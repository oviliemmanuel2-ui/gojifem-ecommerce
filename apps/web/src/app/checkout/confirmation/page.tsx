'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { CheckoutProgressSteps } from '../../../components/ui/CheckoutProgressSteps';
import { Spinner } from '../../../components/ui/Spinner';
import { ErrorRetryBanner } from '../../../components/ui/ErrorRetryBanner';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { apiFetch } from '../../../lib/api';

type VerifyState =
  | 'verifying'
  | 'verified'
  | 'pending'
  | 'failed'
  | 'missing_reference';

interface VerifyPaymentResponse {
  verified: boolean;
  status: string;
  provider?: string;
  reference?: string;
  orderNumber?: string | null;
  amountMinor?: number | null;
  currency?: string | null;
  message?: string;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const { clearCart, sessionReady, session, showToast } = useMarketplace();

  const rawRef =
    searchParams?.get('reference') ||
    searchParams?.get('trxref') ||
    searchParams?.get('tx_ref') ||
    '';
  const reference = rawRef.trim();
  const orderNumberParam = (searchParams?.get('orderNumber') || '').trim();
  const providerParam = (searchParams?.get('provider') || '').trim();

  const [verifyState, setVerifyState] = useState<VerifyState>(
    reference ? 'verifying' : 'missing_reference',
  );
  const [result, setResult] = useState<VerifyPaymentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryNotice, setRetryNotice] = useState<string>('');
  const [retrying, setRetrying] = useState(false);

  const clearedCartRef = useRef(false);

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      setVerifyState('missing_reference');
      return;
    }
    if (!sessionReady) return;
    if (!session?.accessToken) {
      setVerifyState('failed');
      setErrorMessage(
        'Please sign in with the customer account that initiated this checkout to verify your payment.',
      );
      return;
    }

    setVerifyState('verifying');
    setRetrying(true);
    setRetryNotice('');
    setErrorMessage('');

    try {
      const qs = providerParam
        ? `?provider=${encodeURIComponent(providerParam)}`
        : '';
      const data = await apiFetch<VerifyPaymentResponse>(
        `/payments/verify/${encodeURIComponent(reference)}${qs}`,
        {
          method: 'GET',
          timeoutMs: 20000,
          cancelPreviousKey: 'payment-verify',
          onRetryAttempt: ({ attempt, maxRetries }) => {
            setRetryNotice(`Reconnecting to payment provider (attempt ${attempt} of ${maxRetries})...`);
          },
        },
      );
      setRetryNotice('');

      setResult(data);
      if (data.verified && data.status === 'SUCCEEDED') {
        setVerifyState('verified');
        if (!clearedCartRef.current) {
          clearedCartRef.current = true;
          clearCart();
          showToast('Payment confirmed! Thank you for shopping with GOJIFEM.', 'success', {
            category: 'payment',
            dedupeKey: `payment-confirmed-${reference}`,
          });
        }
      } else if (data.status === 'PENDING') {
        setVerifyState('pending');
        const msg =
          data.message ||
          'Your payment is still pending confirmation from the payment provider.';
        setErrorMessage(msg);
        showToast(msg, 'warning', {
          category: 'payment',
          persistent: true,
          dedupeKey: `payment-pending-${reference}`,
        });
      } else {
        setVerifyState('failed');
        const msg =
          data.message ||
          'Payment has not been confirmed by the payment provider.';
        setErrorMessage(msg);
        showToast(msg, 'error', {
          category: 'payment',
          persistent: true,
          dedupeKey: `payment-failed-${reference}`,
        });
      }
    } catch (err: unknown) {
      setVerifyState('failed');
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to verify your payment right now. Your cart has not been cleared.';
      setErrorMessage(msg);
      showToast(msg, 'error', {
        category: 'payment',
        persistent: true,
        dedupeKey: `payment-error-${reference}`,
      });
    } finally {
      setRetrying(false);
    }
  }, [clearCart, providerParam, reference, session?.accessToken, sessionReady, showToast]);

  useEffect(() => {
    if (!reference) {
      setVerifyState('missing_reference');
      return;
    }
    if (!sessionReady) return;
    verifyPayment();
  }, [reference, sessionReady, verifyPayment]);

  const resolvedOrderNumber = result?.orderNumber || orderNumberParam || null;
  const resolvedProvider = result?.provider || providerParam || 'Payment Gateway';

  if (verifyState === 'verifying') {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <CheckoutProgressSteps currentStep={2} className="mb-8" />

        <div className="bg-white rounded-3xl border border-rose p-8 sm:p-10 shadow-sm text-center space-y-4">
          <Spinner size="lg" tone="ruby" label="Verifying your payment..." className="mx-auto" />
          <h1 className="text-2xl font-serif font-bold text-espresso">
            Verifying your payment with {resolvedProvider}...
          </h1>
          <p className="text-xs sm:text-sm text-espresso/75 max-w-md mx-auto leading-relaxed">
            {retryNotice ||
              `Please wait while we confirm transaction ${reference} directly with the payment provider before creating your order confirmation.`}
          </p>
        </div>
      </main>
    );
  }

  if (verifyState === 'missing_reference') {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <CheckoutProgressSteps currentStep={2} className="mb-8" />

        <div className="bg-white rounded-3xl border border-rose p-8 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-gold/25 text-espresso flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-espresso">
            No Payment Reference Found
          </h1>
          <p className="text-xs sm:text-sm text-espresso/75 max-w-md mx-auto leading-relaxed">
            Order confirmation is displayed only after a verified payment callback from our payment provider. Your cart items remain safe if you have not completed checkout.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link
              href="/cart"
              className="px-6 py-3 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Return to Shopping Bag</span>
            </Link>
            <Link
              href="/account"
              className="px-6 py-3 border border-rose rounded-xl text-xs font-bold text-espresso hover:bg-rose/30 transition"
            >
              View Account &amp; Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (verifyState === 'pending') {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <CheckoutProgressSteps currentStep={2} className="mb-8" />

        <div className="bg-white rounded-3xl border border-gold p-8 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-gold/25 text-espresso flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-espresso">
            Payment Verification Pending
          </h1>
          <p className="text-xs sm:text-sm text-espresso/75 max-w-md mx-auto leading-relaxed">
            {errorMessage} Reference: <strong>{reference}</strong>
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={verifyPayment}
              disabled={retrying}
              className="px-6 py-3 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {retrying ? (
                <Spinner size="xs" tone="ivory" label="Checking status..." />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{retrying ? 'Checking Status...' : 'Check Status Again'}</span>
            </button>
            <Link
              href="/checkout"
              className="px-6 py-3 border border-rose rounded-xl text-xs font-bold text-espresso hover:bg-rose/30 transition"
            >
              Return to Checkout
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (verifyState === 'failed') {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-6">
        <CheckoutProgressSteps currentStep={2} />

        <div className="bg-white rounded-3xl border border-rose p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h1 className="text-2xl font-serif font-bold text-espresso">
              Payment Not Confirmed
            </h1>
            <p className="text-xs sm:text-sm text-espresso/75 mt-1">
              Reference: <strong>{reference}</strong>
              {resolvedOrderNumber ? ` • Order: ${resolvedOrderNumber}` : ''}
            </p>
          </div>

          <ErrorRetryBanner
            title="Provider Verification Unconfirmed"
            message={errorMessage}
            onRetry={session?.accessToken ? verifyPayment : undefined}
            retryLabel="Retry Verification"
            retrying={retrying}
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {!session?.accessToken ? (
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(`/checkout/confirmation?reference=${reference}`)}`}
                className="px-6 py-3 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition text-center"
              >
                Sign In to Verify Payment
              </Link>
            ) : (
              <Link
                href="/checkout"
                className="px-6 py-3 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition text-center"
              >
                Return to Checkout
              </Link>
            )}
            <Link
              href="/cart"
              className="px-6 py-3 border border-rose rounded-xl text-xs font-bold text-espresso hover:bg-rose/30 transition text-center"
            >
              View Shopping Bag
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Verified state ONLY when payment provider confirmed SUCCEEDED
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full text-center">
      <CheckoutProgressSteps currentStep={3} completedAll className="mb-8 text-left" />

      <div className="w-16 h-16 rounded-full bg-rose text-ruby flex items-center justify-center mx-auto mb-4 shadow-sm ring-4 ring-gold/30">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">
        Order Confirmed &amp; Paid
      </h1>
      <p className="text-xs sm:text-sm text-espresso/70 mt-1 max-w-md mx-auto">
        Your payment has been confirmed by {resolvedProvider} and secured in GOJIFEM escrow.
      </p>

      <div className="mt-8 bg-white rounded-3xl border border-rose p-6 sm:p-8 shadow-sm text-left space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rose gap-2">
          <div>
            <span className="text-[10px] text-espresso/60 uppercase font-bold tracking-wider">
              {resolvedOrderNumber ? 'Order & Payment Reference' : 'Verified Payment Reference'}
            </span>
            <strong className="text-sm sm:text-base font-serif font-bold text-espresso block">
              {resolvedOrderNumber || result?.reference || reference}
            </strong>
            {resolvedOrderNumber && (
              <span className="text-[11px] text-espresso/65">
                Transaction Ref: {result?.reference || reference}
              </span>
            )}
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold text-espresso self-start sm:self-auto">
            Payment Verified via {resolvedProvider}
          </span>
        </div>

        <div className="p-4 bg-rose/40 border border-gold/40 rounded-2xl flex items-start gap-3 text-xs text-espresso">
          <ShieldCheck className="w-5 h-5 text-ruby shrink-0 mt-0.5" />
          <div>
            <strong className="text-espresso font-bold block">Escrow Protection Active</strong>
            <p className="text-[11px] text-espresso/80 mt-0.5">
              Vendor payment will only be released following recorded courier delivery and recipient inspection.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/account"
            className="flex-1 py-3 px-4 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-sm text-center"
          >
            <span>View in Account &amp; Track Parcels</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="py-3 px-4 border border-rose rounded-xl text-xs font-bold text-espresso hover:bg-rose/40 transition text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />
      <Suspense
        fallback={
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-xs text-espresso/75">
            <Spinner size="md" tone="ruby" label="Verifying your payment..." />
            <span>Loading payment verification...</span>
          </div>
        }
      >
        <ConfirmationContent />
      </Suspense>
    </div>
  );
}
