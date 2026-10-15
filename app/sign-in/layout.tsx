import type { Metadata } from 'next';
import { getPrivateMetadata } from '@/lib/seo';

export const metadata: Metadata = getPrivateMetadata('Sign In', '/sign-in');

export default function SignInLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
