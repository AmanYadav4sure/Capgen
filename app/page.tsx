import type { Metadata } from 'next';
import Home from '@/components/HomePage';
import PageSchema from '@/components/PageSchema';
import CaptionFonts from '@/components/CaptionFonts';
import { getLandingMetadata } from '@/lib/seo';

export const metadata: Metadata = getLandingMetadata('/');

export default function Page() {
  return (
    <>
      <link rel="preload" as="image" href="/hero-sky.webp" fetchPriority="high" />
      <CaptionFonts />
      <PageSchema path="/" />
      <Home />
    </>
  );
}
