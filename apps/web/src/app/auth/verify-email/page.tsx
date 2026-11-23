'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { apiFetch } from '../../../lib/api';
import { useMarketplace } from '../../../context/MarketplaceContext';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { showToast } = useMarketplace();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>(
    token ? 'verifying' : 'idle',
  );
  const [message, setMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch<{ message: string }>('/auth/verify-email/confirm', {
          method: 'POST',
          skipAuth: true,
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;
        setStatus('verified');
        const msg = res.message || 'Your email address has been verified.';
        setMessage(msg);
        showToast(msg, 'success', { category: 'auth', dedupeKey: 'auth-email-verified' });
      } catch (err: unknown) {
        if (cancelled) return;
        setStatus('error');
        const msg =
          err instanceof Error ? err.message : 'Verification link is invalid or has expired.';
        setMessage(msg);
        showToast(msg, 'error', { category: 'auth', dedupeKey: 'auth-email-verify-err' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResending(true);
    try {
      const res = await apiFetch<{ message: string }>('/auth/verify-email/request', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      setStatus('idle');
      setMessage(res.message);
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Could not resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-rose shadow-sm p-6 sm:p-8 text-center">
      {status === 'verifying' && (
        <div className="space-y-2 py-4">
          <h1 className="text-xl font-serif font-bold text-espresso">Verifying Your Email...</h1>
          <p className="text-xs text-espresso/70">Please wait a moment while we confirm your token.</p>
        </div>
      )}

      {status === 'verified' && (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose text-ruby flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-espresso">Email Verified</h1>
          <p className="text-xs text-espresso/80">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <Link
              href="/account"
              className="px-6 py-2.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition"
            >
              Go to My Account
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-2.5 border border-rose text-espresso rounded-xl text-xs font-bold hover:bg-rose/30 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      {(status === 'error' || status === 'idle') && (
        <div className="space-y-4 text-left">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose text-ruby flex items-center justify-center mx-auto mb-3">
              {status === 'error' ? <AlertCircle className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
            </div>
            <h1 className="text-2xl font-serif font-bold text-espresso">
              Email Verification
            </h1>
            {message && (
              <p
                className={`mt-2 text-xs p-3 rounded-xl border ${
                  status === 'error'
                    ? 'bg-rose/50 border-ruby/30 text-ruby font-semibold'
                    : 'bg-rose/30 border-gold/40 text-espresso'
                }`}
              >
                {message}
              </p>
            )}
          </div>

          <form onSubmit={handleResend} className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-espresso">
              Need a new verification link?
            </label>
            <input
              type="email"
              required
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
            />
            <button
              type="submit"
              disabled={resending}
              className="w-full py-2.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{resending ? 'Sending...' : 'Send Verification Link'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-white rounded-3xl border border-rose shadow-sm p-8 text-center text-xs">
              Checking verification token...
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </main>
    </div>
  );
}
