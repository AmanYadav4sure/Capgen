import type { Metadata } from 'next';
import { getLandingMetadata } from '@/lib/seo';
import PricingClient from './PricingClient';
import PageSchema from '@/components/PageSchema';

export function generateMetadata(): Metadata {
  return getLandingMetadata('/pricing');
}

export default function PricingPage() {
  return (
    <>
      <PageSchema path="/pricing" />
      <PricingClient />
    </>
  );
}
