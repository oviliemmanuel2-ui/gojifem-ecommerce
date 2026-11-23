import { defineArrayMember, defineField, defineType } from 'sanity';

export const homePageType = defineType({
  name: 'homePage',
  title: 'Homepage Content & Sections',
  type: 'document',
  fields: [
    defineField({
      name: 'heroBadge',
      title: 'Hero Top Badge',
      type: 'string',
      initialValue: 'GLOBAL & LOCAL MULTI-VENDOR MARKETPLACE • 100% ESCROW PROTECTION',
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Headline (Prefix)',
      type: 'string',
      initialValue: 'The Multi-Vendor Marketplace for',
    }),
    defineField({
      name: 'heroHighlight',
      title: 'Hero Headline (Ruby Highlighted Text)',
      type: 'string',
      initialValue: 'All Kinds of Items',
    }),
    defineField({
      name: 'heroTitleSuffix',
      title: 'Hero Headline (Suffix)',
      type: 'string',
      initialValue: 'Locally & Worldwide.',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
      rows: 3,
      initialValue:
        'Shop electronics, fashion, groceries, home appliances, automotive accessories, books, and cultural crafts directly from approved sellers in Nigeria and international hubs.',
    }),
    defineField({
      name: 'heroPrimaryCtaLabel',
      title: 'Primary Button Text',
      type: 'string',
      initialValue: 'Explore All Departments',
    }),
    defineField({
      name: 'heroPrimaryCtaHref',
      title: 'Primary Button Link',
      type: 'string',
      initialValue: '#featured-products',
    }),
    defineField({
      name: 'heroSecondaryCtaLabel',
      title: 'Secondary Button Text',
      type: 'string',
      initialValue: 'How Worldwide Checkout Works',
    }),
    defineField({
      name: 'heroSecondaryCtaHref',
      title: 'Secondary Button Link',
      type: 'string',
      initialValue: '#international-payments',
    }),
    defineField({
      name: 'heroBannerImage',
      title: 'Hero Feature Image (Optional)',
      type: 'image',
      description: 'Upload or replace the featured hero showcase banner image.',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'valueProps',
      title: 'Hero Value Proposition Cards (3 Cards)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Card Title', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'description', title: 'Card Description', type: 'text', rows: 2, validation: (r) => r.required() }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  { title: 'Credit Card (Payments)', value: 'card' },
                  { title: 'Truck (Delivery)', value: 'truck' },
                  { title: 'Shield (Escrow)', value: 'shield' },
                ],
              },
              initialValue: 'shield',
            }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'description' },
          },
        }),
      ],
    }),
    defineField({
      name: 'categoriesEyebrow',
      title: 'Categories Eyebrow',
      type: 'string',
      initialValue: 'Endless Selection',
    }),
    defineField({
      name: 'categoriesHeading',
      title: 'Categories Heading',
      type: 'string',
      initialValue: 'Browse All Categories',
    }),
    defineField({
      name: 'categoriesSubtitle',
      title: 'Categories Subtitle',
      type: 'string',
      initialValue: 'Discover thousands of verified products from independent vendors',
    }),
    defineField({
      name: 'categories',
      title: 'Homepage Categories',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Category Name', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'countLabel', title: 'Item Count Label', type: 'string', initialValue: '500+ Items' }),
            defineField({ name: 'iconEmoji', title: 'Emoji Icon', type: 'string', initialValue: '🛍️' }),
            defineField({
              name: 'image',
              title: 'Category Image (Optional)',
              type: 'image',
              options: { hotspot: true },
              fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
            }),
            defineField({
              name: 'matchKeywords',
              title: 'Filter Keywords',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Keywords matched against product categories when clicked.',
            }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'countLabel', media: 'image' },
          },
        }),
      ],
    }),
    defineField({
      name: 'featuredEyebrow',
      title: 'Featured Products Eyebrow',
      type: 'string',
      initialValue: 'Direct from Verified Merchants & Makers',
    }),
    defineField({
      name: 'featuredHeading',
      title: 'Featured Products Heading',
      type: 'string',
      initialValue: 'Featured Marketplace Listings',
    }),
    defineField({
      name: 'featuredSubtitle',
      title: 'Featured Products Subtitle',
      type: 'string',
      initialValue: 'Prices calculate live in NGN, USD, GBP, or EUR.',
    }),
    defineField({
      name: 'deliveryEyebrow',
      title: 'Delivery Section Eyebrow',
      type: 'string',
      initialValue: 'Strict Delivery Coverage Gate',
    }),
    defineField({
      name: 'deliveryHeading',
      title: 'Delivery Section Heading',
      type: 'string',
      initialValue: 'Where can GOJIFEM deliver your package?',
    }),
    defineField({
      name: 'deliveryDescription',
      title: 'Delivery Section Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Before you pay, our system verifies whether the recipient shipping address is within our serviceable zones. You can purchase goods from abroad using international cards for delivery anywhere within Nigeria and select international destinations.',
    }),
    defineField({
      name: 'paymentsEyebrow',
      title: 'Payments Section Eyebrow',
      type: 'string',
      initialValue: 'Local Shoppers & Global Diaspora',
    }),
    defineField({
      name: 'paymentsHeading',
      title: 'Payments Section Heading',
      type: 'string',
      initialValue: 'Shopping in Nigeria or sending from abroad? Pay easily in any currency.',
    }),
    defineField({
      name: 'paymentsDescription',
      title: 'Payments Section Description',
      type: 'text',
      rows: 3,
      initialValue:
        'GOJIFEM connects verified multi-vendor merchants to customers everywhere. Whether you are in Lagos, Abuja, London, New York, Toronto, or Atlanta, you can pay using your local or foreign bank card while we handle tracked fulfillment.',
    }),
    defineField({
      name: 'paymentsBullets',
      title: 'Payments Feature Bullets',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'checkoutSteps',
      title: 'How Checkout Works Steps',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Step Title', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'description', title: 'Step Description', type: 'text', rows: 2 }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'customSections',
      title: 'Additional Homepage Sections (Promos / Campaigns / Spotlights)',
      type: 'array',
      description: 'Add, reorder, or remove custom editorial sections rendered on the storefront.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'eyebrow', title: 'Eyebrow Label', type: 'string' }),
            defineField({ name: 'heading', title: 'Section Heading', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'body', title: 'Section Copy', type: 'text', rows: 3 }),
            defineField({
              name: 'image',
              title: 'Section Image',
              type: 'image',
              options: { hotspot: true },
              fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
            }),
            defineField({ name: 'ctaLabel', title: 'Button Label (Optional)', type: 'string' }),
            defineField({ name: 'ctaHref', title: 'Button Link (Optional)', type: 'string' }),
            defineField({
              name: 'theme',
              title: 'Section Theme',
              type: 'string',
              options: {
                list: [
                  { title: 'Warm Ivory', value: 'ivory' },
                  { title: 'Muted Rose', value: 'rose' },
                  { title: 'Deep Espresso', value: 'espresso' },
                ],
              },
              initialValue: 'rose',
            }),
          ],
          preview: {
            select: { title: 'heading', subtitle: 'eyebrow', media: 'image' },
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Homepage Content & Sections' }),
  },
});
