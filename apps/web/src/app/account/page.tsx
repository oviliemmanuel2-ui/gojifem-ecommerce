'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Package,
  LogOut,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorRetryBanner } from '../../components/ui/ErrorRetryBanner';
import { apiFetch } from '../../lib/api';
import { useMarketplace } from '../../context/MarketplaceContext';

interface SavedAddress {
  id: string;
  label?: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  stateOrRegion: string;
  city: string;
  streetAddress: string;
  isDefault?: boolean;
}

interface ProfileResponse {
  id: string;
  email: string;
  phone?: string | null;
  emailVerified?: boolean;
  profile?: { firstName?: string; lastName?: string; avatarUrl?: string | null } | null;
  addresses?: SavedAddress[];
  roles?: string[];
  oauthProviders?: string[];
}

export default function AccountPage() {
  const router = useRouter();
  const { session, sessionReady, setSession, logout, showToast } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [resendingVerify, setResendingVerify] = useState(false);

  // Local Address book additions
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCountry, setNewCountry] = useState('NG');
  const [newState, setNewState] = useState('Lagos State');
  const [newCity, setNewCity] = useState('');
  const [newStreet, setNewStreet] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!sessionReady) return;
    if (!session?.accessToken) {
      setProfile(null);
      return;
    }

    setLoadingProfile(true);
    setProfileError(null);
    try {
      const res = await apiFetch<ProfileResponse>('/auth/me');
      setProfile(res);
      setAddresses(res.addresses || []);
      setSession({
        ...session,
        user: {
          ...session.user,
          id: res.id,
          email: res.email,
          phone: res.phone,
          emailVerified: res.emailVerified,
          firstName: res.profile?.firstName ?? session.user.firstName,
          lastName: res.profile?.lastName ?? session.user.lastName,
          roles: res.roles || session.user.roles,
        },
      });
    } catch (err: unknown) {
      setProfileError(
        err instanceof Error ? err.message : 'Could not refresh profile from server.',
      );
    } finally {
      setLoadingProfile(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, session?.accessToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const handleResendVerification = async () => {
    const email = profile?.email || session?.user?.email;
    if (!email) return;

    setResendingVerify(true);
    try {
      const res = await apiFetch<{ message: string }>('/auth/verify-email/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      showToast(res.message || 'Verification email sent!', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Unable to send verification email.', 'error');
    } finally {
      setResendingVerify(false);
    }
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const added: SavedAddress = {
      id: `addr_${Date.now()}`,
      label: newLabel.trim() || 'Saved Address',
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      phone: newPhone.trim(),
      countryCode: newCountry,
      stateOrRegion: newState.trim(),
      city: newCity.trim(),
      streetAddress: newStreet.trim(),
      isDefault: addresses.length === 0,
    };

    setAddresses((prev) => [...prev, added]);
    setShowAddAddress(false);
    setNewLabel('');
    setNewFirstName('');
    setNewLastName('');
    setNewPhone('');
    setNewCity('');
    setNewStreet('');
    showToast('Delivery address saved to your address book.', 'success');
  };

  if (sessionReady && !session) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory text-espresso">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-rose rounded-3xl p-8 text-center shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose text-ruby flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-espresso">Sign In to Your Account</h1>
            <p className="text-xs text-espresso/75 leading-relaxed">
              Access your personal details, saved Nigerian &amp; international delivery addresses, and real-time order tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
              <Link
                href="/auth/login"
                className="px-6 py-2.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2.5 border border-rose text-espresso rounded-xl text-xs font-bold hover:bg-rose/30 transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const displayEmail = profile?.email || session?.user?.email || '';
  const displayFirstName = profile?.profile?.firstName || session?.user?.firstName || 'Valued';
  const displayLastName = profile?.profile?.lastName || session?.user?.lastName || 'Customer';
  const displayPhone = profile?.phone || session?.user?.phone || 'Not provided';
  const isVerified = profile?.emailVerified ?? session?.user?.emailVerified ?? false;
  const rolesList = profile?.roles || session?.user?.roles || ['CUSTOMER'];

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">Customer Account</h1>
            <p className="text-xs sm:text-sm text-espresso/70 mt-1">
              Manage your delivery addresses, track multi-vendor orders, and security settings
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="self-start sm:self-auto px-3.5 py-2 border rounded-xl text-xs font-semibold text-ruby border-ruby/30 hover:bg-rose/40 transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {profileError && (
          <ErrorRetryBanner
            message={profileError}
            onRetry={fetchProfile}
            retrying={loadingProfile}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-3 bg-white border border-rose rounded-3xl p-4 shadow-sm space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 ${
                activeTab === 'profile'
                  ? 'bg-rose text-ruby font-extrabold shadow-sm'
                  : 'text-espresso/70 hover:bg-rose/40'
              }`}
            >
              <User className="w-4 h-4 text-ruby" />
              <span>Personal Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 ${
                activeTab === 'addresses'
                  ? 'bg-rose text-ruby font-extrabold shadow-sm'
                  : 'text-espresso/70 hover:bg-rose/40'
              }`}
            >
              <MapPin className="w-4 h-4 text-ruby" />
              <span>Saved Delivery Addresses</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 ${
                activeTab === 'orders'
                  ? 'bg-rose text-ruby font-extrabold shadow-sm'
                  : 'text-espresso/70 hover:bg-rose/40'
              }`}
            >
              <Package className="w-4 h-4 text-ruby" />
              <span>Orders &amp; Tracking</span>
            </button>
          </div>

          {/* Main Content Pane */}
          <div className="lg:col-span-9 bg-white border border-rose rounded-3xl p-6 sm:p-8 shadow-sm">
            {activeTab === 'profile' && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                  <h2 className="text-lg font-serif font-bold text-espresso">Personal Profile</h2>
                  {loadingProfile && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-espresso/70">
                      <Spinner size="xs" tone="ruby" label="Refreshing from server..." />
                      <span>Refreshing from server...</span>
                    </span>
                  )}
                </div>

                {!isVerified && displayEmail && (
                  <div className="mb-6 p-4 rounded-2xl bg-rose/40 border border-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-ruby shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-espresso block">Verify your email address</strong>
                        <span className="text-espresso/75">
                          Confirm <strong>{displayEmail}</strong> to protect your orders and receive escrow notifications.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendingVerify}
                      className="px-3.5 py-2 bg-ruby text-white rounded-xl font-bold hover:bg-ruby-hover transition flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                    >
                      {resendingVerify ? (
                        <Spinner size="xs" tone="ivory" label="Sending verification email..." />
                      ) : (
                        <Mail className="w-3.5 h-3.5" />
                      )}
                      <span>{resendingVerify ? 'Sending...' : 'Resend Verification Email'}</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                  <div>
                    <label className="block text-xs font-semibold text-espresso/70 mb-1">First Name</label>
                    <div className="p-3 bg-ivory rounded-xl border border-rose text-xs font-bold text-espresso">
                      {displayFirstName}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-espresso/70 mb-1">Last Name</label>
                    <div className="p-3 bg-ivory rounded-xl border border-rose text-xs font-bold text-espresso">
                      {displayLastName}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-espresso/70 mb-1">Email Address</label>
                    <div className="p-3 bg-ivory rounded-xl border border-rose text-xs font-bold text-espresso flex items-center justify-between gap-2">
                      <span className="truncate">{displayEmail}</span>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-gold text-espresso px-2 py-0.5 rounded-full shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-ruby font-bold shrink-0">Unverified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-espresso/70 mb-1">Phone Number</label>
                    <div className="p-3 bg-ivory rounded-xl border border-rose text-xs font-bold text-espresso">
                      {displayPhone}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-rose flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-espresso/70">
                    <ShieldCheck className="w-4 h-4 text-ruby" />
                    <span>
                      Role Permissions: <strong>{rolesList.join(', ')}</strong>
                    </span>
                  </div>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-bold text-ruby hover:underline"
                  >
                    Change / Reset Password
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-espresso">Saved Delivery Addresses</h2>
                    <p className="text-xs text-espresso/70">Verified destinations within GOJIFEM serviceable coverage</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddAddress((prev) => !prev)}
                    className="px-3.5 py-2 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddAddress ? 'Cancel' : 'Add New Address'}</span>
                  </button>
                </div>

                {showAddAddress && (
                  <form
                    onSubmit={handleSaveNewAddress}
                    className="mb-6 p-5 rounded-2xl bg-rose/25 border border-gold/40 space-y-4 text-xs"
                  >
                    <h3 className="font-serif font-bold text-sm text-espresso">New Delivery Destination</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Label (e.g. Home, Office)"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="border border-rose rounded-xl px-3 py-2 bg-white text-espresso focus:outline-none focus:ring-2 focus:ring-ruby"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Recipient First Name"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        className="border border-rose rounded-xl px-3 py-2 bg-white text-espresso focus:outline-none focus:ring-2 focus:ring-ruby"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Recipient Last Name"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        className="border border-rose rounded-xl px-3 py-2 bg-white text-espresso focus:outline-none focus:ring-2 focus:ring-ruby"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="tel"
                        required
                        placeholder="Phone (+2348012345678)"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="border border-rose rounded-xl px-3 py-2 bg-white text-espresso focus:outline-none focus:ring-2 focus:ring-ruby"
                      />
                      <select
                        value={newCountry}
                        onChange={(e) => setNewCountry(e.target.value)}
                        className="border border-rose rounded-xl px-3 py-2 bg-white text-espresso focus:outline-none focus:ring-2 focus:ring-ruby"
                      >
                        <option value="NG">Nigeria</option>
                        <option value="GH">Ghana</option>
                        <option value="GB">United Kingdom</option>
                        <option value="US">United States</option>
                      </select>
                      <input
                        type="text"
                        required
                        placeholder="State / Region"
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        className="border border-rose rounded-xl px-3 py-2 bg-white text-espresso focus:outline-none focus:ring-2 focus:ring-ruby"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="City / Area"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="border border-rose rounded-xl px-3 py-2 bg-white text-espresso focus:outline-none focus:ring-2 focus:ring-ruby"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Street Address & House Number"
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        className="sm:col-span-2 border border-rose rounded-xl px-3 py-2 bg-white text-espresso focus:outline-none focus:ring-2 focus:ring-ruby"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-ruby text-white rounded-xl font-bold hover:bg-ruby-hover transition"
                    >
                      Save Address
                    </button>
                  </form>
                )}

                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-2xl border space-y-2 ${
                          addr.isDefault ? 'border-2 border-ruby bg-rose/30' : 'border-rose bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-espresso font-serif">
                            {addr.label || 'Delivery Address'}
                          </span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-gold text-espresso text-[10px] font-bold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-espresso">
                          {addr.firstName} {addr.lastName} • {addr.phone}
                        </p>
                        <p className="text-xs text-espresso/80">
                          {addr.streetAddress}, {addr.city}, {addr.stateOrRegion} ({addr.countryCode})
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-rose bg-ivory text-center text-xs text-espresso/70">
                    No saved delivery addresses yet. Click &ldquo;Add New Address&rdquo; to store your first shipping destination.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-lg font-serif font-bold text-espresso mb-4">Orders &amp; Shipments</h2>
                <div className="p-8 rounded-2xl border border-rose bg-ivory text-center space-y-3">
                  <p className="text-xs text-espresso/75">
                    Orders placed through checkout appear here with live multi-vendor parcel tracking (GIGL, Kwik, DHL).
                  </p>
                  <Link
                    href="/#featured-products"
                    className="inline-block px-5 py-2.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition"
                  >
                    Browse Marketplace Items
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
