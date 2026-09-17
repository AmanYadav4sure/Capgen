import type { Metadata } from 'next';

export const SITE_URL = 'https://capgen.app';

export const PUBLIC_SEO_ROUTES = [
  '/',
  '/use-cases',
  '/use-cases/creators',
  '/use-cases/podcasters',
  '/use-cases/agencies',
  '/use-cases/education',
  '/platforms/instagram',
  '/platforms/youtube',
  '/platforms/tiktok',
  '/platforms/linkedin',
  '/templates',
  '/pricing',
  '/solutions',
  '/resources',
  '/free-tools',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
] as const;

const routeSeo: Record<string, { title: string; description: string; keywords: string[] }> = {
  '/use-cases': {
    title: 'Video Caption Workflows for Every Creator',
    description: 'Create accurate, animated captions for creator videos, podcasts, agencies, and education with Capgen.',
    keywords: ['video caption workflows', 'captioning for creators', 'AI captions for content creators'],
  },
  '/use-cases/creators': {
    title: 'Caption Generator for Creators and Influencers',
    description: 'Turn vlogs, personal-brand videos, and short-form footage into readable, animated captions with Capgen.',
    keywords: ['caption generator for creators', 'captions for influencers', 'vlog caption generator'],
  },
  '/use-cases/podcasters': {
    title: 'Auto Captions for Video Podcasts',
    description: 'Find the best moments in long conversations and turn podcast clips into social-ready videos with synced captions.',
    keywords: ['podcast caption generator', 'auto captions for podcasts', 'podcast clip captions'],
  },
  '/use-cases/agencies': {
    title: 'Branded Caption Production for Agencies',
    description: 'Create consistent caption styles, resize social videos, and deliver branded edits faster with Capgen.',
    keywords: ['agency caption workflow', 'branded video captions', 'caption production software'],
  },
  '/use-cases/education': {
    title: 'Accessible Captions for Education Videos',
    description: 'Make lessons and course clips easier to follow with accurate subtitles, readable styling, and flexible exports.',
    keywords: ['education caption generator', '字幕 for courses', 'captions for teaching videos'],
  },
  '/platforms/instagram': {
    title: 'Instagram Caption Generator for Reels',
    description: 'Create vertical Instagram Reels with word-synced animated captions and exports sized for mobile viewing.',
    keywords: ['Instagram caption generator', 'Instagram Reels captions', 'auto captions for Instagram'],
  },
  '/platforms/youtube': {
    title: 'YouTube Shorts Caption Generator',
    description: 'Add accurate, high-retention captions to YouTube Shorts and clips with Capgen’s browser-based editor.',
    keywords: ['YouTube Shorts caption generator', 'YouTube auto captions', 'captions for YouTube clips'],
  },
  '/platforms/tiktok': {
    title: 'TikTok Caption Generator and Subtitle Maker',
    description: 'Create readable, animated TikTok subtitles with fast word timing and mobile-first video exports.',
    keywords: ['TikTok caption generator', 'TikTok subtitle maker', 'auto captions for TikTok'],
  },
  '/platforms/linkedin': {
    title: 'LinkedIn Video Caption Generator',
    description: 'Make professional LinkedIn videos more accessible and engaging with accurate captions and clean templates.',
    keywords: ['LinkedIn video captions', 'LinkedIn caption generator', 'professional video subtitles'],
  },
  '/templates': {
    title: 'Animated Video Caption Templates',
    description: 'Start with creator-ready caption templates including karaoke, kinetic, editorial, podcast, and bold social styles.',
    keywords: ['animated caption templates', 'viral caption styles', 'kinetic typography templates'],
  },
  '/pricing': {
    title: 'AI Video Caption Generator Pricing',
    description: 'Compare Capgen plans for free caption exports, creator workflows, and growing video production teams.',
    keywords: ['caption generator pricing', 'AI subtitle software pricing', 'Capgen pricing'],
  },
  '/solutions': {
    title: 'AI Video Caption Software for Content Teams',
    description: 'Transcribe, style, resize, and export social videos in one focused workspace for creators and teams.',
    keywords: ['AI video caption software', 'video subtitle workflow', 'content team captioning'],
  },
  '/resources': {
    title: 'Video Caption and Short-Form Editing Resources',
    description: 'Practical guidance for caption styles, creator workflows, video retention, and social-ready exports.',
    keywords: ['video caption guide', 'short-form video editing tips', 'caption style guide'],
  },
  '/free-tools': {
    title: 'Free Video Caption and Subtitle Tools',
    description: 'Explore free helpers for subtitles, video captions, aspect ratios, and short-form content workflows.',
    keywords: ['free caption tools', 'free subtitle tools', 'online caption generator'],
  },
  '/about': {
    title: 'About Capgen',
    description: 'Learn why Capgen is building a simpler way to create accurate, expressive captions for modern video.',
    keywords: ['about Capgen', 'video caption company'],
  },
  '/contact': {
    title: 'Contact Capgen',
    description: 'Contact the Capgen team about support, partnerships, feedback, or video caption workflows.',
    keywords: ['contact Capgen', 'Capgen support'],
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: 'Learn how Capgen handles account information, video uploads, transcriptions, and project data.',
    keywords: [],
  },
  '/terms': {
    title: 'Terms of Service',
    description: 'Review the terms that govern use of Capgen’s video caption studio and related services.',
    keywords: [],
  },
};

export function getLandingMetadata(pathname: string): Metadata {
  const seo = routeSeo[pathname];
  if (!seo) {
    return { robots: { index: false, follow: false } };
  }

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: pathname },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: pathname,
      siteName: 'Capgen',
      type: 'website',
      images: [{ url: '/caption.jpeg', alt: 'Capgen video caption editor' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: ['/caption.jpeg'],
    },
  };
}

export function getRouteSeo(pathname: string) {
  return routeSeo[pathname];
}
