import React from 'react';
import { CheckoutProgressSteps } from './CheckoutProgressSteps';
import { Spinner } from './Spinner';

/**
 * Reusable shimmer skeleton block styled with GOJIFEM Warm Ivory / Muted Rose palette.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-xl gojifem-shimmer bg-rose/40 ${className}`}
    />
  );
}

/**
 * Navbar placeholder header shown inside route-level loading skeletons.
 */
function NavbarSkeleton() {
  return (
    <div className="border-b border-rose/60 bg-ivory h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-20 h-2.5" />
        </div>
      </div>
      <Skeleton className="hidden md:block flex-1 max-w-lg h-9 rounded-full" />
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-20 h-8 rounded-lg" />
        <Skeleton className="w-20 h-8 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Product card skeleton matching ProductCard proportions.
 */
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-2xl border border-rose/80 overflow-hidden flex flex-col"
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-2/3 h-4" />
        <Skeleton className="w-1/2 h-3" />
        <div className="pt-3 border-t border-rose/60 flex items-center justify-between">
          <Skeleton className="w-20 h-5" />
          <Skeleton className="w-9 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Homepage skeleton displaying hero banner, categories, and product card placeholders.
 */
export function HomePageSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading GOJIFEM marketplace"
      className="min-h-screen flex flex-col bg-ivory text-espresso"
    >
      <div className="bg-espresso/90 h-8 w-full" />
      <NavbarSkeleton />

      <section className="py-16 sm:py-20 border-b border-rose/60 bg-gradient-to-b from-rose/40 via-ivory to-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Skeleton className="w-72 h-7 rounded-full mx-auto" />
          <Skeleton className="w-full max-w-3xl h-12 sm:h-16 mx-auto" />
          <Skeleton className="w-full max-w-xl h-5 mx-auto" />
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Skeleton className="w-full sm:w-52 h-12 rounded-xl" />
            <Skeleton className="w-full sm:w-52 h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-rose space-y-2.5">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-full h-3" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        <div className="text-center space-y-2">
          <Skeleton className="w-32 h-3 mx-auto" />
          <Skeleton className="w-60 h-7 mx-auto" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-rose rounded-2xl p-5 space-y-3">
              <Skeleton className="w-12 h-12 rounded-xl mx-auto" />
              <Skeleton className="w-3/4 h-4 mx-auto" />
              <Skeleton className="w-1/2 h-3 mx-auto" />
            </div>
          ))}
        </div>
      </section>

      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 border-t border-rose/60">
        <div className="space-y-2">
          <Skeleton className="w-48 h-3" />
          <Skeleton className="w-64 h-7" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </section>
      <span className="sr-only">Loading marketplace products and categories...</span>
    </div>
  );
}

/**
 * Product detail page loading skeleton.
 */
export function ProductDetailSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading product details"
      className="min-h-screen flex flex-col bg-ivory text-espresso"
    >
      <NavbarSkeleton />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <Skeleton className="w-36 h-4 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-4">
            <Skeleton className="aspect-square w-full rounded-3xl" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="w-20 h-20 rounded-2xl shrink-0" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-6 bg-white border border-rose rounded-3xl p-6 sm:p-8 space-y-5">
            <Skeleton className="w-28 h-3" />
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-2/3 h-8" />
            <Skeleton className="w-full h-12 rounded-xl" />
            <Skeleton className="w-full h-16 rounded-2xl" />
            <div className="flex gap-4">
              <Skeleton className="w-32 h-12 rounded-xl" />
              <Skeleton className="flex-1 h-12 rounded-xl" />
            </div>
            <Skeleton className="w-full h-24 rounded-2xl" />
          </div>
        </div>
      </main>
      <span className="sr-only">Loading product information...</span>
    </div>
  );
}

/**
 * Shopping cart loading skeleton.
 */
export function CartSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading your shopping cart"
      className="min-h-screen flex flex-col bg-ivory text-espresso"
    >
      <NavbarSkeleton />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div className="space-y-2">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-44 h-4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-rose rounded-3xl p-6 space-y-4">
                <Skeleton className="w-1/2 h-5" />
                <div className="flex items-center gap-4">
                  <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/3 h-3" />
                  </div>
                  <Skeleton className="w-24 h-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4 bg-white border border-rose rounded-3xl p-6 space-y-4">
            <Skeleton className="w-36 h-6" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-12 rounded-xl" />
          </div>
        </div>
      </main>
      <span className="sr-only">Loading shopping bag...</span>
    </div>
  );
}

/**
 * Checkout preparation skeleton showing progress steps and preparing notice.
 */
export function CheckoutSkeleton({
  message = 'Preparing your checkout...',
}: {
  message?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={message}
      className="min-h-screen flex flex-col bg-ivory text-espresso"
    >
      <NavbarSkeleton />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <CheckoutProgressSteps currentStep={2} />

        <div className="bg-white border border-rose rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
          <Spinner size="sm" tone="ruby" label={message} />
          <div>
            <p className="text-sm font-serif font-bold text-espresso">{message}</p>
            <p className="text-xs text-espresso/65">
              Verifying your customer session, delivery corridor, and encrypted checkout channel.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl border border-rose p-6 space-y-4">
              <Skeleton className="w-48 h-5" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
              <Skeleton className="h-10" />
            </div>
            <div className="bg-white rounded-3xl border border-rose p-6 space-y-3">
              <Skeleton className="w-40 h-5" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          </div>
          <div className="lg:col-span-4 bg-white rounded-3xl border border-rose p-6 space-y-4">
            <Skeleton className="w-44 h-5" />
            <Skeleton className="w-full h-16 rounded-2xl" />
            <Skeleton className="w-full h-12 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Blog / Journal loading skeleton.
 */
export function BlogSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading GOJIFEM journal articles"
      className="min-h-screen flex flex-col bg-ivory text-espresso"
    >
      <NavbarSkeleton />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        <div className="space-y-3 max-w-xl">
          <Skeleton className="w-48 h-3" />
          <Skeleton className="w-72 h-9" />
          <Skeleton className="w-full h-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-rose rounded-3xl overflow-hidden">
              <Skeleton className="aspect-[16/10] w-full rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-full h-5" />
                <Skeleton className="w-5/6 h-4" />
                <Skeleton className="w-full h-3" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <span className="sr-only">Loading articles...</span>
    </div>
  );
}
