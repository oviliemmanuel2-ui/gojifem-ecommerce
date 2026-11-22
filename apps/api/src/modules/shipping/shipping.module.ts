import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { GiglAdapter } from './carriers/gigl.adapter';
import { KwikAdapter } from './carriers/kwik.adapter';
import { DhlAdapter } from './carriers/dhl.adapter';

@Module({
  controllers: [ShippingController],
  providers: [ShippingService, GiglAdapter, KwikAdapter, DhlAdapter],
  exports: [ShippingService, GiglAdapter, KwikAdapter, DhlAdapter],
})
export class ShippingModule {}
