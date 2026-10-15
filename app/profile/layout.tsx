import type { Metadata } from 'next';
import { getPrivateMetadata } from '@/lib/seo';

export const metadata: Metadata = getPrivateMetadata('Your Projects', '/profile');

export default function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
