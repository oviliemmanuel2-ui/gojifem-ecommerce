'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Globe2, 
  Truck, 
  CreditCard, 
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { DeliveryChecker } from '../components/DeliveryChecker';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

const CATEGORIES = [
  { name: 'Fashion & Apparel', count: '1,240+ Products', icon: '👗' },
  { name: 'Electronics & Gadgets', count: '850+ Products', icon: '📱' },
  { name: 'Beauty & Wellness', count: '620+ Products', icon: '✨' },
  { name: 'Home & Kitchen', count: '940+ Products', icon: '🏡' },
  { name: 'Nigerian Groceries & Foods', count: '430+ Products', icon: '🍲' },
  { name: 'Arts & Handcrafts', count: '310+ Products', icon: '🎨' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 py-16 sm:py-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Verified Nigerian Merchants & Escrow Protection</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            The Multi-Vendor Marketplace Connecting <span className="text-emerald-600">Nigeria</span> to the World.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover authentic handcrafted attire, natural skincare, indigenous groceries, and artisan crafts directly from approved Nigerian sellers.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#featured-products"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#international-payments"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-100 transition shadow-sm"
            >
              How International Payments Work
            </a>
          </div>

          {/* Key Value Badges */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">International & Local Cards</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pay securely with Visa, Mastercard, Verve, or direct bank transfer via Paystack.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Reliable Delivery Zones</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Verified delivery across all 36 Nigerian states and select international destinations.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Verified Vendor Escrow</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Vendors are strictly verified. Funds are held securely until order delivery is confirmed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section id="featured-products" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct from Verified Artisans & Sellers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Featured Products</h2>
            <p className="text-sm text-slate-500 mt-1">
              Prices update automatically in your selected currency.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAMPLE_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Delivery Checker & Serviceability Section */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">
                <Truck className="w-4 h-4" />
                <span>Strict Delivery Coverage Gate</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                Where can GOJIFEM deliver your package?
              </h2>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Before you pay, our system verifies whether the recipient shipping address is within our serviceable zones. You can purchase goods from abroad using international cards for delivery anywhere within Nigeria.
              </p>
            </div>
            <div className="lg:col-span-6">
              <DeliveryChecker />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section id="categories" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Browse by Department</h2>
          <p className="text-sm text-slate-500 mt-1">Shop through verified multi-vendor inventories</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition cursor-pointer text-center group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">{cat.icon}</div>
              <h3 className="font-semibold text-slate-800 text-sm">{cat.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* International Payments Explainer */}
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
