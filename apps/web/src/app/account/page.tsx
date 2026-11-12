'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  MapPin, 
  Package, 
  CreditCard, 
  LogOut, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [session, setSession] = useState<{ email: string; firstName?: string; lastName?: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gojifem_session');
      if (saved) {
        setSession(JSON.parse(saved));
      } else {
        // Default mock profile if not logged in
        setSession({
          email: 'customer@example.com',
          firstName: 'Chidi',
          lastName: 'Okafor',
        });
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('gojifem_session');
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Customer Account</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your delivery addresses, track multi-vendor orders, and security settings
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="self-start sm:self-auto px-3.5 py-2 border rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 text-emerald-900 font-extrabold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Personal Details</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 ${
                activeTab === 'addresses'
                  ? 'bg-emerald-50 text-emerald-900 font-extrabold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Saved Delivery Addresses</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 ${
                activeTab === 'orders'
                  ? 'bg-emerald-50 text-emerald-900 font-extrabold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Orders & Tracking</span>
            </button>
          </div>

          {/* Main Content Pane */}
          <div className="lg:col-span-9 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-6">Personal Profile</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">First Name</label>
                    <div className="p-3 bg-slate-50 rounded-xl border text-xs font-bold text-slate-800">
                      {session?.firstName || 'Chidi'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Last Name</label>
                    <div className="p-3 bg-slate-50 rounded-xl border text-xs font-bold text-slate-800">
                      {session?.lastName || 'Okafor'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                    <div className="p-3 bg-slate-50 rounded-xl border text-xs font-bold text-slate-800">
                      {session?.email || 'customer@example.com'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
                    <div className="p-3 bg-slate-50 rounded-xl border text-xs font-bold text-slate-800">
                      +234 801 234 5678 (Verified)
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Role Permissions: <strong>CUSTOMER (Standard Buyer)</strong></span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Saved Delivery Addresses</h2>
                    <p className="text-xs text-slate-500">Verified destinations within GOJIFEM serviceable coverage</p>
                  </div>
                  <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Default Lagos Address */}
                  <div className="p-5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/30 relative space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Primary Residential Address</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                        Default
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">Chidi Okafor • +234 801 234 5678</p>
                    <p className="text-xs text-slate-600">
                      15 Admiralty Way, Lekki Phase 1, Lagos State, Nigeria
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                      ✓ Serviceable with Doorstep Dispatch (GIGL / Kwik)
                    </p>
                  </div>

                  {/* Secondary Abuja Address */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-white relative space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Abuja Family Residence</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">Amaka Okafor • +234 809 111 2233</p>
                    <p className="text-xs text-slate-600">
                      Plot 42 Crescent, Maitama District, Abuja FCT, Nigeria
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                      ✓ Serviceable with Tracked Express Courier
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Orders & Shipments</h2>

                {/* Sample Multi-Vendor Order */}
                <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900">Order #GOJI-2026-0042</span>
                      <span className="text-xs text-slate-400 block sm:inline sm:ml-2">Placed on 10 Nov 2026</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        Paid via International Card (Visa US)
                      </span>
                    </div>
                  </div>

                  {/* Sub-order packages from vendors */}
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 block">Package 1: Omo Odua Heritage Looms</strong>
                        <span className="text-slate-500">1x Luxury Aso-Oke Agbada & Fila Set (Medium)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[10px]">
                        In Transit (GIGL #NIG-88492)
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 block">Package 2: Sahel Naturals Organic Co.</strong>
                        <span className="text-slate-500">2x 100% Organic Raw Shea Butter (500g)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                        Vendor Packing
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Delivery Address: Lekki Phase 1, Lagos</span>
                    <span className="font-extrabold text-slate-900 text-sm">Total: ₦154,600</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
