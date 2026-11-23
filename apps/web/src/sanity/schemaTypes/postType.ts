import { defineField, defineType } from 'sanity';

export const postType = defineType({
  name: 'post',
  title: 'Blog Post & Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Article Title',
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
      name: 'excerpt',
      title: 'Short Summary / Excerpt',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(260),
    }),
    defineField({
      name: 'mainImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'authorName',
      title: 'Author Name',
      type: 'string',
      initialValue: 'GOJIFEM Editorial Team',
    }),
    defineField({
      name: 'authorRole',
      title: 'Author Title / Role',
      type: 'string',
      initialValue: 'Marketplace Editor',
    }),
    defineField({
      name: 'categories',
      title: 'Article Tags / Categories',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'featured',
      title: 'Feature on Homepage Journal Strip',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'body',
      title: 'Article Body',
      type: 'blockContent',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'authorName',
      media: 'mainImage',
    },
  },
});
