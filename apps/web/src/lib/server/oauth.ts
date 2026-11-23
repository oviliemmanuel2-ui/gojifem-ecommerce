import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { getPrisma } from './prisma';
import { issueTokenPair, signOAuthState } from './jwt';

interface OAuthProfileInput {
  provider: 'google' | 'apple';
  providerAccountId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface AppleJwk {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

export class OAuthConfigError extends Error {
  status = 503;
}

export class OAuthAuthError extends Error {
  status = 401;
}

export function resolveRequestOrigin(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(/:$/, '') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host) {
    return `${proto}://${host}`;
  }
  return req.nextUrl.origin;
}

export function buildGoogleAuthUrl(origin: string, intent: string = 'login', explicitRedirectUri?: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new OAuthConfigError(
      `Google Sign-In is not configured on this deployment yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel Environment Variables and register "${origin}/auth/callback/google" as an Authorized Redirect URI in Google Cloud Console.`,
    );
  }

  const redirectUri =
    explicitRedirectUri ||
    process.env.GOOGLE_REDIRECT_URI ||
    `${origin}/auth/callback/google`;

  const state = signOAuthState({
    provider: 'google',
    intent,
    nonce: crypto.randomBytes(12).toString('hex'),
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  origin: string,
  explicitRedirectUri?: string,
) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new OAuthConfigError(
      'Google Sign-In is not configured on this deployment yet. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
    );
  }

  const redirectUri =
    explicitRedirectUri ||
    process.env.GOOGLE_REDIRECT_URI ||
    `${origin}/auth/callback/google`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new OAuthAuthError(
      tokenData.error_description || tokenData.error || 'Google authentication failed. Please try again.',
    );
  }

  const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const profile = (await userInfoRes.json()) as {
    sub?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };

  if (!userInfoRes.ok || !profile.sub || !profile.email) {
    throw new OAuthAuthError('Unable to retrieve verified Google account details.');
  }

  return findOrCreateOAuthUser({
    provider: 'google',
    providerAccountId: profile.sub,
    email: profile.email,
    firstName: profile.given_name,
    lastName: profile.family_name,
    avatarUrl: profile.picture,
  });
}

export function buildAppleAuthUrl(origin: string, intent: string = 'login'): string {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) {
    throw new OAuthConfigError(
      `Sign in with Apple is not configured on this deployment yet. Add APPLE_CLIENT_ID (Services ID), APPLE_TEAM_ID, and APPLE_KEY_ID in Vercel Environment Variables and register "${origin}/api/v1/auth/apple/callback" as a Return URL in Apple Developer.`,
    );
  }

  const redirectUri =
    process.env.APPLE_REDIRECT_URI || `${origin}/api/v1/auth/apple/callback`;

  const state = signOAuthState({
    provider: 'apple',
    intent,
    nonce: crypto.randomBytes(12).toString('hex'),
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code id_token',
    response_mode: 'form_post',
    scope: 'name email',
    state,
  });

  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

export async function verifyAndProcessAppleCallback(params: {
  idToken: string;
  userJson?: string | null;
}) {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) {
    throw new OAuthConfigError(
      'Sign in with Apple is not configured on this deployment yet. Please set APPLE_CLIENT_ID.',
    );
  }

  const claims = await verifyAppleIdToken(params.idToken, clientId);

  let firstName: string | undefined;
  let lastName: string | undefined;
  if (params.userJson) {
    try {
      const parsed = JSON.parse(params.userJson) as {
        name?: { firstName?: string; lastName?: string };
      };
      firstName = parsed.name?.firstName;
      lastName = parsed.name?.lastName;
    } catch {
      // Ignore malformed optional name payload
    }
  }

  const prisma = getPrisma();
  let email = claims.email;
  if (!email) {
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'apple',
          providerAccountId: claims.sub,
        },
      },
      include: { user: true },
    });
    if (!existingOAuth) {
      throw new OAuthAuthError('Apple Sign-In did not return an email address for this new account.');
    }
    email = existingOAuth.user.email;
  }

  return findOrCreateOAuthUser({
    provider: 'apple',
    providerAccountId: claims.sub,
    email,
    firstName,
    lastName,
  });
}

async function verifyAppleIdToken(
  idToken: string,
  expectedAudience: string,
): Promise<{ sub: string; email?: string; iss: string; aud: string; exp: number }> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new OAuthAuthError('Malformed Apple identity token.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as {
    kid?: string;
  };
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
    sub?: string;
    email?: string;
    iss?: string;
    aud?: string;
    exp?: number;
  };

  if (!header.kid) {
    throw new OAuthAuthError('Apple identity token is missing key ID.');
  }

  const jwksRes = await fetch('https://appleid.apple.com/auth/keys');
  if (!jwksRes.ok) {
    throw new OAuthConfigError('Unable to fetch Apple public keys for token verification.');
  }

  const jwks = (await jwksRes.json()) as { keys?: AppleJwk[] };
  const matchingKey = jwks.keys?.find((k) => k.kid === header.kid);
  if (!matchingKey) {
    throw new OAuthAuthError('Unable to match Apple identity token signing key.');
  }

  const publicKey = crypto.createPublicKey({
    key: matchingKey as unknown as crypto.JsonWebKey,
    format: 'jwk',
  });

  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`, 'utf8');
  const signature = Buffer.from(signatureB64, 'base64url');
  const isValid = crypto.verify('RSA-SHA256', signingInput, publicKey, signature);

  if (!isValid) {
    throw new OAuthAuthError('Invalid Apple identity token signature.');
  }
  if (payload.iss !== 'https://appleid.apple.com') {
    throw new OAuthAuthError('Invalid Apple identity token issuer.');
  }
  if (payload.aud !== expectedAudience) {
    throw new OAuthAuthError('Apple identity token audience mismatch.');
  }
  if (!payload.exp || payload.exp * 1000 < Date.now()) {
    throw new OAuthAuthError('Apple identity token has expired.');
  }
  if (!payload.sub) {
    throw new OAuthAuthError('Apple identity token missing subject.');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    iss: payload.iss,
    aud: payload.aud,
    exp: payload.exp,
  };
}

export async function ensureRole(code: string, name: string) {
  const prisma = getPrisma();
  return prisma.role.upsert({
    where: { code },
    update: {},
    create: { code, name },
  });
}

async function findOrCreateOAuthUser(profile: OAuthProfileInput) {
  const prisma = getPrisma();
  const emailLower = profile.email.toLowerCase().trim();

  const existingOAuth = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: {
      user: {
        include: {
          customerProfile: true,
          userRoles: { include: { role: true } },
          vendorMemberships: { where: { isActive: true }, include: { vendor: true } },
        },
      },
    },
  });

  let user = existingOAuth?.user;

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: emailLower },
      include: {
        customerProfile: true,
        userRoles: { include: { role: true } },
        vendorMemberships: { where: { isActive: true }, include: { vendor: true } },
      },
    });

    if (existingByEmail) {
      await prisma.oAuthAccount.create({
        data: {
          userId: existingByEmail.id,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          email: emailLower,
        },
      });

      if (!existingByEmail.emailVerified) {
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { emailVerified: true, emailVerifiedAt: new Date() },
        });
        existingByEmail.emailVerified = true;
      }

      user = existingByEmail;
    } else {
      const firstName = profile.firstName || emailLower.split('@')[0];
      const lastName = profile.lastName || 'Shopper';

      const created = await prisma.user.create({
        data: {
          email: emailLower,
          passwordHash: null,
          accountStatus: 'ACTIVE',
          emailVerified: true,
          emailVerifiedAt: new Date(),
          customerProfile: {
            create: {
              firstName,
              lastName,
              avatarUrl: profile.avatarUrl || null,
            },
          },
          oauthAccounts: {
            create: {
              provider: profile.provider,
              providerAccountId: profile.providerAccountId,
              email: emailLower,
            },
          },
        },
      });

      const customerRole = await ensureRole('CUSTOMER', 'Customer Buyer');
      await prisma.userRole.create({
        data: {
          userId: created.id,
          roleId: customerRole.id,
        },
      });

      user = await prisma.user.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          customerProfile: true,
          userRoles: { include: { role: true } },
          vendorMemberships: { where: { isActive: true }, include: { vendor: true } },
        },
      });
    }
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new OAuthAuthError(`Account is ${user.accountStatus.toLowerCase()}.`);
  }

  const roles = Array.from(new Set(user.userRoles.map((ur) => ur.role.code)));
  if (roles.length === 0) roles.push('CUSTOMER');
  const vendorIds = user.vendorMemberships.map((vm) => vm.vendorId);

  const tokens = issueTokenPair(user.id, user.email, roles, vendorIds);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.customerProfile?.firstName,
      lastName: user.customerProfile?.lastName,
      avatarUrl: user.customerProfile?.avatarUrl,
      emailVerified: user.emailVerified,
      roles,
      vendors: user.vendorMemberships.map((vm) => ({
        id: vm.vendor.id,
        name: vm.vendor.displayName,
        slug: vm.vendor.slug,
        status: vm.vendor.status,
        role: vm.role,
      })),
    },
    ...tokens,
  };
}
