'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Store,
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { ProgressiveImage } from '../../components/ui/ProgressiveImage';
import { CheckoutProgressSteps } from '../../components/ui/CheckoutProgressSteps';
import { Spinner } from '../../components/ui/Spinner';
import { useMarketplace } from '../../context/MarketplaceContext';
import { CHECKOUT_AUTH_MESSAGE, savePostAuthRedirect } from '../../lib/authRedirect';

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    cartByVendor,
    updateQuantity,
    removeFromCart,
    clearCart,
    formatPrice,
    cartSubtotalNGN,
    session,
    sessionReady,
    syncingVariantId,
    showToast,
  } = useMarketplace();

  const [preparingCheckout, setPreparingCheckout] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const checkoutLockRef = useRef(false);

  const handleQuantityChange = async (variantId: string, nextQty: number, title: string) => {
    setUpdatingItemId(variantId);
    try {
      await updateQuantity(variantId, nextQty);
      if (nextQty <= 0) {
        showToast(`Removed "${title}" from your shopping bag.`, 'info', { category: 'cart' });
      }
    } finally {
      setUpdatingItemId((curr) => (curr === variantId ? null : curr));
    }
  };

  const handleRemoveItem = async (variantId: string, title: string) => {
    setUpdatingItemId(variantId);
    try {
      await removeFromCart(variantId);
      showToast(`Removed "${title}" from your shopping bag.`, 'info', { category: 'cart' });
    } finally {
      setUpdatingItemId((curr) => (curr === variantId ? null : curr));
    }
  };

  const handleEmptyCart = () => {
    clearCart();
    showToast('Shopping cart cleared.', 'info', { category: 'cart' });
  };

  const handleProceedToCheckout = () => {
    if (!sessionReady || checkoutLockRef.current) return;
    checkoutLockRef.current = true;
    setPreparingCheckout(true);

    if (session?.accessToken) {
      router.push('/checkout');
      return;
    }
    savePostAuthRedirect('/checkout');
    showToast(CHECKOUT_AUTH_MESSAGE, 'info', {
      category: 'checkout',
      dedupeKey: 'checkout-auth-required',
    });
    router.push('/auth/login?redirect=/checkout&reason=checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory text-espresso">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-rose text-ruby flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-espresso">Your shopping cart is empty</h1>
          <p className="text-sm text-espresso/70 mt-2 max-w-sm">
            Explore electronics, fashion, groceries, home living essentials, and authentic goods from verified sellers.
          </p>
          <Link
            href="/"
            className="mt-6 px-6 py-3 bg-ruby text-white text-sm font-bold rounded-xl hover:bg-ruby-hover transition shadow-sm"
          >
            Start Shopping
          </Link>
        </main>
      </div>
    );
  }

  const vendorCount = Object.keys(cartByVendor).length;

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <CheckoutProgressSteps currentStep={1} className="mb-6" />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">
              Multi-Vendor Shopping Cart
            </h1>
            <p className="text-xs sm:text-sm text-espresso/70 mt-1">
              {cart.length} item{cart.length > 1 ? 's' : ''} from {vendorCount} independent merchant
              {vendorCount > 1 ? 's' : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={handleEmptyCart}
            className="text-xs font-semibold text-ruby hover:underline transition flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Cart</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items Column - Grouped by Vendor */}
          <div className="lg:col-span-8 space-y-6">
            {Object.entries(cartByVendor).map(([vendorId, vendorGroup], idx) => (
              <div
                key={vendorId}
                className="bg-white border border-rose rounded-3xl p-6 shadow-sm overflow-hidden"
              >
                {/* Vendor Header in Muted Rose */}
                <div className="flex items-center justify-between pb-4 border-b border-rose mb-4 -mx-6 -mt-6 p-4 px-6 bg-rose/40">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-ruby" />
                    <span className="font-bold text-espresso text-sm font-serif">
                      Package {idx + 1} of {vendorCount}: {vendorGroup.vendorName}
                    </span>
                    <span className="bg-gold text-espresso text-[10px] font-bold px-2 py-0.5 rounded">
                      Direct Dispatch
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-espresso">
                    Subtotal: <strong>{formatPrice(vendorGroup.subtotalNGN)}</strong>
                  </span>
                </div>

                {/* Items in this Vendor's Package */}
                <div className="divide-y divide-rose/60">
                  {vendorGroup.items.map((item) => {
                    const isRowBusy =
                      updatingItemId === item.variantId || syncingVariantId === item.variantId;
                    return (
                      <div
                        key={item.variantId}
                        className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center"
                      >
                        <ProgressiveImage
                          src={item.imageUrl}
                          alt={item.title}
                          containerClassName="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shrink-0 border border-rose"
                          className="w-full h-full object-cover"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif font-bold text-espresso text-sm truncate">
                            {item.title}
                          </h4>
                          {item.variantTitle && (
                            <p className="text-xs text-espresso/60 mt-0.5">{item.variantTitle}</p>
                          )}
                          <div className="text-sm font-bold text-espresso mt-1 flex items-center gap-2">
                            <span>{formatPrice(item.priceMinorNGN)}</span>
                            {isRowBusy && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ruby">
                                <Spinner size="xs" tone="ruby" label="Updating bag..." />
                                <span>Updating...</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center border border-rose rounded-lg bg-ivory p-1">
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() =>
                              handleQuantityChange(item.variantId, item.quantity - 1, item.title)
                            }
                            aria-label={`Decrease quantity of ${item.title}`}
                            className="p-1 hover:bg-rose rounded text-espresso disabled:opacity-40"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-espresso">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() =>
                              handleQuantityChange(item.variantId, item.quantity + 1, item.title)
                            }
                            aria-label={`Increase quantity of ${item.title}`}
                            className="p-1 hover:bg-rose rounded text-espresso disabled:opacity-40"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => handleRemoveItem(item.variantId, item.title)}
                          className="p-2 text-espresso/40 hover:text-ruby transition disabled:opacity-40"
                          title="Remove item"
                          aria-label={`Remove ${item.title} from cart`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Summary Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-rose rounded-3xl p-6 shadow-sm">
              <h2 className="font-serif font-bold text-espresso text-base mb-4">Order Summary</h2>

              <div className="space-y-3 text-xs text-espresso/80 pb-4 border-b border-rose">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-espresso">{formatPrice(cartSubtotalNGN)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span className="text-espresso/60">Calculated at address step</span>
                </div>
                <div className="flex justify-between">
                  <span>Packages count</span>
                  <span className="font-medium text-espresso">
                    {vendorCount} independent shipment{vendorCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-baseline mb-6">
                <div>
                  <span className="font-bold text-espresso text-sm">Estimated Total</span>
                  <span className="block text-[10px] text-espresso/50">Excludes local delivery fee</span>
                </div>
                <span className="text-2xl font-serif font-bold text-espresso">
                  {formatPrice(cartSubtotalNGN)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={!sessionReady || preparingCheckout}
                className="w-full py-3.5 px-4 bg-ruby text-white rounded-xl font-bold text-sm hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-lg shadow-ruby/20 disabled:opacity-60"
              >
                {!sessionReady ? (
                  <>
                    <Spinner size="xs" tone="ivory" label="Checking session..." />
                    <span>Checking session...</span>
                  </>
                ) : preparingCheckout ? (
                  <>
                    <Spinner size="xs" tone="ivory" label="Preparing your checkout..." />
                    <span>Preparing your checkout...</span>
                  </>
                ) : (
                  <>
                    {!session?.accessToken && <Lock className="w-3.5 h-3.5" />}
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {sessionReady && !session?.accessToken && (
                <p className="mt-2.5 text-[11px] text-center text-espresso/70 leading-relaxed">
                  You will be asked to sign in or create an account before checkout. Your cart items stay saved.
                </p>
              )}

              {/* Payment methods badge */}
              <div className="mt-6 pt-4 border-t border-rose text-center">
                <p className="text-[11px] font-bold text-espresso mb-2">Supported Payment Methods</p>
                <div className="flex items-center justify-center gap-2 text-[10px] text-espresso/80 flex-wrap">
                  <span className="px-2 py-0.5 border border-rose rounded bg-ivory">Visa (Local &amp; Int&apos;l)</span>
                  <span className="px-2 py-0.5 border border-rose rounded bg-ivory">Mastercard</span>
                  <span className="px-2 py-0.5 border border-rose rounded bg-ivory">Verve</span>
                  <span className="px-2 py-0.5 border border-rose rounded bg-ivory">Bank Transfer</span>
                </div>
              </div>
            </div>

            {/* Escrow Trust Card in Deep Espresso */}
            <div className="bg-espresso text-ivory rounded-3xl p-5 text-xs space-y-2 border border-gold/30">
              <div className="flex items-center gap-2 font-bold text-gold">
                <ShieldCheck className="w-4 h-4" />
                <span>GOJIFEM Buyer Protection</span>
              </div>
              <p className="text-[11px] text-ivory/80 leading-relaxed">
                Your payment is held in escrow until all {vendorCount} package{vendorCount > 1 ? 's are' : ' is'} delivered and verified.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
