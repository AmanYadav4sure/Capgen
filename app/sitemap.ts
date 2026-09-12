import { MetadataRoute } from 'next';
import { PUBLIC_SEO_ROUTES, SITE_URL } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SEO_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date('2026-09-09'),
    changeFrequency: path === '/' ? 'daily' : path === '/pricing' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/pricing' || path === '/use-cases' ? 0.9 : 0.7,
  }));
}
