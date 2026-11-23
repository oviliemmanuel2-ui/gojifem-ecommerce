'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '../../../../components/Navbar';
import { apiFetch, StoredUser } from '../../../../lib/api';
import { useMarketplace } from '../../../../context/MarketplaceContext';
import { consumePostAuthRedirect } from '../../../../lib/authRedirect';

function AppleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, showToast } = useMarketplace();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const queryError = searchParams.get('error');
    if (queryError) {
      setError(queryError);
      return;
    }

    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
    const params = new URLSearchParams(hash);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken') || undefined;

    if (!accessToken) {
      setError('Missing Apple authentication session token. Please try signing in again.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const profile = await apiFetch<StoredUser & { profile?: { firstName?: string; lastName?: string; avatarUrl?: string } }>(
          '/auth/me',
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
            skipAuth: true,
          },
        );

        if (cancelled) return;
        setSession({
          accessToken,
          refreshToken,
          user: {
            id: profile.id,
            email: profile.email,
            phone: profile.phone,
            firstName: profile.profile?.firstName,
            lastName: profile.profile?.lastName,
            avatarUrl: profile.profile?.avatarUrl,
            emailVerified: profile.emailVerified,
            roles: profile.roles || ['CUSTOMER'],
            vendors: profile.vendors,
          },
        });
        const target = consumePostAuthRedirect(null, '/account');
        showToast(
          target === '/checkout'
            ? 'Signed in with Apple! Returning you to checkout.'
            : 'Signed in with Apple successfully!',
          'success',
          { category: 'auth', dedupeKey: 'auth-oauth-apple' },
        );
        router.replace(target);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Unable to finalize Apple Sign-In session.';
        setError(msg);
        showToast(msg, 'error', { category: 'auth', dedupeKey: 'auth-oauth-apple-err' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, setSession, showToast]);

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-rose shadow-sm p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-espresso text-ivory font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md mb-4">
        G
      </div>
      {error ? (
        <>
          <h1 className="text-xl font-serif font-bold text-espresso mb-2">Apple Sign-In Failed</h1>
          <p className="text-xs text-ruby font-medium bg-rose/40 p-3 rounded-xl border border-ruby/30 mb-6">
            {error}
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-2.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition"
          >
            Back to Sign In
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-xl font-serif font-bold text-espresso mb-2">
            Completing Sign in with Apple...
          </h1>
          <p className="text-xs text-espresso/70">
            Securing your verified GOJIFEM marketplace session.
          </p>
        </>
      )}
    </div>
  );
}

export default function AppleCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-white rounded-3xl border border-rose shadow-sm p-8 text-center text-xs">
              Loading Apple authentication...
            </div>
          }
        >
          <AppleCallbackContent />
        </Suspense>
      </main>
    </div>
  );
}
