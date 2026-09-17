import { NextResponse } from 'next/server';
import { PUBLIC_SEO_ROUTES, SITE_URL, getRouteSeo } from '@/lib/seo';

export function GET() {
  const pages = PUBLIC_SEO_ROUTES.filter((pathname) => pathname !== '/').map((pathname) => {
    const seo = getRouteSeo(pathname);
    return `- ${seo?.title ?? pathname} -> ${SITE_URL}${pathname}: ${seo?.description ?? ''}`;
  });

  const body = [
    '# Capgen',
    '> Capgen is an AI video caption generator and browser-based subtitle editor for creators, podcasters, agencies, educators, and social video teams.',
    '',
    '## Primary pages',
    `- Capgen home -> ${SITE_URL}: Create accurate animated captions and subtitles for short-form video.`,
    ...pages,
    '',
    '## Product facts',
    '- Capgen supports word-level caption timing, animated styles, multiple aspect ratios, and browser-based video export.',
    '- Capgen supports English, Hinglish, Nepali, Hindi, Spanish, French, German, Japanese, and additional languages through its transcription providers.',
    '- Public support contact: support@capgen.app',
  ].join('\n');

  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
