import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { logServerEvent } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var vercelPrismaGlobal: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var vercelPrismaUrlGlobal: string | undefined;
}

export type DatabaseEnvSource =
  | 'DATABASE_URL'
  | 'POSTGRES_PRISMA_URL'
  | 'GOJIFEM_POSTGRES_PRISMA_URL'
  | 'DATABASE_URL_POOLED'
  | 'POSTGRES_URL'
  | 'GOJIFEM_POSTGRES_URL'
  | 'none';

export function resolveDatabaseEnv(): {
  url: string | null;
  source: DatabaseEnvSource;
} {
  const candidates: Array<{ source: Exclude<DatabaseEnvSource, 'none'>; value?: string }> = [
    { source: 'DATABASE_URL', value: process.env.DATABASE_URL },
    { source: 'POSTGRES_PRISMA_URL', value: process.env.POSTGRES_PRISMA_URL },
    { source: 'GOJIFEM_POSTGRES_PRISMA_URL', value: process.env.GOJIFEM_POSTGRES_PRISMA_URL },
    { source: 'DATABASE_URL_POOLED', value: process.env.DATABASE_URL_POOLED },
    { source: 'POSTGRES_URL', value: process.env.POSTGRES_URL },
    { source: 'GOJIFEM_POSTGRES_URL', value: process.env.GOJIFEM_POSTGRES_URL },
  ];

  for (const item of candidates) {
    const trimmed = item.value?.trim();
    if (trimmed && trimmed.length > 0) {
      return { url: trimmed, source: item.source };
    }
  }
  return { url: null, source: 'none' };
}

export function resolveDatabaseUrl(): string | null {
  return resolveDatabaseEnv().url;
}

export function resolveDirectDatabaseUrl(): string | null {
  const candidates = [
    process.env.DIRECT_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.GOJIFEM_POSTGRES_URL_NON_POOLING,
    resolveDatabaseUrl(),
  ];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed && trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}

/**
 * Ensures PgBouncer / Supabase transaction-pooled URLs include `pgbouncer=true`
 * so Prisma does not hit prepared-statement errors in serverless functions.
 */
export function normalizeRuntimeDatabaseUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const usesPooler =
    /pooler\.supabase\.com/i.test(trimmed) ||
    /-pooler\./i.test(trimmed) ||
    /:6543\b/.test(trimmed);

  if (!usesPooler) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }
    return parsed.toString();
  } catch {
    if (!/pgbouncer=true/i.test(trimmed)) {
      return `${trimmed}${trimmed.includes('?') ? '&' : '?'}pgbouncer=true`;
    }
    return trimmed;
  }
}

export function isLocalhostDatabaseUrl(url: string | null): boolean {
  if (!url) return false;
  return /^postgres(ql)?:\/\/[^/]*@(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$|\?)/i.test(
    url.trim(),
  );
}

export function getPoolingHint(url: string | null): 'pooled' | 'direct' | 'unconfigured' {
  if (!url) return 'unconfigured';
  if (
    /pgbouncer=true/i.test(url) ||
    /pooler\.supabase\.com/i.test(url) ||
    /-pooler\./i.test(url) ||
    /:6543\b/.test(url)
  ) {
    return 'pooled';
  }
  return 'direct';
}

export function isDatabaseConfigured(): boolean {
  return Boolean(resolveDatabaseUrl());
}

export function getPrisma(): PrismaClient {
  const resolvedUrl = normalizeRuntimeDatabaseUrl(resolveDatabaseUrl());
  if (
    !globalThis.vercelPrismaGlobal ||
    globalThis.vercelPrismaUrlGlobal !== (resolvedUrl || undefined)
  ) {
    globalThis.vercelPrismaGlobal = new PrismaClient({
      ...(resolvedUrl ? { datasources: { db: { url: resolvedUrl } } } : {}),
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
    globalThis.vercelPrismaUrlGlobal = resolvedUrl || undefined;
  }
  return globalThis.vercelPrismaGlobal;
}

export function requireDatabase(): NextResponse | null {
  const { url } = resolveDatabaseEnv();
  if (!url) {
    return NextResponse.json(
      {
        message:
          'Database connection (DATABASE_URL) is not configured in this deployment environment. Configure DATABASE_URL in Vercel Environment Variables and run Prisma migrations to enable registration and login.',
        code: 'DATABASE_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  if (process.env.VERCEL === '1' && isLocalhostDatabaseUrl(url)) {
    return NextResponse.json(
      {
        message:
          'DATABASE_URL points to localhost, which cannot be reached from Vercel serverless functions. Set DATABASE_URL to your cloud PostgreSQL connection string (Neon, Supabase, or Vercel Postgres) in Vercel Environment Variables.',
        code: 'DATABASE_LOCALHOST_ON_VERCEL',
      },
      { status: 503 },
    );
  }

  return null;
}

export function handleServerError(err: unknown): NextResponse {
  const errorObj = err as { code?: string; name?: string; message?: string };
  const code = errorObj?.code;
  const name = errorObj?.name;
  const message = errorObj?.message || 'Unexpected server error';

  logServerEvent('error', 'prisma', message, { code, name, error: errorObj });

  if (code === 'P2002') {
    return NextResponse.json(
      { message: 'An account with this email or phone number already exists.' },
      { status: 409 },
    );
  }

  if (
    code === 'P2021' ||
    code === 'P2022' ||
    message.includes('does not exist in the current database')
  ) {
    return NextResponse.json(
      {
        message:
          'Database tables or columns have not been migrated yet. Run `npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma` against your production DATABASE_URL.',
        code: 'DATABASE_NOT_MIGRATED',
      },
      { status: 503 },
    );
  }

  if (
    code === 'P1001' ||
    code === 'P1002' ||
    name === 'PrismaClientInitializationError' ||
    message.includes("Can't reach database server")
  ) {
    return NextResponse.json(
      {
        message:
          'Unable to connect to the configured PostgreSQL database. Verify DATABASE_URL and SSL/pooling settings in Vercel Environment Variables.',
        code: 'DATABASE_UNREACHABLE',
      },
      { status: 503 },
    );
  }

  if (errorObj instanceof Error && errorObj.message) {
    return NextResponse.json({ message: errorObj.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
}
