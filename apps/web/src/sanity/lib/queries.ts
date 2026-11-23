import { defineQuery } from 'next-sanity';

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    siteName,
    tagline,
    announcementBanner,
    logo{
      alt,
      asset->{
        _id,
        url
      }
    },
    supportEmail,
    supportPhone,
    regionalHub,
    copyrightText,
    socialLinks[]{
      platform,
      url
    }
  }
`);

export const HOME_PAGE_QUERY = defineQuery(`
  *[_type == "homePage" && _id == "homePage"][0]{
    heroBadge,
    heroTitle,
    heroHighlight,
    heroTitleSuffix,
    heroSubtitle,
    heroPrimaryCtaLabel,
    heroPrimaryCtaHref,
    heroSecondaryCtaLabel,
    heroSecondaryCtaHref,
    heroBannerImage{
      alt,
      asset->{
        _id,
        url,
        metadata{ dimensions }
      }
    },
    valueProps[]{
      title,
      description,
      icon
    },
    categoriesEyebrow,
    categoriesHeading,
    categoriesSubtitle,
    categories[]{
      name,
      countLabel,
      iconEmoji,
      matchKeywords,
      image{
        alt,
        asset->{
          _id,
          url
        }
      }
    },
    featuredEyebrow,
    featuredHeading,
    featuredSubtitle,
    deliveryEyebrow,
    deliveryHeading,
    deliveryDescription,
    paymentsEyebrow,
    paymentsHeading,
    paymentsDescription,
    paymentsBullets,
    checkoutSteps[]{
      title,
      description
    },
    customSections[]{
      eyebrow,
      heading,
      body,
      ctaLabel,
      ctaHref,
      theme,
      image{
        alt,
        asset->{
          _id,
          url
        }
      }
    }
  }
`);

export const PRODUCTS_QUERY = defineQuery(`
  *[_type == "product" && defined(slug.current)] | order(_createdAt desc){
    _id,
    title,
    "slug": slug.current,
    category,
    vendorName,
    vendorLocation,
    isVendorVerified,
    priceNGN,
    compareAtPriceNGN,
    mainImage{
      alt,
      asset->{
        _id,
        url
      }
    },
    gallery[]{
      alt,
      asset->{
        _id,
        url
      }
    },
    description,
    stockCount,
    rating,
    reviewCount,
    variants[]{
      _key,
      title,
      priceNGN,
      inStock
    },
    shippingHighlights,
    featured
  }
`);

export const PRODUCT_BY_SLUG_QUERY = defineQuery(`
  *[_type == "product" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    category,
    vendorName,
    vendorLocation,
    isVendorVerified,
    priceNGN,
    compareAtPriceNGN,
    mainImage{
      alt,
      asset->{
        _id,
        url
      }
    },
    gallery[]{
      alt,
      asset->{
        _id,
        url
      }
    },
    description,
    stockCount,
    rating,
    reviewCount,
    variants[]{
      _key,
      title,
      priceNGN,
      inStock
    },
    shippingHighlights,
    featured
  }
`);

export const POSTS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc){
    _id,
    title,
    "slug": slug.current,
    excerpt,
    authorName,
    authorRole,
    categories,
    publishedAt,
    featured,
    mainImage{
      alt,
      asset->{
        _id,
        url
      }
    }
  }
`);

export const POST_BY_SLUG_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    authorName,
    authorRole,
    categories,
    publishedAt,
    featured,
    mainImage{
      alt,
      asset->{
        _id,
        url
      }
    },
    body
  }
`);

export const PAGE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "page" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    eyebrow,
    summary,
    updatedAt,
    heroImage{
      alt,
      asset->{
        _id,
        url
      }
    },
    content
  }
`);
