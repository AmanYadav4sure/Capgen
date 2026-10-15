import { NextResponse } from 'next/server';
import { PUBLIC_SEO_ROUTES, SITE_URL, getRouteSeo } from '@/lib/seo';

export function GET() {
  const pages = PUBLIC_SEO_ROUTES.filter((pathname) => pathname !== '/').map((pathname) => {
    const seo = getRouteSeo(pathname);
    return `- ${seo?.title ?? pathname} -> ${SITE_URL}${pathname}: ${seo?.description ?? ''}`;
  });

  const body = [
    '# Capgen',
    '> Capgen is an AI video caption generator and browser-based subtitle editor for creators, podcasters, agencies, educators, and social video teams. It turns spoken audio into word-synced animated captions and exports finished videos without watermarks.',
    '',
    '## Primary pages',
    `- Capgen home -> ${SITE_URL}: Create accurate animated captions and subtitles for short-form video.`,
    ...pages,
    '',
    '## Product facts',
    '- Free plan: 5 free video exports per account, 100 MB max upload, zero watermarks. Re-exporting the same project never costs extra credits.',
    '- Paid plans: Pro and Team subscriptions with higher upload limits and monthly credit pools. See the pricing page for current plans.',
    '- Captioning: generated word timestamps, caption presets including The Bumblebee and Versely Cyber Neon, and animations including pop, marker, bounce, glow, fade-slide and typewriter.',
    '- Languages: the studio offers language selection including English, Hindi, Nepali, Spanish, French, German, Japanese and Arabic. Recognition quality depends on the recording and provider.',
    '- Export: captioned video (MP4 or WebM depending on browser) and SRT subtitle file download. Aspect ratios 9:16, 1:1 and 16:9; resolution and frame rate adapt to the device.',
    '- Workflow: upload a video, generate captions, preview and style them, then export. Editing and rendering run in the browser; extracted audio is sent to server transcription providers.',
    '- Privacy: videos are processed to create captions; see the privacy policy for how account and project data is handled.',
    '- Public support contact: support@capgen.app',
    '',
    '## Frequently asked questions',
    '- Is Capgen free? Yes — every new account gets 5 free video exports with no watermarks.',
    '- Which languages are supported? Choose the spoken language in the studio; options include English, Hindi and Nepali.',
    '- Can I export SRT files? Yes — download captions as an SRT file for editors like Premiere Pro.',
    '- Can I customize caption styles? Yes: presets, fonts, colors, placement, animations and words per screen.',
    '- Can I edit captions after generation? You can change style, animation, and aspect ratio any time and re-export for free; editing individual caption words or their timings is not available yet.',
  ].join('\n');

  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
