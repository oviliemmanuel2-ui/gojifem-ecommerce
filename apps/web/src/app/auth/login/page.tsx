'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, Store, User } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<'customer' | 'vendor'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In production, this calls POST /api/v1/auth/login
      // Simulated successful sign in for demonstration
      await new Promise((r) => setTimeout(r, 600));

      const mockSession = {
        email,
        roles: accountType === 'vendor' ? ['VENDOR_OWNER'] : ['CUSTOMER'],
        token: 'mock_jwt_token_' + Date.now(),
      };
      localStorage.setItem('gojifem_session', JSON.stringify(mockSession));

      if (accountType === 'vendor') {
        router.push('/vendor/dashboard');
      } else {
        router.push('/account');
      }
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type: 'customer' | 'vendor') => {
    setAccountType(type);
    if (type === 'customer') {
      setEmail('customer@example.com');
      setPassword('P@ssw0rd123');
    } else {
      setEmail('vendor@omoodua.com');
      setPassword('P@ssw0rd123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-rose shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-ruby text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md mb-3 ring-2 ring-gold/40">
              G
            </div>
            <h1 className="text-2xl font-serif font-bold text-espresso">Welcome Back</h1>
            <p className="text-xs text-espresso/70 mt-1">Sign in to your GOJIFEM marketplace account</p>
          </div>

          {/* Account Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-rose/40 rounded-xl mb-6 text-xs font-bold text-espresso">
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

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose/50 border border-ruby/30 text-xs text-ruby font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-espresso mb-1.5">
                {accountType === 'vendor' ? 'Merchant Email' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={accountType === 'vendor' ? 'merchant@store.com' : 'you@example.com'}
                  className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
                />
                <Mail className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-espresso">Password</label>
                <a href="#" className="text-[11px] font-semibold text-ruby hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
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
              className="w-full py-3 bg-ruby text-white rounded-xl font-bold text-xs hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-md shadow-ruby/20 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Signing in...' : `Sign In as ${accountType === 'vendor' ? 'Merchant' : 'Customer'}`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-4 border-t border-rose">
            <span className="text-[10px] text-espresso/60 uppercase font-bold block mb-2 text-center">
              Quick Test Credentials
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillDemo('customer')}
                className="flex-1 py-1.5 text-[11px] font-medium border border-rose rounded-lg hover:bg-rose/40 text-espresso"
              >
                Demo Customer
              </button>
              <button
                type="button"
                onClick={() => fillDemo('vendor')}
                className="flex-1 py-1.5 text-[11px] font-medium border border-rose rounded-lg hover:bg-rose/40 text-espresso"
              >
                Demo Vendor
              </button>
            </div>
          </div>

          {/* Register Links */}
          <div className="mt-6 text-center text-xs text-espresso/70 space-y-2">
            <p>
              Don't have an account?{' '}
              <Link href="/auth/register" className="font-bold text-ruby hover:underline">
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
