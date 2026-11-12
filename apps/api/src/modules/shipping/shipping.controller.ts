import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';

@ApiTags('Shipping & Serviceability')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('serviceable-destinations')
  @ApiOperation({ summary: 'List all destinations GOJIFEM currently delivers to' })
  listDestinations() {
    return this.shippingService.listServiceableDestinations();
  }

  @Get('check-serviceability')
  @ApiOperation({
    summary: 'Check if a specific recipient shipping destination is serviceable',
    description:
      'Decoupled from payment: foreign buyers can pay with international cards even if shipping is restricted to serviceable destinations.',
  })
  @ApiQuery({ name: 'countryCode', required: true, example: 'NG' })
  check(@Query('countryCode') countryCode: string) {
    return this.shippingService.checkServiceability({ countryCode });
  }
}
