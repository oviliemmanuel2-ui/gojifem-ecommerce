import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

declare global {
  // eslint-disable-next-line no-var
  var vercelPrismaGlobal: PrismaClient | undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

export function getPrisma(): PrismaClient {
  if (!globalThis.vercelPrismaGlobal) {
    globalThis.vercelPrismaGlobal = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return globalThis.vercelPrismaGlobal;
}

export function requireDatabase(): NextResponse | null {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        message:
          'Database connection (DATABASE_URL) is not configured in this deployment environment. Configure DATABASE_URL in Vercel Environment Variables and run Prisma migrations to enable registration and login.',
        code: 'DATABASE_NOT_CONFIGURED',
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

  if (code === 'P2002') {
    return NextResponse.json(
      { message: 'An account with this email or phone number already exists.' },
      { status: 409 },
    );
  }

  if (code === 'P2021' || message.includes('does not exist in the current database')) {
    return NextResponse.json(
      {
        message:
          'Database tables have not been initialized yet. Run `npx prisma migrate deploy` against your production DATABASE_URL.',
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
          'Unable to connect to the configured PostgreSQL database. Verify DATABASE_URL and network/SSL settings in Vercel Environment Variables.',
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
