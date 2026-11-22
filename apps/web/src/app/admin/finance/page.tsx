'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Landmark, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Download,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { useMarketplace } from '../../../context/MarketplaceContext';

interface LedgerAccountItem {
  code: string;
  name: string;
  type: string;
  balanceMinorNGN: number;
}

interface EligibleVendorPayout {
  vendorId: string;
  vendorName: string;
  bankName: string;
  accountNumberMasked: string;
  clearedOrdersCount: number;
  eligibleAmountMinorNGN: number;
  status: 'PENDING_TRANSFER' | 'SETTLED';
}

const INITIAL_LEDGER_ACCOUNTS: LedgerAccountItem[] = [
  { code: '1010-PAYSTACK-CLEARING', name: 'Paystack Settlement Clearing', type: 'Asset / Clearing', balanceMinorNGN: 18950000 },
  { code: '2020-VENDOR-PAYABLE', name: 'Vendor Payable Escrow Liability', type: 'Current Liability', balanceMinorNGN: 15480000 },
  { code: '3010-PLATFORM-COMMISSION', name: 'GOJIFEM Commission Revenue', type: 'Operating Revenue', balanceMinorNGN: 1895000 },
  { code: '2030-DELIVERY-PAYABLE', name: 'Logistics Courier Payable', type: 'Current Liability', balanceMinorNGN: 1575000 },
];

const INITIAL_PAYOUT_QUEUE: EligibleVendorPayout[] = [
  {
    vendorId: 'vend_1',
    vendorName: 'Omo Odua Heritage Looms Ltd',
    bankName: 'Guaranty Trust Bank (GTBank)',
    accountNumberMasked: '******7890',
    clearedOrdersCount: 4,
    eligibleAmountMinorNGN: 48500000, // ₦485,000
    status: 'PENDING_TRANSFER',
  },
  {
    vendorId: 'vend_2',
    vendorName: 'Sahel Naturals Organic Co.',
    bankName: 'Zenith Bank',
    accountNumberMasked: '******4412',
    clearedOrdersCount: 6,
    eligibleAmountMinorNGN: 19800000, // ₦198,000
    status: 'PENDING_TRANSFER',
  },
];

export default function AdminFinancePage() {
  const { formatPrice } = useMarketplace();
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccountItem[]>(INITIAL_LEDGER_ACCOUNTS);
  const [payoutQueue, setPayoutQueue] = useState<EligibleVendorPayout[]>(INITIAL_PAYOUT_QUEUE);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleExecutePayout = (vendorId: string) => {
    setProcessingId(vendorId);
    setTimeout(() => {
      setPayoutQueue((prev) =>
        prev.map((p) => (p.vendorId === vendorId ? { ...p, status: 'SETTLED' } : p)),
      );
      setProcessingId(null);
    }, 700);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ruby uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-gold" />
              <span>Finance & Treasury Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">
              Double-Entry Ledger & Vendor Payouts
            </h1>
            <p className="text-xs sm:text-sm text-espresso/70 mt-1">
              Reconcile Paystack gateway clearing, audit escrow liabilities, and execute NIBSS batch transfers
            </p>
          </div>
        </div>

        {/* 1. Double-Entry Chart of Accounts Summary */}
        <div className="bg-white rounded-3xl border border-rose p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-rose">
            <div>
              <h2 className="text-base font-serif font-bold text-espresso">Double-Entry General Ledger Accounts</h2>
              <p className="text-xs text-espresso/60 mt-0.5">Real-time balances anchored in integer minor units (Kobo)</p>
            </div>
            <span className="px-3 py-1 bg-rose text-ruby rounded-full text-xs font-bold flex items-center gap-1 border border-rose">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Books Balanced: Debits = Credits</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ledgerAccounts.map((acc) => (
              <div key={acc.code} className="p-4 rounded-2xl bg-ivory border border-rose">
                <span className="text-[10px] font-mono text-espresso/50 block">{acc.code}</span>
                <strong className="text-xs font-serif font-bold text-espresso block mt-1">{acc.name}</strong>
                <span className="text-[11px] text-espresso/60 block mb-2">{acc.type}</span>
                <div className="text-lg font-serif font-bold text-espresso">
                  {formatPrice(acc.balanceMinorNGN)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Vendor Payout Queue */}
        <div className="bg-white rounded-3xl border border-rose p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-rose">
            <div>
              <h2 className="text-base font-serif font-bold text-espresso">
                Eligible Vendor Payout Batches
              </h2>
              <p className="text-xs text-espresso/60 mt-0.5">
                Orders delivered with 72-hour customer inspection period expired
              </p>
            </div>
            <span className="text-xs font-medium text-espresso/60">
              {payoutQueue.filter((p) => p.status === 'PENDING_TRANSFER').length} pending transfer batches
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-espresso">
              <thead className="bg-rose/30 text-[11px] uppercase font-bold text-espresso/70 border-b border-rose">
                <tr>
                  <th className="py-3 px-4">Merchant Entity</th>
                  <th className="py-3 px-4">Settlement Bank</th>
                  <th className="py-3 px-4">NUBAN Account</th>
                  <th className="py-3 px-4">Delivered Orders</th>
                  <th className="py-3 px-4">Net Payout Amount</th>
                  <th className="py-3 px-4 text-right">Transfer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose/60">
                {payoutQueue.map((payout) => (
                  <tr key={payout.vendorId} className="hover:bg-rose/20 transition">
                    <td className="py-4 px-4 font-serif font-bold text-espresso">
                      {payout.vendorName}
                    </td>

                    <td className="py-4 px-4 font-medium text-espresso/80">
                      {payout.bankName}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-espresso">
                      {payout.accountNumberMasked}
                    </td>

                    <td className="py-4 px-4 font-medium text-espresso/80">
                      {payout.clearedOrdersCount} fulfilled orders
                    </td>

                    <td className="py-4 px-4 font-serif font-bold text-espresso text-sm">
                      {formatPrice(payout.eligibleAmountMinorNGN)}
                    </td>

                    <td className="py-4 px-4 text-right">
                      {payout.status === 'PENDING_TRANSFER' ? (
                        <button
                          onClick={() => handleExecutePayout(payout.vendorId)}
                          disabled={processingId === payout.vendorId}
                          className="px-4 py-2 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition shadow-sm disabled:opacity-50"
                        >
                          {processingId === payout.vendorId ? 'Transferring...' : 'Execute Paystack Transfer'}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gold text-espresso font-bold text-xs px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-espresso" />
                          <span>Settled via NIBSS ✓</span>
                        </span>
                      )}
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
