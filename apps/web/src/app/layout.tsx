import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { SystemHealthProvider } from '../context/SystemHealthContext';
import { MarketplaceProvider } from '../context/MarketplaceContext';
import { RouteProgressBar } from '../components/ui/RouteProgressBar';
import { SystemStatusBanner } from '../components/ui/SystemStatusBanner';
import { getSiteSettings } from '../sanity/lib/fetch';

export const metadata: Metadata = {
  title: 'GOJIFEM | Global Multi-Vendor Marketplace (Shop All Items Locally & Worldwide)',
  description:
    'Discover and buy all kinds of items — electronics, fashion, groceries, home appliances, automotive, books, and crafts — from verified Nigerian merchants with seamless local and international card payments.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased text-espresso bg-ivory selection:bg-rose selection:text-ruby">
        <SystemHealthProvider>
          <MarketplaceProvider initialSiteSettings={siteSettings}>
            <Suspense fallback={null}>
              <RouteProgressBar />
            </Suspense>
            <SystemStatusBanner />
            {children}
          </MarketplaceProvider>
        </SystemHealthProvider>
      </body>
    </html>
  );
}
