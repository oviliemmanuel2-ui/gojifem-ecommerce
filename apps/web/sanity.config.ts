'use client';

import { visionTool } from '@sanity/vision';
import { type Config, defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { apiVersion, dataset, projectId } from './src/sanity/env';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';

const sanityConfig: Config = defineConfig({
  name: 'gojifem-studio',
  title: 'GOJIFEM CMS Studio',
  basePath: '/studio',
  projectId: projectId || 'not-configured',
  dataset,
  schema: {
    types: schemaTypes,
  },
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});

export default sanityConfig;
