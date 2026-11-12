import { CurrencyCode, PaymentProviderName, PaymentStatus } from './enums.js';
import { Money } from './money.js';

export interface InitializePaymentRequest {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  amount: Money; // Total charged in transaction currency
  currency: CurrencyCode;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializePaymentResponse {
  reference: string;
  provider: PaymentProviderName;
  checkoutUrl: string;
  authorizationUrl?: string;
  accessCode?: string;
}

export interface VerifyPaymentResponse {
  reference: string;
  providerReference: string;
  status: PaymentStatus;
  amount: Money;
  paidAt?: Date;
  channel?: string; // card, bank_transfer, ussd
  cardType?: string; // visa, mastercard, verve
  cardCountry?: string; // e.g. US, GB, NG
  isInternationalCard: boolean;
  rawPayload: Record<string, unknown>;
}

export interface WebhookEvent<T = Record<string, unknown>> {
  id: string;
  provider: PaymentProviderName;
  event: string;
  data: T;
  receivedAt: Date;
  rawBody: string;
  signature: string;
}

export interface PaymentProvider {
  readonly providerName: PaymentProviderName;
  initializePayment(request: InitializePaymentRequest): Promise<InitializePaymentResponse>;
  verifyPayment(reference: string): Promise<VerifyPaymentResponse>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  parseWebhookEvent(rawBody: string, signature: string): WebhookEvent;
}
