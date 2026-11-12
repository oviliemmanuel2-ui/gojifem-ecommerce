'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  ShieldCheck, 
  Globe2, 
  Truck, 
  CreditCard, 
  ArrowRight,
  Store,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Fashion & Apparel', count: '1,240+ Products', icon: '👗' },
  { name: 'Electronics & Gadgets', count: '850+ Products', icon: '📱' },
  { name: 'Beauty & Wellness', count: '620+ Products', icon: '✨' },
  { name: 'Home & Kitchen', count: '940+ Products', icon: '🏡' },
  { name: 'Nigerian Groceries & Foods', count: '430+ Products', icon: '🍲' },
  { name: 'Arts & Handcrafts', count: '310+ Products', icon: '🎨' },
];

export default function HomePage() {
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'GBP' | 'EUR'>('NGN');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Banner */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>
          <strong>Worldwide Card Acceptance:</strong> Diaspora & international customers can pay with foreign cards for verified deliveries in Nigeria and enabled zones.
        </span>
      </div>

      {/* Main Navigation */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              G
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">GOJIFEM</span>
              <span className="text-[10px] block font-semibold text-emerald-600 uppercase tracking-wider -mt-1">
                Marketplace
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg relative">
            <input
              type="text"
              placeholder="Search products, brands, or verified Nigerian vendors..."
              className="w-full pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Currency Selector */}
            <div className="flex items-center border rounded-lg px-2 py-1 bg-slate-50 text-xs font-semibold text-slate-700">
              <span className="text-slate-400 mr-1.5">Currency:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <a
              href="/vendor/apply"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 border px-3 py-1.5 rounded-lg"
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Sell on GOJIFEM</span>
            </a>

            <button className="flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-slate-800">
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              <span className="bg-emerald-500 text-white rounded-full px-1.5 py-0.2 text-[10px]">0</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-emerald-50/60 to-white py-16 sm:py-24 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Verified Nigerian Merchants & Secure Escrow Checkout</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            The Multi-Vendor Marketplace Connecting <span className="text-emerald-600">Nigeria</span> to the World.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Discover premium quality goods from authentic sellers. Pay seamlessly from Nigeria or abroad with international cards, and enjoy tracked deliveries to your doorstep.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#categories"
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#international-payments"
              className="w-full sm:w-auto px-8 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition"
            >
              How International Payments Work
            </a>
          </div>

          {/* Key Value Badges */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 text-sm">International & Local Cards</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pay securely with Visa, Mastercard, Verve, or direct bank transfer via Paystack.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 text-sm">Reliable Delivery Zones</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Verified delivery across all 36 Nigerian states and select international destinations.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 text-sm">Verified Vendor Escrow</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Vendors are strictly verified. Funds are held securely until order delivery is confirmed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section id="categories" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Explore Marketplace Categories</h2>
            <p className="text-sm text-slate-500 mt-1">Sourced directly from verified independent vendors</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="bg-white border rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition cursor-pointer text-center group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">{cat.icon}</div>
              <h3 className="font-semibold text-slate-800 text-sm">{cat.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* International Payments Explainer Section */}
      <section id="international-payments" className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-3">
                <Globe2 className="w-4 h-4" />
                <span>Diaspora & International Shoppers</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-snug">
                Sending to loved ones in Nigeria? Pay easily with your foreign card.
              </h2>
              <p className="text-slate-300 mt-4 text-sm sm:text-base leading-relaxed">
                GOJIFEM decouples payment processing from delivery coverage. Whether you are in London, New York, Toronto, or Atlanta, you can pay using your foreign bank card while we handle fulfillment and delivery within Nigeria.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Pay with international Visa, Mastercard, or American Express',
                  'Checkout transparently calculates delivery fee by recipient state/zone',
                  'Real-time parcel tracking provided to both buyer and recipient',
                  'Escrow protection: vendor payment released only after successful delivery',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8">
              <h3 className="font-bold text-lg mb-4 text-white">How Checkout Works</h3>
              <ol className="space-y-4 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <div>
                    <strong className="text-white block">Add items from any vendor</strong>
                    <span>Your cart can combine products from multiple verified Nigerian sellers.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <div>
                    <strong className="text-white block">Provide Delivery Destination</strong>
                    <span>Our system validates the delivery address against our active serviceable zones (Nigeria-wide at launch).</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <div>
                    <strong className="text-white block">Pay with any Supported Card</strong>
                    <span>Your card issuer handles any currency conversion seamlessly via Paystack 3DS secure gateway.</span>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white py-12 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} GOJIFEM Marketplace Ltd. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-emerald-600">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-600">Terms of Service</a>
            <a href="#" className="hover:text-emerald-600">Vendor Agreement</a>
            <a href="#" className="hover:text-emerald-600">Delivery Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
