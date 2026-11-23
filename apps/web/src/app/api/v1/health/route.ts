import { NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '../../../../lib/server/prisma';
import { isSanityConfigured } from '../../../../sanity/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const dbConfigured = isDatabaseConfigured();
  let dbStatus: 'connected' | 'not_configured' | 'unreachable' = 'not_configured';
  let dbError: string | undefined;

  if (dbConfigured) {
    try {
      await getPrisma().$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (err: unknown) {
      dbStatus = 'unreachable';
      dbError = err instanceof Error ? err.message : 'Database connection failed';
    }
  }

  const healthy = dbStatus === 'connected';
  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      service: 'GOJIFEM Marketplace Serverless API',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      ...(dbError ? { databaseError: dbError } : {}),
      integrations: {
        googleOAuthConfigured: Boolean(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
        ),
        appleSignInConfigured: Boolean(process.env.APPLE_CLIENT_ID),
        paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
        flutterwaveConfigured: Boolean(process.env.FLUTTERWAVE_SECRET_KEY),
        sanityCmsConfigured: isSanityConfigured,
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
