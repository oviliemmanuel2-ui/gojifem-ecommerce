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
    <div className="bg-white rounded-2xl border border-rose/80 overflow-hidden hover:shadow-lg hover:border-gold/60 transition-all flex flex-col group">
      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-ivory">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5 bg-gold text-espresso text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-espresso" />
          <span>Verified Artisan</span>
        </div>
      </Link>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-bold text-ruby uppercase tracking-wider mb-1">
            {product.category}
          </div>

          <Link href={`/products/${product.slug}`}>
            <h3 className="font-serif font-bold text-espresso text-sm line-clamp-2 hover:text-ruby transition leading-snug">
              {product.title}
            </h3>
          </Link>

          <div className="text-xs text-espresso/70 mt-1 flex items-center gap-1">
            <span>By</span>
            <span className="font-semibold text-espresso underline underline-offset-2 hover:text-ruby">
              {product.vendorName}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-2 text-xs text-espresso/70">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            <span className="font-bold text-espresso">{product.rating.toFixed(1)}</span>
            <span>({product.reviewCount})</span>
          </div>
        </div>

        {/* Pricing and Add to Cart */}
        <div className="mt-4 pt-3 border-t border-rose/60 flex items-center justify-between">
          <div>
            <div className="text-base font-extrabold text-espresso">
              {formatPrice(product.priceMinorNGN)}
            </div>
            {product.compareAtPriceMinorNGN && (
              <div className="text-[11px] text-espresso/50 line-through">
                {formatPrice(product.compareAtPriceMinorNGN)}
              </div>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="p-2 rounded-xl bg-ruby text-white hover:bg-ruby-hover shadow-sm transition"
            title="Add to Shopping Bag"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
