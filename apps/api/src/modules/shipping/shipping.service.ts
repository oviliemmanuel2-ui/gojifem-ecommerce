import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ServiceabilityCheckRequest, ServiceabilityCheckResponse } from '@gojifem/types';
import { GiglAdapter, RateEstimateInput, RateEstimateResult, WaybillResult, TrackingResult } from './carriers/gigl.adapter';
import { KwikAdapter } from './carriers/kwik.adapter';
import { DhlAdapter } from './carriers/dhl.adapter';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly giglAdapter: GiglAdapter,
    private readonly kwikAdapter: KwikAdapter,
    private readonly dhlAdapter: DhlAdapter,
  ) {}

  // Allow-list of destination countries GOJIFEM can currently serve
  private readonly serviceableCountries: Record<string, ServiceabilityCheckResponse> = {
    NG: {
      isServiceable: true,
      countryCode: 'NG',
      countryName: 'Nigeria',
      supportedCarriers: ['GIG Logistics', 'Kwik Delivery', 'DHL Express'],
      estimatedDeliveryDaysMin: 1,
      estimatedDeliveryDaysMax: 4,
    },
    GH: {
      isServiceable: true,
      countryCode: 'GH',
      countryName: 'Ghana',
      supportedCarriers: ['DHL Express'],
      estimatedDeliveryDaysMin: 2,
      estimatedDeliveryDaysMax: 4,
    },
    GB: {
      isServiceable: true,
      countryCode: 'GB',
      countryName: 'United Kingdom',
      supportedCarriers: ['DHL Express'],
      estimatedDeliveryDaysMin: 3,
      estimatedDeliveryDaysMax: 5,
    },
    US: {
      isServiceable: true,
      countryCode: 'US',
      countryName: 'United States',
      supportedCarriers: ['DHL Express'],
      estimatedDeliveryDaysMin: 4,
      estimatedDeliveryDaysMax: 6,
    },
    CA: {
      isServiceable: true,
      countryCode: 'CA',
      countryName: 'Canada',
      supportedCarriers: ['DHL Express'],
      estimatedDeliveryDaysMin: 4,
      estimatedDeliveryDaysMax: 7,
    },
  };

  checkServiceability(req: ServiceabilityCheckRequest): ServiceabilityCheckResponse {
    const code = req.countryCode.toUpperCase();
    const destination = this.serviceableCountries[code];

    if (!destination) {
      return {
        isServiceable: false,
        countryCode: code,
        countryName: code,
        supportedCarriers: [],
        estimatedDeliveryDaysMin: 0,
        estimatedDeliveryDaysMax: 0,
        restrictionReason: `GOJIFEM does not currently deliver to ${code}. You can still purchase items using your international card for delivery to any address within Nigeria or other serviceable countries.`,
      };
    }

    return destination;
  }

  listServiceableDestinations(): ServiceabilityCheckResponse[] {
    return Object.values(this.serviceableCountries);
  }

  estimateRates(input: RateEstimateInput): RateEstimateResult[] {
    const results: RateEstimateResult[] = [];

    const giglRate = this.giglAdapter.estimateRate(input);
    if (giglRate) results.push(giglRate);

    const kwikRate = this.kwikAdapter.estimateRate(input);
    if (kwikRate) results.push(kwikRate);

    const dhlRate = this.dhlAdapter.estimateRate(input);
    if (dhlRate) results.push(dhlRate);

    return results;
  }

  generateWaybill(
    vendorOrderId: string,
    carrierCode: string,
    originCity: string,
    destinationAddress: string,
    destinationCountry: string,
  ): WaybillResult {
    const normalized = carrierCode.toUpperCase();

    if (normalized === 'GIGL' || normalized.includes('GIG')) {
      return this.giglAdapter.generateWaybill(vendorOrderId, originCity, destinationAddress);
    }
    if (normalized === 'KWIK') {
      return this.kwikAdapter.generateWaybill(vendorOrderId, originCity, destinationAddress);
    }
    if (normalized === 'DHL') {
      return this.dhlAdapter.generateWaybill(vendorOrderId, originCity, destinationCountry);
    }

    throw new BadRequestException(`Carrier code "${carrierCode}" is not supported for automatic waybills.`);
  }

  trackParcel(carrierCode: string, trackingNumber: string): TrackingResult {
    const normalized = carrierCode.toUpperCase();

    if (normalized === 'GIGL' || normalized.includes('GIG')) {
      return this.giglAdapter.track(trackingNumber);
    }
    if (normalized === 'KWIK') {
      return this.kwikAdapter.track(trackingNumber);
    }
    if (normalized === 'DHL') {
      return this.dhlAdapter.track(trackingNumber);
    }

    throw new NotFoundException(`Carrier "${carrierCode}" tracking service is not configured.`);
  }

  listCarriers() {
    return [
      {
        code: 'GIGL',
        name: 'GIG Logistics',
        coverage: 'Nigeria Nationwide (All 36 States + FCT)',
        vehicleTypes: ['Vans', 'Light Trucks'],
        features: ['Doorstep tracking', 'Cash-on-delivery ready', 'Daily interstate departures'],
      },
      {
        code: 'KWIK',
        name: 'Kwik Delivery',
        coverage: 'Major Urban Hubs (Lagos, Abuja, Ibadan)',
        vehicleTypes: ['Motorcycles', 'Vans'],
        features: ['Instant on-demand dispatch (under 2 hours)', 'Live rider GPS tracking'],
      },
      {
        code: 'DHL',
        name: 'DHL Express',
        coverage: 'Nigeria Priority Express & Worldwide Exports (UK, US, Canada, Ghana, EU)',
        vehicleTypes: ['Air Freight', 'Dedicated Couriers'],
        features: ['Next-day delivery in major cities', 'Full automated customs clearance'],
      },
    ];
  }
}
