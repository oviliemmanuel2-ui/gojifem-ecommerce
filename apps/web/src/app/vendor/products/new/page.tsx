'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  ShieldAlert,
  Store
} from 'lucide-react';
import { Navbar } from '../../../../components/Navbar';

export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fashion & Apparel');
  const [description, setDescription] = useState('');
  const [priceNGN, setPriceNGN] = useState('35000');
  const [sku, setSku] = useState('ASO-OKE-ROYAL-L');
  const [stock, setStock] = useState('20');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1594938298603-c8148c4dae35');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // In production, this sends POST /api/v1/catalog/vendor/products
    await new Promise((r) => setTimeout(r, 700));

    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      router.push('/vendor/products');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/vendor/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso/70 hover:text-ruby transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Inventory</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-rose shadow-sm p-6 sm:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-serif font-bold text-espresso">List a New Product</h1>
            <p className="text-xs text-espresso/70 mt-1">
              New listings are reviewed by GOJIFEM moderation before public publication on the marketplace.
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-rose/40 border border-gold/40 text-xs text-espresso flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-ruby shrink-0" />
              <span>
                Product created successfully! Listing has been submitted for catalog moderation review.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Info */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-espresso uppercase tracking-wider pb-2 border-b border-rose">
                1. General Information
              </h2>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Product Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Handcrafted Royal Blue Aso-Oke 3-Piece Set"
                  className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">Department Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
                  >
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Nigerian Groceries & Foods">Nigerian Groceries & Foods</option>
                    <option value="Beauty & Wellness">Beauty & Wellness</option>
                    <option value="Arts & Handcrafts">Arts & Handcrafts</option>
                    <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. PROD-SKU-001"
                    className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Product Description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe material, dimensions, artisan origin, and authentic details..."
                  className="w-full text-xs border border-rose rounded-xl p-3 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-bold text-espresso uppercase tracking-wider pb-2 border-b border-rose">
                2. Pricing & Initial Inventory
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">
                    Price in Nigerian Naira (₦ NGN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-espresso/50">₦</span>
                    <input
                      type="number"
                      required
                      min={100}
                      value={priceNGN}
                      onChange={(e) => setPriceNGN(e.target.value)}
                      placeholder="35000"
                      className="w-full text-xs border border-rose rounded-xl pl-8 pr-3.5 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby font-bold text-espresso"
                    />
                  </div>
                  <span className="text-[10px] text-espresso/60 mt-1 block">
                    GOJIFEM charges a 10% commission upon confirmed delivery.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">
                    Initial Warehouse On-Hand Stock
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="20"
                    className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby font-bold text-espresso"
                  />
                  <span className="text-[10px] text-espresso/60 mt-1 block">
                    Stock is reserved atomically when buyers initiate checkout.
                  </span>
                </div>
              </div>
            </div>

            {/* Product Media */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-bold text-espresso uppercase tracking-wider pb-2 border-b border-rose">
                3. High-Resolution Product Media
              </h2>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Image URL</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
                />
              </div>

              {imageUrl && (
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-rose bg-ivory">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Link
                href="/vendor/products"
                className="px-5 py-2.5 border border-rose rounded-xl text-xs font-semibold text-espresso hover:bg-rose/40 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || success}
                className="px-6 py-2.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition flex items-center gap-1.5 shadow-md shadow-ruby/20 disabled:opacity-50"
              >
                <span>{loading ? 'Submitting...' : 'Submit Listing for Moderation'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
