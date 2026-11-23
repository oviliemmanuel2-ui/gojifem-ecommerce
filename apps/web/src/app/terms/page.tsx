import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso/70 hover:text-ruby mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>

        <article className="bg-white border border-rose rounded-3xl p-6 sm:p-10 shadow-sm space-y-5 text-xs sm:text-sm leading-relaxed">
          <div className="flex items-center gap-2 text-ruby font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>GOJIFEM Global Marketplace Ltd.</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">Terms of Service</h1>
          <p className="text-espresso/80">
            By browsing, buying, or selling on GOJIFEM, you agree to abide by our buyer escrow rules, truthful listing requirements, and serviceable delivery verification policies.
          </p>
          <h2 className="text-base font-serif font-bold text-espresso pt-2">1. Escrow Protection</h2>
          <p className="text-espresso/80">
            All payments collected at checkout are held safely in GOJIFEM escrow until order packages are shipped and delivered to the recipient address. Disputes regarding damaged, missing, or counterfeit goods may be escalated to GOJIFEM support within 48 hours of delivery.
          </p>
          <h2 className="text-base font-serif font-bold text-espresso pt-2">2. Multi-Currency Presentment</h2>
          <p className="text-espresso/80">
            Prices may be previewed in NGN, USD, GBP, or EUR. Final cardholder conversion and settlements follow the selected gateway (Paystack or Flutterwave) exchange settlement terms.
          </p>
          <div className="pt-4 border-t border-rose">
            <Link href="/contact" className="font-bold text-ruby hover:underline">
              Need clarification? Contact Support &rarr;
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
