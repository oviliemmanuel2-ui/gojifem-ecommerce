'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Store, User, ShoppingBag } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { SocialAuthButtons } from '../../../components/SocialAuthButtons';
import { Spinner } from '../../../components/ui/Spinner';
import { ErrorRetryBanner } from '../../../components/ui/ErrorRetryBanner';
import { apiFetch, StoredSession } from '../../../lib/api';
import { useMarketplace } from '../../../context/MarketplaceContext';
import {
  CHECKOUT_AUTH_MESSAGE,
  consumePostAuthRedirect,
  isSafeInternalPath,
  savePostAuthRedirect,
} from '../../../lib/authRedirect';

interface LoginClientProps {
  initialRedirect?: string | null;
  initialReason?: string | null;
}

export function LoginClient({
  initialRedirect = null,
  initialReason = null,
}: LoginClientProps) {
  const router = useRouter();
  const isCheckoutRedirect =
    initialReason === 'checkout' || initialRedirect === '/checkout';

  const { setSession, showToast } = useMarketplace();
  const [accountType, setAccountType] = useState<'customer' | 'vendor'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (isSafeInternalPath(initialRedirect)) {
      savePostAuthRedirect(initialRedirect);
    } else if (isCheckoutRedirect) {
      savePostAuthRedirect('/checkout');
    }
  }, [initialRedirect, isCheckoutRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<StoredSession>('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      setSession(response);
      const roles = response.user?.roles || [];
      const defaultDest =
        accountType === 'vendor' || roles.includes('VENDOR_OWNER') || roles.includes('VENDOR_STAFF')
          ? '/vendor/products'
          : '/account';
      const target = consumePostAuthRedirect(initialRedirect, defaultDest);

      showToast(
        target === '/checkout'
          ? 'Signed in! Returning you to checkout with your saved cart.'
          : 'Signed in successfully. Welcome back to GOJIFEM!',
        'success',
        { category: 'auth', dedupeKey: 'auth-login-success' },
      );
      router.push(target);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Invalid email or password. Please try again.';
      setError(msg);
      showToast(msg, 'error', { category: 'auth', dedupeKey: 'auth-login-error' });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const registerHref = isCheckoutRedirect
    ? '/auth/register?redirect=/checkout&reason=checkout'
    : '/auth/register';

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-rose shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-ruby text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md mb-3 ring-2 ring-gold/40">
              G
            </div>
            <h1 className="text-2xl font-serif font-bold text-espresso">Welcome Back</h1>
            <p className="text-xs text-espresso/70 mt-1">Sign in to your GOJIFEM marketplace account</p>
          </div>

          {isCheckoutRedirect && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-2xl bg-gold/25 border border-gold text-xs text-espresso font-semibold flex items-start gap-2.5"
            >
              <ShoppingBag className="w-4 h-4 text-ruby shrink-0 mt-0.5" />
              <span>{CHECKOUT_AUTH_MESSAGE}</span>
            </div>
          )}

          {/* Account Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-rose/40 rounded-xl mb-5 text-xs font-bold text-espresso">
            <button
              type="button"
              onClick={() => setAccountType('customer')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                accountType === 'customer'
                  ? 'bg-white text-ruby shadow-sm'
                  : 'hover:text-espresso/80'
              }`}
            >
              <User className="w-3.5 h-3.5 text-ruby" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType('vendor')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                accountType === 'vendor'
                  ? 'bg-white text-ruby shadow-sm'
                  : 'hover:text-espresso/80'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-ruby" />
              <span>Merchant / Vendor</span>
            </button>
          </div>

          {error && <ErrorRetryBanner message={error} className="mb-4" />}

          {/* Official Google & Apple Sign-In */}
          <SocialAuthButtons
            mode="login"
            disabled={loading}
            onError={(msg) => setError(msg || null)}
          />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-rose" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-espresso/60 font-bold tracking-wider">
                Or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-espresso mb-1.5">
                {accountType === 'vendor' ? 'Merchant Email' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={accountType === 'vendor' ? 'merchant@store.com' : 'you@example.com'}
                  className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition disabled:opacity-60"
                />
                <Mail className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-espresso">Password</label>
                <Link href="/auth/forgot-password" className="text-[11px] font-semibold text-ruby hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition disabled:opacity-60"
                />
                <Lock className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-espresso/70 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-ruby focus:ring-ruby"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ruby text-white rounded-xl font-bold text-xs hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-md shadow-ruby/20 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <Spinner size="xs" tone="ivory" label="Signing you in..." />
                  <span>Signing you in...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {accountType === 'vendor' ? 'Merchant' : 'Customer'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Register Links */}
          <div className="mt-6 text-center text-xs text-espresso/70 space-y-2">
            <p>
              Don&apos;t have an account?{' '}
              <Link href={registerHref} className="font-bold text-ruby hover:underline">
                Register as Customer
              </Link>
            </p>
            <p>
              Want to sell products?{' '}
              <Link href="/auth/vendor-register" className="font-bold text-ruby hover:underline">
                Apply as Merchant
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
