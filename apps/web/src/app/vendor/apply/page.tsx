'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  CreditCard, 
  FileCheck2, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Upload, 
  AlertCircle,
  Clock,
  Landmark
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';

const NIGERIAN_BANKS = [
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '057', name: 'Zenith Bank' },
  { code: '044', name: 'Access Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '101', name: 'Providus Bank' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '035', name: 'Wema Bank / ALAT' },
];

export default function VendorApplyPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<'DRAFT' | 'UNDER_REVIEW' | 'APPROVED'>('DRAFT');

  // Step 1: Business Identity
  const [rcNumber, setRcNumber] = useState('RC-1849204');
  const [tinNumber, setTinNumber] = useState('24910482-0001');
  const [cacUploaded, setCacUploaded] = useState(true);

  // Step 2: Settlement Account
  const [bankCode, setBankCode] = useState('058');
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [accountName, setAccountName] = useState('OMO ODUA HERITAGE LOOMS LTD');
  const [bankResolved, setBankResolved] = useState(true);

  // Step 3: Terms
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setStatus('UNDER_REVIEW');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-bold text-slate-500">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 ${step >= 1 ? 'text-emerald-700 font-extrabold' : ''}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                1
              </span>
              <span>Business KYC</span>
            </button>

            <div className={`h-0.5 flex-1 mx-3 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 ${step >= 2 ? 'text-emerald-700 font-extrabold' : ''}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                2
              </span>
              <span>Bank Settlement</span>
            </button>

            <div className={`h-0.5 flex-1 mx-3 ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-1.5 ${step >= 3 ? 'text-emerald-700 font-extrabold' : ''}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                3
              </span>
              <span>Review & Submit</span>
            </button>
          </div>
        </div>

        {/* Status Alert Banner */}
        {status === 'UNDER_REVIEW' && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-amber-900">Application Under Staff Review</h2>
              <p className="text-xs text-amber-700 mt-1">
                Your CAC certificate and Guaranty Trust Bank settlement account are currently being verified by GOJIFEM Operations. Reviews are typically completed within <strong>24 business hours</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
          {/* Step 1: Business Identity & CAC */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Step 1: Business Identity & Verification</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Upload official Corporate Affairs Commission (CAC) evidence to become a verified merchant.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    CAC Registration Number (RC or BN)
                  </label>
                  <input
                    type="text"
                    value={rcNumber}
                    onChange={(e) => setRcNumber(e.target.value)}
                    placeholder="RC-1234567"
                    className="w-full text-xs border rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tax Identification Number (TIN)
                  </label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="24910482-0001"
                    className="w-full text-xs border rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  CAC Certificate / Business Name Document
                </label>
                <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/30 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    cac_certificate_omo_odua_rc1849204.pdf (2.4 MB)
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    ✓ Uploaded & Securely Stored in Private KYC Vault
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>Continue to Settlement Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Commercial Bank Settlement Account */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Step 2: Nigerian Commercial Bank Account</h1>
                <p className="text-xs text-slate-500 mt-1">
                  All marketplace proceeds are paid out in NGN directly to your corporate or business commercial bank.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Commercial Bank</label>
                  <div className="relative">
                    <select
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                      className="w-full text-xs border rounded-xl pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {NIGERIAN_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <Landmark className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    10-Digit NUBAN Account Number
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="0123456789"
                    className="w-full text-xs border rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Resolved Bank Account Preview Card */}
              {bankResolved && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                      Account Name (NIBSS Verified)
                    </span>
                    <strong className="text-xs font-extrabold text-slate-900">{accountName}</strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Guaranty Trust Bank • Account: ******{accountNumber.slice(-4)}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>Review Application</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Step 3: Commercial Terms & Confirmation</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Please review your merchant submission details and confirm the escrow policy.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Business Registration:</span>
                    <strong className="text-slate-900">{rcNumber} (TIN: {tinNumber})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Document Uploaded:</span>
                    <strong className="text-emerald-700">cac_certificate_omo_odua_rc1849204.pdf</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Settlement Bank:</span>
                    <strong className="text-slate-900">Guaranty Trust Bank (******6789)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Marketplace Commission:</span>
                    <strong className="text-emerald-700">10.00% per fulfilled sale</strong>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950 text-emerald-100 rounded-2xl text-xs space-y-2 border border-emerald-900">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Escrow & Payout Policy</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                    Customer funds are held in escrow clearing until the courier records successful delivery to the recipient. Payouts are transferred automatically via NIBSS/Paystack to your verified GTBank settlement account within 72 hours of verified receipt.
                  </p>
                </div>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 pt-2">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I certify that all documents submitted are valid, and I agree to fulfill customer orders strictly through tracked logistics carriers.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!agreed || submitting || status === 'UNDER_REVIEW'}
                  onClick={handleSubmitApplication}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  <span>{submitting ? 'Submitting...' : status === 'UNDER_REVIEW' ? 'Application Submitted ✓' : 'Submit for Staff Verification'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
