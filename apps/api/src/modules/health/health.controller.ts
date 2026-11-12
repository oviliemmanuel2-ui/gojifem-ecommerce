import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'API Health and status check' })
  @ApiResponse({ status: 200, description: 'Service is operational' })
  check() {
    return {
      status: 'ok',
      service: 'GOJIFEM Marketplace API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
