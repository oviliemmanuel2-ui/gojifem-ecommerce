import { type SchemaTypeDefinition } from 'sanity';
import { blockContentType } from './blockContentType';
import { siteSettingsType } from './siteSettingsType';
import { homePageType } from './homePageType';
import { productType } from './productType';
import { postType } from './postType';
import { pageType } from './pageType';
import { mediaAssetType } from './mediaAssetType';

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettingsType,
  homePageType,
  productType,
  postType,
  pageType,
  mediaAssetType,
  blockContentType,
];
