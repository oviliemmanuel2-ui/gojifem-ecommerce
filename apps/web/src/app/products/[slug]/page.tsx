'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, 
  ShieldCheck, 
  Truck, 
  Globe2, 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Minus,
  ShoppingBag,
  Store
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { DeliveryChecker } from '../../../components/DeliveryChecker';
import { SAMPLE_PRODUCTS } from '../../../data/sampleProducts';
import { useMarketplace } from '../../../context/MarketplaceContext';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const product = SAMPLE_PRODUCTS.find((p) => p.slug === slug) || SAMPLE_PRODUCTS[0];

  const { formatPrice, addToCart } = useMarketplace();
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(
      {
        id: `${product.id}_${selectedVariant.id}`,
        variantId: selectedVariant.id,
        productId: product.id,
        title: product.title,
        variantTitle: selectedVariant.title,
        priceMinorNGN: selectedVariant.priceMinorNGN,
        imageUrl: product.imageUrl,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        vendorSlug: product.vendorSlug,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm relative">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Nigerian Vendor</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Purchase Options */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">
                {product.category}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                {product.title}
              </h1>

              {/* Vendor Info Bar */}
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Dispatched by</span>
                <span className="font-semibold text-slate-900">{product.vendorName}</span>
                <span>• {product.vendorLocation}</span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-3 text-xs">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold text-slate-900 text-sm">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 font-medium">{product.reviewCount} verified reviews</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-600 font-bold">In Stock ({product.stockCount} left)</span>
              </div>

              {/* Pricing Box */}
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline gap-3">
                <div className="text-3xl font-extrabold text-slate-900">
                  {formatPrice(selectedVariant.priceMinorNGN)}
                </div>
                {product.compareAtPriceMinorNGN && (
                  <div className="text-sm text-slate-400 line-through">
                    {formatPrice(product.compareAtPriceMinorNGN)}
                  </div>
                )}
                <div className="text-[11px] text-slate-500 ml-auto font-medium">
                  Authoritative base: ₦{(selectedVariant.priceMinorNGN / 100).toLocaleString()} NGN
                </div>
              </div>

              {/* Variant Selector */}
              {product.variants.length > 1 && (
                <div className="mt-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Option / Size
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border text-xs font-semibold text-left transition flex justify-between items-center ${
                          selectedVariant.id === v.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span>{v.title}</span>
                        <span>{formatPrice(v.priceMinorNGN)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 hover:bg-white rounded-lg transition text-slate-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-slate-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stockCount, q + 1))}
                    className="p-2 hover:bg-white rounded-lg transition text-slate-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`flex-1 w-full py-3.5 px-6 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2 ${
                    added
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{added ? 'Added to Cart ✓' : 'Add to Multi-Vendor Cart'}</span>
                </button>
              </div>

              {/* Description */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Description</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Highlights */}
              <div className="mt-6 space-y-2">
                {product.shippingHighlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Serviceability Estimator Component */}
            <DeliveryChecker />
          </div>
        </div>
      </main>
    </div>
  );
}
