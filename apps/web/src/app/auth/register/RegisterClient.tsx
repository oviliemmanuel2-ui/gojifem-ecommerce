'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, ArrowRight, ShoppingBag } from 'lucide-react';
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

interface RegisterClientProps {
  initialRedirect?: string | null;
  initialReason?: string | null;
}

export function RegisterClient({
  initialRedirect = null,
  initialReason = null,
}: RegisterClientProps) {
  const router = useRouter();
  const isCheckoutRedirect =
    initialReason === 'checkout' || initialRedirect === '/checkout';

  const { setSession, showToast } = useMarketplace();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
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
    if (!acceptTerms) {
      const msg = 'Please accept the Terms of Service and Privacy Policy';
      setError(msg);
      showToast(msg, 'warning', { category: 'auth', dedupeKey: 'auth-register-terms' });
      return;
    }

    const sanitizedPhone = phone.replace(/[\s\-()]/g, '').trim();
    if (sanitizedPhone && !/^\+?[1-9]\d{6,14}$/.test(sanitizedPhone)) {
      const msg = 'Please enter a valid phone number in international format (e.g. +2348012345678).';
      setError(msg);
      showToast(msg, 'warning', { category: 'auth', dedupeKey: 'auth-register-phone' });
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<StoredSession & { emailVerificationRequired?: boolean }>(
        '/auth/register',
        {
          method: 'POST',
          skipAuth: true,
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: sanitizedPhone || undefined,
            password,
          }),
        },
      );

      setSession(response);
      const target = consumePostAuthRedirect(initialRedirect, '/account');
      showToast(
        target === '/checkout'
          ? 'Account created! Continuing to checkout with your saved cart.'
          : 'Account created! Please check your email inbox for the verification link.',
        'success',
        { category: 'auth', dedupeKey: 'auth-register-success' },
      );
      router.push(target);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please verify your details.';
      setError(msg);
      showToast(msg, 'error', { category: 'auth', dedupeKey: 'auth-register-error' });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const loginHref = isCheckoutRedirect
    ? '/auth/login?redirect=/checkout&reason=checkout'
    : '/auth/login';

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-rose shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-serif font-bold text-espresso">Create Customer Account</h1>
            <p className="text-xs text-espresso/70 mt-1">
              Shop authentic goods from verified merchants locally &amp; worldwide with secure escrow protection
            </p>
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

          {error && <ErrorRetryBanner message={error} className="mb-4" />}

          {/* Official Google & Apple Sign-Up */}
          <SocialAuthButtons
            mode="register"
            disabled={loading}
            onError={(msg) => setError(msg || null)}
          />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-rose" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-espresso/60 font-bold tracking-wider">
                Or register with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">First Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Chidi"
                    className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition disabled:opacity-60"
                  />
                  <User className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Okafor"
                  className="w-full text-xs border border-rose rounded-xl px-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-espresso mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chidi.okafor@example.com"
                  className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition disabled:opacity-60"
                />
                <Mail className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-espresso mb-1.5">
                Phone Number (Nigerian or International)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  disabled={loading}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2348012345678"
                  className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition disabled:opacity-60"
                />
                <Phone className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-espresso mb-1.5">Create Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={8}
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition disabled:opacity-60"
                />
                <Lock className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-espresso/80">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded text-ruby focus:ring-ruby"
                />
                <span>
                  I agree to GOJIFEM&apos;s{' '}
                  <Link href="/terms" className="font-semibold text-ruby underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="font-semibold text-ruby underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ruby text-white rounded-xl font-bold text-xs hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-md shadow-ruby/20 disabled:opacity-60 mt-4"
            >
              {loading ? (
                <>
                  <Spinner size="xs" tone="ivory" label="Creating your account..." />
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-espresso/70">
            Already have an account?{' '}
            <Link href={loginHref} className="font-bold text-ruby hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
