'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Mail, Phone, Lock, ArrowRight, ShieldCheck, MapPin, Tag } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';

export default function VendorRegisterPage() {
  const router = useRouter();
  const [legalName, setLegalName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('Fashion & Apparel');
  const [cityState, setCityState] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError('Please accept the Vendor Agreement to apply');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In production, this calls POST /api/v1/auth/vendor-register
      await new Promise((r) => setTimeout(r, 700));

      const mockSession = {
        email,
        roles: ['VENDOR_OWNER'],
        vendor: {
          legalName,
          displayName,
          status: 'DRAFT',
        },
        token: 'mock_jwt_vendor_token_' + Date.now(),
      };
      localStorage.setItem('gojifem_session', JSON.stringify(mockSession));
      router.push('/vendor/apply'); // Directs to step 4 verification evidence upload
    } catch {
      setError('Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-rose shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose text-ruby flex items-center justify-center mx-auto shadow-sm mb-3 ring-2 ring-gold/40">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-espresso">Sell on GOJIFEM</h1>
            <p className="text-xs text-espresso/70 mt-1">
              Reach thousands of buyers in Nigeria and the international diaspora with guaranteed escrow payouts
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
                <label className="block text-xs font-bold text-espresso mb-1.5">Registered Business / Legal Name</label>
                <input
                  type="text"
                  required
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Omo Odua Heritage Ltd"
                  className="w-full text-xs border border-rose rounded-xl px-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Store Display Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Omo Odua Heritage"
                    className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
                  />
                  <Store className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Primary Merchandise Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
                  >
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Nigerian Groceries & Foods">Nigerian Groceries & Foods</option>
                    <option value="Beauty & Wellness">Beauty & Wellness</option>
                    <option value="Arts & Handcrafts">Arts & Handcrafts</option>
                    <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                  </select>
                  <Tag className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Operating City & State</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    placeholder="e.g. Ikeja, Lagos"
                    className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
                  />
                  <MapPin className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Merchant Official Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@yourbrand.com"
                    className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
                  />
                  <Mail className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Merchant Phone (WhatsApp/Calls)</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 802 345 6789"
                    className="w-full text-xs border border-rose rounded-xl pl-9 pr-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby transition"
                  />
                  <Phone className="w-4 h-4 text-espresso/40 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-espresso mb-1.5">Create Secure Merchant Password</label>
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

            {/* Commission Notice in Muted Rose with Gold Accent */}
            <div className="p-3 bg-rose/40 border border-gold/40 rounded-xl text-xs text-espresso">
              <div className="flex items-center gap-1.5 font-bold text-espresso">
                <ShieldCheck className="w-4 h-4 text-ruby shrink-0" />
                <span>Transparent Commercial Terms</span>
              </div>
              <p className="text-[11px] text-espresso/80 mt-1">
                Standard platform commission is <strong>10.00%</strong> per completed order. Payouts are made directly to your verified Nigerian commercial bank account following customer delivery confirmation.
              </p>
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
                  I agree to the{' '}
                  <a href="#" className="font-semibold text-ruby underline">
                    GOJIFEM Vendor Agreement
                  </a>
                  , return standards, and escrow payout terms.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ruby text-white rounded-xl font-bold text-xs hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-md shadow-ruby/20 disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Submitting Application...' : 'Apply as Merchant & Continue to KYC'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-espresso/70">
            Already registered as a vendor?{' '}
            <Link href="/auth/login" className="font-bold text-ruby hover:underline">
              Sign In to Vendor Portal
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
