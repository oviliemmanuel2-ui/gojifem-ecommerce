'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { apiFetch } from '../../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Unable to process password reset request.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-rose shadow-sm p-6 sm:p-8">
          <div className="mb-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso/70 hover:text-ruby transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>

          <h1 className="text-2xl font-serif font-bold text-espresso">Reset Your Password</h1>
          <p className="text-xs text-espresso/70 mt-1 mb-6">
            Enter your account email address and we will send you a secure link to create a new password.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose/50 border border-ruby/30 text-xs text-ruby font-semibold">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="p-5 rounded-2xl bg-rose/30 border border-gold/40 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-ruby">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Reset Request Sent</span>
              </div>
              <p className="text-espresso/80 leading-relaxed">
                If an account exists for <strong>{email}</strong>, a password reset link has been dispatched. Please check your inbox and follow the instructions within 1 hour.
              </p>
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 font-bold text-ruby hover:underline"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
                  />
                  <Mail className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-ruby text-white rounded-xl font-bold text-xs hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-md shadow-ruby/20 disabled:opacity-50"
              >
                <span>{loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
