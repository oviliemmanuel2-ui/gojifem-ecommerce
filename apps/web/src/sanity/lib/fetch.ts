import { client } from './client';
import { isSanityConfigured } from '../env';
import {
  HOME_PAGE_QUERY,
  PAGE_BY_SLUG_QUERY,
  POSTS_QUERY,
  POST_BY_SLUG_QUERY,
  PRODUCTS_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  SITE_SETTINGS_QUERY,
} from './queries';
import type { ProductData } from '../../data/sampleProducts';

export interface SanityImageObject {
  alt?: string;
  asset?: {
    _id?: string;
    url?: string;
    metadata?: {
      dimensions?: {
        width?: number;
        height?: number;
      };
    };
  };
}

export interface SanitySiteSettings {
  siteName?: string;
  tagline?: string;
  announcementBanner?: string;
  logo?: SanityImageObject;
  supportEmail?: string;
  supportPhone?: string;
  regionalHub?: string;
  copyrightText?: string;
  socialLinks?: { platform?: string; url?: string }[];
}

export interface SanityHomePageData {
  heroBadge?: string;
  heroTitle?: string;
  heroHighlight?: string;
  heroTitleSuffix?: string;
  heroSubtitle?: string;
  heroPrimaryCtaLabel?: string;
  heroPrimaryCtaHref?: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaHref?: string;
  heroBannerImage?: SanityImageObject;
  valueProps?: { title: string; description: string; icon?: 'card' | 'truck' | 'shield' }[];
  categoriesEyebrow?: string;
  categoriesHeading?: string;
  categoriesSubtitle?: string;
  categories?: {
    name: string;
    countLabel?: string;
    iconEmoji?: string;
    matchKeywords?: string[];
    image?: SanityImageObject;
  }[];
  featuredEyebrow?: string;
  featuredHeading?: string;
  featuredSubtitle?: string;
  deliveryEyebrow?: string;
  deliveryHeading?: string;
  deliveryDescription?: string;
  paymentsEyebrow?: string;
  paymentsHeading?: string;
  paymentsDescription?: string;
  paymentsBullets?: string[];
  checkoutSteps?: { title: string; description?: string }[];
  customSections?: {
    eyebrow?: string;
    heading: string;
    body?: string;
    ctaLabel?: string;
    ctaHref?: string;
    theme?: 'ivory' | 'rose' | 'espresso';
    image?: SanityImageObject;
  }[];
}

export interface SanityBlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  authorName?: string;
  authorRole?: string;
  categories?: string[];
  publishedAt?: string;
  featured?: boolean;
  mainImage?: SanityImageObject;
  body?: unknown[];
}

export interface SanityCustomPage {
  _id: string;
  title: string;
  slug: string;
  eyebrow?: string;
  summary?: string;
  updatedAt?: string;
  heroImage?: SanityImageObject;
  content?: unknown[];
}

interface RawCmsProduct {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  vendorName?: string;
  vendorLocation?: string;
  isVendorVerified?: boolean;
  priceNGN?: number;
  compareAtPriceNGN?: number;
  mainImage?: SanityImageObject;
  gallery?: SanityImageObject[];
  description?: string;
  stockCount?: number;
  rating?: number;
  reviewCount?: number;
  variants?: { _key?: string; title: string; priceNGN: number; inStock?: boolean }[];
  shippingHighlights?: string[];
}

function mapCmsProduct(raw: RawCmsProduct): ProductData {
  const baseMinor = Math.round((raw.priceNGN || 0) * 100);
  const compareMinor = raw.compareAtPriceNGN
    ? Math.round(raw.compareAtPriceNGN * 100)
    : undefined;
  const mainUrl = raw.mainImage?.asset?.url || '';
  const galleryUrls = (raw.gallery || [])
    .map((g) => g.asset?.url)
    .filter((u): u is string => Boolean(u));
  const allGallery = [mainUrl, ...galleryUrls].filter(Boolean);

  const variants =
    raw.variants && raw.variants.length > 0
      ? raw.variants.map((v, idx) => ({
          id: v._key || `cms_var_${raw._id}_${idx}`,
          title: v.title,
          priceMinorNGN: Math.round((v.priceNGN || raw.priceNGN || 0) * 100),
          inStock: v.inStock ?? true,
        }))
      : [
          {
            id: `cms_var_${raw._id}_default`,
            title: 'Standard Option',
            priceMinorNGN: baseMinor,
            inStock: (raw.stockCount ?? 1) > 0,
          },
        ];

  const vendorSlug = (raw.vendorName || 'gojifem-vendor')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    id: raw._id,
    slug: raw.slug,
    title: raw.title,
    category: raw.category || 'Marketplace',
    vendorId: `cms_vendor_${vendorSlug}`,
    vendorName: raw.vendorName || 'Verified GOJIFEM Merchant',
    vendorSlug,
    vendorLocation: raw.vendorLocation || 'Nigeria',
    isVendorVerified: raw.isVendorVerified ?? true,
    priceMinorNGN: baseMinor,
    compareAtPriceMinorNGN: compareMinor,
    imageUrl: mainUrl,
    galleryImages: allGallery,
    description: raw.description || '',
    stockCount: raw.stockCount ?? 10,
    rating: raw.rating ?? 4.9,
    reviewCount: raw.reviewCount ?? 1,
    variants,
    shippingHighlights:
      raw.shippingHighlights && raw.shippingHighlights.length > 0
        ? raw.shippingHighlights
        : ['Tracked courier delivery available across Nigeria & worldwide'],
  };
}

async function safeSanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  tags: string[] = ['sanity'],
): Promise<T | null> {
  if (!isSanityConfigured || !client) return null;
  try {
    return await client.fetch<T>(query, params, {
      next: { revalidate: 60, tags: ['sanity', ...tags] },
    });
  } catch {
    return null;
  }
}

export async function getSiteSettings(): Promise<SanitySiteSettings | null> {
  return safeSanityFetch<SanitySiteSettings>(SITE_SETTINGS_QUERY, {}, ['siteSettings']);
}

export async function getHomePage(): Promise<SanityHomePageData | null> {
  return safeSanityFetch<SanityHomePageData>(HOME_PAGE_QUERY, {}, ['homePage']);
}

export async function getCmsProducts(): Promise<ProductData[]> {
  const rows = await safeSanityFetch<RawCmsProduct[]>(PRODUCTS_QUERY, {}, ['product']);
  if (!rows || rows.length === 0) return [];
  return rows.map(mapCmsProduct);
}

export async function getCmsProductBySlug(slug: string): Promise<ProductData | null> {
  const row = await safeSanityFetch<RawCmsProduct | null>(
    PRODUCT_BY_SLUG_QUERY,
    { slug },
    ['product'],
  );
  if (!row) return null;
  return mapCmsProduct(row);
}

export async function getBlogPosts(limit?: number): Promise<SanityBlogPost[]> {
  const posts = await safeSanityFetch<SanityBlogPost[]>(POSTS_QUERY, {}, ['post']);
  if (!posts) return [];
  return typeof limit === 'number' ? posts.slice(0, limit) : posts;
}

export async function getBlogPostBySlug(slug: string): Promise<SanityBlogPost | null> {
  return safeSanityFetch<SanityBlogPost | null>(POST_BY_SLUG_QUERY, { slug }, ['post']);
}

export async function getCmsPageBySlug(slug: string): Promise<SanityCustomPage | null> {
  return safeSanityFetch<SanityCustomPage | null>(PAGE_BY_SLUG_QUERY, { slug }, ['page']);
}
