import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { prisma, UserAccountStatus, VendorStatus } from '@gojifem/database';
import { UserRole } from '@gojifem/types';
import {
  RegisterCustomerDto,
  RegisterVendorDto,
  LoginDto,
  GoogleAuthCallbackDto,
  AppleAuthCallbackDto,
  ResetPasswordDto,
} from './auth.dto';
import { JwtPayload } from './jwt.strategy';

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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {}

  private getWebUrl(): string {
    const raw = process.env.WEB_URL || 'http://localhost:3000';
    return raw.split(',')[0].trim().replace(/\/$/, '');
  }

  private getApiUrl(): string {
    return (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
  }

  async registerCustomer(dto: RegisterCustomerDto) {
    const emailLower = dto.email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailLower }, ...(dto.phone ? [{ phone: dto.phone }] : [])],
      },
    });

    if (existing) {
      throw new ConflictException('An account with this email or phone number already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        phone: dto.phone || null,
        passwordHash,
        accountStatus: UserAccountStatus.ACTIVE,
        emailVerified: false,
        customerProfile: {
          create: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
          },
        },
      },
      include: {
        customerProfile: true,
      },
    });

    const customerRole = await prisma.role.findUnique({ where: { code: UserRole.CUSTOMER } });
    if (customerRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: customerRole.id,
        },
      });
    }

    await this.createAndDispatchVerificationToken(user.email);

    const tokens = await this.generateTokens(user.id, user.email, [UserRole.CUSTOMER], []);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        emailVerified: false,
        roles: [UserRole.CUSTOMER],
      },
      emailVerificationRequired: true,
      ...tokens,
    };
  }

  async registerVendor(dto: RegisterVendorDto) {
    const emailLower = dto.email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailLower }, { phone: dto.phone }],
      },
    });

    if (existing) {
      throw new ConflictException('An account with this email or phone number already exists');
    }

    const slugBase = dto.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const uniqueSlug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        phone: dto.phone,
        passwordHash,
        accountStatus: UserAccountStatus.ACTIVE,
        emailVerified: false,
        ownedVendors: {
          create: {
            legalName: dto.legalName.trim(),
            displayName: dto.displayName.trim(),
            slug: uniqueSlug,
            status: VendorStatus.DRAFT,
            commissionRateBps: 1000,
            description: dto.operatingLocation ? `Located in ${dto.operatingLocation}` : undefined,
          },
        },
      },
      include: {
        ownedVendors: true,
      },
    });

    const vendor = user.ownedVendors[0];

    await prisma.vendorMembership.create({
      data: {
        vendorId: vendor.id,
        userId: user.id,
        role: 'OWNER',
      },
    });

    const vendorRole = await prisma.role.findUnique({ where: { code: UserRole.VENDOR_OWNER } });
    if (vendorRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: vendorRole.id,
          vendorId: vendor.id,
        },
      });
    }

    await this.createAndDispatchVerificationToken(user.email);

    const tokens = await this.generateTokens(user.id, user.email, [UserRole.VENDOR_OWNER], [vendor.id]);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        emailVerified: false,
        roles: [UserRole.VENDOR_OWNER],
      },
      vendor: {
        id: vendor.id,
        displayName: vendor.displayName,
        slug: vendor.slug,
        status: vendor.status,
      },
      emailVerificationRequired: true,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        customerProfile: true,
        userRoles: {
          include: { role: true },
        },
        vendorMemberships: {
          where: { isActive: true },
          include: { vendor: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.accountStatus !== UserAccountStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.accountStatus.toLowerCase()}`);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account was created with Google or Apple Sign-In. Please sign in with that provider or reset your password.',
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = Array.from(new Set(user.userRoles.map((ur) => ur.role.code)));
    const vendorIds = user.vendorMemberships.map((vm) => vm.vendorId);

    const tokens = await this.generateTokens(user.id, user.email, roles, vendorIds);

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

  // ------------------------------------------------------------------
  // OFFICIAL GOOGLE OAUTH 2.0
  // ------------------------------------------------------------------
  async getGoogleAuthUrl(intent: string = 'login') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new ServiceUnavailableException(
        'Google Sign-In is not configured on the server yet. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || `${this.getWebUrl()}/auth/callback/google`;

    const state = await this.jwtService.signAsync(
      { provider: 'google', intent, nonce: crypto.randomBytes(12).toString('hex') },
      {
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_chars_long',
        expiresIn: '10m',
      },
    );

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  async handleGoogleCallback(dto: GoogleAuthCallbackDto) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'Google Sign-In is not configured on the server yet. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }

    const redirectUri =
      dto.redirectUri ||
      process.env.GOOGLE_REDIRECT_URI ||
      `${this.getWebUrl()}/auth/callback/google`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: dto.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenRes.ok || !tokenData.access_token) {
      this.logger.warn(`Google token exchange failed: ${tokenData.error_description || tokenData.error}`);
      throw new UnauthorizedException(
        tokenData.error_description || 'Google authentication failed. Please try again.',
      );
    }

    const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = (await userInfoRes.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };

    if (!userInfoRes.ok || !profile.sub || !profile.email) {
      throw new UnauthorizedException('Unable to retrieve verified Google account details.');
    }

    return this.findOrCreateOAuthUser({
      provider: 'google',
      providerAccountId: profile.sub,
      email: profile.email,
      firstName: profile.given_name,
      lastName: profile.family_name,
      avatarUrl: profile.picture,
    });
  }

  // ------------------------------------------------------------------
  // OFFICIAL SIGN IN WITH APPLE
  // ------------------------------------------------------------------
  async getAppleAuthUrl(intent: string = 'login') {
    const clientId = process.env.APPLE_CLIENT_ID;
    if (!clientId) {
      throw new ServiceUnavailableException(
        'Apple Sign-In is not configured on the server yet. Please set APPLE_CLIENT_ID and Apple developer credentials.',
      );
    }

    const redirectUri =
      process.env.APPLE_REDIRECT_URI || `${this.getApiUrl()}/api/v1/auth/apple/callback`;

    const state = await this.jwtService.signAsync(
      { provider: 'apple', intent, nonce: crypto.randomBytes(12).toString('hex') },
      {
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_chars_long',
        expiresIn: '10m',
      },
    );

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code id_token',
      response_mode: 'form_post',
      scope: 'name email',
      state,
    });

    return {
      url: `https://appleid.apple.com/auth/authorize?${params.toString()}`,
    };
  }

  async handleAppleCallback(dto: AppleAuthCallbackDto) {
    const clientId = process.env.APPLE_CLIENT_ID;
    if (!clientId) {
      throw new ServiceUnavailableException(
        'Apple Sign-In is not configured on the server yet. Please set APPLE_CLIENT_ID.',
      );
    }

    const claims = await this.verifyAppleIdToken(dto.id_token, clientId);

    let firstName: string | undefined;
    let lastName: string | undefined;
    if (dto.user) {
      try {
        const parsed = JSON.parse(dto.user) as {
          name?: { firstName?: string; lastName?: string };
        };
        firstName = parsed.name?.firstName;
        lastName = parsed.name?.lastName;
      } catch {
        // Ignore malformed optional user payload
      }
    }

    const email = claims.email;
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
        throw new UnauthorizedException('Apple Sign-In did not return an email address for this new account.');
      }
      return this.findOrCreateOAuthUser({
        provider: 'apple',
        providerAccountId: claims.sub,
        email: existingOAuth.user.email,
        firstName,
        lastName,
      });
    }

    return this.findOrCreateOAuthUser({
      provider: 'apple',
      providerAccountId: claims.sub,
      email,
      firstName,
      lastName,
    });
  }

  private async verifyAppleIdToken(
    idToken: string,
    expectedAudience: string,
  ): Promise<{ sub: string; email?: string; iss: string; aud: string; exp: number }> {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed Apple identity token.');
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as {
      kid?: string;
      alg?: string;
    };
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      sub?: string;
      email?: string;
      iss?: string;
      aud?: string;
      exp?: number;
    };

    if (!header.kid) {
      throw new UnauthorizedException('Apple identity token is missing key ID.');
    }

    const jwksRes = await fetch('https://appleid.apple.com/auth/keys');
    if (!jwksRes.ok) {
      throw new ServiceUnavailableException('Unable to fetch Apple public keys for token verification.');
    }

    const jwks = (await jwksRes.json()) as { keys?: AppleJwk[] };
    const matchingKey = jwks.keys?.find((k) => k.kid === header.kid);
    if (!matchingKey) {
      throw new UnauthorizedException('Unable to match Apple identity token signing key.');
    }

    const publicKey = crypto.createPublicKey({
      key: matchingKey as unknown as crypto.JsonWebKey,
      format: 'jwk',
    });

    const signingInput = Buffer.from(`${headerB64}.${payloadB64}`, 'utf8');
    const signature = Buffer.from(signatureB64, 'base64url');
    const isValid = crypto.verify('RSA-SHA256', signingInput, publicKey, signature);

    if (!isValid) {
      throw new UnauthorizedException('Invalid Apple identity token signature.');
    }

    if (payload.iss !== 'https://appleid.apple.com') {
      throw new UnauthorizedException('Invalid Apple identity token issuer.');
    }

    if (payload.aud !== expectedAudience) {
      throw new UnauthorizedException('Apple identity token audience mismatch.');
    }

    if (!payload.exp || payload.exp * 1000 < Date.now()) {
      throw new UnauthorizedException('Apple identity token has expired.');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Apple identity token missing subject.');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      iss: payload.iss,
      aud: payload.aud,
      exp: payload.exp,
    };
  }

  private async findOrCreateOAuthUser(profile: OAuthProfileInput) {
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
            accountStatus: UserAccountStatus.ACTIVE,
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

        const customerRole = await prisma.role.findUnique({ where: { code: UserRole.CUSTOMER } });
        if (customerRole) {
          await prisma.userRole.create({
            data: {
              userId: created.id,
              roleId: customerRole.id,
            },
          });
        }

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

    if (user.accountStatus !== UserAccountStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.accountStatus.toLowerCase()}`);
    }

    const roles = Array.from(new Set(user.userRoles.map((ur) => ur.role.code)));
    if (roles.length === 0) roles.push(UserRole.CUSTOMER);
    const vendorIds = user.vendorMemberships.map((vm) => vm.vendorId);

    const tokens = await this.generateTokens(user.id, user.email, roles, vendorIds);

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

  // ------------------------------------------------------------------
  // FORGOT PASSWORD & RESET PASSWORD
  // ------------------------------------------------------------------
  async forgotPassword(email: string) {
    const emailLower = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: emailLower } });

    if (user) {
      await prisma.passwordResetToken.deleteMany({ where: { email: emailLower } });
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          email: emailLower,
          token,
          expiresAt,
        },
      });

      const resetUrl = `${this.getWebUrl()}/auth/reset-password?token=${token}`;
      this.logger.log(`[Password Reset] Reset link for ${emailLower}: ${resetUrl}`);
    }

    return {
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This password reset link is invalid or has expired.');
    }

    const user = await prisma.user.findUnique({ where: { email: record.email } });
    if (!user) {
      throw new NotFoundException('Associated account not found.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({ where: { id: record.id } }),
    ]);

    return {
      success: true,
      message: 'Your password has been updated. You can now sign in with your new password.',
    };
  }

  // ------------------------------------------------------------------
  // EMAIL VERIFICATION
  // ------------------------------------------------------------------
  private async createAndDispatchVerificationToken(email: string) {
    const emailLower = email.toLowerCase().trim();
    await prisma.emailVerificationToken.deleteMany({ where: { email: emailLower } });
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        email: emailLower,
        token,
        expiresAt,
      },
    });

    const verifyUrl = `${this.getWebUrl()}/auth/verify-email?token=${token}`;
    this.logger.log(`[Email Verification] Verification link for ${emailLower}: ${verifyUrl}`);
    return token;
  }

  async requestEmailVerification(email: string) {
    const emailLower = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: emailLower } });

    if (user && !user.emailVerified) {
      await this.createAndDispatchVerificationToken(emailLower);
    }

    return {
      message: 'If your account requires email verification, a verification link has been sent.',
    };
  }

  async verifyEmail(token: string) {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This verification link is invalid or has expired.');
    }

    const user = await prisma.user.findUnique({ where: { email: record.email } });
    if (!user) {
      throw new NotFoundException('Account not found.');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.delete({ where: { id: record.id } }),
    ]);

    return {
      success: true,
      message: 'Your email address has been verified successfully.',
    };
  }

  // ------------------------------------------------------------------
  // SESSION MANAGEMENT
  // ------------------------------------------------------------------
  async logout(userId?: string) {
    if (userId) {
      this.logger.log(`User ${userId} signed out.`);
    }
    return {
      success: true,
      message: 'Signed out successfully.',
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_at_least_32_chars',
      });

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          userRoles: { include: { role: true } },
          vendorMemberships: { where: { isActive: true } },
        },
      });

      if (!user || user.accountStatus !== UserAccountStatus.ACTIVE) {
        throw new UnauthorizedException('User account invalid or suspended');
      }

      const roles = Array.from(new Set(user.userRoles.map((ur) => ur.role.code)));
      const vendorIds = user.vendorMemberships.map((vm) => vm.vendorId);

      return this.generateTokens(user.id, user.email, roles, vendorIds);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        addresses: true,
        userRoles: { include: { role: true } },
        vendorMemberships: {
          include: { vendor: true },
        },
        oauthAccounts: {
          select: { provider: true, createdAt: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      profile: user.customerProfile,
      addresses: user.addresses,
      roles: user.userRoles.map((ur) => ur.role.code),
      oauthProviders: user.oauthAccounts.map((o) => o.provider),
      vendors: user.vendorMemberships.map((vm) => ({
        id: vm.vendor.id,
        name: vm.vendor.displayName,
        slug: vm.vendor.slug,
        status: vm.vendor.status,
        role: vm.role,
      })),
    };
  }

  private async generateTokens(userId: string, email: string, roles: string[], vendorIds: string[]) {
    const payload: JwtPayload = { sub: userId, email, roles, vendorIds };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_chars_long',
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_at_least_32_chars',
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }
}
