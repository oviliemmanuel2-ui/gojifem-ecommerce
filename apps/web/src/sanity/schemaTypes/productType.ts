import { defineArrayMember, defineField, defineType } from 'sanity';

export const productType = defineType({
  name: 'product',
  title: 'Marketplace Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Product Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Department / Category',
      type: 'string',
      options: {
        list: [
          'Fashion & Apparel',
          'Electronics & Gadgets',
          'Nigerian Groceries & Foods',
          'Home, Kitchen & Living',
          'Health, Beauty & Wellness',
          'Arts, Crafts & Collectibles',
          'Automotive, Tools & Hardware',
          'Books, Stationery & Media',
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Primary Product Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Additional Product Gallery Images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
        }),
      ],
    }),
    defineField({
      name: 'priceNGN',
      title: 'Price (NGN ₦)',
      type: 'number',
      description: 'Base price in Naira (e.g. 45000 for ₦45,000). Auto-converted on storefront.',
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: 'compareAtPriceNGN',
      title: 'Compare-At Price (NGN ₦, Optional)',
      type: 'number',
    }),
    defineField({
      name: 'vendorName',
      title: 'Vendor / Merchant Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'vendorLocation',
      title: 'Vendor Dispatch Location',
      type: 'string',
      initialValue: 'Lagos, Nigeria',
    }),
    defineField({
      name: 'isVendorVerified',
      title: 'KYC Verified Vendor',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'stockCount',
      title: 'Available Stock Quantity',
      type: 'number',
      initialValue: 20,
    }),
    defineField({
      name: 'rating',
      title: 'Display Rating (1 - 5)',
      type: 'number',
      initialValue: 4.9,
      validation: (rule) => rule.min(1).max(5),
    }),
    defineField({
      name: 'reviewCount',
      title: 'Review Count',
      type: 'number',
      initialValue: 12,
    }),
    defineField({
      name: 'description',
      title: 'Product Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'variants',
      title: 'Product Options / Variants',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Option Name', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'priceNGN', title: 'Variant Price (NGN ₦)', type: 'number', validation: (r) => r.required().positive() }),
            defineField({ name: 'inStock', title: 'In Stock', type: 'boolean', initialValue: true }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'priceNGN' },
          },
        }),
      ],
    }),
    defineField({
      name: 'shippingHighlights',
      title: 'Shipping Highlights',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'featured',
      title: 'Feature on Homepage',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'vendorName',
      media: 'mainImage',
    },
  },
});
