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
    slug: 'solargen-portable-power-station',
    title: 'SolarGen 1.5kVA Pure Sine Wave Lithium Portable Power Station',
    category: 'Electronics & Gadgets',
    vendorId: 'vend_tech',
    vendorName: 'Naija Volt Tech Solutions',
    vendorSlug: 'naija-volt-tech',
    vendorLocation: 'Ikeja Computer Village, Lagos',
    isVendorVerified: true,
    priceMinorNGN: 46000000, // ₦460,000
    compareAtPriceMinorNGN: 51000000,
    imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'High-capacity LiFePO4 battery pack with 220V AC outlets, USB-C Power Delivery, and dual solar charging inputs. Powers TVs, laptops, fans, and home workstations during power outages.',
    stockCount: 22,
    rating: 4.9,
    reviewCount: 51,
    variants: [
      { id: 'var_solar_1500', title: '1500Wh Station + 200W Solar Panel Bundle', priceMinorNGN: 46000000, inStock: true },
      { id: 'var_solar_2000', title: '2000Wh Station + 400W Solar Panel Bundle', priceMinorNGN: 59000000, inStock: true },
    ],
    shippingHighlights: [
      'Certified lithium transit packaging',
      'Next-day delivery within Lagos / Abuja; 2-4 days nationwide',
    ],
  },
  {
    id: 'prod_3',
    slug: 'smart-pressure-cooker-yam-steamer',
    title: 'Smart 8L Multi-Tier Stainless Pressure Cooker & Food Steamer',
    category: 'Home, Kitchen & Living',
    vendorId: 'vend_home',
    vendorName: 'Continental Housewares NG',
    vendorSlug: 'continental-housewares',
    vendorLocation: 'Trade Fair Complex, Lagos',
    isVendorVerified: true,
    priceMinorNGN: 6800000, // ₦68,000
    compareAtPriceMinorNGN: 7500000,
    imageUrl: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'Heavy-duty stainless steel multi-cooker with digital pre-sets for beans, yam, jollof rice, soups, and tough meats. Cuts cooking time by 70% while preserving nutritional flavor.',
    stockCount: 35,
    rating: 4.8,
    reviewCount: 44,
    variants: [
      { id: 'var_cooker_8l', title: '8 Litre Capacity', priceMinorNGN: 6800000, inStock: true },
      { id: 'var_cooker_10l', title: '10 Litre Family Capacity', priceMinorNGN: 8200000, inStock: true },
    ],
    shippingHighlights: [
      'Dispatches within 24 hours in impact-proof foam packaging',
      'Doorstep delivery nationwide',
    ],
  },
  {
    id: 'prod_4',
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
    id: 'prod_5',
    slug: 'pure-raw-shea-butter-500g',
    title: '100% Organic Unrefined Nigerian Shea Butter (500g Jar)',
    category: 'Health, Beauty & Wellness',
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
    id: 'prod_6',
    slug: 'hand-carved-benin-bronze-replica',
    title: 'Queen Idia Commemorative Bronze Mask Replica (Hand-Cast)',
    category: 'Arts, Crafts & Collectibles',
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
  {
    id: 'prod_7',
    slug: 'heavy-duty-auto-jump-starter-pump',
    title: 'Heavy-Duty 12V Car Battery Jump Starter & Digital Tire Inflator',
    category: 'Automotive, Tools & Hardware',
    vendorId: 'vend_auto',
    vendorName: 'Automech Express Spares',
    vendorSlug: 'automech-express',
    vendorLocation: 'Ladipo Market, Lagos',
    isVendorVerified: true,
    priceMinorNGN: 3850000, // ₦38,500
    compareAtPriceMinorNGN: 4500000,
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'Compact emergency roadside toolkit with 2000A peak current jump-starter, 150 PSI auto-stop tire compressor, LED emergency strobe, and power bank capabilities.',
    stockCount: 28,
    rating: 4.9,
    reviewCount: 36,
    variants: [
      { id: 'var_jump_combo', title: 'Complete Kit with Carrying Case', priceMinorNGN: 3850000, inStock: true },
    ],
    shippingHighlights: [
      'Same-day dispatch in Lagos; next-day nationwide',
      'Full 1-year replacement warranty',
    ],
  },
  {
    id: 'prod_8',
    slug: 'pan-african-history-atlas-hardcover',
    title: 'Pan-African Chronicles: Illustrated Cultural & Historical Atlas',
    category: 'Books, Stationery & Media',
    vendorId: 'vend_books',
    vendorName: 'University Heritage Press',
    vendorSlug: 'university-heritage-press',
    vendorLocation: 'Yaba, Lagos',
    isVendorVerified: true,
    priceMinorNGN: 1650000, // ₦16,500
    compareAtPriceMinorNGN: 2000000,
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'Collector edition hardcover exploring African kingdoms, trade routes, cultural inventions, and contemporary innovations. Richly illustrated with maps and historical archives.',
    stockCount: 60,
    rating: 5.0,
    reviewCount: 28,
    variants: [
      { id: 'var_book_hc', title: 'Deluxe Hardcover Edition', priceMinorNGN: 1650000, inStock: true },
    ],
    shippingHighlights: [
      'Rigid protective book sleeve packaging',
      'Worldwide tracked delivery available',
    ],
  },
];
