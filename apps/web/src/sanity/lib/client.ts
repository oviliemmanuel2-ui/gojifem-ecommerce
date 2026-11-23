import { createClient } from 'next-sanity';
import { apiVersion, dataset, isSanityConfigured, projectId } from '../env';

export const client = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: !process.env.SANITY_API_READ_TOKEN && process.env.NODE_ENV === 'production',
      token: process.env.SANITY_API_READ_TOKEN || undefined,
      perspective: 'published',
    })
  : null;
