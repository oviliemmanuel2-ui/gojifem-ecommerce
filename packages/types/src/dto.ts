import { CurrencyCode, OrderStatus, VendorOrderStatus } from './enums.js';
import { Money } from './money.js';

export interface AddressSnapshot {
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string; // ISO 2-letter, e.g. "NG", "US", "GB"
  stateOrRegion: string;
  city: string;
  streetAddress: string;
  apartmentSuite?: string;
  postalCode?: string;
  deliveryNotes?: string;
}

export interface ServiceabilityCheckRequest {
  countryCode: string;
  stateOrRegion?: string;
  city?: string;
}

export interface ServiceabilityCheckResponse {
  isServiceable: boolean;
  countryCode: string;
  countryName: string;
  supportedCarriers: string[];
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  restrictionReason?: string;
}

export interface CheckoutQuoteRequest {
  cartId: string;
  shippingAddress: AddressSnapshot;
  billingCountryCode: string;
  presentmentCurrency: CurrencyCode;
}

export interface VendorQuoteItem {
  variantId: string;
  sku: string;
  title: string;
  quantity: number;
  unitPrice: Money;
  subtotal: Money;
}

export interface VendorQuoteGroup {
  vendorId: string;
  vendorName: string;
  items: VendorQuoteItem[];
  itemsSubtotal: Money;
  shippingFee: Money;
  vendorTotal: Money;
}

export interface CheckoutQuoteResponse {
  quoteId: string;
  expiresAt: Date;
  serviceable: boolean;
  serviceabilityNotes?: string;
  presentmentCurrency: CurrencyCode;
  transactionCurrency: CurrencyCode; // Currency the gateway will charge (e.g., NGN)
  itemsSubtotal: Money;
  shippingTotal: Money;
  discountTotal: Money;
  grandTotal: Money;
  vendorGroups: VendorQuoteGroup[];
}
