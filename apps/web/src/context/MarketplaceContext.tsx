'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR';

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  title: string;
  variantTitle?: string;
  priceMinorNGN: number; // Stored in Kobo (base currency)
  quantity: number;
  imageUrl: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
}

interface MarketplaceContextType {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, qty: number) => void;
  clearCart: () => void;
  formatPrice: (priceMinorNGN: number) => string;
  convertPrice: (priceMinorNGN: number) => number;
  totalItems: number;
  cartSubtotalNGN: number;
  cartByVendor: Record<string, { vendorName: string; vendorSlug: string; items: CartItem[]; subtotalNGN: number }>;
}

// Indicative conversion rates for customer display (authoritative billing remains NGN)
const FX_RATES: Record<SupportedCurrency, { rate: number; symbol: string; prefix: string }> = {
  NGN: { rate: 1.0, symbol: '₦', prefix: 'NGN' },
  USD: { rate: 0.000625, symbol: '$', prefix: 'USD' }, // ~ 1 USD = 1,600 NGN
  GBP: { rate: 0.00048, symbol: '£', prefix: 'GBP' },  // ~ 1 GBP = 2,080 NGN
  EUR: { rate: 0.00057, symbol: '€', prefix: 'EUR' },  // ~ 1 EUR = 1,750 NGN
};

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<SupportedCurrency>('NGN');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gojifem_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {
      // Local storage unavailable
    }
  }, []);

  // Save cart changes
  useEffect(() => {
    try {
      localStorage.setItem('gojifem_cart', JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity: qty } : i)),
    );
  };

  const clearCart = () => setCart([]);

  const convertPrice = (priceMinorNGN: number): number => {
    const naira = priceMinorNGN / 100;
    return naira * FX_RATES[currency].rate;
  };

  const formatPrice = (priceMinorNGN: number): string => {
    const converted = convertPrice(priceMinorNGN);
    const { symbol } = FX_RATES[currency];

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: currency === 'NGN' ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartSubtotalNGN = cart.reduce(
    (sum, item) => sum + item.priceMinorNGN * item.quantity,
    0,
  );

  // Group cart items by vendor for split order fulfillment
  const cartByVendor = cart.reduce((acc, item) => {
    if (!acc[item.vendorId]) {
      acc[item.vendorId] = {
        vendorName: item.vendorName,
        vendorSlug: item.vendorSlug,
        items: [],
        subtotalNGN: 0,
      };
    }
    acc[item.vendorId].items.push(item);
    acc[item.vendorId].subtotalNGN += item.priceMinorNGN * item.quantity;
    return acc;
  }, {} as MarketplaceContextType['cartByVendor']);

  return (
    <MarketplaceContext.Provider
      value={{
        currency,
        setCurrency,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        formatPrice,
        convertPrice,
        totalItems,
        cartSubtotalNGN,
        cartByVendor,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
