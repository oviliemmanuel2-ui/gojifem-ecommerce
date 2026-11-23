import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export default function PrivacyPolicyPage() {
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
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">Privacy Policy</h1>
          <p className="text-espresso/80">
            GOJIFEM protects the privacy of shoppers, recipients, and verified merchants across Nigeria and international corridors. We collect only the information required to authenticate your account (via email/password, Google OAuth, or Sign in with Apple), verify delivery serviceability, process Paystack and Flutterwave escrow transactions, and deliver tracked packages.
          </p>
          <h2 className="text-base font-serif font-bold text-espresso pt-2">1. Account &amp; Authentication Data</h2>
          <p className="text-espresso/80">
            When you register or sign in using Google or Apple, GOJIFEM stores your verified email address, name, and provider subject identifier securely. Payment card credentials are tokenized and processed directly by PCI-DSS Level 1 payment processors (Paystack and Flutterwave) and are never stored on GOJIFEM servers.
          </p>
          <h2 className="text-base font-serif font-bold text-espresso pt-2">2. Fulfillment &amp; Courier Sharing</h2>
          <p className="text-espresso/80">
            Recipient name, delivery address, and phone number are shared strictly with the fulfilling vendor and assigned logistics partner (GIG Logistics, Kwik Delivery, or DHL Express) to complete doorstep delivery and customs clearance.
          </p>
          <div className="pt-4 border-t border-rose">
            <Link href="/contact" className="font-bold text-ruby hover:underline">
              Questions? Contact Privacy Support &rarr;
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
