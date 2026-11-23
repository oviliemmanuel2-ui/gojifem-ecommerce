'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ImagePlus, Lock } from 'lucide-react';
import { useMarketplace } from '../../../../context/MarketplaceContext';
import { ApiError, apiFetch } from '../../../../lib/api';
import { Spinner } from '../../../../components/ui/Spinner';
import { ErrorRetryBanner } from '../../../../components/ui/ErrorRetryBanner';

const CATEGORIES = [
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Nigerian Groceries & Foods',
  'Home, Kitchen & Living',
  'Health, Beauty & Wellness',
  'Arts, Crafts & Collectibles',
];

export default function NewVendorProductPage() {
  const { session, showToast } = useMarketplace();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [priceNGN, setPriceNGN] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<{ title: string; slug: string } | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerificationError(null);

    const parsedPrice = Number(priceNGN);
    const parsedStock = Number(stock);
    if (!title.trim() || !description.trim() || !sku.trim() || parsedPrice <= 0 || parsedStock < 1) {
      const msg = 'Complete title, description, SKU, positive NGN price, and initial stock.';
      setError(msg);
      showToast(msg, 'warning', { category: 'merchant' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ product: { title: string; slug: string } }>(
        '/merchant/products',
        {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            category,
            description: description.trim(),
            priceNGN: parsedPrice,
            sku: sku.trim().toUpperCase(),
            stock: parsedStock,
            imageUrl: imageUrl.trim() || undefined,
          }),
          timeoutMs: 12000,
        },
      );
      setCreatedProduct(res.product);
      showToast(`"${res.product.title}" published to GOJIFEM!`, 'success', {
        category: 'merchant',
      });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 403) {
        setVerificationError(err.message);
        showToast(err.message, 'warning', { category: 'merchant' });
      } else {
        const msg = err instanceof ApiError ? err.message : 'Unable to create product listing.';
        setError(msg);
        showToast(msg, 'error', { category: 'merchant' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.accessToken) {
    return (
      <div className="bg-ivory min-h-screen py-16 px-4 text-center">
        <div className="max-w-lg mx-auto bg-white rounded-3xl border border-rose p-8 space-y-4">
          <h1 className="font-serif text-2xl font-bold text-espresso">Sign In Required</h1>
          <Link
            href="/auth/login?redirect=/vendor/products/new"
            className="inline-block px-6 py-3 rounded-full bg-ruby text-white text-xs font-bold"
          >
            Sign In to List Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/vendor/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-espresso-muted hover:text-ruby mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Product Catalog
        </Link>

        {verificationError && (
          <div className="bg-white rounded-3xl border border-rose p-8 text-center space-y-4 shadow-sm mb-6">
            <Lock className="w-9 h-9 text-ruby mx-auto" />
            <h2 className="font-serif text-xl font-bold text-espresso">
              Merchant Verification Required Before Listing
            </h2>
            <p className="text-xs text-espresso-muted">{verificationError}</p>
            <Link
              href="/vendor/apply"
              className="inline-block px-6 py-3 rounded-full bg-ruby text-white text-xs font-bold hover:bg-ruby-hover"
            >
              Complete Sell on GOJIFEM Application
            </Link>
          </div>
        )}

        {createdProduct ? (
          <div className="bg-white rounded-3xl border border-rose p-10 text-center space-y-5 shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h1 className="font-serif text-3xl font-bold text-espresso">Product Listed Live!</h1>
            <p className="text-sm text-espresso-muted">
              <strong>{createdProduct.title}</strong> is now saved in your verified merchant inventory and live on GOJIFEM.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link
                href="/vendor/products"
                className="px-6 py-3 rounded-full bg-ruby text-white font-bold text-sm hover:bg-ruby-hover transition"
              >
                View My Products
              </Link>
              <button
                type="button"
                onClick={() => {
                  setTitle('');
                  setDescription('');
                  setSku('');
                  setPriceNGN('');
                  setImageUrl('');
                  setCreatedProduct(null);
                }}
                className="px-6 py-3 rounded-full border border-espresso/20 text-espresso font-bold text-sm hover:border-ruby transition"
              >
                Add Another Product
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-rose p-8 shadow-sm">
            <h1 className="font-serif text-2xl font-bold text-espresso mb-2">
              Create New Product Listing
            </h1>
            <p className="text-xs text-espresso-muted mb-6">
              Enter pricing in NGN base currency (automatically displayed in multi-currency for global shoppers).
            </p>

            {error && <ErrorRetryBanner title="Validation error" message={error} className="mb-5" />}

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Handwoven Indigo Aso-Oke Wrap Dress"
                  className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                    Base Price (NGN) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={priceNGN}
                    onChange={(e) => setPriceNGN(e.target.value)}
                    placeholder="e.g., 45000"
                    className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                    Product SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g., ZHT-ASO-012"
                    className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                    Initial Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                  Product Image URL
                </label>
                <div className="relative">
                  <ImagePlus className="w-4 h-4 text-espresso-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... (optional storefront photography URL)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                  Product Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Materials, sizing, craftsmanship, and care instructions..."
                  className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-full bg-ruby text-white font-bold text-sm hover:bg-ruby-hover transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting && <Spinner size="xs" tone="ivory" label="Publishing product" />}
                <span>{submitting ? 'Publishing Listing...' : 'Publish Product Live'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
