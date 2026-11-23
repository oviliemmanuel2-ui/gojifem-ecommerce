'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Landmark,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { API_BASE_URL, ApiError, apiFetch } from '../../../lib/api';
import { Spinner } from '../../../components/ui/Spinner';
import { ErrorRetryBanner } from '../../../components/ui/ErrorRetryBanner';

interface AdminDoc {
  id: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  status: string;
  reviewNotes?: string | null;
  storageProvider: string;
  createdAt: string;
}

interface AdminMerchantApplication {
  id: string;
  referenceNumber: string;
  status: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  requestedInfoNote?: string | null;
  merchant: {
    id: string;
    merchantCode: string;
    accountStatus: string;
    isVerified: boolean;
    canListProducts: boolean;
    commissionRateBps: number;
    ownerEmail: string;
  };
  businessProfile: {
    businessName: string;
    displayName?: string | null;
    registrationType: string;
    cacRegistrationNumber: string;
    tinNumber: string | null;
    tinMasked?: string | null;
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
    ownerFullName: string;
    businessDescription: string;
    businessCategory: string;
    countryCode: string;
  } | null;
  bankAccount: {
    countryCode: string;
    bankName: string;
    bankCode?: string | null;
    accountNumberPlain: string | null;
    accountNumberMasked?: string | null;
    accountHolderName: string;
    verifiedAccountName?: string | null;
    settlementCurrency: string;
    accountType: string;
    verificationStatus: string;
    verificationProvider?: string | null;
    verificationMessage?: string | null;
  } | null;
  documents: AdminDoc[];
  verificationRecords: Array<{
    id: string;
    checkType: string;
    status: string;
    notes?: string | null;
    createdAt: string;
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus?: string | null;
    toStatus: string;
    actorRole?: string | null;
    reason?: string | null;
    notes?: string | null;
    createdAt: string;
  }>;
}

const STATUS_FILTERS = [
  'ALL',
  'PENDING_REVIEW',
  'UNDER_VERIFICATION',
  'MORE_INFORMATION_REQUIRED',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
  'DRAFT',
] as const;

function humanizeStatus(s: string): string {
  return s.replace(/_/g, ' ');
}

function statusPillClass(status: string): string {
  switch (status) {
    case 'APPROVED':
    case 'VERIFIED':
      return 'bg-emerald-100 text-emerald-800';
    case 'PENDING_REVIEW':
    case 'UNDER_VERIFICATION':
    case 'SUBMITTED':
      return 'bg-gold/25 text-espresso';
    case 'MORE_INFORMATION_REQUIRED':
      return 'bg-amber-100 text-amber-900';
    case 'REJECTED':
    case 'SUSPENDED':
      return 'bg-rose text-ruby';
    default:
      return 'bg-ivory-200 text-espresso';
  }
}

export default function AdminVendorsPage() {
  const { session, sessionReady, showToast } = useMarketplace();
  const [applications, setApplications] = useState<AdminMerchantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [decisionNote, setDecisionNote] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [previewingDocId, setPreviewingDocId] = useState<string | null>(null);

  const isAdminUser = Boolean(
    session?.user?.roles?.some((r) => r === 'ADMIN' || r === 'MODERATOR'),
  );

  const fetchApplications = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setAccessDenied(false);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await apiFetch<{ applications: AdminMerchantApplication[] }>(
        `/admin/merchants${query}`,
        { method: 'GET', timeoutMs: 15000 },
      );
      setApplications(res.applications);
      setSelectedId((prev) =>
        prev && res.applications.some((a) => a.id === prev)
          ? prev
          : res.applications[0]?.id || null,
      );
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.statusCode === 401 || err.statusCode === 403)) {
        setAccessDenied(true);
        setError(err.message);
      } else {
        setError(
          err instanceof ApiError ? err.message : 'Unable to load merchant verification queue.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, statusFilter, searchQuery]);

  useEffect(() => {
    if (!sessionReady) return;
    if (session?.accessToken) {
      void fetchApplications();
    } else {
      setLoading(false);
    }
  }, [sessionReady, session?.accessToken, fetchApplications]);

  const selected = applications.find((a) => a.id === selectedId) || applications[0] || null;

  const handleDecision = async (
    action: 'START_VERIFICATION' | 'REQUEST_MORE_INFO' | 'APPROVE' | 'REJECT' | 'SUSPEND',
  ) => {
    if (!selected) return;
    if (
      (action === 'REQUEST_MORE_INFO' || action === 'REJECT' || action === 'SUSPEND') &&
      !decisionNote.trim()
    ) {
      showToast('Please enter a clear compliance reason or instruction note first.', 'warning');
      return;
    }

    setDecisionSubmitting(true);
    try {
      const res = await apiFetch<{ success: boolean; status: string }>(
        `/admin/merchants/${selected.id}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({
            action,
            reason: decisionNote.trim() || undefined,
            notes: decisionNote.trim() || undefined,
          }),
          timeoutMs: 15000,
        },
      );
      showToast(`Application updated to ${humanizeStatus(res.status)}.`, 'success');
      setDecisionNote('');
      await fetchApplications();
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError ? err.message : 'Unable to apply merchant verification decision.';
      showToast(msg, 'error');
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleOpenPrivateDoc = async (docId: string) => {
    if (!session?.accessToken) return;
    setPreviewingDocId(docId);
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/documents/${docId}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Failed to authorize document stream (${res.status}).`);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Unable to view KYC document.', 'error');
    } finally {
      setPreviewingDocId(null);
    }
  };

  if (!sessionReady || (loading && applications.length === 0 && session?.accessToken)) {
    return (
      <div className="bg-ivory min-h-screen py-14 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-rose p-10 flex flex-col items-center gap-3">
          <Spinner size="lg" tone="ruby" label="Loading admin verification queue" />
          <p className="text-sm font-semibold text-espresso-muted">
            Loading GOJIFEM merchant verification applications...
          </p>
        </div>
      </div>
    );
  }

  if (!session?.accessToken || accessDenied || !isAdminUser) {
    return (
      <div className="bg-ivory min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-rose p-8 text-center space-y-5 shadow-sm">
          <ShieldAlert className="w-10 h-10 text-ruby mx-auto" />
          <h1 className="font-serif text-2xl font-bold text-espresso">
            Administrator Access Required
          </h1>
          <p className="text-xs text-espresso-muted leading-relaxed">
            {error ||
              'Merchant KYC inspection, TIN decryption, bank verification review, and store activation are restricted to authorized GOJIFEM Compliance Administrators.'}
          </p>
          <div className="flex justify-center gap-3">
            {!session?.accessToken ? (
              <Link
                href="/auth/login?redirect=/admin/vendors"
                className="px-6 py-3 rounded-full bg-ruby text-white text-xs font-bold hover:bg-ruby-hover transition"
              >
                Sign In as Administrator
              </Link>
            ) : (
              <Link
                href="/"
                className="px-6 py-3 rounded-full bg-espresso text-ivory text-xs font-bold hover:bg-espresso-muted transition"
              >
                Return to Marketplace
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-ruby bg-rose px-3 py-1 rounded-full mb-2">
              Admin Compliance Portal
            </span>
            <h1 className="font-serif text-3xl font-bold text-espresso">
              Merchant Verification &amp; Approval Queue
            </h1>
            <p className="text-sm text-espresso-muted mt-1">
              Inspect CAC registration records, decrypted TIN &amp; settlement bank accounts, and private KYC documents before activating merchant storefronts.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-espresso-muted">
            <span className="px-3.5 py-2 rounded-full bg-white border border-rose font-semibold text-espresso">
              {applications.length} Application{applications.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="bg-white rounded-2xl border border-rose p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-espresso-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search business name, CAC RC/BN, reference GOJI-MCH..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-rose focus:border-ruby outline-none text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition ${
                  statusFilter === st
                    ? 'bg-ruby text-white'
                    : 'bg-ivory text-espresso-muted hover:text-ruby border border-rose'
                }`}
              >
                {humanizeStatus(st)}
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorRetryBanner title="Error loading queue" message={error} onRetry={fetchApplications} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Queue List */}
          <div className="lg:col-span-4 space-y-3">
            {applications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-rose p-8 text-center text-xs text-espresso-muted">
                No merchant applications match this filter.
              </div>
            ) : (
              applications.map((app) => {
                const isSelected = selected?.id === app.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedId(app.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition ${
                      isSelected
                        ? 'bg-white border-ruby shadow-md ring-2 ring-ruby/15'
                        : 'bg-white border-rose hover:border-ruby/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-serif font-bold text-espresso text-base truncate">
                          {app.businessProfile?.businessName || app.merchant.ownerEmail}
                        </h3>
                        <p className="text-[11px] text-espresso-muted font-mono">
                          {app.referenceNumber} · {app.businessProfile?.cacRegistrationNumber || 'No CAC yet'}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusPillClass(
                          app.status,
                        )}`}
                      >
                        {humanizeStatus(app.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-espresso-muted mt-2 pt-2 border-t border-rose/50">
                      <span>{app.businessProfile?.businessCategory || 'Uncategorized'}</span>
                      <span>{app.documents.length} doc(s)</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Detail Inspector */}
          {selected && (
            <div className="lg:col-span-8 bg-white rounded-3xl border border-rose p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose pb-4">
                <div>
                  <span className="text-[11px] font-mono text-espresso-muted">
                    {selected.referenceNumber} · {selected.merchant.merchantCode}
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-espresso">
                    {selected.businessProfile?.businessName || 'Incomplete Business Profile'}
                  </h2>
                  <p className="text-xs text-espresso-muted">
                    Owner Account: {selected.merchant.ownerEmail}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${statusPillClass(
                    selected.status,
                  )}`}
                >
                  {humanizeStatus(selected.status)}
                </span>
              </div>

              {/* Business & Tax */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="rounded-2xl border border-rose bg-ivory/50 p-4 space-y-2">
                  <h3 className="font-bold text-ruby uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Business &amp; Compliance
                  </h3>
                  {selected.businessProfile ? (
                    <div className="space-y-1 text-espresso">
                      <p>
                        <span className="text-espresso-muted">Type:</span>{' '}
                        <strong>{selected.businessProfile.registrationType}</strong>
                      </p>
                      <p>
                        <span className="text-espresso-muted">CAC Number:</span>{' '}
                        <strong className="font-mono">
                          {selected.businessProfile.cacRegistrationNumber || '—'}
                        </strong>
                      </p>
                      <p>
                        <span className="text-espresso-muted">Decrypted TIN:</span>{' '}
                        <strong className="font-mono text-ruby">
                          {selected.businessProfile.tinNumber || selected.businessProfile.tinMasked || '—'}
                        </strong>
                      </p>
                      <p>
                        <span className="text-espresso-muted">Director/Owner:</span>{' '}
                        <strong>{selected.businessProfile.ownerFullName || '—'}</strong>
                      </p>
                      <p>
                        <span className="text-espresso-muted">Phone / Email:</span>{' '}
                        <strong>
                          {selected.businessProfile.businessPhone} · {selected.businessProfile.businessEmail}
                        </strong>
                      </p>
                      <p>
                        <span className="text-espresso-muted">Address:</span>{' '}
                        <strong>{selected.businessProfile.businessAddress}</strong>
                      </p>
                    </div>
                  ) : (
                    <p className="text-espresso-muted">No business profile saved yet.</p>
                  )}
                </div>

                {/* Settlement Bank */}
                <div className="rounded-2xl border border-rose bg-ivory/50 p-4 space-y-2">
                  <h3 className="font-bold text-ruby uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" /> Settlement Bank Account
                  </h3>
                  {selected.bankAccount ? (
                    <div className="space-y-1 text-espresso">
                      <p>
                        <span className="text-espresso-muted">Bank:</span>{' '}
                        <strong>
                          {selected.bankAccount.bankName}{' '}
                          {selected.bankAccount.bankCode ? `(${selected.bankAccount.bankCode})` : ''}
                        </strong>
                      </p>
                      <p>
                        <span className="text-espresso-muted">Full Account Number:</span>{' '}
                        <strong className="font-mono text-ruby">
                          {selected.bankAccount.accountNumberPlain ||
                            selected.bankAccount.accountNumberMasked ||
                            '—'}
                        </strong>
                      </p>
                      <p>
                        <span className="text-espresso-muted">Holder Name:</span>{' '}
                        <strong>{selected.bankAccount.accountHolderName || '—'}</strong>
                      </p>
                      {selected.bankAccount.verifiedAccountName && (
                        <p>
                          <span className="text-espresso-muted">Resolved Name:</span>{' '}
                          <strong className="text-emerald-700">
                            {selected.bankAccount.verifiedAccountName}
                          </strong>
                        </p>
                      )}
                      <p>
                        <span className="text-espresso-muted">Verification:</span>{' '}
                        <strong>{humanizeStatus(selected.bankAccount.verificationStatus)}</strong>
                      </p>
                      <p>
                        <span className="text-espresso-muted">Currency / Type:</span>{' '}
                        <strong>
                          {selected.bankAccount.settlementCurrency} · {selected.bankAccount.accountType}
                        </strong>
                      </p>
                    </div>
                  ) : (
                    <p className="text-espresso-muted">No bank settlement details submitted yet.</p>
                  )}
                </div>
              </div>

              {/* Private KYC Documents */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ruby flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Private KYC Documents ({selected.documents.length})
                </h3>
                {selected.documents.length === 0 ? (
                  <p className="text-xs text-espresso-muted">No KYC documents uploaded.</p>
                ) : (
                  <div className="space-y-2">
                    {selected.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-rose bg-ivory/40 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-ruby shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-espresso truncate">{doc.fileName}</p>
                            <p className="text-[11px] text-espresso-muted">
                              {humanizeStatus(doc.documentType)} · {(doc.fileSizeBytes / 1024).toFixed(1)} KB ·{' '}
                              {doc.storageProvider}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleOpenPrivateDoc(doc.id)}
                          disabled={previewingDocId === doc.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-rose font-bold text-espresso hover:border-ruby hover:text-ruby transition shrink-0"
                        >
                          {previewingDocId === doc.id ? (
                            <Spinner size="xs" tone="ruby" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          <span>Inspect Private File</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compliance Review Action Console */}
              <div className="border-t border-rose pt-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ruby flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Compliance Decision &amp; Store Activation
                </h3>
                <textarea
                  rows={2}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Optional approval note, OR required reason/instruction when requesting more info, rejecting, or suspending..."
                  className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-xs"
                />
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    disabled={decisionSubmitting}
                    onClick={() => void handleDecision('START_VERIFICATION')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-espresso/20 text-espresso text-xs font-bold hover:bg-ivory transition disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" /> Start Verification
                  </button>
                  <button
                    type="button"
                    disabled={decisionSubmitting}
                    onClick={() => void handleDecision('REQUEST_MORE_INFO')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold hover:bg-amber-200 transition disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Request More Info
                  </button>
                  <button
                    type="button"
                    disabled={decisionSubmitting}
                    onClick={() => void handleDecision('APPROVE')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Activate Merchant
                  </button>
                  <button
                    type="button"
                    disabled={decisionSubmitting}
                    onClick={() => void handleDecision('REJECT')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-ruby text-white text-xs font-bold hover:bg-ruby-hover transition disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    type="button"
                    disabled={decisionSubmitting}
                    onClick={() => void handleDecision('SUSPEND')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-espresso text-ivory text-xs font-bold hover:bg-espresso-muted transition disabled:opacity-50"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Suspend
                  </button>
                </div>
              </div>

              {/* Status History */}
              {selected.statusHistory.length > 0 && (
                <div className="border-t border-rose pt-4 space-y-2">
                  <h4 className="text-[11px] font-bold uppercase text-espresso-muted">
                    Audit Timeline
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {selected.statusHistory.map((h) => (
                      <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 text-espresso-muted">
                        <span>
                          <strong className="text-espresso">{humanizeStatus(h.toStatus)}</strong>
                          {h.reason ? ` — ${h.reason}` : h.notes ? ` — ${h.notes}` : ''}
                        </span>
                        <span className="text-[11px]">
                          {new Date(h.createdAt).toLocaleString('en-NG')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
