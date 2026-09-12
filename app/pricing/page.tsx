import type { Metadata } from 'next';
import { getLandingMetadata } from '@/lib/seo';
import PricingClient from './PricingClient';

export function generateMetadata(): Metadata {
  return getLandingMetadata('/pricing');
}

export default function PricingPage() {
  return <PricingClient />;
}
