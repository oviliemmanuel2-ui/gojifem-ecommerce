import { defineField, defineType } from 'sanity';

export const mediaAssetType = defineType({
  name: 'mediaAsset',
  title: 'Website Image & Media Asset',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Asset Title / Key',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Placement / Category',
      type: 'string',
      options: {
        list: [
          { title: 'Hero & Banners', value: 'hero' },
          { title: 'Brand & Logo', value: 'brand' },
          { title: 'Category Artwork', value: 'category' },
          { title: 'Promotions', value: 'promo' },
          { title: 'Editorial / Gallery', value: 'gallery' },
        ],
      },
      initialValue: 'gallery',
    }),
    defineField({
      name: 'image',
      title: 'Image File (Upload, Crop, Replace or Delete)',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'altText',
      title: 'Alt Text',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'notes',
      title: 'Usage Notes',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'image',
    },
  },
});
