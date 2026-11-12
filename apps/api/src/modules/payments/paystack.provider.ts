import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  CurrencyCode,
  InitializePaymentRequest,
  InitializePaymentResponse,
  PaymentProvider,
  PaymentProviderName,
  PaymentStatus,
  VerifyPaymentResponse,
  WebhookEvent,
} from '@gojifem/types';

@Injectable()
export class PaystackProvider implements PaymentProvider {
  readonly providerName = PaymentProviderName.PAYSTACK;
  private readonly logger = new Logger(PaystackProvider.name);
  private readonly secretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder';

  async initializePayment(request: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    const reference = `GOJI_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    this.logger.log(
      `Initializing Paystack transaction [${reference}] for Order ${request.orderNumber} - Amount: ${request.amount.amount} ${request.currency}`,
    );

    // In a live call, this sends a POST to https://api.paystack.co/transaction/initialize
    // Paystack accepts foreign cards (Visa, Mastercard, Amex) when enabled on the merchant account.
    return {
      reference,
      provider: this.providerName,
      checkoutUrl: `https://checkout.paystack.com/${reference}`,
      authorizationUrl: `https://checkout.paystack.com/${reference}`,
      accessCode: `acc_${reference}`,
    };
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    this.logger.log(`Verifying Paystack transaction [${reference}]`);

    // In a live call, this calls GET https://api.paystack.co/transaction/verify/${reference}
    return {
      reference,
      providerReference: `pstk_trx_${reference}`,
      status: PaymentStatus.SUCCEEDED,
      amount: {
        amount: 2500000n, // 25,000 NGN in kobo
        currency: CurrencyCode.NGN,
      },
      paidAt: new Date(),
      channel: 'card',
      cardType: 'visa',
      cardCountry: 'US', // International card paid from United States
      isInternationalCard: true,
      rawPayload: {
        gateway_response: 'Successful',
        channel: 'card',
        authorization: {
          brand: 'visa',
          country_code: 'US',
          is_international: true,
        },
      },
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || this.secretKey)
      .update(rawBody)
      .digest('hex');

    return hash === signature;
  }

  parseWebhookEvent(rawBody: string, signature: string): WebhookEvent {
    if (!this.verifyWebhookSignature(rawBody, signature)) {
      throw new Error('Invalid Paystack webhook signature');
    }

    const parsed = JSON.parse(rawBody);
    return {
      id: parsed.data?.id?.toString() || `evt_${Date.now()}`,
      provider: this.providerName,
      event: parsed.event,
      data: parsed.data,
      receivedAt: new Date(),
      rawBody,
      signature,
    };
  }
}
