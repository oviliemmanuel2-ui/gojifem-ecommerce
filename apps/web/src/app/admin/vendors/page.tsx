'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Check, 
  X, 
  FileText, 
  Landmark, 
  Clock, 
  AlertCircle,
  Eye,
  Store
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';

interface PendingVendor {
  id: string;
  legalName: string;
  displayName: string;
  category: string;
  ownerEmail: string;
  rcNumber: string;
  cacDocumentName: string;
  bankName: string;
  accountNumberMasked: string;
  accountName: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const INITIAL_APPLICATIONS: PendingVendor[] = [
  {
    id: 'app_1',
    legalName: 'Adire Cultural Looms Nigeria Ltd',
    displayName: 'Adire Cultural Looms',
    category: 'Fashion & Apparel',
    ownerEmail: 'vendor@adirelooms.com',
    rcNumber: 'RC-1928374',
    cacDocumentName: 'cac_adire_rc1928374.pdf',
    bankName: 'Guaranty Trust Bank',
    accountNumberMasked: '******8821',
    accountName: 'ADIRE CULTURAL LOOMS NIG LTD',
    submittedAt: 'Today, 11:20 AM',
    status: 'PENDING',
  },
  {
    id: 'app_2',
    legalName: 'Benin Royal Craftsmen Enterprise',
    displayName: 'Igun Heritage Guild',
    category: 'Arts & Handcrafts',
    ownerEmail: 'igun.crafts@gmail.com',
    rcNumber: 'BN-8839201',
    cacDocumentName: 'bn_igun_guild_8839201.pdf',
    bankName: 'Zenith Bank',
    accountNumberMasked: '******4412',
    accountName: 'BENIN ROYAL CRAFTSMEN ENT',
    submittedAt: 'Yesterday, 4:15 PM',
    status: 'PENDING',
  },
];

export default function AdminVendorsPage() {
  const [applications, setApplications] = useState<PendingVendor[]>(INITIAL_APPLICATIONS);
  const [selectedApp, setSelectedApp] = useState<PendingVendor | null>(applications[0]);
  const [reviewNote, setReviewNote] = useState('');

  const handleAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: action } : a)),
    );
    if (selectedApp?.id === id) {
      setSelectedApp((prev) => (prev ? { ...prev, status: action } : null));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Operations & Compliance Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Vendor KYC Review Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Audit Corporate Affairs Commission (CAC) evidence and bank settlement details before enabling sales
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Applications Queue List */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pending Applications ({applications.filter((a) => a.status === 'PENDING').length})
            </h2>

            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-5 rounded-2xl border transition cursor-pointer text-left ${
                    selectedApp?.id === app.id
                      ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{app.displayName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 truncate">{app.legalName}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {app.category} • {app.submittedAt}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Details & Review Decision Panel */}
          {selectedApp && (
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedApp.displayName}</h3>
                  <span className="text-xs text-slate-500">{selectedApp.legalName}</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                  {selectedApp.category}
                </span>
              </div>

              {/* 1. CAC Corporate Verification */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Corporate Affairs Commission (CAC) Verification</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Registration Code</span>
                    <strong>{selectedApp.rcNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Merchant Contact</span>
                    <strong>{selectedApp.ownerEmail}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-xs text-slate-600">{selectedApp.cacDocumentName}</span>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Viewing secure document: ${selectedApp.cacDocumentName}`);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Evidence PDF</span>
                  </a>
                </div>
              </div>

              {/* 2. Commercial Bank Settlement */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  <span>NIBSS / Commercial Bank Settlement Target</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bank Institution</span>
                    <strong>{selectedApp.bankName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">NUBAN Account (Masked)</span>
                    <strong>{selectedApp.accountNumberMasked}</strong>
                  </div>
                </div>
                <div className="text-xs pt-1">
                  <span className="text-slate-400 block text-[10px]">Resolved Corporate Account Name</span>
                  <strong className="text-emerald-800 font-extrabold">{selectedApp.accountName}</strong>
                </div>
              </div>

              {/* Review Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Compliance Audit Note / Reason
                </label>
                <textarea
                  rows={2}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="e.g. CAC registration verified on search portal; corporate bank name matches legal entity."
                  className="w-full text-xs border rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => handleAction(selectedApp.id, 'APPROVED')}
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Merchant to Sell</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(selectedApp.id, 'REJECTED')}
                  className="py-3 px-4 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-50 transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Request Re-submission</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
