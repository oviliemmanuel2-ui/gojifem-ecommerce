import { Injectable, Logger } from '@nestjs/common';
import {
  RateEstimateInput,
  RateEstimateResult,
  WaybillResult,
  TrackingResult,
} from './gigl.adapter';

@Injectable()
export class DhlAdapter {
  private readonly logger = new Logger(DhlAdapter.name);
  readonly carrierCode = 'DHL';
  readonly carrierName = 'DHL Express';

  estimateRate(input: RateEstimateInput): RateEstimateResult | null {
    const destCountry = input.destinationCountry.toUpperCase();

    // Priority domestic express in Nigeria
    if (destCountry === 'NG') {
      const baseKobo = 480000; // ₦4,800
      const additionalKobo = Math.max(0, input.weightKg - 1) * 120000;
      return {
        carrier: this.carrierName,
        carrierCode: this.carrierCode,
        serviceName: 'DHL Domestic Express Priority',
        amountMinorNGN: baseKobo + additionalKobo,
        currency: 'NGN',
        estimatedTransitDaysMin: 1,
        estimatedTransitDaysMax: 2,
        isAvailable: true,
      };
    }

    // International Export Corridors (GH, GB, US, CA, EU)
    const internationalBaseRates: Record<string, { baseKobo: number; daysMin: number; daysMax: number }> = {
      GH: { baseKobo: 1850000, daysMin: 2, daysMax: 4 }, // ₦18,500 to Ghana
      GB: { baseKobo: 2850000, daysMin: 3, daysMax: 5 }, // ₦28,500 to UK
      US: { baseKobo: 3450000, daysMin: 4, daysMax: 6 }, // ₦34,500 to USA
      CA: { baseKobo: 3650000, daysMin: 4, daysMax: 7 }, // ₦36,500 to Canada
    };

    const rateConfig = internationalBaseRates[destCountry] || {
      baseKobo: 4200000,
      daysMin: 4,
      daysMax: 8,
    };

    const additionalKobo = Math.max(0, input.weightKg - 1) * 750000;

    return {
      carrier: this.carrierName,
      carrierCode: this.carrierCode,
      serviceName: `DHL Worldwide Express (${destCountry})`,
      amountMinorNGN: rateConfig.baseKobo + additionalKobo,
      currency: 'NGN',
      estimatedTransitDaysMin: rateConfig.daysMin,
      estimatedTransitDaysMax: rateConfig.daysMax,
      isAvailable: true,
    };
  }

  generateWaybill(
    vendorOrderId: string,
    originCity: string,
    destinationCountry: string,
  ): WaybillResult {
    const trackingNumber = `DHL-EXP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isIntl = destinationCountry.toUpperCase() !== 'NG';
    const deliveryDays = isIntl ? 5 : 2;
    const deliveryDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    this.logger.log(`Created DHL Express Waybill [${trackingNumber}] for vendor order ${vendorOrderId}`);

    return {
      carrier: this.carrierName,
      carrierCode: this.carrierCode,
      trackingNumber,
      waybillUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
      dispatchInstructions: isIntl
        ? 'Commercial export invoices attached. Hand over to DHL Express international courier at scheduled pickup.'
        : 'Hand over to DHL Express domestic courier.',
      estimatedDeliveryDate: deliveryDate,
    };
  }

  track(trackingNumber: string): TrackingResult {
    return {
      carrier: this.carrierName,
      trackingNumber,
      currentStatus: 'IN_TRANSIT',
      origin: 'Lagos Gateway Export Hub, Nigeria',
      destination: 'London Heathrow Customs Centre, United Kingdom',
      estimatedDelivery: '3 days from now',
      milestones: [
        {
          status: 'SHIPMENT_PICKED_UP',
          location: 'Merchant Facility, Lagos',
          description: 'Shipment collected by DHL courier',
          timestamp: 'Yesterday, 02:00 PM',
        },
        {
          status: 'EXPORT_CUSTOMS_CLEARED',
          location: 'Murtala Muhammed International Airport (LOS)',
          description: 'Customs cleared for departure',
          timestamp: 'Yesterday, 09:30 PM',
        },
        {
          status: 'IN_FLIGHT',
          location: 'In transit to Heathrow Hub (LHR)',
          description: 'Departed export facility on scheduled international cargo flight',
          timestamp: 'Today, 06:15 AM',
        },
      ],
    };
  }
}
