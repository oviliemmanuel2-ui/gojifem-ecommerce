'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In production, this calls POST /api/v1/auth/register
      await new Promise((r) => setTimeout(r, 600));

      const mockSession = {
        email,
        firstName,
        lastName,
        roles: ['CUSTOMER'],
        token: 'mock_jwt_token_' + Date.now(),
      };
      localStorage.setItem('gojifem_session', JSON.stringify(mockSession));
      router.push('/account');
    } catch {
      setError('Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-rose shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-serif font-bold text-espresso">Create Customer Account</h1>
            <p className="text-xs text-espresso/70 mt-1">
              Shop authentic goods from verified Nigerian merchants with secure escrow protection
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose/50 border border-ruby/30 text-xs text-ruby font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">First Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Chidi"
                    className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
                  />
                  <User className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Okafor"
                  className="w-full text-xs border border-rose rounded-xl px-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-espresso mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chidi.okafor@example.com"
                  className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
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
                  I agree to GOJIFEM's{' '}
                  <a href="#" className="font-semibold text-ruby underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="font-semibold text-ruby underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ruby text-white rounded-xl font-bold text-xs hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-md shadow-ruby/20 disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-espresso/70">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-bold text-ruby hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
