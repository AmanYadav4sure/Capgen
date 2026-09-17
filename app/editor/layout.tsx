import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio Editor',
  robots: { index: false, follow: false },
};

export default function EditorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
