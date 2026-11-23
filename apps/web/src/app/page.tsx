import React from 'react';
import { HomeClient } from '../components/HomeClient';
import {
  getBlogPosts,
  getCmsProducts,
  getHomePage,
  getSiteSettings,
} from '../sanity/lib/fetch';

export const revalidate = 60;

export default async function HomePage() {
  const [homeData, cmsProducts, latestPosts, siteSettings] = await Promise.all([
    getHomePage(),
    getCmsProducts(),
    getBlogPosts(3),
    getSiteSettings(),
  ]);

  return (
    <HomeClient
      homeData={homeData}
      cmsProducts={cmsProducts}
      latestPosts={latestPosts}
      siteSettings={siteSettings}
    />
  );
}
