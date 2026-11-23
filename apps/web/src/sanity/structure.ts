import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('GOJIFEM Website CMS')
    .items([
      S.listItem()
        .title('Site Settings & Branding')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings'),
        ),
      S.listItem()
        .title('Homepage Content & Sections')
        .id('homePage')
        .child(
          S.document()
            .schemaType('homePage')
            .documentId('homePage'),
        ),
      S.divider(),
      S.documentTypeListItem('product').title('Products & Listings'),
      S.documentTypeListItem('post').title('Blog Posts & Articles'),
      S.documentTypeListItem('page').title('Editable Policy & Custom Pages'),
      S.documentTypeListItem('mediaAsset').title('Website Image & Media Library'),
    ]);
