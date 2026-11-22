'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  Globe2, 
  Store, 
  User, 
  ShieldCheck 
} from 'lucide-react';
import { useMarketplace, SupportedCurrency } from '../context/MarketplaceContext';

export function Navbar() {
  const { currency, setCurrency, totalItems } = useMarketplace();

  return (
    <>
      {/* Top Banner */}
      <div className="bg-espresso text-ivory text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-espresso-muted">
        <Globe2 className="w-3.5 h-3.5 text-gold shrink-0" />
        <span>
          <strong className="text-gold">Worldwide Card Acceptance:</strong> Pay securely from abroad with foreign cards for verified deliveries in Nigeria and enabled zones.
        </span>
      </div>

      {/* Main Navbar */}
      <header className="border-b border-rose/60 bg-ivory/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-ruby flex items-center justify-center text-white font-extrabold text-xl shadow-md ring-2 ring-gold/40 group-hover:bg-ruby-hover transition">
              G
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-extrabold text-xl tracking-tight text-espresso font-serif">GOJIFEM</span>
                <span className="w-1.5 h-1.5 rounded-full bg-ruby"></span>
              </div>
              <span className="text-[10px] block font-bold text-gold uppercase tracking-wider -mt-1">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg relative">
            <input
              type="text"
              placeholder="Search authentic products, categories, or Nigerian sellers..."
              className="w-full pl-10 pr-4 py-2 border border-rose rounded-full text-xs text-espresso placeholder-espresso/50 focus:outline-none focus:ring-2 focus:ring-ruby focus:border-ruby bg-white/80 transition"
            />
            <Search className="w-4 h-4 text-gold absolute left-3.5 top-2.5" />
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Currency Selector */}
            <div className="flex items-center border border-rose/80 rounded-lg px-2.5 py-1.5 bg-rose/40 text-xs font-semibold text-espresso hover:bg-rose/60 transition">
              <span className="text-espresso/60 mr-1.5 hidden sm:inline">Currency:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                className="bg-transparent focus:outline-none cursor-pointer font-bold text-espresso"
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            {/* Vendor Onboarding Link */}
            <Link
              href="/vendor/apply"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-espresso hover:text-ruby border border-rose rounded-lg px-3 py-1.5 hover:border-ruby/40 hover:bg-rose/30 transition"
            >
              <Store className="w-4 h-4 text-ruby" />
              <span>Sell on GOJIFEM</span>
            </Link>

            {/* Account Link */}
            <Link
              href="/auth/login"
              className="hidden sm:flex items-center gap-1 text-xs font-semibold text-espresso hover:text-ruby p-2 transition"
              title="Sign In / Register"
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Shopping Cart Button */}
            <Link
              href="/cart"
              className="flex items-center gap-2 bg-ruby text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-ruby-hover transition shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              <span className="bg-gold text-espresso rounded-full px-1.5 py-0.2 text-[10px] font-extrabold">
                {totalItems}
              </span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
