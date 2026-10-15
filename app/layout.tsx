// Created By DaddyAman
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import CookieConsent from '@/components/CookieConsent';
import ConsentAnalytics from '@/components/ConsentAnalytics';
import { AuthProvider } from '@/components/AuthProvider';
import { JsonLd } from '@/components/PageSchema';
import { SITE_URL } from '@/lib/seo';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Capgen Video Captions', template: '%s | Capgen' },
  description:
    'Generate timed captions from video audio with Capgen. Customize caption styles and export video or SRT subtitles.',
  applicationName: 'Capgen',
  creator: 'Capgen',
  publisher: 'Capgen',
  icons: {
    icon: [
      { url: '/favicon.ico?v=20261015', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: '/favicon-32.png?v=20261015', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png?v=20261015', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=20261015',
    apple: { url: '/apple-touch-icon.png?v=20261015', sizes: '180x180', type: 'image/png' },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background" data-scroll-behavior="smooth">
      <head>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': `${SITE_URL}/#organization`,
                name: 'Capgen',
                url: `${SITE_URL}/`,
                logo: `${SITE_URL}/logo.png`,
                email: 'support@capgen.app',
              },
              {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                name: 'Capgen',
                alternateName: 'Capgen.app',
                url: `${SITE_URL}/`,
                publisher: { '@id': `${SITE_URL}/#organization` },
              },
            ],
          }}
        />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider
          localization={{
            signIn: { start: { title: 'Sign in to Capgen' } },
            signUp: { start: { title: 'Create your Capgen account' } },
          }}
          appearance={{
            variables: {
              colorPrimary: '#2563eb',
              borderRadius: '0.75rem',
              fontFamily: 'var(--font-geist), Arial, sans-serif',
            },
            elements: {
              rootBox: { width: '100%' },
              cardBox: { width: '100%' },
              card: { width: '100%' },
            },
          }}
        >
          <AuthProvider>
            {children}
            <CookieConsent />
          </AuthProvider>
          <ConsentAnalytics
            vercel={process.env.NODE_ENV === 'production' && !!process.env.VERCEL}
          />
        </ClerkProvider>
      </body>
    </html>
  );
}
