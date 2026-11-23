'use client';

import React, { useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Globe2,
  Truck,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ProductCard } from './ProductCard';
import { DeliveryChecker } from './DeliveryChecker';
import { ProgressiveImage } from './ui/ProgressiveImage';
import { Spinner } from './ui/Spinner';
import { SAMPLE_PRODUCTS, type ProductData } from '../data/sampleProducts';
import { useMarketplace } from '../context/MarketplaceContext';
import { urlFor } from '../sanity/lib/image';
import type {
  SanityBlogPost,
  SanityHomePageData,
  SanitySiteSettings,
} from '../sanity/lib/fetch';

interface CategoryItem {
  name: string;
  countLabel: string;
  iconEmoji: string;
  imageUrl?: string | null;
  matchKeywords: string[];
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { name: 'Fashion & Apparel', countLabel: '1,420+ Items', iconEmoji: '👗', matchKeywords: ['fashion', 'apparel'] },
  { name: 'Electronics & Gadgets', countLabel: '980+ Items', iconEmoji: '📱', matchKeywords: ['electronics', 'gadgets'] },
  { name: 'Nigerian Groceries & Foods', countLabel: '650+ Items', iconEmoji: '🍲', matchKeywords: ['groceries', 'foods'] },
  { name: 'Home, Kitchen & Living', countLabel: '820+ Items', iconEmoji: '🏡', matchKeywords: ['home', 'kitchen', 'living'] },
  { name: 'Health, Beauty & Personal Care', countLabel: '740+ Items', iconEmoji: '✨', matchKeywords: ['health', 'beauty', 'wellness'] },
  { name: 'Arts, Crafts & Collectibles', countLabel: '410+ Items', iconEmoji: '🎨', matchKeywords: ['arts', 'crafts', 'collectibles'] },
  { name: 'Automotive & Hardware', countLabel: '530+ Items', iconEmoji: '🚗', matchKeywords: ['automotive', 'hardware', 'tools'] },
  { name: 'Books, Media & Stationery', countLabel: '390+ Items', iconEmoji: '📚', matchKeywords: ['books', 'media', 'stationery'] },
];

const DEFAULT_VALUE_PROPS = [
  {
    icon: 'card' as const,
    title: 'International & Local Cards',
    description:
      'Pay securely with Visa, Mastercard, Verve, or direct bank transfer via Paystack or Flutterwave with multi-currency support.',
  },
  {
    icon: 'truck' as const,
    title: 'Worldwide & Local Delivery',
    description:
      'Doorstep shipping across all 36 Nigerian states and international express shipping worldwide.',
  },
  {
    icon: 'shield' as const,
    title: 'Verified Vendor Escrow',
    description:
      'Sellers are strictly verified. Funds are held safely in escrow until you receive and inspect your items.',
  },
];

const DEFAULT_PAYMENTS_BULLETS = [
  'Pay with Visa, Mastercard, American Express, Verve, or direct bank transfer',
  'Checkout transparently calculates courier dispatch by recipient state or international corridor',
  'Real-time parcel tracking provided to both buyer and recipient',
  'Escrow protection: vendor payment released only after successful delivery inspection',
];

const DEFAULT_CHECKOUT_STEPS = [
  {
    title: 'Add all kinds of items to one cart',
    description:
      'Combine products from multiple verified electronics, fashion, groceries, or home goods sellers in a single checkout.',
  },
  {
    title: 'Enter Delivery Destination',
    description:
      'Our system validates the delivery address against our active serviceable zones (nationwide Nigeria + international corridors).',
  },
  {
    title: 'Pay Securely with any Card',
    description:
      'Paystack & Flutterwave 3DS gateways process local and foreign bank cards seamlessly with instant order confirmation.',
  },
];

interface HomeClientProps {
  homeData?: SanityHomePageData | null;
  cmsProducts?: ProductData[];
  latestPosts?: SanityBlogPost[];
  siteSettings?: SanitySiteSettings | null;
}

export function HomeClient({
  homeData = null,
  cmsProducts = [],
  latestPosts = [],
  siteSettings = null,
}: HomeClientProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
  } = useMarketplace();
  const [isFiltering, startFilterTransition] = useTransition();

  const activeProducts = cmsProducts.length > 0 ? cmsProducts : SAMPLE_PRODUCTS;

  const categories: CategoryItem[] =
    homeData?.categories && homeData.categories.length > 0
      ? homeData.categories.map((cat) => ({
          name: cat.name,
          countLabel: cat.countLabel || 'Available',
          iconEmoji: cat.iconEmoji || '🛍️',
          imageUrl: urlFor(cat.image, 400),
          matchKeywords:
            cat.matchKeywords && cat.matchKeywords.length > 0
              ? cat.matchKeywords
              : cat.name
                  .toLowerCase()
                  .split(/[\s,&]+/)
                  .filter((w) => w.length > 2),
        }))
      : DEFAULT_CATEGORIES;

  const valueProps =
    homeData?.valueProps && homeData.valueProps.length > 0
      ? homeData.valueProps
      : DEFAULT_VALUE_PROPS;

  const paymentsBullets =
    homeData?.paymentsBullets && homeData.paymentsBullets.length > 0
      ? homeData.paymentsBullets
      : DEFAULT_PAYMENTS_BULLETS;

  const checkoutSteps =
    homeData?.checkoutSteps && homeData.checkoutSteps.length > 0
      ? homeData.checkoutSteps
      : DEFAULT_CHECKOUT_STEPS;

  const heroBannerUrl = urlFor(homeData?.heroBannerImage, 1400);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const activeCat = categories.find((c) => c.name === selectedCategory);

    return activeProducts.filter((product) => {
      const catMatches =
        !selectedCategory ||
        product.category.toLowerCase() === selectedCategory.toLowerCase() ||
        Boolean(
          activeCat?.matchKeywords.some((kw) =>
            product.category.toLowerCase().includes(kw.toLowerCase()),
          ),
        );

      const queryMatches =
        !query ||
        product.title.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.vendorName.toLowerCase().includes(query) ||
        product.vendorLocation.toLowerCase().includes(query);

      return catMatches && queryMatches;
    });
  }, [activeProducts, categories, searchQuery, selectedCategory]);

  const handleCategoryClick = (categoryName: string) => {
    startFilterTransition(() => {
      if (selectedCategory === categoryName) {
        setSelectedCategory(null);
        return;
      }
      setSelectedCategory(categoryName);
    });
    if (selectedCategory !== categoryName && typeof window !== 'undefined') {
      const el = document.getElementById('featured-products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-ivory text-espresso">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-rose/50 via-ivory to-ivory py-16 sm:py-20 border-b border-rose/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gold text-espresso text-xs px-3.5 py-1.5 rounded-full font-bold shadow-sm mb-6">
            <ShieldCheck className="w-4 h-4 text-espresso" />
            <span>
              {homeData?.heroBadge ||
                'GLOBAL & LOCAL MULTI-VENDOR MARKETPLACE • 100% ESCROW PROTECTION'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-espresso tracking-tight max-w-4xl mx-auto leading-tight">
            {homeData?.heroTitle || 'The Multi-Vendor Marketplace for'}{' '}
            <span className="text-ruby">{homeData?.heroHighlight || 'All Kinds of Items'}</span>{' '}
            {homeData?.heroTitleSuffix || 'Locally & Worldwide.'}
          </h1>

          <p className="mt-6 text-base sm:text-lg text-espresso/80 max-w-2xl mx-auto leading-relaxed">
            {homeData?.heroSubtitle ||
              'Shop electronics, fashion, groceries, home appliances, automotive accessories, books, and cultural crafts directly from approved sellers in Nigeria and international hubs.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={homeData?.heroPrimaryCtaHref || '#featured-products'}
              className="w-full sm:w-auto px-8 py-3.5 bg-ruby text-white rounded-xl font-bold hover:bg-ruby-hover transition shadow-lg shadow-ruby/20 flex items-center justify-center gap-2"
            >
              <span>{homeData?.heroPrimaryCtaLabel || 'Explore All Departments'}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={homeData?.heroSecondaryCtaHref || '#international-payments'}
              className="w-full sm:w-auto px-8 py-3.5 bg-ivory text-espresso border border-gold/70 rounded-xl font-semibold hover:bg-rose/50 transition shadow-sm"
            >
              {homeData?.heroSecondaryCtaLabel || 'How Worldwide Checkout Works'}
            </a>
          </div>

          {/* Optional CMS Hero Feature Banner */}
          {heroBannerUrl && (
            <div className="mt-10 max-w-5xl mx-auto rounded-3xl overflow-hidden border border-rose shadow-md">
              <ProgressiveImage
                src={heroBannerUrl}
                alt={homeData?.heroBannerImage?.alt || 'GOJIFEM Featured Showcase'}
                priority
                containerClassName="w-full"
                className="w-full max-h-[420px] object-cover"
              />
            </div>
          )}

          {/* Key Value Badges */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            {valueProps.map((prop, idx) => {
              const iconKey = prop.icon || (idx === 1 ? 'truck' : idx === 2 ? 'shield' : 'card');
              return (
                <div
                  key={`${prop.title}-${idx}`}
                  className="bg-white p-5 rounded-2xl border border-rose shadow-sm flex items-start gap-4"
                >
                  <div
                    className={`p-2.5 rounded-xl ${
                      iconKey === 'truck' ? 'bg-gold/30 text-espresso' : 'bg-rose text-ruby'
                    }`}
                  >
                    {iconKey === 'truck' ? (
                      <Truck className="w-6 h-6 text-espresso" />
                    ) : iconKey === 'shield' ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <CreditCard className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-espresso text-sm">{prop.title}</h3>
                    <p className="text-xs text-espresso/70 mt-1">{prop.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section id="categories" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-ruby">
            {homeData?.categoriesEyebrow || 'Endless Selection'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-espresso mt-1">
            {homeData?.categoriesHeading || 'Browse All Categories'}
          </h2>
          <p className="text-sm text-espresso/70 mt-1">
            {homeData?.categoriesSubtitle ||
              'Discover thousands of verified products from independent vendors'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                type="button"
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className={`rounded-2xl p-5 transition cursor-pointer text-center group border ${
                  isActive
                    ? 'bg-rose/40 border-ruby ring-2 ring-ruby/20 shadow-md'
                    : 'bg-white border-rose hover:border-ruby hover:shadow-md'
                }`}
              >
                {cat.imageUrl ? (
                  <ProgressiveImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    containerClassName="w-12 h-12 rounded-xl mx-auto mb-3 border border-rose"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="text-3xl mb-3 group-hover:scale-110 transition">
                    {cat.iconEmoji}
                  </div>
                )}
                <h3
                  className={`font-serif font-bold text-sm transition ${
                    isActive ? 'text-ruby' : 'text-espresso group-hover:text-ruby'
                  }`}
                >
                  {cat.name}
                </h3>
                <p className="text-xs text-espresso/60 mt-1">{cat.countLabel}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section
        id="featured-products"
        className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-t border-rose/60"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ruby uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>
                {homeData?.featuredEyebrow || 'Direct from Verified Merchants & Makers'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">
              {selectedCategory
                ? selectedCategory
                : homeData?.featuredHeading || 'Featured Marketplace Listings'}
            </h2>
            <p className="text-sm text-espresso/70 mt-1 flex items-center gap-2">
              <span>{homeData?.featuredSubtitle || 'Prices calculate live in NGN, USD, GBP, or EUR.'}</span>
              {isFiltering && <Spinner size="xs" tone="ruby" label="Updating listings..." />}
            </p>
          </div>

          {(selectedCategory || searchQuery.trim()) && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose/60 text-ruby text-xs font-bold hover:bg-rose transition"
                >
                  <span>Category: {selectedCategory}</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/40 text-espresso text-xs font-bold hover:bg-gold/60 transition"
                >
                  <span>Search: &ldquo;{searchQuery.trim()}&rdquo;</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-rose rounded-3xl p-12 text-center">
            <h3 className="text-lg font-serif font-bold text-espresso">
              No matching listings found
            </h3>
            <p className="text-xs text-espresso/70 mt-1">
              Try adjusting your search keywords or clear the selected category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('');
              }}
              className="mt-5 px-6 py-2.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition"
            >
              Show All Marketplace Items
            </button>
          </div>
        )}
      </section>

      {/* Optional Custom CMS Sections */}
      {homeData?.customSections &&
        homeData.customSections.length > 0 &&
        homeData.customSections.map((section, idx) => {
          const sectionImg = urlFor(section.image, 1000);
          const themeClass =
            section.theme === 'espresso'
              ? 'bg-espresso text-ivory'
              : section.theme === 'ivory'
                ? 'bg-ivory text-espresso border-t border-rose/60'
                : 'bg-rose/25 text-espresso border-t border-rose';
          return (
            <section key={`${section.heading}-${idx}`} className={`py-14 ${themeClass}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className={sectionImg ? 'lg:col-span-6 space-y-4' : 'lg:col-span-12 space-y-4'}>
                  {section.eyebrow && (
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        section.theme === 'espresso' ? 'text-gold' : 'text-ruby'
                      }`}
                    >
                      {section.eyebrow}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold">{section.heading}</h2>
                  {section.body && (
                    <p
                      className={`text-sm leading-relaxed ${
                        section.theme === 'espresso' ? 'text-ivory/80' : 'text-espresso/80'
                      }`}
                    >
                      {section.body}
                    </p>
                  )}
                  {section.ctaLabel && section.ctaHref && (
                    <div className="pt-2">
                      <Link
                        href={section.ctaHref}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ruby text-white text-xs font-bold hover:bg-ruby-hover transition shadow-sm"
                      >
                        <span>{section.ctaLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
                {sectionImg && (
                  <div className="lg:col-span-6">
                    <ProgressiveImage
                      src={sectionImg}
                      alt={section.image?.alt || section.heading}
                      containerClassName="w-full rounded-3xl border border-rose shadow-sm"
                      className="w-full object-cover max-h-[360px]"
                    />
                  </div>
                )}
              </div>
            </section>
          );
        })}

      {/* Delivery Checker & Serviceability Section */}
      <section className="py-12 bg-rose/20 border-y border-rose">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-1.5 text-xs text-ruby font-bold uppercase tracking-wider mb-2">
                <Truck className="w-4 h-4 text-gold" />
                <span>{homeData?.deliveryEyebrow || 'Strict Delivery Coverage Gate'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-espresso leading-snug">
                {homeData?.deliveryHeading || 'Where can GOJIFEM deliver your package?'}
              </h2>
              <p className="text-sm text-espresso/80 mt-3 leading-relaxed">
                {homeData?.deliveryDescription ||
                  'Before you pay, our system verifies whether the recipient shipping address is within our serviceable zones. You can purchase goods from abroad using international cards for delivery anywhere within Nigeria and select international destinations.'}
              </p>
            </div>
            <div className="lg:col-span-6">
              <DeliveryChecker />
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts / Journal Preview (when published in Sanity) */}
      {latestPosts.length > 0 && (
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ruby uppercase tracking-wider mb-1">
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                <span>Stories, Seller Spotlights &amp; Guides</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">
                From the GOJIFEM Journal
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-xs font-bold text-ruby hover:underline inline-flex items-center gap-1"
            >
              <span>View all articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestPosts.map((post) => {
              const postImg = urlFor(post.mainImage, 800) || post.mainImage?.asset?.url;
              return (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="bg-white border border-rose rounded-2xl overflow-hidden hover:shadow-md hover:border-ruby/40 transition flex flex-col group"
                >
                  {postImg && (
                    <div className="aspect-[16/10] overflow-hidden bg-rose/20">
                      <ProgressiveImage
                        src={postImg}
                        alt={post.mainImage?.alt || post.title}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-serif font-bold text-base text-espresso group-hover:text-ruby transition line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-espresso/75 mt-2 line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                    <div className="text-[11px] font-bold text-ruby flex items-center gap-1">
                      <span>Read article</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* International & Local Payments Explainer */}
      <section id="international-payments" className="bg-espresso text-ivory py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-gold font-bold uppercase tracking-wider mb-3">
                <Globe2 className="w-4 h-4 text-gold" />
                <span>{homeData?.paymentsEyebrow || 'Local Shoppers & Global Diaspora'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight leading-snug">
                {homeData?.paymentsHeading ||
                  'Shopping in Nigeria or sending from abroad? Pay easily in any currency.'}
              </h2>
              <p className="text-ivory/80 mt-4 text-sm sm:text-base leading-relaxed">
                {homeData?.paymentsDescription ||
                  'GOJIFEM connects verified multi-vendor merchants to customers everywhere. Whether you are in Lagos, Abuja, London, New York, Toronto, or Atlanta, you can pay using your local or foreign bank card while we handle tracked fulfillment.'}
              </p>

              <div className="mt-6 space-y-3">
                {paymentsBullets.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-ivory/90">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#2a1e1c] border border-gold/30 rounded-3xl p-6 sm:p-8">
              <h3 className="font-serif font-bold text-lg mb-4 text-ivory">How Checkout Works</h3>
              <ol className="space-y-4 text-sm text-ivory/80">
                {checkoutSteps.map((step, idx) => (
                  <li key={`${step.title}-${idx}`} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-ruby text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="text-ivory block">{step.title}</strong>
                      <span>{step.description}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-rose/80 bg-ivory py-12 text-espresso/70 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()}{' '}
            {siteSettings?.copyrightText ||
              'GOJIFEM Global Marketplace Ltd. All rights reserved.'}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/blog" className="hover:text-ruby transition">Journal</Link>
            <Link href="/privacy" className="hover:text-ruby transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ruby transition">Terms of Service</Link>
            <Link href="/vendor-agreement" className="hover:text-ruby transition">Vendor Agreement</Link>
            <Link href="/delivery-policy" className="hover:text-ruby transition">Delivery Policy</Link>
            <Link href="/contact" className="font-semibold text-ruby hover:underline transition">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
