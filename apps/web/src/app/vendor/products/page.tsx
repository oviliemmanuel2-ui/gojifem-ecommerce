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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Merchant Inventory Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Product Catalog & Stock Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage variants, update real-time warehouse stock, and track listing moderation states
            </p>
          </div>

          <Link
            href="/vendor/products/new"
            className="self-start sm:self-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product Listing</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by product title or SKU..."
              className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-auto font-medium">
            <span>Showing {filtered.length} listings</span>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Product</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Price (NGN)</th>
                  <th className="py-3.5 px-4">Warehouse Stock</th>
                  <th className="py-3.5 px-4">Listing Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-4 sm:px-6 flex items-center gap-3">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 border shrink-0"
                      />
                      <div className="min-w-0">
                        <strong className="text-slate-900 block truncate max-w-xs sm:max-w-md">
                          {product.title}
                        </strong>
                        <span className="text-[11px] text-slate-400">{product.category}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-slate-700">
                      {product.sku}
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900">
                      {formatPrice(product.priceMinorNGN)}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickStockUpdate(product.id, -1)}
                          className="w-6 h-6 rounded border bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600"
                        >
                          -
                        </button>
                        <span className="font-extrabold text-slate-900 px-1">{product.stockCount}</span>
                        <button
                          onClick={() => handleQuickStockUpdate(product.id, 1)}
                          className="w-6 h-6 rounded border bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600"
                        >
                          +
                        </button>
                        {product.stockCount <= 5 && (
                          <span className="text-[10px] text-amber-600 font-bold ml-1">Low</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {product.status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active / Selling</span>
                        </span>
                      )}
                      {product.status === 'PENDING_REVIEW' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>Staff Moderation</span>
                        </span>
                      )}
                      {product.status === 'DRAFT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          <span>Draft</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-700 transition">
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
