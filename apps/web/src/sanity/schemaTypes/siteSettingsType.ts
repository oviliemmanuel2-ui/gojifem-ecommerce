import { defineArrayMember, defineField, defineType } from 'sanity';

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site / Brand Name',
      type: 'string',
      initialValue: 'GOJIFEM',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Brand Tagline',
      type: 'string',
      initialValue: 'Global Marketplace',
    }),
    defineField({
      name: 'announcementBanner',
      title: 'Top Announcement Banner',
      type: 'string',
      description: 'Displayed inside the top dark espresso bar across every page.',
      initialValue:
        'Worldwide & Local Deliveries: Buy all kinds of products locally or from abroad with seamless Visa, Mastercard, and Verve payments.',
    }),
    defineField({
      name: 'logo',
      title: 'Custom Brand Logo Image (Optional)',
      type: 'image',
      description:
        'Upload an image to replace the default "G" badge in the navbar, or remove to restore the default badge.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'supportEmail',
      title: 'Support Email',
      type: 'string',
      initialValue: 'support@gojifem.com',
    }),
    defineField({
      name: 'supportPhone',
      title: 'Support Phone',
      type: 'string',
      initialValue: '+234 (0) 800 GOJIFEM',
    }),
    defineField({
      name: 'regionalHub',
      title: 'Regional Hub Location',
      type: 'string',
      initialValue: 'Victoria Island, Lagos, Nigeria (Worldwide Fulfillment)',
    }),
    defineField({
      name: 'copyrightText',
      title: 'Footer Copyright Line',
      type: 'string',
      initialValue: 'GOJIFEM Global Marketplace Ltd. All rights reserved.',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Media Links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'platform', title: 'Platform', type: 'string' }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
          ],
          preview: {
            select: { title: 'platform', subtitle: 'url' },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'siteName', subtitle: 'tagline', media: 'logo' },
  },
});
