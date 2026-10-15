import type { Metadata } from 'next';
import { getPrivateMetadata } from '@/lib/seo';
import CaptionFonts from '@/components/CaptionFonts';

export const metadata: Metadata = getPrivateMetadata('Studio Editor', '/editor');

export default function EditorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <CaptionFonts editor />
      {children}
    </>
  );
}
