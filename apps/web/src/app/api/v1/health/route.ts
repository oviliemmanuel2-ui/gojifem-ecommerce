import { NextResponse } from 'next/server';
import {
  getPoolingHint,
  getPrisma,
  isLocalhostDatabaseUrl,
  resolveDatabaseEnv,
} from '../../../../lib/server/prisma';
import { issueTokenPair, verifyAccessJwt } from '../../../../lib/server/jwt';
import { logServerEvent } from '../../../../lib/server/logger';
import { isSanityConfigured } from '../../../../sanity/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DB_HEALTH_TIMEOUT_MS = 4000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} exceeded ${ms}ms timeout`));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function GET() {
  const startedAt = Date.now();
  const { url: dbUrl, source: dbEnvSource } = resolveDatabaseEnv();
  const dbConfigured = Boolean(dbUrl);
  const localhostOnVercel =
    process.env.VERCEL === '1' && isLocalhostDatabaseUrl(dbUrl);
  const poolingHint = getPoolingHint(dbUrl);

  let dbStatus: 'operational' | 'not_configured' | 'outage' = 'not_configured';
  let legacyDbState: 'connected' | 'not_configured' | 'unreachable' = 'not_configured';
  let dbLatencyMs: number | null = null;
  let dbError: string | undefined;

  let authTableReady = false;
  let authTableError: string | undefined;

  if (localhostOnVercel) {
    dbStatus = 'outage';
    legacyDbState = 'unreachable';
    dbError =
      'DATABASE_URL points to localhost, which is unreachable from Vercel serverless functions.';
  } else if (dbConfigured) {
    const dbStart = Date.now();
    try {
      const prisma = getPrisma();
      await withTimeout(prisma.$queryRaw`SELECT 1`, DB_HEALTH_TIMEOUT_MS, 'Database SELECT 1');
      dbStatus = 'operational';
      legacyDbState = 'connected';
      dbLatencyMs = Date.now() - dbStart;

      try {
        await withTimeout(
          prisma.user.findFirst({ select: { id: true } }),
          DB_HEALTH_TIMEOUT_MS,
          'Auth users table probe',
        );
        authTableReady = true;
      } catch (err: unknown) {
        authTableReady = false;
        authTableError =
          err instanceof Error ? err.message : 'Users table unavailable (migrations required)';
      }
    } catch (err: unknown) {
      dbStatus = 'outage';
      legacyDbState = 'unreachable';
      dbLatencyMs = Date.now() - dbStart;
      dbError = err instanceof Error ? err.message : 'Database connection failed';
      logServerEvent('error', 'health', 'Database health check failed', {
        latencyMs: dbLatencyMs,
        errorMessage: dbError,
      });
    }
  }

  // Real JWT signing/verification self-test
  let jwtOperational = false;
  let jwtError: string | undefined;
  try {
    const pair = issueTokenPair('healthcheck', 'healthcheck@gojifem.local', [], []);
    const decoded = verifyAccessJwt(pair.accessToken);
    jwtOperational = decoded?.sub === 'healthcheck';
  } catch (err: unknown) {
    jwtOperational = false;
    jwtError = err instanceof Error ? err.message : 'JWT token service self-check failed';
    logServerEvent('error', 'health', 'Authentication token service check failed', {
      errorMessage: jwtError,
    });
  }

  const authStatus: 'operational' | 'degraded' | 'outage' = !jwtOperational
    ? 'outage'
    : dbStatus === 'operational' && authTableReady
      ? 'operational'
      : 'degraded';

  const overallOperational = dbStatus === 'operational' && authStatus === 'operational';

  const payload = {
    status: overallOperational ? 'ok' : 'degraded',
    overallStatus: overallOperational ? 'operational' : 'degraded',
    service: 'GOJIFEM Marketplace Serverless API',
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    database: legacyDbState,
    ...(dbError ? { databaseError: dbError } : {}),
    services: {
      api: {
        status: 'operational' as const,
      },
      database: {
        status: dbStatus,
        configured: dbConfigured,
        envSource: dbEnvSource,
        poolingHint,
        schemaMigrated: authTableReady,
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
      auth: {
        status: authStatus,
        jwtOperational,
        databaseBacked: dbStatus === 'operational' && authTableReady,
        ...(jwtError || authTableError ? { error: jwtError || authTableError } : {}),
      },
    },
    integrations: {
      googleOAuthConfigured: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      ),
      appleSignInConfigured: Boolean(process.env.APPLE_CLIENT_ID),
      paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
      flutterwaveConfigured: Boolean(process.env.FLUTTERWAVE_SECRET_KEY),
      sanityCmsConfigured: isSanityConfigured,
    },
  };

  return NextResponse.json(payload, {
    status: overallOperational ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
