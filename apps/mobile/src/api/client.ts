import { CurrencyCode, PaymentProviderName } from '@gojifem/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class GojifemApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  // 1. Catalog
  static async getProducts(category?: string, query?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (query) params.append('q', query);
    return this.request<{ products: any[] }>(`/catalog/products?${params.toString()}`);
  }

  static async getProductBySlug(slug: string) {
    return this.request<any>(`/catalog/products/${slug}`);
  }

  static async getCategories() {
    return this.request<any[]>('/catalog/categories');
  }

  // 2. Shipping Serviceability
  static async checkServiceability(countryCode: string) {
    return this.request<any>(`/shipping/check-serviceability?countryCode=${countryCode}`);
  }

  // 3. Checkout & Payment
  static async createQuote(quoteData: any) {
    return this.request<any>('/checkout/quote', {
      method: 'POST',
      body: JSON.stringify(quoteData),
    });
  }

  static async createSession(quoteId: string, email: string) {
    return this.request<any>('/checkout/session', {
      method: 'POST',
      body: JSON.stringify({
        quoteId,
        customerEmail: email,
        preferredProvider: PaymentProviderName.PAYSTACK,
      }),
    });
  }

  // 4. Order Tracking
  static async trackOrder(orderNumber: string) {
    return this.request<any>(`/orders/${orderNumber}/tracking`);
  }
}
