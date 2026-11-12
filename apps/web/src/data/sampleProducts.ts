export interface ProductData {
  id: string;
  slug: string;
  title: string;
  category: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  vendorLocation: string;
  isVendorVerified: boolean;
  priceMinorNGN: number; // e.g., 3500000 = ₦35,000
  compareAtPriceMinorNGN?: number;
  imageUrl: string;
  galleryImages: string[];
  description: string;
  stockCount: number;
  rating: number;
  reviewCount: number;
  variants: { id: string; title: string; priceMinorNGN: number; inStock: boolean }[];
  shippingHighlights: string[];
}

export const SAMPLE_PRODUCTS: ProductData[] = [
  {
    id: 'prod_1',
    slug: 'authentic-aso-oke-traditional-attire',
    title: 'Handcrafted Luxury Aso-Oke Agbada & Fila Set',
    category: 'Fashion & Apparel',
    vendorId: 'vend_1',
    vendorName: 'Omo Odua Heritage Looms',
    vendorSlug: 'omo-odua-heritage',
    vendorLocation: 'Ibadan, Oyo State',
    isVendorVerified: true,
    priceMinorNGN: 14500000, // ₦145,000
    compareAtPriceMinorNGN: 18000000,
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'Woven from the finest threads by master artisans in Western Nigeria. Perfect for weddings, coronation ceremonies, and prestigious galas.',
    stockCount: 14,
    rating: 4.9,
    reviewCount: 38,
    variants: [
      { id: 'var_1_m', title: 'Medium (Chest 40-42")', priceMinorNGN: 14500000, inStock: true },
      { id: 'var_1_l', title: 'Large (Chest 44-46")', priceMinorNGN: 14500000, inStock: true },
      { id: 'var_1_xl', title: 'Extra Large (Chest 48-50")', priceMinorNGN: 15500000, inStock: true },
    ],
    shippingHighlights: [
      'Dispatches from Ibadan within 24-48 hours',
      'Tracked doorstep delivery across Nigeria (1-3 days)',
      'Worldwide card payments accepted; customs declarations provided for export',
    ],
  },
  {
    id: 'prod_2',
    slug: 'pure-raw-shea-butter-500g',
    title: '100% Organic Unrefined Nigerian Shea Butter (500g Jar)',
    category: 'Beauty & Wellness',
    vendorId: 'vend_2',
    vendorName: 'Sahel Naturals Organic Co.',
    vendorSlug: 'sahel-naturals',
    vendorLocation: 'Minna, Niger State',
    isVendorVerified: true,
    priceMinorNGN: 480000, // ₦4,800
    compareAtPriceMinorNGN: 600000,
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-0d414a1c5d9a?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1608248597359-0d414a1c5d9a?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'Ethically sourced from wild-grown Vitellaria paradoxa trees in Niger State. Cold-pressed, unbleached, and packed with vitamins A and E for hair and skin.',
    stockCount: 120,
    rating: 4.8,
    reviewCount: 94,
    variants: [
      { id: 'var_2_500g', title: '500g Glass Jar', priceMinorNGN: 480000, inStock: true },
      { id: 'var_2_1kg', title: '1kg Family Tub', priceMinorNGN: 880000, inStock: true },
    ],
    shippingHighlights: [
      'Dispatches from Minna within 24 hours',
      'Doorstep delivery via GIGL / Red Star Express',
    ],
  },
  {
    id: 'prod_3',
    slug: 'sun-dried-premium-crayfish-bag',
    title: 'Oron Crayfish - Premium Sun-Dried Seafood (2kg Pack)',
    category: 'Nigerian Groceries & Foods',
    vendorId: 'vend_3',
    vendorName: 'Akwa Ibom Coastal Harvests',
    vendorSlug: 'akwa-ibom-harvests',
    vendorLocation: 'Oron, Akwa Ibom',
    isVendorVerified: true,
    priceMinorNGN: 2200000, // ₦22,000
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'Aromatic, sand-free, and thoroughly sun-dried crayfish harvested directly from the coastal waters of Oron. Adds authentic Nigerian umami flavor to soups.',
    stockCount: 45,
    rating: 5.0,
    reviewCount: 62,
    variants: [
      { id: 'var_3_2kg', title: '2kg Vacuum Sealed Bag', priceMinorNGN: 2200000, inStock: true },
      { id: 'var_3_5kg', title: '5kg Bulk Carton', priceMinorNGN: 5100000, inStock: true },
    ],
    shippingHighlights: [
      'Food-grade vacuum packaging ensures fresh arrival',
      'Direct dispatch from Akwa Ibom to all major Nigerian transit hubs',
    ],
  },
  {
    id: 'prod_4',
    slug: 'hand-carved-benin-bronze-replica',
    title: 'Queen Idia Commemorative Bronze Mask Replica (Hand-Cast)',
    category: 'Arts & Handcrafts',
    vendorId: 'vend_4',
    vendorName: 'Igun Street Bronze Guild',
    vendorSlug: 'igun-bronze-guild',
    vendorLocation: 'Benin City, Edo State',
    isVendorVerified: true,
    priceMinorNGN: 8500000, // ₦85,000
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'Authentic lost-wax bronze casting celebrating Queen Idia, mother of Oba Esigie. Cast by descendants of the ancient Benin Royal Bronze Casters Guild.',
    stockCount: 8,
    rating: 4.9,
    reviewCount: 19,
    variants: [
      { id: 'var_4_standard', title: '12-inch Bronze Sculpture', priceMinorNGN: 8500000, inStock: true },
    ],
    shippingHighlights: [
      'Fragile wooden protective crate packaging included',
      'Insured priority shipping across Nigeria & international corridors',
    ],
  },
];
