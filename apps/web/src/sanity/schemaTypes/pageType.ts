import { defineField, defineType } from 'sanity';

export const pageType = defineType({
  name: 'page',
  title: 'Editable Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Page Route Slug',
      type: 'slug',
      description:
        'Use "privacy", "terms", "vendor-agreement", or "delivery-policy" to override those built-in pages, or create any new custom page accessible at /pages/<slug>.',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Label',
      type: 'string',
      initialValue: 'GOJIFEM Global Marketplace Ltd.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Header Image (Optional)',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alternative Text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'summary',
      title: 'Meta Description / Summary',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'content',
      title: 'Page Content',
      type: 'blockContent',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Effective / Last Updated Date',
      type: 'date',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
      media: 'heroImage',
    },
  },
});
