import { Injectable, Logger } from '@nestjs/common';

export interface RateEstimateInput {
  originState: string;
  originCity: string;
  destinationCountry: string;
  destinationState?: string;
  destinationCity?: string;
  weightKg: number;
}

export interface RateEstimateResult {
  carrier: string;
  carrierCode: string;
  serviceName: string;
  amountMinorNGN: number;
  currency: string;
  estimatedTransitDaysMin: number;
  estimatedTransitDaysMax: number;
  isAvailable: boolean;
}

export interface WaybillResult {
  carrier: string;
  carrierCode: string;
  trackingNumber: string;
  waybillUrl: string;
  dispatchInstructions: string;
  estimatedDeliveryDate: string;
}

export interface TrackingMilestone {
  status: string;
  location: string;
  description: string;
  timestamp: string;
}

export interface TrackingResult {
  carrier: string;
  trackingNumber: string;
  currentStatus: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  milestones: TrackingMilestone[];
}

@Injectable()
export class GiglAdapter {
  private readonly logger = new Logger(GiglAdapter.name);
  readonly carrierCode = 'GIGL';
  readonly carrierName = 'GIG Logistics';

  estimateRate(input: RateEstimateInput): RateEstimateResult | null {
    // GIGL specializes in Nigeria nationwide transit across all 36 states
    if (input.destinationCountry.toUpperCase() !== 'NG') {
      return null;
    }

    const isIntraState =
      input.originState.toLowerCase() === (input.destinationState || '').toLowerCase();

    // Base pricing: intra-state is ₦2,200 for 1st kg, interstate is ₦4,500
    const baseKobo = isIntraState ? 220000 : 450000;
    const additionalKgKobo = Math.max(0, input.weightKg - 1) * 80000;
    const totalAmount = baseKobo + additionalKgKobo;

    return {
      carrier: this.carrierName,
      carrierCode: this.carrierCode,
      serviceName: isIntraState ? 'GIGL Same-Day / Next-Day Delivery' : 'GIGL Inter-State Courier Express',
      amountMinorNGN: totalAmount,
      currency: 'NGN',
      estimatedTransitDaysMin: isIntraState ? 1 : 2,
      estimatedTransitDaysMax: isIntraState ? 2 : 4,
      isAvailable: true,
    };
  }

  generateWaybill(
    vendorOrderId: string,
    originCity: string,
    destinationCity: string,
  ): WaybillResult {
    const trackingNumber = `GIG-NG-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    this.logger.log(`Created GIGL Waybill [${trackingNumber}] for vendor order ${vendorOrderId}`);

    return {
      carrier: this.carrierName,
      carrierCode: this.carrierCode,
      trackingNumber,
      waybillUrl: `https://tracking.gigl.ng/waybills/${trackingNumber}.pdf`,
      dispatchInstructions: 'Hand over package to designated GIGL pickup rider or drop at nearest GIGL Service Centre.',
      estimatedDeliveryDate: deliveryDate,
    };
  }

  track(trackingNumber: string): TrackingResult {
    return {
      carrier: this.carrierName,
      trackingNumber,
      currentStatus: 'IN_TRANSIT',
      origin: 'Ibadan Sorting Hub, Oyo State',
      destination: 'Lekki Dispatch Centre, Lagos State',
      estimatedDelivery: 'Tomorrow, by 5:00 PM',
      milestones: [
        {
          status: 'LABEL_CREATED',
          location: 'Merchant Facility',
          description: 'Waybill generated and pickup request confirmed',
          timestamp: 'Today, 08:30 AM',
        },
        {
          status: 'PICKED_UP',
          location: 'Ibadan Collection Station',
          description: 'Parcel collected by GIGL courier van',
          timestamp: 'Today, 11:15 AM',
        },
        {
          status: 'IN_TRANSIT',
          location: 'Lagos Gateway Transit Hub',
          description: 'Package processed at central sort facility',
          timestamp: 'Today, 03:45 PM',
        },
      ],
    };
  }
}
