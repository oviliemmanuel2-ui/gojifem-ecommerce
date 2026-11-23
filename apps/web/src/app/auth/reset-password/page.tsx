'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { apiFetch } from '../../../lib/api';
import { useMarketplace } from '../../../context/MarketplaceContext';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useMarketplace();
  const tokenFromUrl = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tokenFromUrl) {
      setError('Missing password reset token. Please use the link from your email.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          token: tokenFromUrl,
          newPassword,
        }),
      });
      setDone(true);
      showToast('Password updated successfully! Redirecting to sign in.', 'success', {
        category: 'auth',
      });
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Unable to reset password. The link may have expired.';
      setError(msg);
      showToast(msg, 'error', { category: 'auth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-rose shadow-sm p-6 sm:p-8">
      <h1 className="text-2xl font-serif font-bold text-espresso">Choose a New Password</h1>
      <p className="text-xs text-espresso/70 mt-1 mb-6">
        Enter a strong new password of at least 8 characters for your GOJIFEM account.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose/50 border border-ruby/30 text-xs text-ruby font-semibold">
          {error}
        </div>
      )}

      {done ? (
        <div className="p-5 rounded-2xl bg-rose/30 border border-gold/40 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-ruby">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Password Updated Successfully</span>
          </div>
          <p className="text-espresso/80">
            Redirecting you to Sign In...
          </p>
          <Link href="/auth/login" className="inline-block font-bold text-ruby hover:underline">
            Sign In Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-espresso mb-1.5">New Password</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
              />
              <Lock className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-espresso mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
              />
              <Lock className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ruby text-white rounded-xl font-bold text-xs hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-md shadow-ruby/20 disabled:opacity-50"
          >
            <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-white rounded-3xl border border-rose shadow-sm p-8 text-center text-xs">
              Loading password reset form...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
