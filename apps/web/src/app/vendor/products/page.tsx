'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, Package, Plus, RefreshCw, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { ApiError, apiFetch } from '../../../lib/api';
import { Spinner } from '../../../components/ui/Spinner';
import { ErrorRetryBanner } from '../../../components/ui/ErrorRetryBanner';

interface MerchantProductRow {
  id: string;
  variantId: string | null;
  sku: string;
  title: string;
  slug: string;
  category: string;
  priceMinorNGN: number;
  stockCount: number;
  status: string;
  imageUrl: string;
}

export default function VendorProductsPage() {
  const { session, sessionReady, formatPrice, showToast } = useMarketplace();
  const [products, setProducts] = useState<MerchantProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [verificationLockMessage, setVerificationLockMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setVerificationLockMessage(null);
    try {
      const res = await apiFetch<{ merchantStatus: string; products: MerchantProductRow[] }>(
        '/merchant/products',
        { method: 'GET', timeoutMs: 12000 },
      );
      setProducts(res.products);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 403) {
        setVerificationLockMessage(err.message);
      } else if (err instanceof ApiError && err.statusCode === 401) {
        setError('Please sign in with your merchant account to view your catalog.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Unable to load merchant products.');
      }
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (!sessionReady) return;
    if (session?.accessToken) {
      void fetchProducts();
    } else {
      setLoading(false);
    }
  }, [sessionReady, session?.accessToken, fetchProducts]);

  const handleAdjustStock = async (productId: string, delta: number) => {
    setUpdatingId(productId);
    try {
      const res = await apiFetch<{ id: string; stockCount: number }>(
        `/merchant/products/${productId}/stock`,
        {
          method: 'PATCH',
          body: JSON.stringify({ delta }),
        },
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stockCount: res.stockCount } : p)),
      );
      showToast('Inventory updated.', 'success', {
        category: 'merchant',
        dedupeKey: `stock-update-${productId}`,
      });
    } catch (err: unknown) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update stock.', 'error', {
        category: 'merchant',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (!sessionReady || (loading && session?.accessToken && !verificationLockMessage)) {
    return (
      <div className="bg-ivory min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-rose p-10 flex flex-col items-center gap-3">
          <Spinner size="lg" tone="ruby" label="Loading merchant products" />
          <p className="text-sm font-semibold text-espresso-muted">Loading Vendor Catalog...</p>
        </div>
      </div>
    );
  }

  if (!session?.accessToken) {
    return (
      <div className="bg-ivory min-h-screen py-16 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-3xl border border-rose p-8 text-center space-y-4">
          <ShieldCheck className="w-10 h-10 text-ruby mx-auto" />
          <h1 className="font-serif text-2xl font-bold text-espresso">Vendor Portal Sign-In</h1>
          <p className="text-xs text-espresso-muted">
            Sign in with your verified GOJIFEM merchant account to manage products and inventory.
          </p>
          <Link
            href="/auth/login?redirect=/vendor/products"
            className="inline-block px-6 py-3 rounded-full bg-ruby text-white text-xs font-bold hover:bg-ruby-hover transition"
          >
            Sign In to Vendor Portal
          </Link>
        </div>
      </div>
    );
  }

  if (verificationLockMessage) {
    return (
      <div className="bg-ivory min-h-screen py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-rose p-8 sm:p-10 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-gold/20 text-espresso flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-ruby bg-rose px-3.5 py-1 rounded-full">
            Verification Required
          </span>
          <h1 className="font-serif text-3xl font-bold text-espresso">
            Merchant Account Pending Verification
          </h1>
          <p className="text-sm text-espresso-muted leading-relaxed">{verificationLockMessage}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link
              href="/vendor/apply"
              className="px-6 py-3 rounded-full bg-ruby text-white text-xs font-bold hover:bg-ruby-hover transition"
            >
              View / Complete Onboarding Application
            </Link>
            <button
              type="button"
              onClick={() => void fetchProducts()}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full border border-rose text-xs font-bold text-espresso hover:border-ruby"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Check Activation Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-ruby bg-rose px-3 py-1 rounded-full mb-2">
              Verified Vendor Portal
            </span>
            <h1 className="font-serif text-3xl font-bold text-espresso">My Product Catalog</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/vendor/orders"
              className="px-5 py-2.5 rounded-full border border-espresso/20 text-espresso font-bold text-xs hover:border-ruby hover:text-ruby transition flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Fulfillment Orders
            </Link>
            <Link
              href="/vendor/products/new"
              className="px-5 py-2.5 rounded-full bg-ruby text-white font-bold text-xs hover:bg-ruby-hover transition flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Product
            </Link>
          </div>
        </div>

        {error && <ErrorRetryBanner title="Error loading products" message={error} onRetry={fetchProducts} />}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-rose p-5">
            <span className="text-xs font-bold text-espresso-muted uppercase">Live Listings</span>
            <p className="text-2xl font-serif font-bold text-espresso mt-1">
              {products.filter((p) => p.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-rose p-5">
            <span className="text-xs font-bold text-espresso-muted uppercase">Total Stock Units</span>
            <p className="text-2xl font-serif font-bold text-ruby mt-1">
              {products.reduce((acc, p) => acc + p.stockCount, 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-rose p-5">
            <span className="text-xs font-bold text-espresso-muted uppercase">Verification Status</span>
            <p className="text-sm font-bold text-emerald-700 mt-2">Verified Active Merchant</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-rose overflow-hidden shadow-sm">
          {products.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <Package className="w-10 h-10 text-ruby/40 mx-auto" />
              <h2 className="font-serif text-xl font-bold text-espresso">No Products Listed Yet</h2>
              <p className="text-xs text-espresso-muted max-w-md mx-auto">
                Your merchant store is verified and active. Publish your first product to start accepting customer orders on GOJIFEM.
              </p>
              <Link
                href="/vendor/products/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ruby text-white text-xs font-bold hover:bg-ruby-hover transition"
              >
                <Plus className="w-4 h-4" /> List Your First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ivory-200 text-xs font-bold uppercase text-espresso-muted border-b border-rose">
                    <th className="py-4 px-5">Product</th>
                    <th className="py-4 px-4">SKU</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Price</th>
                    <th className="py-4 px-4">Stock</th>
                    <th className="py-4 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose text-sm">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-ivory/60 transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-11 h-11 rounded-lg object-cover border border-rose shrink-0"
                          />
                          <span className="font-semibold text-espresso line-clamp-1">
                            {product.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-espresso-muted">
                        {product.sku}
                      </td>
                      <td className="py-4 px-4 text-xs text-espresso-muted">{product.category}</td>
                      <td className="py-4 px-4 font-bold text-ruby">
                        {formatPrice(product.priceMinorNGN)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={updatingId === product.id}
                            onClick={() => void handleAdjustStock(product.id, -1)}
                            className="w-6 h-6 rounded border border-rose hover:bg-rose/40 text-xs font-bold disabled:opacity-50"
                          >
                            -
                          </button>
                          <span
                            className={`font-semibold text-xs ${
                              product.stockCount === 0 ? 'text-ruby font-bold' : ''
                            }`}
                          >
                            {product.stockCount}
                          </span>
                          <button
                            type="button"
                            disabled={updatingId === product.id}
                            onClick={() => void handleAdjustStock(product.id, 1)}
                            className="w-6 h-6 rounded border border-rose hover:bg-rose/40 text-xs font-bold disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            product.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gold/20 text-espresso'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
