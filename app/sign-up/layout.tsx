import type { Metadata } from 'next';
import { getPrivateMetadata } from '@/lib/seo';

export const metadata: Metadata = getPrivateMetadata('Create Your Account', '/sign-up');

export default function SignUpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
