import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { prisma } from '@gojifem/database';

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

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'API Health, database, and authentication readiness check' })
  @ApiResponse({ status: 200, description: 'Service, database, and auth operational' })
  @ApiResponse({ status: 503, description: 'One or more dependencies are unavailable' })
  async check(@Res() res: Response) {
    const startedAt = Date.now();
    const configured = Boolean(process.env.DATABASE_URL);
    let database: 'connected' | 'not_configured' | 'unreachable' = 'not_configured';
    let dbStatus: 'operational' | 'not_configured' | 'outage' = 'not_configured';
    let dbLatencyMs: number | null = null;
    let databaseError: string | undefined;
    let authTableReady = false;

    if (configured) {
      const dbStart = Date.now();
      try {
        await withTimeout(prisma.$queryRaw`SELECT 1`, DB_HEALTH_TIMEOUT_MS, 'Database SELECT 1');
        database = 'connected';
        dbStatus = 'operational';
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
          databaseError =
            err instanceof Error ? err.message : 'Users table unavailable';
        }
      } catch (err: unknown) {
        database = 'unreachable';
        dbStatus = 'outage';
        dbLatencyMs = Date.now() - dbStart;
        databaseError = err instanceof Error ? err.message : 'Database connection failed';
      }
    }

    const authStatus: 'operational' | 'degraded' =
      dbStatus === 'operational' && authTableReady ? 'operational' : 'degraded';
    const overallOperational = dbStatus === 'operational' && authStatus === 'operational';

    const payload = {
      status: overallOperational ? 'ok' : 'degraded',
      overallStatus: overallOperational ? 'operational' : 'degraded',
      service: 'GOJIFEM Marketplace API',
      database,
      ...(databaseError ? { databaseError } : {}),
      services: {
        api: { status: 'operational' as const },
        database: {
          status: dbStatus,
          configured,
          latencyMs: dbLatencyMs,
          ...(databaseError ? { error: databaseError } : {}),
        },
        auth: {
          status: authStatus,
          databaseBacked: dbStatus === 'operational' && authTableReady,
        },
      },
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      uptimeSeconds: Math.floor(process.uptime()),
    };

    return res
      .status(overallOperational ? 200 : 503)
      .setHeader('Cache-Control', 'no-store')
      .json(payload);
  }
}
