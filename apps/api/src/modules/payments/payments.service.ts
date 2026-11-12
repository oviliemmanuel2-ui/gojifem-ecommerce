import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CurrencyCode,
  InitializePaymentRequest,
  InitializePaymentResponse,
  PaymentProvider,
  PaymentProviderName,
  VerifyPaymentResponse,
} from '@gojifem/types';
import { PaystackProvider } from './paystack.provider';

@Injectable()
export class PaymentsService {
  private readonly providers: Map<PaymentProviderName, PaymentProvider> = new Map();

  constructor(private readonly paystackProvider: PaystackProvider) {
    this.providers.set(PaymentProviderName.PAYSTACK, this.paystackProvider);
  }

  getProvider(name: PaymentProviderName = PaymentProviderName.PAYSTACK): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new BadRequestException(`Payment provider ${name} is not registered`);
    }
    return provider;
  }

  async initializePayment(
    request: InitializePaymentRequest,
    preferredProvider: PaymentProviderName = PaymentProviderName.PAYSTACK,
  ): Promise<InitializePaymentResponse> {
    const provider = this.getProvider(preferredProvider);
    return provider.initializePayment(request);
  }

  async verifyPayment(
    reference: string,
    providerName: PaymentProviderName = PaymentProviderName.PAYSTACK,
  ): Promise<VerifyPaymentResponse> {
    const provider = this.getProvider(providerName);
    return provider.verifyPayment(reference);
  }
}
