'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '../../../../components/Navbar';
import { apiFetch, StoredSession } from '../../../../lib/api';
import { useMarketplace } from '../../../../context/MarketplaceContext';
import { consumePostAuthRedirect } from '../../../../lib/authRedirect';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, showToast } = useMarketplace();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oauthError = searchParams.get('error');
    const code = searchParams.get('code');

    if (oauthError) {
      setError(`Google Sign-In declined: ${oauthError}`);
      return;
    }

    if (!code) {
      setError('Missing Google authorization code. Please try signing in again.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback/google`;
        const response = await apiFetch<StoredSession>('/auth/google/callback', {
          method: 'POST',
          skipAuth: true,
          body: JSON.stringify({ code, redirectUri }),
        });

        if (cancelled) return;
        setSession(response);
        const target = consumePostAuthRedirect(null, '/account');
        showToast(
          target === '/checkout'
            ? 'Signed in with Google! Returning you to checkout.'
            : 'Signed in with Google successfully!',
          'success',
          { category: 'auth', dedupeKey: 'auth-oauth-google' },
        );
        router.replace(target);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Unable to complete Google Sign-In.';
        setError(msg);
        showToast(msg, 'error', { category: 'auth', dedupeKey: 'auth-oauth-google-err' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, setSession, showToast]);

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-rose shadow-sm p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-ruby text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md mb-4">
        G
      </div>
      {error ? (
        <>
          <h1 className="text-xl font-serif font-bold text-espresso mb-2">Google Sign-In Failed</h1>
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
            Completing Google Sign-In...
          </h1>
          <p className="text-xs text-espresso/70">
            Verifying your Google account and establishing your secure GOJIFEM session.
          </p>
        </>
      )}
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-white rounded-3xl border border-rose shadow-sm p-8 text-center text-xs">
              Loading Google authentication...
            </div>
          }
        >
          <GoogleCallbackContent />
        </Suspense>
      </main>
    </div>
  );
}
