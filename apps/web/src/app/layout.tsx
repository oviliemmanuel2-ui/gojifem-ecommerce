import type { Metadata } from 'next';
import './globals.css';
import { MarketplaceProvider } from '../context/MarketplaceContext';

export const metadata: Metadata = {
  title: 'GOJIFEM | Global Multi-Vendor Marketplace (Shop All Items Locally & Worldwide)',
  description:
    'Discover and buy all kinds of items — electronics, fashion, groceries, home appliances, automotive, books, and crafts — from verified Nigerian merchants with seamless local and international card payments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased text-espresso bg-ivory selection:bg-rose selection:text-ruby">
        <MarketplaceProvider>{children}</MarketplaceProvider>
      </body>
    </html>
  );
}
