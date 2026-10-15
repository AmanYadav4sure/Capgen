import { MetadataRoute } from 'next';
import { PUBLIC_PAGE_UPDATED_AT, PUBLIC_SEO_ROUTES, SITE_URL } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SEO_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    ...(PUBLIC_PAGE_UPDATED_AT[path] ? { lastModified: PUBLIC_PAGE_UPDATED_AT[path] } : {}),
  }));
}
