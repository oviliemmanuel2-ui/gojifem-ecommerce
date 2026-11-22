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
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { DeliveryChecker } from '../components/DeliveryChecker';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

const CATEGORIES = [
  { name: 'Fashion & Apparel', count: '1,420+ Items', icon: '👗' },
  { name: 'Electronics & Gadgets', count: '980+ Items', icon: '📱' },
  { name: 'Nigerian Groceries & Foods', count: '650+ Items', icon: '🍲' },
  { name: 'Home, Kitchen & Living', count: '820+ Items', icon: '🏡' },
  { name: 'Health, Beauty & Personal Care', count: '740+ Items', icon: '✨' },
  { name: 'Arts, Crafts & Collectibles', count: '410+ Items', icon: '🎨' },
  { name: 'Automotive & Hardware', count: '530+ Items', icon: '🚗' },
  { name: 'Books, Media & Stationery', count: '390+ Items', icon: '📚' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-ivory text-espresso">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-rose/50 via-ivory to-ivory py-16 sm:py-20 border-b border-rose/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gold text-espresso text-xs px-3.5 py-1.5 rounded-full font-bold shadow-sm mb-6">
            <ShieldCheck className="w-4 h-4 text-espresso" />
            <span>GLOBAL & LOCAL MULTI-VENDOR MARKETPLACE &bull; 100% ESCROW PROTECTION</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-espresso tracking-tight max-w-4xl mx-auto leading-tight">
            The Multi-Vendor Marketplace for <span className="text-ruby">All Kinds of Items</span> Locally & Worldwide.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-espresso/80 max-w-2xl mx-auto leading-relaxed">
            Shop electronics, fashion, groceries, home appliances, automotive accessories, books, and cultural crafts directly from approved sellers in Nigeria and international hubs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#featured-products"
              className="w-full sm:w-auto px-8 py-3.5 bg-ruby text-white rounded-xl font-bold hover:bg-ruby-hover transition shadow-lg shadow-ruby/20 flex items-center justify-center gap-2"
            >
              <span>Explore All Departments</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#international-payments"
              className="w-full sm:w-auto px-8 py-3.5 bg-ivory text-espresso border border-gold/70 rounded-xl font-semibold hover:bg-rose/50 transition shadow-sm"
            >
              How Worldwide Checkout Works
            </a>
          </div>

          {/* Key Value Badges */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-white p-5 rounded-2xl border border-rose shadow-sm flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-rose text-ruby">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-espresso text-sm">International & Local Cards</h3>
                <p className="text-xs text-espresso/70 mt-1">
                  Pay securely with Visa, Mastercard, Verve, or direct bank transfer via Paystack with multi-currency support.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose shadow-sm flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-gold/30 text-espresso">
                <Truck className="w-6 h-6 text-espresso" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-espresso text-sm">Worldwide & Local Delivery</h3>
                <p className="text-xs text-espresso/70 mt-1">
                  Doorstep shipping across all 36 Nigerian states and international express shipping worldwide.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose shadow-sm flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-rose text-ruby">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-espresso text-sm">Verified Vendor Escrow</h3>
                <p className="text-xs text-espresso/70 mt-1">
                  Sellers are strictly verified. Funds are held safely in escrow until you receive and inspect your items.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid (All 8 Departments) */}
      <section id="categories" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-ruby">Endless Selection</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-espresso mt-1">Browse All Categories</h2>
          <p className="text-sm text-espresso/70 mt-1">Discover thousands of verified products from independent vendors</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="bg-white border border-rose rounded-2xl p-5 hover:border-ruby hover:shadow-md transition cursor-pointer text-center group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">{cat.icon}</div>
              <h3 className="font-serif font-bold text-espresso text-sm group-hover:text-ruby transition">{cat.name}</h3>
              <p className="text-xs text-espresso/60 mt-1">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section id="featured-products" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-t border-rose/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ruby uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Direct from Verified Merchants & Makers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">Featured Marketplace Listings</h2>
            <p className="text-sm text-espresso/70 mt-1">
              Prices calculate live in NGN, USD, GBP, or EUR.
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
      <section className="py-12 bg-rose/20 border-y border-rose">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-1.5 text-xs text-ruby font-bold uppercase tracking-wider mb-2">
                <Truck className="w-4 h-4 text-gold" />
                <span>Strict Delivery Coverage Gate</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-espresso leading-snug">
                Where can GOJIFEM deliver your package?
              </h2>
              <p className="text-sm text-espresso/80 mt-3 leading-relaxed">
                Before you pay, our system verifies whether the recipient shipping address is within our serviceable zones. You can purchase goods from abroad using international cards for delivery anywhere within Nigeria and select international destinations.
              </p>
            </div>
            <div className="lg:col-span-6">
              <DeliveryChecker />
            </div>
          </div>
        </div>
      </section>

      {/* International & Local Payments Explainer */}
      <section id="international-payments" className="bg-espresso text-ivory py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-gold font-bold uppercase tracking-wider mb-3">
                <Globe2 className="w-4 h-4 text-gold" />
                <span>Local Shoppers & Global Diaspora</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight leading-snug">
                Shopping in Nigeria or sending from abroad? Pay easily in any currency.
              </h2>
              <p className="text-ivory/80 mt-4 text-sm sm:text-base leading-relaxed">
                GOJIFEM connects verified multi-vendor merchants to customers everywhere. Whether you are in Lagos, Abuja, London, New York, Toronto, or Atlanta, you can pay using your local or foreign bank card while we handle tracked fulfillment.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Pay with Visa, Mastercard, American Express, Verve, or direct bank transfer',
                  'Checkout transparently calculates courier dispatch by recipient state or international corridor',
                  'Real-time parcel tracking provided to both buyer and recipient',
                  'Escrow protection: vendor payment released only after successful delivery inspection',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-ivory/90">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#2a1e1c] border border-gold/30 rounded-3xl p-6 sm:p-8">
              <h3 className="font-serif font-bold text-lg mb-4 text-ivory">How Checkout Works</h3>
              <ol className="space-y-4 text-sm text-ivory/80">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-ruby text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <div>
                    <strong className="text-ivory block">Add all kinds of items to one cart</strong>
                    <span>Combine products from multiple verified electronics, fashion, groceries, or home goods sellers in a single checkout.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-ruby text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <div>
                    <strong className="text-ivory block">Enter Delivery Destination</strong>
                    <span>Our system validates the delivery address against our active serviceable zones (nationwide Nigeria + international corridors).</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-ruby text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <div>
                    <strong className="text-ivory block">Pay Securely with any Card</strong>
                    <span>Paystack 3DS secure gateway processes local and foreign bank cards seamlessly with instant order confirmation.</span>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-rose/80 bg-ivory py-12 text-espresso/70 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} GOJIFEM Global Marketplace Ltd. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-ruby transition">Privacy Policy</a>
            <a href="#" className="hover:text-ruby transition">Terms of Service</a>
            <a href="#" className="hover:text-ruby transition">Vendor Agreement</a>
            <a href="#" className="hover:text-ruby transition">Delivery Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
