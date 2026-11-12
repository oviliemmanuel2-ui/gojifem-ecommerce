'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, ShoppingCart } from 'lucide-react';
import { ProductData } from '../data/sampleProducts';
import { useMarketplace } from '../context/MarketplaceContext';

export function ProductCard({ product }: { product: ProductData }) {
  const { formatPrice, addToCart } = useMarketplace();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: `${product.id}_${product.variants[0].id}`,
      variantId: product.variants[0].id,
      productId: product.id,
      title: product.title,
      variantTitle: product.variants[0].title,
      priceMinorNGN: product.variants[0].priceMinorNGN,
      imageUrl: product.imageUrl,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      vendorSlug: product.vendorSlug,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col group">
      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm text-[10px] font-bold text-slate-800 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Verified Vendor</span>
        </div>
      </Link>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider mb-1">
            {product.category}
          </div>

          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 hover:text-emerald-600 transition leading-snug">
              {product.title}
            </h3>
          </Link>

          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Sold by</span>
            <span className="font-medium text-slate-700 underline underline-offset-2">
              {product.vendorName}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-800">{product.rating.toFixed(1)}</span>
            <span>({product.reviewCount})</span>
          </div>
        </div>

        {/* Pricing and Add to Cart */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-base font-extrabold text-slate-900">
              {formatPrice(product.priceMinorNGN)}
            </div>
            {product.compareAtPriceMinorNGN && (
              <div className="text-[11px] text-slate-400 line-through">
                {formatPrice(product.compareAtPriceMinorNGN)}
              </div>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
            title="Add to Cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
