'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Store, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Globe2 
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { useMarketplace } from '../../context/MarketplaceContext';

export default function CartPage() {
  const { 
    cart, 
    cartByVendor, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    formatPrice, 
    cartSubtotalNGN 
  } = useMarketplace();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Your shopping cart is empty</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">
            Explore authentic products from verified Nigerian vendors and add them to your cart.
          </p>
          <Link
            href="/"
            className="mt-6 px-6 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
          >
            Start Shopping
          </Link>
        </main>
      </div>
    );
  }

  const vendorCount = Object.keys(cartByVendor).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Multi-Vendor Cart</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {cart.length} item{cart.length > 1 ? 's' : ''} from {vendorCount} independent Nigerian vendor{vendorCount > 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={clearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Cart</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items Column - Grouped by Vendor */}
          <div className="lg:col-span-8 space-y-6">
            {Object.entries(cartByVendor).map(([vendorId, vendorGroup]) => (
              <div
                key={vendorId}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden"
              >
                {/* Vendor Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 text-sm">
                      Package Dispatched by {vendorGroup.vendorName}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    Subtotal: <strong>{formatPrice(vendorGroup.subtotalNGN)}</strong>
                  </span>
                </div>

                {/* Items in this Vendor's Package */}
                <div className="divide-y divide-slate-100">
                  {vendorGroup.items.map((item) => (
                    <div key={item.variantId} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-slate-100 shrink-0 border"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">
                          {item.title}
                        </h4>
                        {item.variantTitle && (
                          <p className="text-xs text-slate-500 mt-0.5">{item.variantTitle}</p>
                        )}
                        <div className="text-sm font-bold text-slate-900 mt-1">
                          {formatPrice(item.priceMinorNGN)}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded-lg bg-slate-50 p-1">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 hover:bg-white rounded text-slate-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1 hover:bg-white rounded text-slate-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Summary Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="font-extrabold text-slate-900 text-base mb-4">Order Summary</h2>

              <div className="space-y-3 text-xs text-slate-600 pb-4 border-b border-slate-100">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-slate-900">{formatPrice(cartSubtotalNGN)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span className="text-slate-500">Calculated at address step</span>
                </div>
                <div className="flex justify-between">
                  <span>Packages count</span>
                  <span className="font-medium text-slate-900">{vendorCount} independent shipment{vendorCount > 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-baseline mb-6">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm">Estimated Total</span>
                  <span className="block text-[10px] text-slate-400">Excludes local delivery zone fee</span>
                </div>
                <span className="text-2xl font-extrabold text-emerald-700">
                  {formatPrice(cartSubtotalNGN)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="w-full py-3.5 px-4 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Payment methods badge */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <p className="text-[11px] font-semibold text-slate-700 mb-2">Supported Payment Methods</p>
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 flex-wrap">
                  <span className="px-2 py-0.5 border rounded bg-slate-50">Visa (Local & Int'l)</span>
                  <span className="px-2 py-0.5 border rounded bg-slate-50">Mastercard</span>
                  <span className="px-2 py-0.5 border rounded bg-slate-50">Verve</span>
                  <span className="px-2 py-0.5 border rounded bg-slate-50">Bank Transfer</span>
                </div>
              </div>
            </div>

            {/* Escrow Trust Card */}
            <div className="bg-emerald-950 text-emerald-100 rounded-3xl p-5 text-xs space-y-2 border border-emerald-900">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>GOJIFEM Buyer Protection</span>
              </div>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                Your payment is held in escrow until all {vendorCount} package{vendorCount > 1 ? 's are' : ' is'} delivered and verified.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
