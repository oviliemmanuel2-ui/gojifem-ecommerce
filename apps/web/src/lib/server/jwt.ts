import crypto from 'crypto';
import type { NextRequest } from 'next/server';

export interface AuthJwtPayload {
  sub: string;
  email: string;
  roles: string[];
  vendorIds: string[];
  iat?: number;
  exp?: number;
}

function getAccessSecret(): string {
  return (
    process.env.JWT_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    process.env.GOJIFEM_SUPABASE_JWT_SECRET ||
    'super_secret_jwt_key_at_least_32_chars_long'
  );
}

function getRefreshSecret(): string {
  return (
    process.env.JWT_REFRESH_SECRET ||
    (process.env.GOJIFEM_SUPABASE_JWT_SECRET
      ? `${process.env.GOJIFEM_SUPABASE_JWT_SECRET}:refresh`
      : 'super_secret_refresh_jwt_key_at_least_32_chars')
  );
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

export function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds: number,
): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const headerB64 = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyJwt<T = AuthJwtPayload>(token: string, secret: string): T {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token');
  }
  const [headerB64, payloadB64, sigB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('Invalid token signature');
  }

  const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
    exp?: number;
  };
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    throw new Error('Token expired');
  }

  return decoded as T;
}

export function signOAuthState(payload: Record<string, unknown>): string {
  return signJwt(payload, getAccessSecret(), 600);
}

export function issueTokenPair(
  userId: string,
  email: string,
  roles: string[],
  vendorIds: string[],
) {
  const claims: AuthJwtPayload = { sub: userId, email, roles, vendorIds };
  return {
    accessToken: signJwt(claims as unknown as Record<string, unknown>, getAccessSecret(), 3600),
    refreshToken: signJwt(claims as unknown as Record<string, unknown>, getRefreshSecret(), 7 * 86400),
    expiresIn: 3600,
  };
}

export function verifyRefreshJwt(token: string): AuthJwtPayload {
  return verifyJwt<AuthJwtPayload>(token, getRefreshSecret());
}

export function authenticateRequest(req: NextRequest): AuthJwtPayload | null {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  const token = auth.slice(7).trim();
  if (!token) return null;
  try {
    return verifyJwt<AuthJwtPayload>(token, getAccessSecret());
  } catch {
    return null;
  }
}
