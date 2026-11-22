'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { useMarketplace } from '../../../context/MarketplaceContext';

interface VendorProductItem {
  id: string;
  sku: string;
  title: string;
  category: string;
  priceMinorNGN: number;
  stockCount: number;
  status: 'ACTIVE' | 'PENDING_REVIEW' | 'DRAFT' | 'PAUSED';
  imageUrl: string;
}

const INITIAL_VENDOR_PRODUCTS: VendorProductItem[] = [
  {
    id: 'vp_1',
    sku: 'ASO-OKE-ROYAL-M',
    title: 'Handcrafted Luxury Aso-Oke Agbada & Fila Set (Medium)',
    category: 'Fashion & Apparel',
    priceMinorNGN: 14500000, // ₦145,000
    stockCount: 14,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'vp_2',
    sku: 'ASO-OKE-GOLD-L',
    title: 'Woven Metallic Gold Shimmery Iro & Buba Set',
    category: 'Fashion & Apparel',
    priceMinorNGN: 12000000, // ₦120,000
    stockCount: 8,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'vp_3',
    sku: 'ASO-OKE-CAP-EMB',
    title: 'Embroidered Gobi Cap with Hand-Stitched Royal Filigree',
    category: 'Fashion & Apparel',
    priceMinorNGN: 1850000, // ₦18,500
    stockCount: 30,
    status: 'PENDING_REVIEW',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
  },
];

export default function VendorProductsPage() {
  const { formatPrice } = useMarketplace();
  const [products, setProducts] = useState<VendorProductItem[]>(INITIAL_VENDOR_PRODUCTS);
  const [search, setSearch] = useState('');

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  const handleQuickStockUpdate = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stockCount: Math.max(0, p.stockCount + delta) } : p,
      ),
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
              <span>Merchant Inventory Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">
              Product Catalog & Stock Management
            </h1>
            <p className="text-xs sm:text-sm text-espresso/70 mt-1">
              Manage variants, update real-time warehouse stock, and track listing moderation states
            </p>
          </div>

          <Link
            href="/vendor/products/new"
            className="self-start sm:self-auto px-5 py-2.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition flex items-center gap-1.5 shadow-md shadow-ruby/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product Listing</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-rose p-4 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by product title or SKU..."
              className="w-full pl-9 pr-4 py-2 border border-rose rounded-xl text-xs bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
            />
            <Search className="w-4 h-4 text-espresso/40 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 text-xs text-espresso/70 self-end sm:self-auto font-medium">
            <span>Showing {filtered.length} listings</span>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-3xl border border-rose shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-espresso">
              <thead className="bg-rose/30 text-[11px] uppercase font-bold text-espresso/70 border-b border-rose">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Product</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Price (NGN)</th>
                  <th className="py-3.5 px-4">Warehouse Stock</th>
                  <th className="py-3.5 px-4">Listing Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose/60">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-rose/20 transition">
                    <td className="py-4 px-4 sm:px-6 flex items-center gap-3">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-12 h-12 rounded-xl object-cover bg-ivory border border-rose shrink-0"
                      />
                      <div className="min-w-0">
                        <strong className="text-espresso font-serif block truncate max-w-xs sm:max-w-md">
                          {product.title}
                        </strong>
                        <span className="text-[11px] text-espresso/50">{product.category}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-espresso/80">
                      {product.sku}
                    </td>

                    <td className="py-4 px-4 font-serif font-bold text-espresso">
                      {formatPrice(product.priceMinorNGN)}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickStockUpdate(product.id, -1)}
                          className="w-6 h-6 rounded border border-rose bg-ivory hover:bg-rose/40 flex items-center justify-center font-bold text-espresso"
                        >
                          -
                        </button>
                        <span className="font-bold text-espresso px-1">{product.stockCount}</span>
                        <button
                          onClick={() => handleQuickStockUpdate(product.id, 1)}
                          className="w-6 h-6 rounded border border-rose bg-ivory hover:bg-rose/40 flex items-center justify-center font-bold text-espresso"
                        >
                          +
                        </button>
                        {product.stockCount <= 5 && (
                          <span className="text-[10px] text-ruby font-bold ml-1">Low</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {product.status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose text-ruby border border-rose">
                          <CheckCircle2 className="w-3 h-3 text-ruby" />
                          <span>Active / Selling</span>
                        </span>
                      )}
                      {product.status === 'PENDING_REVIEW' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold/40 text-espresso border border-gold/40">
                          <Clock className="w-3 h-3 text-espresso" />
                          <span>Staff Moderation</span>
                        </span>
                      )}
                      {product.status === 'DRAFT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-ivory text-espresso/70 border border-rose">
                          <span>Draft</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button className="p-1.5 hover:bg-rose/40 rounded-lg text-espresso/60 hover:text-ruby transition">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
