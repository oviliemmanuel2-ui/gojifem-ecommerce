import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { ServiceabilityCheckRequest } from '@gojifem/types';
import { RateEstimateInput } from './carriers/gigl.adapter';

@ApiTags('Shipping & Serviceability')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('serviceability/check')
  @ApiOperation({
    summary: 'Check if recipient address is within serviceable delivery corridor',
    description: 'Enforces the boundary check before customer pays.',
  })
  check(@Body() body: ServiceabilityCheckRequest) {
    return this.shippingService.checkServiceability(body);
  }

  @Get('serviceability/destinations')
  @ApiOperation({ summary: 'List all currently active delivery countries and transit corridors' })
  listDestinations() {
    return this.shippingService.listServiceableDestinations();
  }

  @Post('rates/estimate')
  @ApiOperation({ summary: 'Estimate shipping rates across integrated carriers (GIGL, Kwik, DHL)' })
  estimateRates(@Body() body: RateEstimateInput) {
    return this.shippingService.estimateRates(body);
  }

  @Post('waybills/generate')
  @ApiOperation({ summary: 'Generate official courier waybill & tracking code for vendor shipment' })
  generateWaybill(
    @Body()
    body: {
      vendorOrderId: string;
      carrierCode: string;
      originCity: string;
      destinationAddress: string;
      destinationCountry: string;
    },
  ) {
    return this.shippingService.generateWaybill(
      body.vendorOrderId,
      body.carrierCode,
      body.originCity,
      body.destinationAddress,
      body.destinationCountry,
    );
  }

  @Get('track/:carrier/:trackingNumber')
  @ApiOperation({ summary: 'Track parcel status and history milestones across integrated couriers' })
  trackParcel(
    @Param('carrier') carrier: string,
    @Param('trackingNumber') trackingNumber: string,
  ) {
    return this.shippingService.trackParcel(carrier, trackingNumber);
  }

  @Get('carriers')
  @ApiOperation({ summary: 'List all integrated courier partners and coverage details' })
  listCarriers() {
    return this.shippingService.listCarriers();
  }
}
