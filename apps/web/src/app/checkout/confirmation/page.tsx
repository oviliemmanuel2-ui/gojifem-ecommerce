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
      <div className="w-16 h-16 rounded-full bg-rose text-ruby flex items-center justify-center mx-auto mb-4 shadow-sm ring-4 ring-gold/30">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">
        Order Confirmed & Paid
      </h1>
      <p className="text-xs sm:text-sm text-espresso/70 mt-1 max-w-md mx-auto">
        Your payment has been secured in escrow. Independent vendors have been notified to begin dispatch.
      </p>

      {/* Order Info Card */}
      <div className="mt-8 bg-white rounded-3xl border border-rose p-6 sm:p-8 shadow-sm text-left space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rose gap-2">
          <div>
            <span className="text-[10px] text-espresso/60 uppercase font-bold tracking-wider">Order Reference</span>
            <strong className="text-sm sm:text-base font-serif font-bold text-espresso block">{orderNumber}</strong>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold text-espresso self-start sm:self-auto">
            Payment Verified via Paystack (3DS Secure)
          </span>
        </div>

        {/* Split Shipments */}
        <div>
          <h2 className="text-xs font-bold text-espresso uppercase tracking-wider mb-3">
            Vendor Fulfillment Breakdown
          </h2>

          <div className="space-y-3">
            <div className="p-4 bg-ivory rounded-2xl border border-rose flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-rose flex items-center justify-center text-ruby">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-espresso block font-serif">Package 1: Omo Odua Heritage Looms</strong>
                  <span className="text-espresso/70">Dispatching from Ibadan, Oyo State via GIGL</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-rose text-espresso font-bold text-[10px] border border-rose">
                Order Accepted
              </span>
            </div>
          </div>
        </div>

        {/* Escrow Notice */}
        <div className="p-4 bg-rose/40 border border-gold/40 rounded-2xl flex items-start gap-3 text-xs text-espresso">
          <ShieldCheck className="w-5 h-5 text-ruby shrink-0 mt-0.5" />
          <div>
            <strong className="text-espresso font-bold block">Escrow Protection Active</strong>
            <p className="text-[11px] text-espresso/80 mt-0.5">
              Vendor payment will only be released following recorded courier delivery and recipient inspection.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/account"
            className="flex-1 py-3 px-4 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-sm text-center"
          >
            <span>View in Account & Track Parcels</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="py-3 px-4 border border-rose rounded-xl text-xs font-bold text-espresso hover:bg-rose/40 transition text-center"
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
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center text-xs text-espresso/60">Loading order confirmation...</div>}>
        <ConfirmationContent />
      </Suspense>
    </div>
  );
}
