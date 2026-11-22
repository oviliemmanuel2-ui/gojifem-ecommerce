import { Injectable, Logger } from '@nestjs/common';
import {
  RateEstimateInput,
  RateEstimateResult,
  WaybillResult,
  TrackingResult,
} from './gigl.adapter';

@Injectable()
export class KwikAdapter {
  private readonly logger = new Logger(KwikAdapter.name);
  readonly carrierCode = 'KWIK';
  readonly carrierName = 'Kwik Delivery';

  estimateRate(input: RateEstimateInput): RateEstimateResult | null {
    // Kwik specializes in urban on-demand bike/van deliveries within major cities (Lagos, Abuja, Ibadan)
    if (input.destinationCountry.toUpperCase() !== 'NG') {
      return null;
    }

    const urbanStates = ['lagos', 'abuja', 'fct', 'oyo'];
    const origin = input.originState.toLowerCase();
    const dest = (input.destinationState || '').toLowerCase();

    // Available only when intra-city within supported urban hubs
    if (origin !== dest || !urbanStates.some((s) => origin.includes(s))) {
      return null;
    }

    // Flat intra-city on-demand rate
    const baseKobo = 180000; // ₦1,800
    const additionalKgKobo = Math.max(0, input.weightKg - 2) * 50000;

    return {
      carrier: this.carrierName,
      carrierCode: this.carrierCode,
      serviceName: 'Kwik On-Demand Instant Dispatch',
      amountMinorNGN: baseKobo + additionalKgKobo,
      currency: 'NGN',
      estimatedTransitDaysMin: 0,
      estimatedTransitDaysMax: 1, // Same-day / instant delivery
      isAvailable: true,
    };
  }

  generateWaybill(
    vendorOrderId: string,
    originCity: string,
    destinationCity: string,
  ): WaybillResult {
    const trackingNumber = `KWIK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const deliveryDate = new Date().toISOString().split('T')[0];

    this.logger.log(`Created Kwik Waybill [${trackingNumber}] for vendor order ${vendorOrderId}`);

    return {
      carrier: this.carrierName,
      carrierCode: this.carrierCode,
      trackingNumber,
      waybillUrl: `https://kwik.delivery/track/${trackingNumber}`,
      dispatchInstructions: 'A Kwik courier rider has been dispatched to merchant pickup address.',
      estimatedDeliveryDate: deliveryDate,
    };
  }

  track(trackingNumber: string): TrackingResult {
    return {
      carrier: this.carrierName,
      trackingNumber,
      currentStatus: 'OUT_FOR_DELIVERY',
      origin: 'Ikeja, Lagos',
      destination: 'Victoria Island, Lagos',
      estimatedDelivery: 'Today within 2 hours',
      milestones: [
        {
          status: 'DISPATCHED',
          location: 'Merchant Pickup Location',
          description: 'Kwik courier rider assigned and arrived for pickup',
          timestamp: '1 hour ago',
        },
        {
          status: 'OUT_FOR_DELIVERY',
          location: 'Lagos Corridor Expressway',
          description: 'Rider is on route with customer parcel',
          timestamp: '15 minutes ago',
        },
      ],
    };
  }
}
