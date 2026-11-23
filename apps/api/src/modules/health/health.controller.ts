import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { prisma } from '@gojifem/database';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'API Health and database connectivity check' })
  @ApiResponse({ status: 200, description: 'Service and database operational' })
  async check() {
    let database: 'connected' | 'not_configured' | 'unreachable' = 'not_configured';
    let databaseError: string | undefined;

    if (process.env.DATABASE_URL) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        database = 'connected';
      } catch (err: unknown) {
        database = 'unreachable';
        databaseError = err instanceof Error ? err.message : 'Database connection failed';
      }
    }

    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      service: 'GOJIFEM Marketplace API',
      database,
      ...(databaseError ? { databaseError } : {}),
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
