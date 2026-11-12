import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GOJIFEM | Nigeria Multi-Vendor E-Commerce Marketplace',
  description:
    'Discover, compare, and purchase authentic products from verified Nigerian merchants with seamless local and international card payments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
