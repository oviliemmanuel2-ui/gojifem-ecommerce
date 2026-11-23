'use client';

import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ErrorRetryBanner } from '../components/ui/ErrorRetryBanner';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-20 flex-1 w-full flex flex-col justify-center space-y-5">
        <div className="bg-white border border-rose rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ruby">
              Temporary Issue
            </span>
            <h1 className="text-2xl font-serif font-bold text-espresso mt-1">
              Something interrupted your request
            </h1>
            <p className="text-xs text-espresso/75 mt-1 leading-relaxed">
              Your cart items remain safely preserved. You can retry loading this page or return to the marketplace.
            </p>
          </div>

          <ErrorRetryBanner
            title="Unable to complete request"
            message={
              error?.message ||
              'A network or server error occurred while loading this page.'
            }
            onRetry={reset}
            retryLabel="Retry Page"
          />

          <div className="pt-2 flex justify-center sm:justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-rose rounded-xl text-xs font-bold text-espresso hover:bg-rose/30 transition"
            >
              <Home className="w-3.5 h-3.5 text-ruby" />
              <span>Return to Marketplace</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
