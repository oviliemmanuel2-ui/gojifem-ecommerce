'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Globe2,
  Store,
  User,
  Menu,
  X,
  LogOut,
  ChevronDown,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { useMarketplace, SupportedCurrency } from '../context/MarketplaceContext';
import { urlFor } from '../sanity/lib/image';
import { handleImageError } from '../lib/imageFallback';

export function Navbar() {
  const router = useRouter();
  const {
    currency,
    setCurrency,
    totalItems,
    cartPulseKey,
    searchQuery,
    setSearchQuery,
    session,
    logout,
    siteSettings,
  } = useMarketplace();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const brandName = siteSettings?.siteName || 'GOJIFEM';
  const brandTagline = siteSettings?.tagline || 'Global Marketplace';
  const logoUrl = urlFor(siteSettings?.logo, 160);
  const announcement =
    siteSettings?.announcementBanner ||
    'Worldwide & Local Deliveries: Buy all kinds of products locally or from abroad with seamless Visa, Mastercard, and Verve payments.';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    router.push('/#featured-products');
    if (typeof window !== 'undefined') {
      const target = document.getElementById('featured-products');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.push('/auth/login');
  };

  const displayName = session?.user?.firstName
    ? session.user.firstName
    : session?.user?.email?.split('@')[0];

  const isVendor = Boolean(
    session?.user?.roles?.some((r) => r === 'VENDOR_OWNER' || r === 'VENDOR_STAFF'),
  );
  const isAdmin = Boolean(
    session?.user?.roles?.some((r) => r === 'ADMIN' || r === 'MODERATOR'),
  );

  return (
    <>
      {/* Top Banner */}
      <div className="bg-espresso text-ivory text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-espresso-muted">
        <Globe2 className="w-3.5 h-3.5 text-gold shrink-0" />
        <span>{announcement}</span>
      </div>

      {/* Main Navbar */}
      <header className="border-b border-rose/60 bg-ivory/95 backdrop-blur-md sticky top-0 z-[30] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo with Shopping Cart next to GOJIFEM */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteSettings?.logo?.alt || brandName}
                onError={handleImageError}
                className="w-10 h-10 rounded-xl object-cover shadow-md ring-2 ring-gold/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-ruby flex items-center justify-center text-white font-extrabold text-xl shadow-md ring-2 ring-gold/40 group-hover:bg-ruby-hover transition">
                {brandName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-espresso font-serif">
                  {brandName}
                </span>
                <ShoppingCart className="w-5 h-5 text-ruby" />
              </div>
              <span className="text-[10px] block font-bold text-gold uppercase tracking-wider -mt-0.5">
                {brandTagline}
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-lg relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all items: electronics, fashion, groceries, home, books..."
              aria-label="Search marketplace items"
              className="w-full pl-10 pr-20 py-2 border border-rose rounded-full text-xs text-espresso placeholder-espresso/50 focus:outline-none focus:ring-2 focus:ring-ruby focus:border-ruby bg-white/80 transition"
            />
            <Search className="w-4 h-4 text-gold absolute left-3.5 top-2.5 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1.5 top-1 bottom-1 px-3 rounded-full bg-ruby text-white text-[11px] font-bold hover:bg-ruby-hover transition"
            >
              Search
            </button>
          </form>

          {/* Right Action Items */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Currency Selector */}
            <div className="flex items-center border border-rose/80 rounded-lg px-2 py-1.5 bg-rose/40 text-xs font-semibold text-espresso hover:bg-rose/60 transition">
              <span className="text-espresso/60 mr-1.5 hidden lg:inline">Currency:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                aria-label="Select currency"
                className="bg-transparent focus:outline-none cursor-pointer font-bold text-espresso"
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            {/* Journal / Blog Link */}
            <Link
              href="/blog"
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-espresso hover:text-ruby transition px-2 py-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-ruby" />
              <span>Journal</span>
            </Link>

            {/* Contact Us Link */}
            <Link
              href="/contact"
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-espresso hover:text-ruby transition px-2 py-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-ruby" />
              <span>Support</span>
            </Link>

            {/* Vendor Onboarding Link */}
            <Link
              href="/vendor/apply"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-espresso hover:text-ruby border border-rose rounded-lg px-3 py-1.5 hover:border-ruby/40 hover:bg-rose/30 transition"
            >
              <Store className="w-4 h-4 text-ruby" />
              <span>Sell on {brandName}</span>
            </Link>

            {/* Authenticated User Dropdown or Sign In Link */}
            {session ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 text-xs font-bold text-espresso hover:text-ruby border border-rose rounded-lg px-3 py-1.5 bg-white transition"
                >
                  <User className="w-3.5 h-3.5 text-ruby" />
                  <span className="max-w-[100px] truncate">{displayName || 'Account'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-espresso/60" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-rose rounded-2xl shadow-lg py-2 z-[40] text-xs">
                    <div className="px-3.5 py-2 border-b border-rose/60 text-[11px] text-espresso/70 truncate">
                      {session.user.email}
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-3.5 py-2 font-semibold text-espresso hover:bg-rose/30 hover:text-ruby transition"
                    >
                      My Account &amp; Orders
                    </Link>
                    {isVendor && (
                      <>
                        <Link
                          href="/vendor/apply"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-3.5 py-2 font-semibold text-espresso hover:bg-rose/30 hover:text-ruby transition"
                        >
                          Merchant Onboarding
                        </Link>
                        <Link
                          href="/vendor/products"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-3.5 py-2 font-semibold text-espresso hover:bg-rose/30 hover:text-ruby transition"
                        >
                          Vendor Portal
                        </Link>
                      </>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin/vendors"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-3.5 py-2 font-semibold text-ruby hover:bg-rose/30 transition"
                      >
                        Admin Verification Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3.5 py-2 font-semibold text-ruby hover:bg-rose/30 transition flex items-center gap-1.5 border-t border-rose/60 mt-1 pt-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-espresso hover:text-ruby p-2 transition"
                title="Sign In / Register"
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">Sign In</span>
              </Link>
            )}

            {/* Shopping Cart Button */}
            <Link
              href="/cart"
              aria-label={`Shopping cart with ${totalItems} item${totalItems === 1 ? '' : 's'}`}
              className="flex items-center gap-2 bg-ruby text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-ruby-hover transition shadow-sm"
            >
              <span
                key={`icon-${cartPulseKey}`}
                className={cartPulseKey > 0 ? 'animate-cart-bump inline-flex' : 'inline-flex'}
              >
                <ShoppingBag className="w-4 h-4" />
              </span>
              <span className="hidden sm:inline">Cart</span>
              <span
                key={`badge-${cartPulseKey}`}
                className={`bg-gold text-espresso rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  cartPulseKey > 0 ? 'animate-cart-bump' : ''
                }`}
              >
                {totalItems}
              </span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden p-2 rounded-lg border border-rose text-espresso hover:bg-rose/30 transition"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden relative z-[40] border-t border-rose/60 bg-ivory px-4 py-4 space-y-3 shadow-md">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, categories, vendors..."
                className="w-full pl-9 pr-16 py-2 border border-rose rounded-xl text-xs bg-white text-espresso focus:outline-none focus:ring-2 focus:ring-ruby"
              />
              <Search className="w-4 h-4 text-gold absolute left-3 top-2.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 top-1 bottom-1 px-2.5 rounded-lg bg-ruby text-white text-[11px] font-bold"
              >
                Go
              </button>
            </form>

            <div className="grid grid-cols-1 gap-2 text-xs font-semibold">
              <Link
                href="/#featured-products"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl bg-white border border-rose text-espresso hover:text-ruby"
              >
                Browse Marketplace
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl bg-white border border-rose text-espresso hover:text-ruby"
              >
                Journal &amp; Articles
              </Link>
              <Link
                href="/vendor/apply"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl bg-white border border-rose text-espresso hover:text-ruby"
              >
                Sell on {brandName}
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl bg-white border border-rose text-espresso hover:text-ruby"
              >
                Contact Support
              </Link>

              {session ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl bg-white border border-rose text-espresso hover:text-ruby"
                  >
                    My Account ({displayName})
                  </Link>
                  {isVendor && (
                    <>
                      <Link
                        href="/vendor/apply"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-3 py-2 rounded-xl bg-white border border-rose text-espresso hover:text-ruby"
                      >
                        Merchant Onboarding
                      </Link>
                      <Link
                        href="/vendor/products"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-3 py-2 rounded-xl bg-white border border-rose text-espresso hover:text-ruby"
                      >
                        Vendor Portal
                      </Link>
                    </>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin/vendors"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl bg-rose/40 border border-ruby/30 text-ruby"
                    >
                      Admin Verification Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-xl bg-rose/40 border border-ruby/30 text-ruby text-left font-bold flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl bg-ruby text-white text-center font-bold"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl bg-white border border-rose text-espresso text-center font-bold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
