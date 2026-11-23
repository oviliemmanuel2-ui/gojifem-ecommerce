'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  Landmark,
  Lock,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { API_BASE_URL, ApiError, apiFetch } from '../../../lib/api';
import { Spinner } from '../../../components/ui/Spinner';
import { ErrorRetryBanner } from '../../../components/ui/ErrorRetryBanner';

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '50211', name: 'Kuda Microfinance Bank' },
  { code: '999992', name: 'OPay Digital Services' },
  { code: '999991', name: 'PalmPay' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '035', name: 'Wema Bank / ALAT' },
  { code: '057', name: 'Zenith Bank' },
] as const;

const BUSINESS_CATEGORIES = [
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Nigerian Groceries & Foods',
  'Home, Kitchen & Living',
  'Health, Beauty & Wellness',
  'Arts, Crafts & Collectibles',
  'Automotive & Hardware',
  'Books, Media & Stationery',
] as const;

const DOC_TYPE_OPTIONS = [
  { value: 'CAC_CERTIFICATE', label: 'CAC Certificate of Incorporation' },
  { value: 'BUSINESS_REGISTRATION', label: 'Business Name Registration / Status Report' },
  { value: 'TIN_CERTIFICATE', label: 'Tax Identification Number (TIN) Certificate' },
  { value: 'GOVERNMENT_ID', label: "Owner's Government-Issued ID" },
  { value: 'UTILITY_BILL', label: 'Proof of Business Address (Utility Bill)' },
  { value: 'ADDITIONAL_REQUESTED', label: 'Additional Requested Verification Document' },
  { value: 'OTHER', label: 'Other Supporting Business Document' },
] as const;

const EDITABLE_STATUSES = new Set(['DRAFT', 'MORE_INFORMATION_REQUIRED', 'REJECTED']);

interface MerchantDoc {
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

interface VerificationRecord {
  id: string;
  checkType: string;
  status: string;
  notes?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
}

interface StatusHistoryEntry {
  id: string;
  fromStatus?: string | null;
  toStatus: string;
  actorRole?: string | null;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface MerchantNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface HydratedMerchantResponse {
  merchant: {
    id: string;
    merchantCode: string;
    vendorId?: string | null;
    vendorSlug?: string | null;
    accountStatus: string;
    isVerified: boolean;
    canListProducts: boolean;
    canManageInventory: boolean;
    canReceiveOrders: boolean;
    canReceiveSettlements: boolean;
    commissionRateBps: number;
    activatedAt?: string | null;
  };
  businessProfile: {
    id: string;
    businessName: string;
    displayName?: string | null;
    registrationType: 'CAC_RC' | 'CAC_BN';
    cacRegistrationNumber: string;
    tinMasked?: string | null;
    hasTinOnFile: boolean;
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
    ownerFullName: string;
    businessDescription: string;
    businessCategory: string;
    countryCode: string;
  } | null;
  bankAccount: {
    id: string;
    countryCode: string;
    bankName: string;
    bankCode?: string | null;
    swiftBic?: string | null;
    routingOrIban?: string | null;
    accountNumberMasked?: string | null;
    accountLast4?: string | null;
    accountHolderName: string;
    verifiedAccountName?: string | null;
    settlementCurrency: string;
    accountType: string;
    verificationStatus: string;
    verificationProvider?: string | null;
    verificationMessage?: string | null;
    verifiedAt?: string | null;
  } | null;
  application: {
    id: string;
    referenceNumber: string;
    status: string;
    currentStep: number;
    termsAccepted: boolean;
    termsAcceptedAt?: string | null;
    accuracyConfirmed: boolean;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    rejectionReason?: string | null;
    requestedInfoNote?: string | null;
    documents: MerchantDoc[];
    verificationRecords: VerificationRecord[];
    statusHistory: StatusHistoryEntry[];
  } | null;
  notifications: MerchantNotificationItem[];
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}

function humanizeStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

function statusBadgeStyle(status: string): string {
  switch (status) {
    case 'APPROVED':
    case 'VERIFIED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'PENDING_REVIEW':
    case 'SUBMITTED':
    case 'UNDER_VERIFICATION':
      return 'bg-gold/25 text-espresso border-gold/50';
    case 'MORE_INFORMATION_REQUIRED':
    case 'PENDING_MANUAL_REVIEW':
      return 'bg-amber-100 text-amber-900 border-amber-300';
    case 'REJECTED':
    case 'SUSPENDED':
    case 'FAILED':
      return 'bg-rose text-ruby border-ruby/30';
    default:
      return 'bg-ivory-200 text-espresso border-rose';
  }
}

export default function VendorApplyPage() {
  const { session, sessionReady, showToast } = useMarketplace();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<HydratedMerchantResponse | null>(null);

  // Step 1 form state
  const [businessName, setBusinessName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [registrationType, setRegistrationType] = useState<'CAC_RC' | 'CAC_BN'>('CAC_RC');
  const [cacRegistrationNumber, setCacRegistrationNumber] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessCategory, setBusinessCategory] = useState<string>(BUSINESS_CATEGORIES[0]);
  const [businessCountryCode, setBusinessCountryCode] = useState('NG');

  // Step 1 document upload state
  const [selectedDocType, setSelectedDocType] = useState<string>('CAC_CERTIFICATE');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [previewingDocId, setPreviewingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 2 bank state
  const [bankCountryCode, setBankCountryCode] = useState('NG');
  const [bankName, setBankName] = useState<string>(NIGERIAN_BANKS[6].name);
  const [customBankName, setCustomBankName] = useState('');
  const [bankCode, setBankCode] = useState<string>(NIGERIAN_BANKS[6].code);
  const [swiftBic, setSwiftBic] = useState('');
  const [routingOrIban, setRoutingOrIban] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [settlementCurrency, setSettlementCurrency] = useState('NGN');
  const [accountType, setAccountType] = useState('CORPORATE');
  const [verifyingBank, setVerifyingBank] = useState(false);

  // Step 3 confirmation state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Action states
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const hydrateFromResponse = useCallback((res: HydratedMerchantResponse) => {
    setData(res);
    const bp = res.businessProfile;
    if (bp) {
      setBusinessName(bp.businessName || '');
      setDisplayName(bp.displayName || '');
      setRegistrationType(bp.registrationType || 'CAC_RC');
      setCacRegistrationNumber(bp.cacRegistrationNumber || '');
      setTinNumber('');
      setBusinessAddress(bp.businessAddress || '');
      setBusinessPhone(bp.businessPhone || '');
      setBusinessEmail(bp.businessEmail || '');
      setOwnerFullName(bp.ownerFullName || '');
      setBusinessDescription(bp.businessDescription || '');
      setBusinessCategory(bp.businessCategory || BUSINESS_CATEGORIES[0]);
      setBusinessCountryCode(bp.countryCode || 'NG');
    }

    const bk = res.bankAccount;
    if (bk) {
      setBankCountryCode(bk.countryCode || 'NG');
      const matchedBank = NIGERIAN_BANKS.find(
        (b) => b.name.toLowerCase() === (bk.bankName || '').toLowerCase() || b.code === bk.bankCode,
      );
      if (matchedBank) {
        setBankName(matchedBank.name);
        setBankCode(matchedBank.code);
        setCustomBankName('');
      } else if (bk.bankName) {
        setBankName('__OTHER__');
        setCustomBankName(bk.bankName);
        setBankCode(bk.bankCode || '');
      }
      setSwiftBic(bk.swiftBic || '');
      setRoutingOrIban(bk.routingOrIban || '');
      setAccountNumber('');
      setAccountHolderName(bk.accountHolderName || '');
      setSettlementCurrency(bk.settlementCurrency || 'NGN');
      setAccountType(bk.accountType || 'CORPORATE');
    }

    if (res.application) {
      const s = res.application.currentStep;
      setStep(s === 2 ? 2 : s === 3 ? 3 : 1);
      setTermsAccepted(Boolean(res.application.termsAccepted));
      setAccuracyConfirmed(Boolean(res.application.accuracyConfirmed));
    }
  }, []);

  const fetchApplication = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiFetch<HydratedMerchantResponse>('/merchant/application', {
        method: 'GET',
        timeoutMs: 12000,
      });
      hydrateFromResponse(res);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Unable to load your merchant onboarding application.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, hydrateFromResponse]);

  useEffect(() => {
    if (!sessionReady) return;
    if (session?.accessToken) {
      void fetchApplication();
    } else {
      setLoading(false);
    }
  }, [sessionReady, session?.accessToken, fetchApplication]);

  const applicationStatus = data?.application?.status || 'DRAFT';
  const isEditable = EDITABLE_STATUSES.has(applicationStatus);
  const documents = data?.application?.documents || [];
  const notifications = data?.notifications || [];
  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );
  const resolvedBankName = bankName === '__OTHER__' ? customBankName.trim() : bankName;

  const buildDraftPayload = (targetStep: 1 | 2 | 3) => ({
    currentStep: targetStep,
    business: {
      businessName: businessName.trim(),
      displayName: displayName.trim() || undefined,
      registrationType,
      cacRegistrationNumber: cacRegistrationNumber.trim(),
      tinNumber: tinNumber.trim() || undefined,
      businessAddress: businessAddress.trim(),
      businessPhone: businessPhone.trim(),
      businessEmail: businessEmail.trim(),
      ownerFullName: ownerFullName.trim(),
      businessDescription: businessDescription.trim(),
      businessCategory,
      countryCode: businessCountryCode,
    },
    bank: {
      countryCode: bankCountryCode,
      bankName: resolvedBankName,
      bankCode: bankCode.trim() || undefined,
      swiftBic: swiftBic.trim() || undefined,
      routingOrIban: routingOrIban.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      accountHolderName: accountHolderName.trim(),
      settlementCurrency,
      accountType,
    },
  });

  const handleSaveDraft = async (nextStep?: 1 | 2 | 3) => {
    if (!isEditable) return true;
    setSavingDraft(true);
    setActionError(null);
    const targetStep = nextStep ?? step;
    try {
      const updated = await apiFetch<HydratedMerchantResponse>('/merchant/application/draft', {
        method: 'PUT',
        body: JSON.stringify(buildDraftPayload(targetStep)),
        timeoutMs: 12000,
      });
      hydrateFromResponse(updated);
      if (nextStep) {
        setStep(nextStep);
      } else {
        showToast('Merchant application draft saved to database.', 'success');
      }
      return true;
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError ? err.message : 'Unable to save merchant draft right now.';
      setActionError(msg);
      showToast(msg, 'error');
      return false;
    } finally {
      setSavingDraft(false);
    }
  };

  const validateStep1BeforeContinue = (): string | null => {
    if (!businessName.trim()) return 'Business / Company Name is required.';
    if (!cacRegistrationNumber.trim()) return 'CAC Registration Number is required.';
    if (!tinNumber.trim() && !data?.businessProfile?.hasTinOnFile) {
      return 'Tax Identification Number (TIN) is required.';
    }
    if (!businessAddress.trim()) return 'Business Address is required.';
    if (!businessPhone.trim()) return 'Business Phone Number is required.';
    if (!businessEmail.trim() || !businessEmail.includes('@')) {
      return 'Valid Business Email Address is required.';
    }
    if (!ownerFullName.trim()) return "Business Owner's Full Name is required.";
    if (!businessDescription.trim()) return 'Business Description is required.';
    if (!businessCategory.trim()) return 'Business Category is required.';
    if (documents.length === 0) {
      return 'Please upload at least one CAC or business verification document.';
    }
    return null;
  };

  const validateStep2BeforeContinue = (): string | null => {
    if (!resolvedBankName) return 'Commercial Bank Name is required.';
    if (!accountNumber.trim() && !data?.bankAccount?.accountLast4) {
      return 'Bank Account Number is required.';
    }
    if (accountNumber.trim() && !/^\d{6,34}$/.test(accountNumber.trim())) {
      return 'Account number must contain only digits (10 digits for Nigerian NUBAN accounts).';
    }
    if (!accountHolderName.trim()) return 'Account Holder / Legal Business Name is required.';
    return null;
  };

  const handleStep1Continue = async () => {
    const err = validateStep1BeforeContinue();
    if (err) {
      setActionError(err);
      showToast(err, 'warning');
      return;
    }
    await handleSaveDraft(2);
  };

  const handleStep2Continue = async () => {
    const err = validateStep2BeforeContinue();
    if (err) {
      setActionError(err);
      showToast(err, 'warning');
      return;
    }
    await handleSaveDraft(3);
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file || !session?.accessToken) return;
    setActionError(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExt = ['pdf', 'jpg', 'jpeg', 'png'];
    if (!allowedExt.includes(ext)) {
      const msg = 'Unsupported file type. Upload only PDF, JPG, JPEG, or PNG documents.';
      setActionError(msg);
      showToast(msg, 'error');
      return;
    }
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      const msg = 'Document file size must be between 1 byte and 10 MB.';
      setActionError(msg);
      showToast(msg, 'error');
      return;
    }

    setUploadingDoc(true);
    setUploadProgress(5);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', selectedDocType);
      if (replacingDocId) {
        formData.append('replaceDocumentId', replacingDocId);
      }

      const responseData = await new Promise<{ document: MerchantDoc }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/merchant/documents`);
        xhr.setRequestHeader('Authorization', `Bearer ${session.accessToken}`);
        xhr.timeout = 45000;

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable && ev.total > 0) {
            setUploadProgress(Math.min(96, Math.round((ev.loaded / ev.total) * 100)));
          }
        };

        xhr.onload = () => {
          setUploadProgress(100);
          try {
            const parsed = JSON.parse(xhr.responseText || '{}');
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.message || `Upload failed (${xhr.status}).`));
            }
          } catch {
            reject(new Error(`Upload failed (${xhr.status}).`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error while uploading KYC document.'));
        xhr.ontimeout = () => reject(new Error('Document upload timed out. Please retry.'));
        xhr.send(formData);
      });

      showToast(
        `${responseData.document.fileName} encrypted & uploaded securely.`,
        'success',
      );
      setReplacingDocId(null);
      await fetchApplication();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to upload KYC document.';
      setActionError(msg);
      showToast(msg, 'error');
    } finally {
      setUploadingDoc(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDocument = async (docId: string, fileName: string) => {
    if (!isEditable) return;
    setDeletingDocId(docId);
    setActionError(null);
    try {
      await apiFetch(`/merchant/documents/${docId}`, { method: 'DELETE' });
      showToast(`Removed "${fileName}".`, 'info');
      await fetchApplication();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Unable to remove document.';
      setActionError(msg);
      showToast(msg, 'error');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handlePreviewDocument = async (docId: string) => {
    if (!session?.accessToken) return;
    setPreviewingDocId(docId);
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/documents/${docId}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Cannot open document (${res.status}).`);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to open KYC document.';
      showToast(msg, 'error');
    } finally {
      setPreviewingDocId(null);
    }
  };

  const handleVerifyBankAccount = async () => {
    const acctToVerify = accountNumber.trim();
    if (!resolvedBankName) {
      showToast('Select your commercial bank first.', 'warning');
      return;
    }
    if (!acctToVerify) {
      showToast('Enter the full bank account number to verify.', 'warning');
      return;
    }

    setVerifyingBank(true);
    setActionError(null);
    try {
      const res = await apiFetch<{
        verified: boolean;
        verificationStatus: string;
        provider: string;
        accountName: string | null;
        accountNumberMasked: string;
        message: string;
      }>('/merchant/bank/verify', {
        method: 'POST',
        body: JSON.stringify({
          countryCode: bankCountryCode,
          bankName: resolvedBankName,
          bankCode: bankCode.trim() || undefined,
          swiftBic: swiftBic.trim() || undefined,
          routingOrIban: routingOrIban.trim() || undefined,
          accountNumber: acctToVerify,
          accountHolderName: accountHolderName.trim() || undefined,
          settlementCurrency,
          accountType,
        }),
        timeoutMs: 15000,
      });

      if (res.verified && res.accountName) {
        setAccountHolderName(res.accountName);
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'info');
      }
      await fetchApplication();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Bank verification request failed.';
      setActionError(msg);
      showToast(msg, 'error');
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!termsAccepted || !accuracyConfirmed) {
      showToast('Please accept the Merchant Terms and confirm document accuracy.', 'warning');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    setShowSubmitModal(false);
    try {
      await apiFetch<HydratedMerchantResponse>('/merchant/application/draft', {
        method: 'PUT',
        body: JSON.stringify(buildDraftPayload(3)),
        timeoutMs: 12000,
      });

      const res = await apiFetch<HydratedMerchantResponse & { submitted: boolean; referenceNumber: string }>(
        '/merchant/application/submit',
        {
          method: 'POST',
          body: JSON.stringify({ termsAccepted, accuracyConfirmed }),
          timeoutMs: 15000,
        },
      );
      hydrateFromResponse(res);
      showToast(
        `Application ${res.referenceNumber} submitted for compliance review!`,
        'success',
      );
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Unable to submit application.';
      setActionError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkNotificationsRead = async (notificationId?: string) => {
    try {
      await apiFetch('/merchant/notifications', {
        method: 'PATCH',
        body: JSON.stringify(notificationId ? { notificationId } : { markAll: true }),
      });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            notificationId ? (n.id === notificationId ? { ...n, isRead: true } : n) : { ...n, isRead: true },
          ),
        };
      });
    } catch {
      // Non-blocking
    }
  };

  if (!sessionReady || (loading && !data && session?.accessToken)) {
    return (
      <div className="bg-ivory min-h-screen py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-56 rounded-full bg-rose/40 animate-pulse mx-auto" />
          <div className="h-12 w-96 max-w-full rounded-2xl bg-rose/30 animate-pulse mx-auto" />
          <div className="bg-white rounded-3xl border border-rose p-10 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" tone="ruby" label="Loading merchant onboarding..." />
            <p className="text-sm font-semibold text-espresso-muted">
              Loading your GOJIFEM merchant workspace &amp; verification records...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.accessToken) {
    return (
      <div className="bg-ivory min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-rose p-8 sm:p-10 shadow-sm text-center space-y-6">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ruby bg-rose px-4 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4" /> Sell on GOJIFEM
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
            Merchant Onboarding &amp; Business Verification
          </h1>
          <p className="text-sm text-espresso-muted leading-relaxed">
            Create or sign in to your GOJIFEM account to submit your CAC business registration, upload encrypted KYC verification documents, and configure your commercial settlement bank account.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/auth/vendor-register"
              className="px-6 py-3.5 rounded-full bg-ruby text-white font-bold text-sm hover:bg-ruby-hover transition shadow-sm"
            >
              Create Merchant Account
            </Link>
            <Link
              href="/auth/login?redirect=/vendor/apply"
              className="px-6 py-3.5 rounded-full border-2 border-espresso/20 text-espresso font-bold text-sm hover:border-ruby hover:text-ruby transition"
            >
              Sign In to Continue Application
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-ruby bg-rose px-4 py-1.5 rounded-full">
            Sell on GOJIFEM
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
            Verified Merchant Onboarding
          </h1>
          <p className="text-espresso-muted max-w-2xl mx-auto text-sm leading-relaxed">
            Every merchant on GOJIFEM completes business registration verification, private KYC document review, and commercial bank settlement setup before listing products.
          </p>
        </div>

        {loadError && (
          <ErrorRetryBanner
            title="Could not load merchant application"
            message={loadError}
            onRetry={fetchApplication}
          />
        )}

        {/* Application Status & Reference Bar */}
        {data?.application && (
          <div className="bg-white rounded-3xl border border-rose p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-espresso-muted">
                  <span>
                    Application Ref:{' '}
                    <strong className="font-mono text-espresso">{data.application.referenceNumber}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Merchant ID:{' '}
                    <strong className="font-mono text-espresso">{data.merchant.merchantCode}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeStyle(
                      applicationStatus,
                    )}`}
                  >
                    {applicationStatus === 'APPROVED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : applicationStatus === 'REJECTED' || applicationStatus === 'SUSPENDED' ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {humanizeStatus(applicationStatus)}
                  </span>
                  {data.application.submittedAt && (
                    <span className="text-xs text-espresso-muted">
                      Submitted {formatDateTime(data.application.submittedAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.merchant.canListProducts ? (
                  <>
                    <Link
                      href="/vendor/products"
                      className="px-4 py-2 rounded-full bg-ruby text-white text-xs font-bold hover:bg-ruby-hover transition"
                    >
                      Open Vendor Portal
                    </Link>
                    <Link
                      href="/vendor/products/new"
                      className="px-4 py-2 rounded-full border border-ruby text-ruby text-xs font-bold hover:bg-rose/40 transition"
                    >
                      + List Product
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={fetchApplication}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose text-espresso text-xs font-bold hover:bg-rose/30 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
                  </button>
                )}
              </div>
            </div>

            {applicationStatus === 'PENDING_REVIEW' || applicationStatus === 'UNDER_VERIFICATION' ? (
              <div className="rounded-2xl bg-gold/15 border border-gold/40 p-4 text-xs text-espresso flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-espresso shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">
                    Application locked during compliance review
                  </strong>
                  <p className="text-espresso-muted">
                    Our Trust &amp; Merchant Compliance team is verifying your CAC records, KYC documents, and bank settlement details. You will receive an in-portal notification once a decision is made.
                  </p>
                </div>
              </div>
            ) : null}

            {applicationStatus === 'MORE_INFORMATION_REQUIRED' && data.application.requestedInfoNote && (
              <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 text-xs text-amber-950 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">
                    Additional information or documents requested by reviewer
                  </strong>
                  <p>{data.application.requestedInfoNote}</p>
                </div>
              </div>
            )}

            {applicationStatus === 'REJECTED' && (
              <div className="rounded-2xl bg-rose/50 border border-ruby/30 p-4 text-xs text-ruby flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">Application Rejected — Resubmission Allowed</strong>
                  <p className="text-espresso">
                    {data.application.rejectionReason ||
                      'Please review the feedback, update your business/bank information or replace KYC documents, and submit again.'}
                  </p>
                </div>
              </div>
            )}

            {applicationStatus === 'SUSPENDED' && (
              <div className="rounded-2xl bg-rose/60 border border-ruby/40 p-4 text-xs text-ruby flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">Merchant Account Suspended</strong>
                  <p className="text-espresso">
                    {data.application.rejectionReason ||
                      'Merchant selling privileges are temporarily suspended pending compliance resolution.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 py-1">
          {[
            { num: 1 as const, label: 'Business & KYC', icon: Building2 },
            { num: 2 as const, label: 'Bank Settlement', icon: Landmark },
            { num: 3 as const, label: 'Review & Submit', icon: FileCheck2 },
          ].map((s, idx) => {
            const Icon = s.icon;
            const active = step === s.num;
            const completed = step > s.num || applicationStatus === 'APPROVED';
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => setStep(s.num)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition ${
                    active
                      ? 'bg-ruby text-white shadow-sm'
                      : completed
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-white text-espresso-muted border border-rose hover:text-ruby'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>
                    {s.num}. {s.label}
                  </span>
                </button>
                {idx < 2 && <div className="w-6 sm:w-10 h-0.5 bg-rose rounded" />}
              </React.Fragment>
            );
          })}
        </div>

        {actionError && (
          <ErrorRetryBanner
            title="Action required"
            message={actionError}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Onboarding Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-rose p-6 sm:p-8 shadow-sm">
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-rose pb-4">
                  <h2 className="font-serif text-xl font-bold text-espresso flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-ruby" /> Step 1: Business Registration &amp; KYC
                  </h2>
                  <p className="text-xs text-espresso-muted mt-1">
                    Provide official registration records matching your CAC documents and TIN filing.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Business / Legal Company Name *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g., Zaria Heritage Textiles Ltd"
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm disabled:bg-ivory"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Storefront Display Name
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Optional shop name on GOJIFEM"
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm disabled:bg-ivory"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Business Category *
                    </label>
                    <select
                      disabled={!isEditable}
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm bg-white disabled:bg-ivory"
                    >
                      {BUSINESS_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Business Registration Type *
                    </label>
                    <select
                      disabled={!isEditable}
                      value={registrationType}
                      onChange={(e) => setRegistrationType(e.target.value as 'CAC_RC' | 'CAC_BN')}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm bg-white disabled:bg-ivory"
                    >
                      <option value="CAC_RC">CAC Registered Company (RC)</option>
                      <option value="CAC_BN">CAC Business Name (BN)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      CAC Registration Number *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={cacRegistrationNumber}
                      onChange={(e) => setCacRegistrationNumber(e.target.value)}
                      placeholder="e.g., RC-1849204"
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm font-mono disabled:bg-ivory"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Tax Identification Number (TIN) *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      placeholder={
                        data?.businessProfile?.hasTinOnFile
                          ? `Encrypted on file (${data.businessProfile.tinMasked}) — enter to update`
                          : 'e.g., 10492817-0001'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm font-mono disabled:bg-ivory"
                    />
                    {data?.businessProfile?.hasTinOnFile && (
                      <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Encrypted TIN on file ({data.businessProfile.tinMasked})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Country of Registration
                    </label>
                    <select
                      disabled={!isEditable}
                      value={businessCountryCode}
                      onChange={(e) => setBusinessCountryCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm bg-white disabled:bg-ivory"
                    >
                      <option value="NG">Nigeria (NG)</option>
                      <option value="GH">Ghana (GH)</option>
                      <option value="KE">Kenya (KE)</option>
                      <option value="ZA">South Africa (ZA)</option>
                      <option value="GB">United Kingdom (GB)</option>
                      <option value="US">United States (US)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Business Physical / Registered Address *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Street, suite, city, state"
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm disabled:bg-ivory"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Business Phone Number *
                    </label>
                    <input
                      type="tel"
                      disabled={!isEditable}
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm disabled:bg-ivory"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Official Business Email *
                    </label>
                    <input
                      type="email"
                      disabled={!isEditable}
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="compliance@yourbusiness.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm disabled:bg-ivory"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Business Owner / Authorized Director Full Name *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={ownerFullName}
                      onChange={(e) => setOwnerFullName(e.target.value)}
                      placeholder="Full legal name matching ID and CAC records"
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm disabled:bg-ivory"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Business Description *
                    </label>
                    <textarea
                      rows={3}
                      disabled={!isEditable}
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      placeholder="Describe your product catalog, sourcing, fulfillment capacity, and heritage."
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm disabled:bg-ivory"
                    />
                  </div>
                </div>

                {/* KYC Document Upload Section */}
                <div className="border-t border-rose pt-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-espresso flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-ruby" /> Private KYC &amp; Registration Documents *
                      </h3>
                      <p className="text-xs text-espresso-muted">
                        Accepted: PDF, JPG, JPEG, PNG up to 10 MB. Stored in private encrypted vault (never publicly exposed).
                      </p>
                    </div>
                  </div>

                  {isEditable && (
                    <div className="bg-ivory rounded-2xl border border-dashed border-ruby/40 p-5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-espresso-muted mb-1">
                            Document Type
                          </label>
                          <select
                            value={selectedDocType}
                            onChange={(e) => setSelectedDocType(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-rose bg-white text-xs font-semibold text-espresso outline-none focus:border-ruby"
                          >
                            {DOC_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            onChange={(e) => void handleFileSelected(e.target.files?.[0] || null)}
                            className="hidden"
                            id="kyc-document-input"
                          />
                          <button
                            type="button"
                            disabled={uploadingDoc}
                            onClick={() => {
                              setReplacingDocId(null);
                              fileInputRef.current?.click();
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ruby text-white text-xs font-bold hover:bg-ruby-hover transition disabled:opacity-60"
                          >
                            {uploadingDoc ? (
                              <>
                                <Spinner size="xs" tone="ivory" label="Uploading KYC document" />
                                <span>Uploading ({uploadProgress}%)</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>
                                  {replacingDocId ? 'Select Replacement File' : 'Select & Upload Document'}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {uploadingDoc && (
                        <div className="w-full h-2 rounded-full bg-rose overflow-hidden">
                          <div
                            className="h-full bg-ruby transition-all duration-150"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Uploaded Documents List */}
                  <div className="space-y-2.5">
                    {documents.length === 0 ? (
                      <p className="text-xs text-espresso-muted italic py-2">
                        No KYC documents uploaded yet. Upload at least your CAC Certificate or Business Registration document to continue.
                      </p>
                    ) : (
                      documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-rose bg-ivory/60"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-ruby shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-espresso truncate">{doc.fileName}</p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-espresso-muted mt-0.5">
                                <span>{humanizeStatus(doc.documentType)}</span>
                                <span>•</span>
                                <span>{formatBytes(doc.fileSizeBytes)}</span>
                                <span>•</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusBadgeStyle(
                                    doc.status,
                                  )}`}
                                >
                                  {humanizeStatus(doc.status)}
                                </span>
                              </div>
                              {doc.reviewNotes && (
                                <p className="text-[11px] text-ruby mt-1">{doc.reviewNotes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => void handlePreviewDocument(doc.id)}
                              disabled={previewingDocId === doc.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose bg-white text-xs font-semibold text-espresso hover:border-ruby hover:text-ruby transition"
                            >
                              {previewingDocId === doc.id ? (
                                <Spinner size="xs" tone="ruby" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                              <span>View</span>
                            </button>
                            {isEditable && (
                              <>
                                <button
                                  type="button"
                                  disabled={uploadingDoc}
                                  onClick={() => {
                                    setReplacingDocId(doc.id);
                                    setSelectedDocType(doc.documentType);
                                    fileInputRef.current?.click();
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-rose bg-white text-xs font-semibold text-espresso hover:border-ruby hover:text-ruby transition"
                                >
                                  Replace
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingDocId === doc.id}
                                  onClick={() => void handleDeleteDocument(doc.id, doc.fileName)}
                                  className="p-1.5 rounded-lg border border-rose bg-white text-ruby hover:bg-rose/40 transition"
                                  aria-label={`Remove ${doc.fileName}`}
                                >
                                  {deletingDocId === doc.id ? (
                                    <Spinner size="xs" tone="ruby" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Step 1 Footer */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-rose">
                  {isEditable ? (
                    <button
                      type="button"
                      disabled={savingDraft}
                      onClick={() => void handleSaveDraft()}
                      className="px-5 py-3 rounded-full border border-rose text-espresso text-xs font-bold hover:border-ruby hover:text-ruby transition disabled:opacity-50"
                    >
                      {savingDraft ? 'Saving Draft...' : 'Save Progress'}
                    </button>
                  ) : (
                    <div />
                  )}
                  <button
                    type="button"
                    disabled={savingDraft}
                    onClick={() => (isEditable ? void handleStep1Continue() : setStep(2))}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-ruby text-white text-xs sm:text-sm font-bold hover:bg-ruby-hover transition shadow-sm disabled:opacity-60"
                  >
                    {savingDraft && <Spinner size="xs" tone="ivory" />}
                    <span>Continue to Bank Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-rose pb-4">
                  <h2 className="font-serif text-xl font-bold text-espresso flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-ruby" /> Step 2: Commercial Bank Settlement &amp; Verification
                  </h2>
                  <p className="text-xs text-espresso-muted mt-1">
                    Order payouts are routed to your commercial bank account after order fulfillment. Account numbers are encrypted at rest.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Bank Country *
                    </label>
                    <select
                      disabled={!isEditable}
                      value={bankCountryCode}
                      onChange={(e) => setBankCountryCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm bg-white disabled:bg-ivory"
                    >
                      <option value="NG">Nigeria (NGN Settlement)</option>
                      <option value="GB">United Kingdom (GBP)</option>
                      <option value="US">United States (USD)</option>
                      <option value="GH">Ghana</option>
                      <option value="INTL">Other International Bank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Settlement Currency *
                    </label>
                    <select
                      disabled={!isEditable}
                      value={settlementCurrency}
                      onChange={(e) => setSettlementCurrency(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm bg-white disabled:bg-ivory"
                    >
                      <option value="NGN">NGN — Nigerian Naira</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Commercial Bank Name *
                    </label>
                    <select
                      disabled={!isEditable}
                      value={bankName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBankName(val);
                        const found = NIGERIAN_BANKS.find((b) => b.name === val);
                        if (found) setBankCode(found.code);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm bg-white disabled:bg-ivory"
                    >
                      {NIGERIAN_BANKS.map((bank) => (
                        <option key={bank.code} value={bank.name}>
                          {bank.name} ({bank.code})
                        </option>
                      ))}
                      <option value="__OTHER__">Other / International Commercial Bank</option>
                    </select>
                  </div>

                  {bankName === '__OTHER__' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                        Specify Commercial Bank Name *
                      </label>
                      <input
                        type="text"
                        disabled={!isEditable}
                        value={customBankName}
                        onChange={(e) => setCustomBankName(e.target.value)}
                        placeholder="Full name of commercial bank"
                        className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm disabled:bg-ivory"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Bank Account Number *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={!isEditable}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ''))}
                      placeholder={
                        data?.bankAccount?.accountLast4
                          ? `Encrypted (${data.bankAccount.accountNumberMasked}) — enter to update/verify`
                          : '10-digit NUBAN or account number'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm font-mono disabled:bg-ivory"
                    />
                    {data?.bankAccount?.accountNumberMasked && (
                      <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Saved on file: {data.bankAccount.accountNumberMasked}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Account Type *
                    </label>
                    <select
                      disabled={!isEditable}
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm bg-white disabled:bg-ivory"
                    >
                      <option value="CORPORATE">Corporate / Commercial Account</option>
                      <option value="BUSINESS">Business Enterprise Account</option>
                      <option value="CURRENT">Current Account</option>
                      <option value="SAVINGS">Savings Account</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                      Account Holder / Corporate Legal Name *
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Must match registered CAC business name or proprietor"
                      className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm disabled:bg-ivory"
                    />
                  </div>

                  {bankCountryCode !== 'NG' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                          SWIFT / BIC Code
                        </label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={swiftBic}
                          onChange={(e) => setSwiftBic(e.target.value)}
                          placeholder="e.g., BARCGB22"
                          className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm font-mono disabled:bg-ivory"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-espresso-muted mb-1">
                          Routing Number / IBAN
                        </label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={routingOrIban}
                          onChange={(e) => setRoutingOrIban(e.target.value)}
                          placeholder="International routing or IBAN"
                          className="w-full px-4 py-2.5 rounded-xl border border-rose focus:border-ruby outline-none text-sm font-mono disabled:bg-ivory"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Live Bank Verification Status Box */}
                <div className="rounded-2xl border border-rose bg-ivory p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase text-espresso-muted block">
                        Bank Verification Status
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeStyle(
                            data?.bankAccount?.verificationStatus || 'UNVERIFIED',
                          )}`}
                        >
                          {data?.bankAccount?.verificationStatus === 'VERIFIED' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {humanizeStatus(data?.bankAccount?.verificationStatus || 'UNVERIFIED')}
                        </span>
                        {data?.bankAccount?.verifiedAccountName && (
                          <span className="text-xs font-semibold text-emerald-800">
                            Resolved: {data.bankAccount.verifiedAccountName}
                          </span>
                        )}
                      </div>
                    </div>

                    {isEditable && (
                      <button
                        type="button"
                        disabled={verifyingBank}
                        onClick={() => void handleVerifyBankAccount()}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-espresso text-ivory text-xs font-bold hover:bg-espresso-muted transition disabled:opacity-60"
                      >
                        {verifyingBank ? (
                          <Spinner size="xs" tone="ivory" label="Verifying bank account" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>{verifyingBank ? 'Verifying...' : 'Verify Account Details'}</span>
                      </button>
                    )}
                  </div>
                  {data?.bankAccount?.verificationMessage && (
                    <p className="text-xs text-espresso-muted leading-relaxed">
                      {data.bankAccount.verificationMessage}
                    </p>
                  )}
                </div>

                {/* Step 2 Footer */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-rose">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full border border-rose text-espresso text-xs font-bold hover:border-ruby hover:text-ruby transition"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Business &amp; KYC
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {isEditable && (
                      <button
                        type="button"
                        disabled={savingDraft}
                        onClick={() => void handleSaveDraft()}
                        className="px-5 py-3 rounded-full border border-rose text-espresso text-xs font-bold hover:border-ruby hover:text-ruby transition disabled:opacity-50"
                      >
                        {savingDraft ? 'Saving...' : 'Save Progress'}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={savingDraft}
                      onClick={() => (isEditable ? void handleStep2Continue() : setStep(3))}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-ruby text-white text-xs sm:text-sm font-bold hover:bg-ruby-hover transition shadow-sm disabled:opacity-60"
                    >
                      {savingDraft && <Spinner size="xs" tone="ivory" />}
                      <span>Review &amp; Submit</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-rose pb-4">
                  <h2 className="font-serif text-xl font-bold text-espresso flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-ruby" /> Step 3: Review, Confirm &amp; Submit
                  </h2>
                  <p className="text-xs text-espresso-muted mt-1">
                    Review all submitted business records, KYC documents, and bank settlement details carefully before submitting for verification.
                  </p>
                </div>

                {/* Business Summary */}
                <div className="rounded-2xl border border-rose bg-ivory/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ruby">
                      1. Business Registration Profile
                    </h3>
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-bold text-ruby hover:underline"
                      >
                        Edit Business Info
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <p>
                      <span className="text-espresso-muted">Legal Name:</span>{' '}
                      <strong className="text-espresso">{businessName || 'Not provided'}</strong>
                    </p>
                    <p>
                      <span className="text-espresso-muted">Category:</span>{' '}
                      <strong className="text-espresso">{businessCategory}</strong>
                    </p>
                    <p>
                      <span className="text-espresso-muted">CAC Reg ({registrationType}):</span>{' '}
                      <strong className="font-mono text-espresso">{cacRegistrationNumber || 'Not provided'}</strong>
                    </p>
                    <p>
                      <span className="text-espresso-muted">TIN:</span>{' '}
                      <strong className="font-mono text-espresso">
                        {tinNumber.trim()
                          ? 'Entered & ready to encrypt'
                          : data?.businessProfile?.tinMasked || 'Not provided'}
                      </strong>
                    </p>
                    <p>
                      <span className="text-espresso-muted">Owner:</span>{' '}
                      <strong className="text-espresso">{ownerFullName || 'Not provided'}</strong>
                    </p>
                    <p>
                      <span className="text-espresso-muted">Phone / Email:</span>{' '}
                      <strong className="text-espresso">
                        {businessPhone || '—'} · {businessEmail || '—'}
                      </strong>
                    </p>
                    <p className="sm:col-span-2">
                      <span className="text-espresso-muted">Address:</span>{' '}
                      <strong className="text-espresso">{businessAddress || 'Not provided'}</strong>
                    </p>
                  </div>
                </div>

                {/* Documents Summary */}
                <div className="rounded-2xl border border-rose bg-ivory/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ruby">
                      2. Uploaded KYC Documents ({documents.length})
                    </h3>
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-bold text-ruby hover:underline"
                      >
                        Manage Documents
                      </button>
                    )}
                  </div>
                  {documents.length === 0 ? (
                    <p className="text-xs text-ruby font-semibold">
                      At least one KYC registration document is required before submitting.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-xs">
                      {documents.map((doc) => (
                        <li key={doc.id} className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-espresso truncate">
                            {doc.fileName} ({humanizeStatus(doc.documentType)})
                          </span>
                          <span className="text-espresso-muted shrink-0">
                            {formatBytes(doc.fileSizeBytes)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Bank Summary */}
                <div className="rounded-2xl border border-rose bg-ivory/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ruby">
                      3. Settlement Bank Account
                    </h3>
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-xs font-bold text-ruby hover:underline"
                      >
                        Edit Bank Details
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <p>
                      <span className="text-espresso-muted">Bank:</span>{' '}
                      <strong className="text-espresso">{resolvedBankName || 'Not provided'}</strong>
                    </p>
                    <p>
                      <span className="text-espresso-muted">Account Number:</span>{' '}
                      <strong className="font-mono text-espresso">
                        {accountNumber.trim()
                          ? `••••${accountNumber.trim().slice(-4)}`
                          : data?.bankAccount?.accountNumberMasked || 'Not provided'}
                      </strong>
                    </p>
                    <p>
                      <span className="text-espresso-muted">Account Name:</span>{' '}
                      <strong className="text-espresso">{accountHolderName || 'Not provided'}</strong>
                    </p>
                    <p>
                      <span className="text-espresso-muted">Currency / Type:</span>{' '}
                      <strong className="text-espresso">
                        {settlementCurrency} ({accountType})
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Legal Confirmations */}
                <div className="space-y-3 bg-gold/10 border border-gold/40 rounded-2xl p-5 text-xs text-espresso">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isEditable}
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 accent-ruby"
                    />
                    <span>
                      I agree to the{' '}
                      <Link href="/terms" className="text-ruby font-bold hover:underline">
                        GOJIFEM Merchant Terms &amp; Commission Schedule
                      </Link>{' '}
                      (10% standard commission, verified escrow payouts upon order delivery).
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isEditable}
                      checked={accuracyConfirmed}
                      onChange={(e) => setAccuracyConfirmed(e.target.checked)}
                      className="mt-0.5 accent-ruby"
                    />
                    <span>
                      I certify that all business registration numbers, TIN records, KYC documents, and bank settlement details provided are authentic and belong to this legal business entity.
                    </span>
                  </label>
                </div>

                {/* Step 3 Footer */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-rose">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full border border-rose text-espresso text-xs font-bold hover:border-ruby hover:text-ruby transition"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Bank Details
                  </button>

                  {isEditable ? (
                    <button
                      type="button"
                      disabled={submitting || !termsAccepted || !accuracyConfirmed}
                      onClick={() => setShowSubmitModal(true)}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-ruby text-white text-xs sm:text-sm font-bold hover:bg-ruby-hover transition shadow-sm disabled:opacity-50"
                    >
                      {submitting && <Spinner size="xs" tone="ivory" />}
                      <span>Submit Merchant Application</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ivory-200 text-espresso text-xs font-bold">
                      <Lock className="w-3.5 h-3.5" /> Application Already Submitted
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Notifications & Status Timeline */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-3xl border border-rose p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-espresso flex items-center gap-2">
                  <Bell className="w-4 h-4 text-ruby" /> Merchant Notifications
                  {unreadNotificationCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-ruby text-white text-[10px] font-bold">
                      {unreadNotificationCount}
                    </span>
                  )}
                </h3>
                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleMarkNotificationsRead()}
                    className="text-[11px] font-bold text-ruby hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-espresso-muted">
                  Updates from GOJIFEM Compliance will appear here.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => !note.isRead && void handleMarkNotificationsRead(note.id)}
                      className={`w-full text-left p-3 rounded-2xl border text-xs transition ${
                        note.isRead
                          ? 'border-rose/70 bg-ivory/40 text-espresso-muted'
                          : 'border-ruby/30 bg-rose/20 text-espresso'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="font-bold text-espresso">{note.title}</strong>
                        {!note.isRead && <span className="w-2 h-2 rounded-full bg-ruby shrink-0" />}
                      </div>
                      <p className="leading-relaxed">{note.message}</p>
                      <span className="block text-[10px] text-espresso-muted mt-1.5">
                        {formatDateTime(note.createdAt)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status History Timeline */}
            <div className="bg-white rounded-3xl border border-rose p-5 shadow-sm space-y-4">
              <h3 className="font-serif text-base font-bold text-espresso flex items-center gap-2">
                <Clock className="w-4 h-4 text-ruby" /> Application Timeline
              </h3>
              {!data?.application?.statusHistory?.length ? (
                <p className="text-xs text-espresso-muted">No status events recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.application.statusHistory.map((item) => (
                    <div key={item.id} className="border-l-2 border-ruby/40 pl-3 space-y-0.5 text-xs">
                      <span className="font-bold text-espresso block">
                        {humanizeStatus(item.toStatus)}
                      </span>
                      {(item.reason || item.notes) && (
                        <p className="text-espresso-muted leading-relaxed">
                          {item.reason || item.notes}
                        </p>
                      )}
                      <span className="text-[10px] text-espresso-muted block">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-rose max-w-md w-full p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-espresso">
                Confirm Application Submission
              </h3>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="p-1 text-espresso-muted hover:text-ruby"
                aria-label="Close confirmation dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-espresso-muted leading-relaxed">
              You are submitting application{' '}
              <strong className="font-mono text-espresso">{data?.application?.referenceNumber}</strong>{' '}
              for <strong>{businessName}</strong> with {documents.length} uploaded KYC document(s) and settlement bank <strong>{resolvedBankName}</strong>. Editing will be locked while under compliance review.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-full border border-rose text-xs font-bold text-espresso hover:bg-ivory"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleFinalSubmit()}
                className="px-6 py-2.5 rounded-full bg-ruby text-white text-xs font-bold hover:bg-ruby-hover transition"
              >
                {submitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
