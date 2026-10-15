import type { Metadata } from 'next';
import { LANDING_ROUTES } from '@/lib/landingContent';

export const SITE_URL = 'https://www.capgen.app';

export const PUBLIC_SEO_ROUTES = [
  '/',
  ...LANDING_ROUTES,
  '/templates',
  '/pricing',
  '/privacy',
  '/terms',
];

// Update only when the corresponding page content changes substantially.
export const PUBLIC_PAGE_UPDATED_AT: Record<string, string> = {
  '/': '2026-10-15',
  '/use-cases': '2026-10-14',
  '/use-cases/creators': '2026-10-14',
  '/use-cases/podcasters': '2026-10-14',
  '/use-cases/agencies': '2026-10-14',
  '/use-cases/education': '2026-10-14',
  '/platforms/instagram': '2026-10-14',
  '/platforms/youtube': '2026-10-14',
  '/platforms/tiktok': '2026-10-14',
  '/platforms/linkedin': '2026-10-14',
  '/features/srt-subtitles': '2026-10-14',
  '/about': '2026-10-14',
  '/contact': '2026-10-14',
  '/templates': '2026-10-15',
  '/pricing': '2026-10-15',
  '/privacy': '2026-10-15',
};

const routeSeo: Record<string, { title: string; description: string; keywords: string[] }> = {
  '/': {
    title: 'AI Video Caption Generator for Reels & Shorts',
    description:
      'Add animated captions to your videos with Capgen. Customize subtitle styles, sync words to speech, and export captioned videos or SRT files. Start with 5 free credits.',
    keywords: ['AI video caption generator', 'automatic video captions', 'animated subtitles'],
  },
  '/features/srt-subtitles': {
    title: 'SRT Subtitle Generator for Videos',
    description:
      'Generate timed subtitles from uploaded video audio and download an SRT file. Learn what SRT includes, how to review it, and how it differs from animated captions.',
    keywords: ['SRT subtitle generator', 'video to SRT', 'generate SRT subtitles'],
  },
  '/use-cases': {
    title: 'Video Caption Workflows for Every Creator',
    description:
      'Create accurate, animated captions for creator videos, podcasts, agencies, and education with Capgen.',
    keywords: [
      'video caption workflows',
      'captioning for creators',
      'AI captions for content creators',
    ],
  },
  '/use-cases/creators': {
    title: 'Caption Generator for Creators and Influencers',
    description:
      'Turn vlogs, personal-brand videos, and short-form footage into readable, animated captions with Capgen.',
    keywords: [
      'caption generator for creators',
      'captions for influencers',
      'vlog caption generator',
    ],
  },
  '/use-cases/podcasters': {
    title: 'Auto Captions for Video Podcasts',
    description:
      'Add timed captions to prepared video podcast excerpts. Style the subtitles for social clips or download an SRT file for another editing workflow.',
    keywords: ['podcast caption generator', 'auto captions for podcasts', 'podcast clip captions'],
  },
  '/use-cases/agencies': {
    title: 'Branded Caption Production for Agencies',
    description:
      'Create consistent caption styles, resize social videos, and deliver branded edits faster with Capgen.',
    keywords: ['agency caption workflow', 'branded video captions', 'caption production software'],
  },
  '/use-cases/education': {
    title: 'Accessible Captions for Education Videos',
    description:
      'Make lessons and course clips easier to follow with accurate subtitles, readable styling, and flexible exports.',
    keywords: ['education caption generator', '字幕 for courses', 'captions for teaching videos'],
  },
  '/platforms/instagram': {
    title: 'Instagram Reels Video Caption Generator',
    description:
      'Create vertical Instagram Reels with word-synced animated captions and exports sized for mobile viewing.',
    keywords: [
      'Instagram caption generator',
      'Instagram Reels captions',
      'auto captions for Instagram',
    ],
  },
  '/platforms/youtube': {
    title: 'YouTube Shorts Caption Generator',
    description:
      'Add animated captions to your YouTube Shorts with Capgen. Upload a video, style the timed words, and export a captioned video or separate SRT subtitles.',
    keywords: [
      'YouTube Shorts caption generator',
      'YouTube auto captions',
      'captions for YouTube clips',
    ],
  },
  '/platforms/tiktok': {
    title: 'TikTok Caption Generator and Subtitle Maker',
    description:
      'Create readable, animated TikTok subtitles with fast word timing and mobile-first video exports.',
    keywords: ['TikTok caption generator', 'TikTok subtitle maker', 'auto captions for TikTok'],
  },
  '/platforms/linkedin': {
    title: 'LinkedIn Video Caption Generator',
    description:
      'Make professional LinkedIn videos more accessible and engaging with accurate captions and clean templates.',
    keywords: [
      'LinkedIn video captions',
      'LinkedIn caption generator',
      'professional video subtitles',
    ],
  },
  '/templates': {
    title: 'Animated Video Caption Templates',
    description:
      'Start with creator-ready caption templates including karaoke, kinetic, editorial, podcast, and bold social styles.',
    keywords: [
      'animated caption templates',
      'viral caption styles',
      'kinetic typography templates',
    ],
  },
  '/pricing': {
    title: 'AI Video Caption Generator Pricing',
    description:
      'Compare Capgen plans for free caption exports, creator workflows, and growing video production teams.',
    keywords: ['caption generator pricing', 'AI subtitle software pricing', 'Capgen pricing'],
  },
  '/about': {
    title: 'About Capgen',
    description:
      'Learn why Capgen is building a simpler way to create accurate, expressive captions for modern video.',
    keywords: ['about Capgen', 'video caption company'],
  },
  '/contact': {
    title: 'Contact Capgen',
    description:
      'Contact the Capgen team about support, partnerships, feedback, or video caption workflows.',
    keywords: ['contact Capgen', 'Capgen support'],
  },
  '/privacy': {
    title: 'Privacy Policy',
    description:
      'Learn how Capgen handles account information, video uploads, transcriptions, and project data.',
    keywords: [],
  },
  '/terms': {
    title: 'Terms of Service',
    description:
      'Review the terms that govern use of Capgen’s video caption studio and related services.',
    keywords: [],
  },
};

export function getLandingMetadata(pathname: string): Metadata {
  const seo = routeSeo[pathname];
  if (!seo) {
    return { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } };
  }

  return {
    title: { absolute: `${seo.title} | Capgen` },
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: `${SITE_URL}${pathname}` },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `${SITE_URL}${pathname}`,
      siteName: 'Capgen',
      type: 'website',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'Capgen: turn your voice into captions automatically',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: ['/opengraph-image'],
    },
  };
}

export function getRouteSeo(pathname: string) {
  return routeSeo[pathname];
}

export function getPrivateMetadata(title: string, pathname: string): Metadata {
  return {
    title: { absolute: `${title} | Capgen` },
    description: `Access your Capgen ${title.toLowerCase()} workspace.`,
    robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
    openGraph: { title: `${title} | Capgen`, url: `${SITE_URL}${pathname}` },
  };
}
