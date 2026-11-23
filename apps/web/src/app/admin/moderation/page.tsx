'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Eye, 
  Store, 
  Tag, 
  DollarSign, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { useMarketplace } from '../../../context/MarketplaceContext';

interface PendingProduct {
  id: string;
  title: string;
  vendorName: string;
  category: string;
  priceMinorNGN: number;
  sku: string;
  stockCount: number;
  description: string;
  imageUrl: string;
  submittedAt: string;
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED';
}

const INITIAL_PENDING_PRODUCTS: PendingProduct[] = [
  {
    id: 'mod_1',
    title: 'Embroidered Gobi Cap with Hand-Stitched Royal Filigree',
    vendorName: 'Omo Odua Heritage Looms',
    category: 'Fashion & Apparel',
    priceMinorNGN: 1850000, // ₦18,500
    sku: 'ASO-OKE-CAP-EMB',
    stockCount: 30,
    description: 'Traditional matching headpiece for groomsmen and ceremonial occasions.',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
    submittedAt: 'Today, 08:30 AM',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'mod_2',
    title: 'Pure Wild Forest Honey (750ml Raw Glass Jar)',
    vendorName: 'Sahel Naturals Organic Co.',
    category: 'Nigerian Groceries & Foods',
    priceMinorNGN: 650000, // ₦6,500
    sku: 'SAHEL-HONEY-750ML',
    stockCount: 50,
    description: '100% unpasteurized raw honey harvested from the dry savannah forests of Niger State.',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80',
    submittedAt: 'Yesterday, 3:10 PM',
    status: 'PENDING_REVIEW',
  },
];

export default function AdminModerationPage() {
  const { formatPrice, showToast } = useMarketplace();
  const [products, setProducts] = useState<PendingProduct[]>(INITIAL_PENDING_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(products[0]);
  const [moderationNote, setModerationNote] = useState('');

  const handleModerate = (id: string, action: 'ACTIVE' | 'REJECTED') => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: action } : p)),
    );
    if (selectedProduct?.id === id) {
      setSelectedProduct((prev) => (prev ? { ...prev, status: action } : null));
    }
    showToast(
      action === 'ACTIVE'
        ? 'Product listing approved and published.'
        : 'Product listing marked rejected.',
      action === 'ACTIVE' ? 'success' : 'warning',
      { category: 'merchant', dedupeKey: `mod-${id}` },
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ruby uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-gold" />
              <span>Operations & Compliance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">
              Product Listing Moderation
            </h1>
            <p className="text-xs sm:text-sm text-espresso/70 mt-1">
              Inspect new merchant listings for authenticity, pricing accuracy, and quality before public visibility
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Moderation Queue */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xs font-bold text-espresso uppercase tracking-wider">
              Pending Listings ({products.filter((p) => p.status === 'PENDING_REVIEW').length})
            </h2>

            <div className="space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex gap-3 items-center ${
                    selectedProduct?.id === p.id
                      ? 'border-ruby bg-rose/40 ring-2 ring-ruby/20'
                      : 'border-rose bg-white hover:border-ruby/40'
                  }`}
                >
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-16 h-16 rounded-xl object-cover bg-ivory border border-rose shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-ruby">
                        {p.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'ACTIVE'
                            ? 'bg-gold text-espresso'
                            : p.status === 'REJECTED'
                            ? 'bg-rose text-ruby'
                            : 'bg-ivory text-espresso border border-rose'
                        }`}
                      >
                        {p.status === 'PENDING_REVIEW' ? 'Pending Review' : p.status}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-espresso text-xs truncate">{p.title}</h3>
                    <p className="text-[11px] text-espresso/60 mt-0.5">By {p.vendorName}</p>
                    <div className="text-xs font-serif font-bold text-espresso mt-1">
                      {formatPrice(p.priceMinorNGN)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details & Moderation Actions */}
          {selectedProduct && (
            <div className="lg:col-span-7 bg-white rounded-3xl border border-rose p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-rose gap-4">
                <div>
                  <span className="text-xs font-bold text-ruby uppercase tracking-wider block mb-1">
                    {selectedProduct.category}
                  </span>
                  <h2 className="text-xl font-serif font-bold text-espresso">{selectedProduct.title}</h2>
                  <p className="text-xs text-espresso/70 mt-0.5">
                    Vendor: <strong className="text-espresso">{selectedProduct.vendorName}</strong> • Submitted {selectedProduct.submittedAt}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-lg font-serif font-bold text-espresso block">
                    {formatPrice(selectedProduct.priceMinorNGN)}
                  </span>
                  <span className="text-[10px] font-mono text-espresso/50">
                    SKU: {selectedProduct.sku}
                  </span>
                </div>
              </div>

              {/* Media Preview */}
              <div className="w-full h-56 rounded-2xl overflow-hidden bg-ivory border border-rose relative">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-espresso uppercase tracking-wider mb-1.5">
                  Listing Description
                </h4>
                <p className="text-xs text-espresso/80 leading-relaxed bg-ivory p-4 rounded-xl border border-rose">
                  {selectedProduct.description}
                </p>
              </div>

              {/* Initial Warehouse Stock */}
              <div className="p-3 bg-rose/40 border border-rose rounded-xl flex items-center justify-between text-xs">
                <span className="text-espresso/70">Reported Warehouse Stock Available:</span>
                <strong className="text-espresso font-serif font-bold">{selectedProduct.stockCount} units</strong>
              </div>

              {/* Compliance Note */}
              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">
                  Moderator Audit Note
                </label>
                <textarea
                  rows={2}
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  placeholder="e.g. Imagery verified; price verified within standard category range."
                  className="w-full text-xs border border-rose rounded-xl p-3 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => handleModerate(selectedProduct.id, 'ACTIVE')}
                  className="flex-1 py-3 px-4 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Publish to Marketplace</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModerate(selectedProduct.id, 'REJECTED')}
                  className="py-3 px-4 border border-rose text-ruby rounded-xl text-xs font-bold hover:bg-rose/40 transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Listing</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
