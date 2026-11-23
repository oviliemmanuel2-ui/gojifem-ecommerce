'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import {
  apiFetch,
  readStoredSession,
  writeStoredSession,
  StoredSession,
} from '../lib/api';
import { mergeCartItems } from '../lib/cartMerge';
import { logOperationalEvent } from '../lib/logger';
import { useSystemHealth } from './SystemHealthContext';
import type { SanitySiteSettings } from '../sanity/lib/fetch';

export type CartSyncStatus = 'idle' | 'syncing' | 'synced' | 'pending_sync';

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

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  actionLabel?: string;
  onAction?: () => void;
}

interface MarketplaceContextType {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => Promise<void>;
  removeFromCart: (variantId: string) => Promise<void>;
  updateQuantity: (variantId: string, qty: number) => Promise<void>;
  clearCart: () => void;
  cartPulseKey: number;
  syncingVariantId: string | null;
  cartSyncStatus: CartSyncStatus;
  favorites: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string, productTitle?: string) => void;
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
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  siteSettings: SanitySiteSettings | null;
}

const GUEST_CART_KEY = 'gojifem_cart';
const USER_CART_PREFIX = 'gojifem_cart_user_';
const PENDING_CART_SYNC_KEY = 'gojifem_cart_pending_sync';
const FAVORITES_KEY = 'gojifem_favorites';

function readPendingSyncFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PENDING_CART_SYNC_KEY) === 'true';
  } catch {
    return false;
  }
}

function writePendingSyncFlag(pending: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (pending) {
      localStorage.setItem(PENDING_CART_SYNC_KEY, 'true');
    } else {
      localStorage.removeItem(PENDING_CART_SYNC_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function readFavoritesFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeFavoritesToStorage(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors
  }
}

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
  const { isOnline, status: healthStatus } = useSystemHealth();
  const [currency, setCurrency] = useState<SupportedCurrency>('NGN');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [session, setSessionState] = useState<StoredSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cartPulseKey, setCartPulseKey] = useState(0);
  const [syncingVariantId, setSyncingVariantId] = useState<string | null>(null);
  const [cartSyncStatus, setCartSyncStatus] = useState<CartSyncStatus>('idle');
  const [favorites, setFavorites] = useState<string[]>([]);

  const cartRef = useRef<CartItem[]>([]);
  const sessionRef = useRef<StoredSession | null>(null);
  const pendingResyncLockRef = useRef(false);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      options?: ToastOptions,
    ) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const durationMs =
        options?.durationMs ?? (type === 'error' || type === 'warning' ? 4500 : 3500);
      setToasts((prev) => [
        ...prev.slice(-3),
        {
          id,
          message,
          type,
          actionLabel: options?.actionLabel,
          onAction: options?.onAction,
        },
      ]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
    },
    [],
  );

  // Load saved session, favourites & merge guest cart safely on mount
  useEffect(() => {
    try {
      setFavorites(readFavoritesFromStorage());
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
        if (readPendingSyncFlag() && merged.length > 0) {
          setCartSyncStatus('pending_sync');
        }
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

  const syncCartWithServer = useCallback(
    async (nextItems: CartItem[], variantId: string, showRecoveryToast = false) => {
      const activeToken = sessionRef.current?.accessToken;
      if (!activeToken || nextItems.length === 0) {
        writePendingSyncFlag(false);
        setCartSyncStatus('idle');
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        writePendingSyncFlag(true);
        setCartSyncStatus('pending_sync');
        return;
      }

      setSyncingVariantId(variantId);
      setCartSyncStatus('syncing');
      try {
        await apiFetch('/cart/merge', {
          method: 'POST',
          headers: { Authorization: `Bearer ${activeToken}` },
          skipAuth: true,
          cancelPreviousKey: 'cart-merge',
          body: JSON.stringify({
            items: nextItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          }),
        });
        writePendingSyncFlag(false);
        setCartSyncStatus('synced');
        if (showRecoveryToast) {
          showToast('Connection restored — your saved shopping cart is synced.', 'success');
        }
      } catch (err: unknown) {
        writePendingSyncFlag(true);
        setCartSyncStatus('pending_sync');
        logOperationalEvent({
          level: 'warn',
          category: 'CART',
          endpoint: '/cart/merge',
          method: 'POST',
          message:
            err instanceof Error
              ? err.message
              : 'Cart preserved locally; awaiting server reconnection to sync.',
        });
      } finally {
        setSyncingVariantId((curr) => (curr === variantId ? null : curr));
      }
    },
    [showToast],
  );

  // Automatically re-sync locally preserved cart items when connectivity recovers
  useEffect(() => {
    if (!sessionReady || !session?.accessToken) return;
    if (!isOnline || healthStatus === 'offline' || healthStatus === 'unreachable') return;
    if (cartSyncStatus !== 'pending_sync' || cartRef.current.length === 0) return;
    if (pendingResyncLockRef.current) return;

    pendingResyncLockRef.current = true;
    syncCartWithServer(cartRef.current, 'resync', true).finally(() => {
      pendingResyncLockRef.current = false;
    });
  }, [cartSyncStatus, healthStatus, isOnline, session?.accessToken, sessionReady, syncCartWithServer]);

  const persistCartImmediately = (items: CartItem[]) => {
    const key = sessionRef.current?.user?.id
      ? `${USER_CART_PREFIX}${sessionRef.current.user.id}`
      : GUEST_CART_KEY;
    writeCartToStorage(key, items);
  };

  const addToCart = async (item: Omit<CartItem, 'quantity'>, qty: number = 1) => {
    const safeQty = Math.max(1, Math.floor(qty));
    const current = cartRef.current;
    const existing = current.find((i) => i.variantId === item.variantId);
    const nextCart = existing
      ? current.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + safeQty } : i,
        )
      : [...current, { ...item, quantity: safeQty }];

    cartRef.current = nextCart;
    persistCartImmediately(nextCart);
    setCart(nextCart);
    setCartPulseKey((k) => k + 1);
    await syncCartWithServer(nextCart, item.variantId);
  };

  const removeFromCart = async (variantId: string) => {
    const nextCart = cartRef.current.filter((i) => i.variantId !== variantId);
    cartRef.current = nextCart;
    persistCartImmediately(nextCart);
    setCart(nextCart);
    setCartPulseKey((k) => k + 1);
    await syncCartWithServer(nextCart, variantId);
  };

  const updateQuantity = async (variantId: string, qty: number) => {
    if (qty <= 0) {
      await removeFromCart(variantId);
      return;
    }
    const nextCart = cartRef.current.map((i) =>
      i.variantId === variantId ? { ...i, quantity: qty } : i,
    );
    cartRef.current = nextCart;
    persistCartImmediately(nextCart);
    setCart(nextCart);
    setCartPulseKey((k) => k + 1);
    await syncCartWithServer(nextCart, variantId);
  };

  const clearCart = () => {
    cartRef.current = [];
    persistCartImmediately([]);
    writePendingSyncFlag(false);
    setCartSyncStatus('idle');
    setCart([]);
  };

  const isFavorite = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (productId: string, productTitle?: string) => {
      const exists = favorites.includes(productId);
      const next = exists
        ? favorites.filter((id) => id !== productId)
        : [...favorites, productId];
      setFavorites(next);
      writeFavoritesToStorage(next);
      showToast(
        exists
          ? `Removed ${productTitle ? `"${productTitle}"` : 'item'} from your favourites.`
          : `Saved ${productTitle ? `"${productTitle}"` : 'item'} to your favourites.`,
        exists ? 'info' : 'success',
      );
    },
    [favorites, showToast],
  );

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
        cartPulseKey,
        syncingVariantId,
        cartSyncStatus,
        favorites,
        isFavorite,
        toggleFavorite,
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
          {toasts.map((t) => {
            const toneClass =
              t.type === 'error'
                ? 'bg-ruby text-white border-ruby-dark'
                : t.type === 'warning'
                  ? 'bg-gold text-espresso border-espresso/20'
                  : t.type === 'success'
                    ? 'bg-espresso text-ivory border-gold/60'
                    : 'bg-white text-espresso border-rose';
            return (
              <div
                key={t.id}
                role={t.type === 'error' ? 'alert' : 'status'}
                aria-live={t.type === 'error' ? 'assertive' : 'polite'}
                className={`animate-toast-in pointer-events-auto rounded-2xl px-4 py-3 shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 transition-all ${toneClass}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {t.type === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  )}
                  {t.type === 'error' && (
                    <AlertCircle className="w-4 h-4 text-white shrink-0" />
                  )}
                  {t.type === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-espresso shrink-0" />
                  )}
                  {t.type === 'info' && (
                    <Info className="w-4 h-4 text-ruby shrink-0" />
                  )}
                  <span className="leading-snug">{t.message}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {t.actionLabel && t.onAction && (
                    <button
                      type="button"
                      onClick={() => {
                        t.onAction?.();
                        setToasts((prev) => prev.filter((item) => item.id !== t.id));
                      }}
                      className="underline font-extrabold text-[11px] hover:opacity-80"
                    >
                      {t.actionLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                    aria-label="Dismiss notification"
                    className="p-1 rounded-lg opacity-75 hover:opacity-100 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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
