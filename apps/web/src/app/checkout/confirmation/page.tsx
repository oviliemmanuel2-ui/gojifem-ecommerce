'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle2, 
  Package, 
  Store, 
  Truck, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  CreditCard 
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get('orderNumber') || 'GOJI-2026-849201';

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full text-center">
      {/* Success Badge */}
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
        Order Confirmed & Paid
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
        Your payment has been secured in escrow. Independent vendors have been notified to begin dispatch.
      </p>

      {/* Order Info Card */}
      <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm text-left space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Order Reference</span>
            <strong className="text-sm sm:text-base font-extrabold text-slate-900 block">{orderNumber}</strong>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
            Payment Verified via Paystack (3DS Secure)
          </span>
        </div>

        {/* Split Shipments */}
        <div>
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Vendor Fulfillment Breakdown
          </h2>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-emerald-700">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-slate-900 block">Package 1: Omo Odua Heritage Looms</strong>
                  <span className="text-slate-500">Dispatching from Ibadan, Oyo State via GIGL</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-[10px]">
                Order Accepted
              </span>
            </div>
          </div>
        </div>

        {/* Escrow Notice */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/50 rounded-2xl flex items-start gap-3 text-xs text-slate-700">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-900 block">Escrow Protection Active</strong>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Vendor payment will only be released following recorded courier delivery and recipient inspection.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/account"
            className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-sm text-center"
          >
            <span>View in Account & Track Parcels</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="py-3 px-4 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading order confirmation...</div>}>
        <ConfirmationContent />
      </Suspense>
    </div>
  );
}
