'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  apiFetch,
  readStoredSession,
  writeStoredSession,
  StoredSession,
} from '../lib/api';
import { mergeCartItems } from '../lib/cartMerge';
import type { SanitySiteSettings } from '../sanity/lib/fetch';

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

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
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
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  session: StoredSession | null;
  sessionReady: boolean;
  setSession: (next: StoredSession | null) => void;
  logout: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  siteSettings: SanitySiteSettings | null;
}

const GUEST_CART_KEY = 'gojifem_cart';
const USER_CART_PREFIX = 'gojifem_cart_user_';

function readCartFromStorage(key: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCartToStorage(key: string, items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

// Indicative conversion rates for customer display (authoritative billing remains NGN)
const FX_RATES: Record<SupportedCurrency, { rate: number; symbol: string; prefix: string }> = {
  NGN: { rate: 1.0, symbol: '₦', prefix: 'NGN' },
  USD: { rate: 0.000625, symbol: '$', prefix: 'USD' }, // ~ 1 USD = 1,600 NGN
  GBP: { rate: 0.00048, symbol: '£', prefix: 'GBP' },  // ~ 1 GBP = 2,080 NGN
  EUR: { rate: 0.00057, symbol: '€', prefix: 'EUR' },  // ~ 1 EUR = 1,750 NGN
};

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({
  children,
  initialSiteSettings = null,
}: {
  children: React.ReactNode;
  initialSiteSettings?: SanitySiteSettings | null;
}) {
  const [currency, setCurrency] = useState<SupportedCurrency>('NGN');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [session, setSessionState] = useState<StoredSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const cartRef = useRef<CartItem[]>([]);
  const sessionRef = useRef<StoredSession | null>(null);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    [],
  );

  // Load saved session & merge guest cart safely on mount
  useEffect(() => {
    try {
      const guestItems = readCartFromStorage(GUEST_CART_KEY);
      const savedSession = readStoredSession();

      if (savedSession?.user?.id) {
        const userCartKey = `${USER_CART_PREFIX}${savedSession.user.id}`;
        const savedUserItems = readCartFromStorage(userCartKey);
        const merged = mergeCartItems(savedUserItems, guestItems);
        writeCartToStorage(userCartKey, merged);
        if (guestItems.length > 0) {
          localStorage.removeItem(GUEST_CART_KEY);
        }
        setCart(merged);
        cartRef.current = merged;
        setSessionState(savedSession);
        sessionRef.current = savedSession;
      } else {
        setCart(guestItems);
        cartRef.current = guestItems;
      }
    } catch {
      // Local storage unavailable
    } finally {
      setSessionReady(true);
    }
  }, []);

  // Persist cart changes to the appropriate owner store (guest vs authenticated user)
  useEffect(() => {
    if (!sessionReady) return;
    const key = session?.user?.id ? `${USER_CART_PREFIX}${session.user.id}` : GUEST_CART_KEY;
    writeCartToStorage(key, cart);
  }, [cart, session?.user?.id, sessionReady]);

  const setSession = useCallback((next: StoredSession | null) => {
    writeStoredSession(next);
    const prevUserId = sessionRef.current?.user?.id;

    if (next?.user?.id) {
      const userCartKey = `${USER_CART_PREFIX}${next.user.id}`;
      const isNewLogin = prevUserId !== next.user.id;
      const guestStored = readCartFromStorage(GUEST_CART_KEY);
      const activeGuest = !prevUserId ? cartRef.current : [];
      const incomingGuest = mergeCartItems(guestStored, activeGuest);

      if (isNewLogin || incomingGuest.length > 0) {
        const savedUserCart = readCartFromStorage(userCartKey);
        const merged = mergeCartItems(savedUserCart, incomingGuest);
        writeCartToStorage(userCartKey, merged);
        try {
          localStorage.removeItem(GUEST_CART_KEY);
        } catch {
          // Ignore
        }
        setCart(merged);
        cartRef.current = merged;

        if (merged.length > 0 && next.accessToken) {
          apiFetch('/cart/merge', {
            method: 'POST',
            headers: { Authorization: `Bearer ${next.accessToken}` },
            skipAuth: true,
            body: JSON.stringify({
              items: merged.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
            }),
          }).catch(() => {
            // Non-blocking background DB sync
          });
        }
      }
    }

    sessionRef.current = next;
    setSessionState(next);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Proceed with clearing client session even if network call fails
    }
    writeStoredSession(null);
    sessionRef.current = null;
    setSessionState(null);
    setCart([]);
    cartRef.current = [];
    try {
      localStorage.removeItem(GUEST_CART_KEY);
    } catch {
      // Ignore
    }
    showToast('You have signed out securely.', 'info');
  }, [showToast]);

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
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        session,
        sessionReady,
        setSession,
        logout,
        showToast,
        siteSettings: initialSiteSettings,
      }}
    >
      {children}

      {/* Floating Toast Notifications */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-2xl px-4 py-3 shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 transition-all ${
                t.type === 'error'
                  ? 'bg-ruby text-white border-ruby-dark'
                  : t.type === 'success'
                    ? 'bg-espresso text-ivory border-gold/60'
                    : 'bg-white text-espresso border-rose'
              }`}
            >
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="opacity-70 hover:opacity-100 text-[11px] font-bold"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}
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
