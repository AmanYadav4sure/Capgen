import type { Metadata } from 'next';
import { getLandingMetadata } from '@/lib/seo';
import TemplatesClient from '@/components/templates/TemplatesClient';
import PageSchema from '@/components/PageSchema';
import CaptionFonts from '@/components/CaptionFonts';

export function generateMetadata(): Metadata {
  return getLandingMetadata('/templates');
}

export default function TemplatesPage() {
  return (
    <>
      <CaptionFonts templates />
      <link rel="preload" as="image" href="/hero-sky.webp" />
      <PageSchema path="/templates" />
      <TemplatesClient />
    </>
  );
}
