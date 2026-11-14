'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  CheckCircle2, 
  ArrowRight,
  Store,
  Globe2,
  Lock
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { useMarketplace } from '../../context/MarketplaceContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartByVendor, cartSubtotalNGN, formatPrice, clearCart } = useMarketplace();

  // Contact & Shipping Address
  const [firstName, setFirstName] = useState('Chidi');
  const [lastName, setLastName] = useState('Okafor');
  const [email, setEmail] = useState('chidi.okafor@example.com');
  const [phone, setPhone] = useState('+234 801 234 5678');
  
  const [shippingCountry, setShippingCountry] = useState('NG');
  const [stateRegion, setStateRegion] = useState('Lagos');
  const [city, setCity] = useState('Lekki Phase 1');
  const [streetAddress, setStreetAddress] = useState('15 Admiralty Way');

  // Customer Cardholder Billing Country (Decoupled from shipping destination)
  const [billingCountry, setBillingCountry] = useState('US');

  // Payment Channel Selection
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [processing, setProcessing] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
          <h1 className="text-xl font-bold text-slate-900">No items in checkout</h1>
          <p className="text-xs text-slate-500 mt-2">Add items to your cart before proceeding to checkout.</p>
          <Link
            href="/"
            className="mt-6 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
          >
            Return to Marketplace
          </Link>
        </main>
      </div>
    );
  }

  // Delivery fee per vendor package
  const shippingFeePerVendor = shippingCountry === 'NG' ? (stateRegion === 'Lagos' ? 250000 : 450000) : 3500000;
  const vendorCount = Object.keys(cartByVendor).length;
  const totalShippingFeeNGN = shippingFeePerVendor * vendorCount;
  const grandTotalNGN = cartSubtotalNGN + totalShippingFeeNGN;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // In production, this calls POST /api/v1/checkout/quote then /api/v1/checkout/session
    // Returns Paystack authorizationUrl / checkout modal
    await new Promise((r) => setTimeout(r, 900));

    setProcessing(false);
    clearCart();
    router.push('/checkout/confirmation?orderNumber=GOJI-2026-849201');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Breadcrumb / Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Secure Checkout</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Split multi-vendor fulfillment with guaranteed buyer escrow protection
          </p>
        </div>

        <form onSubmit={handlePay} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact, Shipping & Payment Information */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Recipient Contact & Delivery Address */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-extrabold text-slate-900">1. Delivery Destination</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Recipient First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-xs border rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Recipient Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full text-xs border rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Recipient Contact Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs border rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Recipient Phone (Delivery Dispatch)</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs border rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Destination Country</label>
                  <select
                    value={shippingCountry}
                    onChange={(e) => setShippingCountry(e.target.value)}
                    className="w-full text-xs border rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="NG">Nigeria (All 36 States + FCT)</option>
                    <option value="GH">Ghana (Accra & Kumasi)</option>
                    <option value="GB">United Kingdom</option>
                    <option value="US">United States</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">State / Region</label>
                  {shippingCountry === 'NG' ? (
                    <select
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      className="w-full text-xs border rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Lagos">Lagos State</option>
                      <option value="Abuja">Abuja FCT</option>
                      <option value="Rivers">Rivers State</option>
                      <option value="Oyo">Oyo State</option>
                      <option value="Kano">Kano State</option>
                      <option value="Enugu">Enugu State</option>
                      <option value="Other">All Other States</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="e.g. Greater London"
                      className="w-full text-xs border rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">City / Area</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lekki Phase 1"
                    className="w-full text-xs border rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Street Address</label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Street name, house/building number, apartment"
                  className="w-full text-xs border rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Serviceability Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Serviceable Address:</strong> Doorstep courier delivery supported with real-time tracking code sent via SMS/Email.
                </span>
              </div>
            </div>

            {/* 2. Decoupled Cardholder Billing Country */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Globe2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  2. Cardholder Billing Country (Diaspora Support)
                </h2>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Paying from outside Nigeria? Select the country where your payment card was issued. You can pay with your foreign Visa, Mastercard, or Amex while shipping to recipients anywhere in Nigeria.
              </p>

              <div className="max-w-md">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Card Issuing Country</label>
                <select
                  value={billingCountry}
                  onChange={(e) => setBillingCountry(e.target.value)}
                  className="w-full text-xs border rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="US">United States (USD Card)</option>
                  <option value="GB">United Kingdom (GBP Card)</option>
                  <option value="CA">Canada (CAD Card)</option>
                  <option value="NG">Nigeria (NGN Local Card / Transfer)</option>
                  <option value="EU">European Union (EUR Card)</option>
                  <option value="OTHER">Other International Country</option>
                </select>
              </div>

              {billingCountry !== 'NG' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Your foreign card will be charged the equivalent in Nigerian Naira via Paystack 3DS secure gateway. Your card issuer will handle the currency conversion automatically.
                  </span>
                </div>
              )}
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-extrabold text-slate-900">3. Payment Channel</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                    paymentMethod === 'card'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <strong className="text-xs font-extrabold text-slate-900 block">
                      Debit / Credit Card
                    </strong>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Local Visa, Mastercard, Verve & International Cards
                    </span>
                  </div>
                  <Lock className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <strong className="text-xs font-extrabold text-slate-900 block">
                      Direct Nigerian Bank Transfer
                    </strong>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Instant Paystack virtual NUBAN transfer
                    </span>
                  </div>
                  <Lock className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Split Vendor Packages & Order Summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="font-extrabold text-slate-900 text-base">Shipment Packages ({vendorCount})</h2>

              {/* Vendor Packages Breakdown */}
              <div className="space-y-3">
                {Object.entries(cartByVendor).map(([vId, vGroup]) => (
                  <div key={vId} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate max-w-[170px]">{vGroup.vendorName}</span>
                      </span>
                      <span>{formatPrice(vGroup.subtotalNGN)}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>{vGroup.items.length} item{vGroup.items.length > 1 ? 's' : ''}</span>
                      <span>Courier Dispatch: <strong>{formatPrice(shippingFeePerVendor)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-slate-900">{formatPrice(cartSubtotalNGN)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Delivery ({vendorCount} package{vendorCount > 1 ? 's' : ''})</span>
                  <span className="font-bold text-slate-900">{formatPrice(totalShippingFeeNGN)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm">Total Due</span>
                    <span className="block text-[10px] text-slate-400">Charged in NGN via Paystack</span>
                  </div>
                  <span className="text-xl font-extrabold text-emerald-700">
                    {formatPrice(grandTotalNGN)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3.5 px-4 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 mt-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{processing ? 'Connecting Gateway...' : `Authorize Payment (${formatPrice(grandTotalNGN)})`}</span>
              </button>
            </div>

            {/* Escrow Guarantee */}
            <div className="bg-emerald-950 text-emerald-100 rounded-3xl p-5 text-xs space-y-2 border border-emerald-900">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Buyer Protection Guarantee</span>
              </div>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                Your payment remains securely in GOJIFEM escrow. Vendors are only paid after parcels arrive at your recipient address.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
