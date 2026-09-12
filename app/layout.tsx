import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import CookieConsent from '@/components/CookieConsent';
import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://capgen.app'),
  title: {
    default: 'Capgen — Free AI Video Caption Generator for Reels, Shorts & TikTok',
    template: '%s | Capgen AI Video Captions',
  },
  description:
    'Auto-generate animated subtitles & viral captions in seconds with 60fps word-level sync. Supports English, Hinglish, Nepali, Hindi & 99+ languages. Watermark-free, studio-grade fonts, and MrBeast/Karaoke presets.',
  keywords: [
    'AI video caption generator',
    'auto subtitle generator',
    'Hinglish video captions',
    'Nepali subtitle generator',
    'MrBeast caption style generator',
    'karaoke subtitles for reels',
    'free caption generator without watermark',
    'TikTok subtitle maker',
    'YouTube Shorts caption tool',
    'kinetic typography video editor',
    'Captions AI alternative free',
    'auto subtitle generator free',
    'caption generator',
    'auto caption generator',
    'auto captions',
    'CapGen',
    'Capgen',
    'Capgen.app',
  ],
  authors: [{ name: 'Capgen Team', url: 'https://capgen.app' }],
  creator: 'Capgen',
  publisher: 'Capgen Team',
  alternates: {
    canonical: 'https://capgen.app',
  },
  openGraph: {
    title: 'Capgen — Free AI Video Caption Generator for Viral Content',
    description:
      'Transform raw footage into scroll-stopping reels with 60fps kinetic captions. 99+ languages, 0 watermarks, 100+ creator presets.',
    url: 'https://capgen.app',
    siteName: 'Capgen',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/caption.jpeg',
        width: 1200,
        height: 675,
        alt: 'Capgen AI Video Caption Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Capgen — Free AI Video Caption Generator',
    description: 'Create viral, frame-accurate animated captions for Shorts and Reels in seconds.',
    images: ['/caption.jpeg'],
    creator: '@capgenapp',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-icon.png',
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

const jsonLdSchemas = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Capgen',
    operatingSystem: 'Web Browser',
    applicationCategory: 'MultimediaApplication',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.96',
      reviewCount: '5120',
    },
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
      url: 'https://capgen.app/pricing',
    },
    description:
      'Capgen is a free AI video caption generator that creates 60fps word-synced animated subtitles for Reels, Shorts, TikTok, and video podcasts.',
    url: 'https://capgen.app',
    publisher: {
      '@type': 'Organization',
      name: 'Capgen Team',
      url: 'https://capgen.app',
      logo: 'https://capgen.app/apple-icon.png',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@capgen.app',
      },
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Capgen',
    url: 'https://capgen.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://capgen.app/editor?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is Capgen free to use without a watermark?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Capgen provides free video exports with zero watermarks, 60fps word-level subtitle sync, and 100+ creator fonts.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which languages are supported for AI auto captioning?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Capgen supports 99+ languages including English, Hinglish, Nepali, Hindi, Spanish, Portuguese, German, French, and Japanese.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I export subtitle files like SRT, VTT, or ASS?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Capgen allows downloading raw subtitle files (SRT, VTT, ASS) to import directly into Premiere Pro, Final Cut Pro, or DaVinci Resolve.',
        },
      },
    ],
  },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Bangers&family=Bebas+Neue&family=Black+Han+Sans&family=Bowlby+One+SC&family=Bungee&family=Caveat:wght@700&family=Cinzel:wght@700&family=Cormorant+Garamond:ital,wght@1,700&family=Courier+Prime:wght@700&family=DM+Serif+Display&family=Dancing+Script:wght@700&family=Inter:wght@700;900&family=Kalam:wght@700&family=Manrope:wght@800&family=Montserrat:wght@800;900&family=Outfit:wght@800;900&family=Pacifico&family=Permanent+Marker&family=Playfair+Display:ital,wght@1,800&family=Plus+Jakarta+Sans:wght@800&family=Poppins:wght@800;900&family=Rubik+Mono+One&family=Share+Tech+Mono&family=Space+Grotesk:wght@700&family=Special+Elite&family=Syne:wght@800&family=Titan+One&family=VT323&family=Yatra+One&display=swap"
          rel="stylesheet"
        />
        {jsonLdSchemas.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        {/* Google Tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FB0MFNC2PE"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-FB0MFNC2PE');
          `}
        </Script>

        <AuthProvider>
          {children}
          <CookieConsent />
          {process.env.NODE_ENV === 'production' && process.env.VERCEL && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  );
}
