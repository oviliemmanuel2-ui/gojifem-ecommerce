import { Injectable } from '@nestjs/common';
import { ServiceabilityCheckRequest, ServiceabilityCheckResponse } from '@gojifem/types';

@Injectable()
export class ShippingService {
  // Allow-list of destination countries GOJIFEM can currently serve
  private readonly serviceableCountries: Record<string, ServiceabilityCheckResponse> = {
    NG: {
      isServiceable: true,
      countryCode: 'NG',
      countryName: 'Nigeria',
      supportedCarriers: ['GIGL', 'Kwik Delivery', 'DHL Express Nigeria', 'Red Star Express'],
      estimatedDeliveryDaysMin: 1,
      estimatedDeliveryDaysMax: 4,
    },
    GH: {
      isServiceable: true,
      countryCode: 'GH',
      countryName: 'Ghana',
      supportedCarriers: ['DHL Express', 'FedEx'],
      estimatedDeliveryDaysMin: 3,
      estimatedDeliveryDaysMax: 7,
    },
    GB: {
      isServiceable: true,
      countryCode: 'GB',
      countryName: 'United Kingdom',
      supportedCarriers: ['DHL Express International'],
      estimatedDeliveryDaysMin: 4,
      estimatedDeliveryDaysMax: 8,
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
}
