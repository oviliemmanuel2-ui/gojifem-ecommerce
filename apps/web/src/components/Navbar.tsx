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
      <div className="bg-emerald-950 text-emerald-200 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-emerald-900">
        <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>
          <strong>Worldwide Card Acceptance:</strong> Pay from abroad with foreign cards for verified deliveries in Nigeria and enabled zones.
        </span>
      </div>

      {/* Main Navbar */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              G
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">GOJIFEM</span>
              <span className="text-[10px] block font-semibold text-emerald-600 uppercase tracking-wider -mt-1">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg relative">
            <input
              type="text"
              placeholder="Search authentic products, categories, or Nigerian sellers..."
              className="w-full pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Currency Selector */}
            <div className="flex items-center border rounded-lg px-2.5 py-1.5 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">
              <span className="text-slate-400 mr-1.5 hidden sm:inline">Currency:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
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
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 border px-3 py-1.5 rounded-lg hover:border-emerald-300 transition"
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Sell on GOJIFEM</span>
            </Link>

            {/* Account Link */}
            <Link
              href="/auth/login"
              className="hidden sm:flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 p-2"
              title="Sign In / Register"
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Shopping Cart Button */}
            <Link
              href="/cart"
              className="flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="bg-emerald-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                {totalItems}
              </span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
