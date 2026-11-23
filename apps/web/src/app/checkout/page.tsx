'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  CreditCard, 
  MapPin, 
  CheckCircle2, 
  Store,
  Globe2,
  Lock
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { CheckoutProgressSteps } from '../../components/ui/CheckoutProgressSteps';
import { CheckoutSkeleton } from '../../components/ui/Skeleton';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorRetryBanner } from '../../components/ui/ErrorRetryBanner';
import { useMarketplace } from '../../context/MarketplaceContext';
import { apiFetch } from '../../lib/api';
import { CHECKOUT_AUTH_MESSAGE, savePostAuthRedirect } from '../../lib/authRedirect';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    cartByVendor,
    cartSubtotalNGN,
    currency,
    formatPrice,
    session,
    sessionReady,
    setSession,
    showToast,
  } = useMarketplace();

  // Contact & Shipping Address
  const [firstName, setFirstName] = useState(session?.user?.firstName || '');
  const [lastName, setLastName] = useState(session?.user?.lastName || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [phone, setPhone] = useState(session?.user?.phone || '');
  
  const [shippingCountry, setShippingCountry] = useState('NG');
  const [stateRegion, setStateRegion] = useState('Lagos');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  // Customer Cardholder Billing Country (Decoupled from shipping destination)
  const [billingCountry, setBillingCountry] = useState('US');

  // Payment Gateway & Channel Selection
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [provider, setProvider] = useState<'PAYSTACK' | 'FLUTTERWAVE'>('PAYSTACK');
  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!sessionReady) return;
    if (!session?.accessToken) {
      savePostAuthRedirect('/checkout');
      showToast(CHECKOUT_AUTH_MESSAGE, 'info');
      router.replace('/auth/login?redirect=/checkout&reason=checkout');
      return;
    }
    if (session?.user) {
      setFirstName((prev) => prev || session.user.firstName || '');
      setLastName((prev) => prev || session.user.lastName || '');
      setEmail((prev) => prev || session.user.email || '');
      setPhone((prev) => prev || session.user.phone || '');
    }
  }, [session, sessionReady, router, showToast]);

  if (!sessionReady) {
    return <CheckoutSkeleton message="Preparing your checkout..." />;
  }

  if (!session?.accessToken) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory text-espresso">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-24 text-center flex-1 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose text-ruby flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-serif font-bold text-espresso">
            Authentication Required for Checkout
          </h1>
          <p className="text-xs text-espresso/75 leading-relaxed">
            {CHECKOUT_AUTH_MESSAGE}
          </p>
          <Link
            href="/auth/login?redirect=/checkout&reason=checkout"
            className="mt-2 px-6 py-2.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition shadow-sm"
          >
            Sign In or Create Account
          </Link>
        </main>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory text-espresso">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
          <h1 className="text-xl font-serif font-bold text-espresso">No items in checkout</h1>
          <p className="text-xs text-espresso/70 mt-2">Add items to your shopping bag before proceeding to checkout.</p>
          <Link
            href="/"
            className="mt-6 px-6 py-2.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition shadow-sm"
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

  const handlePay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submittingRef.current) return;

    if (!session?.accessToken) {
      savePostAuthRedirect('/checkout');
      showToast(CHECKOUT_AUTH_MESSAGE, 'info');
      router.replace('/auth/login?redirect=/checkout&reason=checkout');
      return;
    }

    submittingRef.current = true;
    setProcessing(true);
    setCheckoutError(null);

    try {
      const paymentInit = await apiFetch<{
        orderNumber: string;
        authorizationUrl?: string;
        reference?: string;
      }>('/checkout/session', {
        method: 'POST',
        timeoutMs: 20000,
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            title: item.title,
            variantTitle: item.variantTitle,
            priceMinorNGN: item.priceMinorNGN,
            quantity: item.quantity,
            vendorId: item.vendorId,
          })),
          shippingAddress: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            countryCode: shippingCountry,
            stateOrRegion: stateRegion,
            city: city.trim(),
            streetAddress: streetAddress.trim(),
          },
          billingCountryCode: billingCountry,
          paymentMethod,
          currency: currency === 'NGN' ? 'NGN' : provider === 'FLUTTERWAVE' ? currency : 'NGN',
          provider,
        }),
      });

      const authUrl = paymentInit?.authorizationUrl;
      const isValidProviderRedirect =
        Boolean(authUrl) &&
        typeof authUrl === 'string' &&
        /^https?:\/\//i.test(authUrl) &&
        !authUrl.includes('sandbox.paystack.co') &&
        !authUrl.includes('checkout.flutterwave.com/v3/hosted/pay/mock');

      if (!isValidProviderRedirect || !authUrl) {
        throw new Error(
          'Payment provider did not return a valid checkout URL. Your card was not charged and your cart remains saved.',
        );
      }

      // Redirect to the live payment provider; cart is only cleared once /checkout/confirmation verifies payment success.
      window.location.href = authUrl;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to initialize checkout payment. Please review your details and try again.';
      if (message.toLowerCase().includes('sign in') || message.toLowerCase().includes('unauthorized')) {
        setSession(null);
        savePostAuthRedirect('/checkout');
        showToast(CHECKOUT_AUTH_MESSAGE, 'info');
        router.replace('/auth/login?redirect=/checkout&reason=checkout');
        return;
      }
      setCheckoutError(message);
      showToast(message, 'error');
      submittingRef.current = false;
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <CheckoutProgressSteps currentStep={2} className="mb-6" />

        {/* Breadcrumb / Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">Secure Checkout</h1>
          <p className="text-xs sm:text-sm text-espresso/70 mt-1">
            Split multi-vendor fulfillment with guaranteed buyer escrow protection
          </p>
        </div>

        <form onSubmit={handlePay} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact, Shipping & Payment Information */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Recipient Contact & Delivery Address */}
            <div className="bg-white rounded-3xl border border-rose p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-rose">
                <MapPin className="w-5 h-5 text-ruby" />
                <h2 className="text-base font-serif font-bold text-espresso">1. Delivery Destination</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">Recipient First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby text-espresso"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">Recipient Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby text-espresso"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">Recipient Contact Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby text-espresso"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">Recipient Phone (Delivery Dispatch)</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby text-espresso"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">Destination Country</label>
                  <select
                    value={shippingCountry}
                    onChange={(e) => setShippingCountry(e.target.value)}
                    className="w-full text-xs border border-rose rounded-xl px-3 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby text-espresso"
                  >
                    <option value="NG">Nigeria (All 36 States + FCT)</option>
                    <option value="GH">Ghana (Accra & Kumasi)</option>
                    <option value="GB">United Kingdom</option>
                    <option value="US">United States</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">State / Region</label>
                  {shippingCountry === 'NG' ? (
                    <select
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      className="w-full text-xs border border-rose rounded-xl px-3 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby text-espresso"
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
                      className="w-full text-xs border border-rose rounded-xl px-3 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby text-espresso"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">City / Area</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lekki Phase 1"
                    className="w-full text-xs border border-rose rounded-xl px-3 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby text-espresso"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Street Address</label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Street name, house/building number, apartment"
                  className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby text-espresso"
                />
              </div>

              {/* Serviceability Banner */}
              <div className="p-3 bg-rose/50 border border-gold/40 rounded-xl flex items-center gap-2 text-xs text-espresso">
                <CheckCircle2 className="w-4 h-4 text-ruby shrink-0" />
                <span>
                  <strong>Serviceable Address:</strong> Doorstep courier delivery supported with real-time tracking code sent via SMS/Email.
                </span>
              </div>
            </div>

            {/* 2. Decoupled Cardholder Billing Country */}
            <div className="bg-white rounded-3xl border border-rose p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-rose">
                <Globe2 className="w-5 h-5 text-gold" />
                <h2 className="text-base font-serif font-bold text-espresso">
                  2. Cardholder Billing Country (Diaspora Support)
                </h2>
              </div>

              <p className="text-xs text-espresso/80 leading-relaxed">
                Paying from outside Nigeria? Select the country where your payment card was issued. You can pay with your foreign Visa, Mastercard, or Amex while shipping to recipients anywhere in Nigeria.
              </p>

              <div className="max-w-md">
                <label className="block text-xs font-bold text-espresso mb-1.5">Card Issuing Country</label>
                <select
                  value={billingCountry}
                  onChange={(e) => setBillingCountry(e.target.value)}
                  className="w-full text-xs border border-rose rounded-xl px-3 py-2.5 bg-ivory focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby font-semibold text-espresso"
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
                <div className="p-3 bg-rose/40 border border-gold/40 rounded-xl text-xs text-espresso flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-ruby shrink-0 mt-0.5" />
                  <span>
                    Your foreign card will be charged the equivalent in Nigerian Naira via Paystack 3DS secure gateway. Your card issuer will handle the currency conversion automatically.
                  </span>
                </div>
              )}
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white rounded-3xl border border-rose p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-rose">
                <CreditCard className="w-5 h-5 text-ruby" />
                <h2 className="text-base font-serif font-bold text-espresso">3. Payment Channel</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                    paymentMethod === 'card'
                      ? 'border-ruby bg-rose/40 ring-2 ring-ruby/20'
                      : 'border-rose hover:border-ruby/40 bg-ivory'
                  }`}
                >
                  <div>
                    <strong className="text-xs font-bold text-espresso block">
                      Debit / Credit Card
                    </strong>
                    <span className="text-[11px] text-espresso/70 mt-1 block">
                      Local Visa, Mastercard, Verve & International Cards
                    </span>
                  </div>
                  <Lock className="w-4 h-4 text-ruby" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('bank_transfer');
                    setProvider('PAYSTACK');
                  }}
                  className={`p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-ruby bg-rose/40 ring-2 ring-ruby/20'
                      : 'border-rose hover:border-ruby/40 bg-ivory'
                  }`}
                >
                  <div>
                    <strong className="text-xs font-bold text-espresso block">
                      Direct Nigerian Bank Transfer
                    </strong>
                    <span className="text-[11px] text-espresso/70 mt-1 block">
                      Instant Paystack virtual NUBAN transfer
                    </span>
                  </div>
                  <Lock className="w-4 h-4 text-ruby" />
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-espresso mb-1.5">
                    Select Payment Gateway
                  </label>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setProvider('PAYSTACK')}
                      className={`py-2.5 px-3 rounded-xl border font-bold transition ${
                        provider === 'PAYSTACK'
                          ? 'border-ruby bg-white text-ruby ring-2 ring-ruby/20'
                          : 'border-rose bg-ivory text-espresso'
                      }`}
                    >
                      Paystack (NGN &amp; 3DS Cards)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProvider('FLUTTERWAVE')}
                      className={`py-2.5 px-3 rounded-xl border font-bold transition ${
                        provider === 'FLUTTERWAVE'
                          ? 'border-ruby bg-white text-ruby ring-2 ring-ruby/20'
                          : 'border-rose bg-ivory text-espresso'
                      }`}
                    >
                      Flutterwave (NGN / USD / GBP / EUR)
                    </button>
                  </div>
                </div>
              )}

              {checkoutError && (
                <ErrorRetryBanner
                  title="Unable to initialize payment"
                  message={checkoutError}
                  onRetry={() => handlePay()}
                  retryLabel="Retry Payment"
                  retrying={processing}
                />
              )}
            </div>
          </div>

          {/* Right Column: Split Vendor Packages & Order Summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-rose p-6 shadow-sm space-y-4">
              <h2 className="font-serif font-bold text-espresso text-base">Shipment Packages ({vendorCount})</h2>

              {/* Vendor Packages Breakdown */}
              <div className="space-y-3">
                {Object.entries(cartByVendor).map(([vId, vGroup]) => (
                  <div key={vId} className="p-3 bg-rose/30 rounded-2xl border border-rose text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-espresso">
                      <span className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-ruby" />
                        <span className="truncate max-w-[170px]">{vGroup.vendorName}</span>
                      </span>
                      <span>{formatPrice(vGroup.subtotalNGN)}</span>
                    </div>

                    <div className="text-[11px] text-espresso/70 flex justify-between">
                      <span>{vGroup.items.length} item{vGroup.items.length > 1 ? 's' : ''}</span>
                      <span>Courier Dispatch: <strong>{formatPrice(shippingFeePerVendor)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-3 border-t border-rose space-y-2 text-xs text-espresso/80">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-espresso">{formatPrice(cartSubtotalNGN)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Delivery ({vendorCount} package{vendorCount > 1 ? 's' : ''})</span>
                  <span className="font-bold text-espresso">{formatPrice(totalShippingFeeNGN)}</span>
                </div>
                <div className="pt-2 border-t border-rose flex justify-between items-baseline">
                  <div>
                    <span className="font-serif font-bold text-espresso text-sm">Total Due</span>
                    <span className="block text-[10px] text-espresso/50">Charged in NGN via Paystack</span>
                  </div>
                  <span className="text-xl font-serif font-bold text-espresso">
                    {formatPrice(grandTotalNGN)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3.5 px-4 bg-ruby text-white rounded-xl font-bold text-xs hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-lg shadow-ruby/20 disabled:opacity-60 mt-2"
              >
                {processing ? (
                  <>
                    <Spinner size="xs" tone="ivory" label="Processing payment..." />
                    <span>
                      Processing payment with {provider === 'FLUTTERWAVE' ? 'Flutterwave' : 'Paystack'}...
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{`Authorize Payment (${formatPrice(grandTotalNGN)})`}</span>
                  </>
                )}
              </button>

              {processing && (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-[11px] text-center text-espresso/75 font-semibold bg-rose/30 border border-rose rounded-xl p-2.5"
                >
                  Connecting to payment provider... Please do not refresh or close this page.
                </p>
              )}
            </div>

            {/* Escrow Guarantee */}
            <div className="bg-espresso text-ivory rounded-3xl p-5 text-xs space-y-2 border border-gold/30">
              <div className="flex items-center gap-1.5 font-bold text-gold">
                <ShieldCheck className="w-4 h-4" />
                <span>Buyer Protection Guarantee</span>
              </div>
              <p className="text-[11px] text-ivory/80 leading-relaxed">
                Your payment remains securely in GOJIFEM escrow. Vendors are only paid after parcels arrive at your recipient address.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
