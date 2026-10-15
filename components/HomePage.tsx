'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';

import { useAuth } from '@/components/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
import CaptionStream, { type StreamClip } from '@/components/CaptionStream';
import CaptionStyleSample from '@/components/CaptionStyleSample';

const UpgradeModal = dynamic(
  () => import('@/components/UpgradeModal').then((m) => m.UpgradeModal),
  { ssr: false },
);
const AuthRequiredModal = dynamic(
  () => import('@/components/AuthRequiredModal').then((m) => m.AuthRequiredModal),
  { ssr: false },
);

// These still-image illustrations are not exported Capgen videos. Replace them only with
// verified source/result assets; the caption-free QA fixture is not a product demonstration.
const streamClips: StreamClip[] = [
  {
    id: 'creator',
    image: '/stream-creator.jpg',
    caption: 'This is insane!',
    accent: '#ffe45e',
    label: 'Creator',
    origin: '50% 38%',
  },
  {
    id: 'studio',
    image: '/stream-mindset.jpg',
    caption: 'Small steps. Big dreams.',
    accent: '#a8c7ff',
    label: 'Mindset',
    origin: '50% 42%',
  },
  {
    id: 'podcast',
    image: '/stream-podcast.jpg',
    caption: 'Building cool stuff never gets old.',
    accent: '#b8ff6a',
    label: 'Podcast',
    origin: '50% 30%',
  },
  {
    id: 'gaming',
    image: '/stream-gaming.jpg',
    caption: 'This game is crazy!',
    accent: '#7df9ff',
    label: 'Gaming',
    origin: '50% 20%',
  },
  {
    id: 'travel',
    image: '/stream-vibes.jpg',
    caption: 'Good vibes only.',
    accent: '#ff9ce8',
    label: 'Travel',
    origin: '50% 32%',
  },
  {
    id: 'dogs',
    image: '/stream-dogs.jpg',
    caption: 'Life is better with dogs.',
    accent: '#ffd68a',
    label: 'Lifestyle',
    origin: '50% 26%',
  },
  {
    id: 'cooking',
    image: '/stream-cooking.jpg',
    caption: 'Best meal I made all week.',
    accent: '#ffb0f0',
    label: 'Food',
    origin: '50% 30%',
  },
  {
    id: 'running',
    image: '/stream-fitness.jpg',
    caption: 'Sunrise miles hit different.',
    accent: '#9dffcf',
    label: 'Fitness',
    origin: '50% 18%',
  },
  {
    id: 'adventure',
    image: '/stream-travel.jpg',
    caption: 'Worth every single step.',
    accent: '#a8e9ff',
    label: 'Adventure',
    origin: '50% 22%',
  },
].map((clip, index) => ({
  ...clip,
  presetId: [
    'bumblebee',
    'tidemark',
    'shamani_gold_glow',
    'versely_neon',
    'clean_minimal',
    'mrbeast',
    'versely_bold',
    'ali_abdaal_marker',
    'sunset_glow',
  ][index],
}));

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { userProfile } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [faqActive, setFaqActive] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const regions = document.querySelectorAll('.capgen-below section, .caption-gallery-shell');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          (entry.target as HTMLElement).dataset.inViewport = String(entry.isIntersecting);
      },
      { rootMargin: '160px' },
    );
    regions.forEach((region) => observer.observe(region));
    return () => observer.disconnect();
  }, []);

  // Hero entrance and lightweight pointer/scroll depth.
  useEffect(() => {
    if (!heroRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const title = heroRef.current?.querySelector('.gsap-hero-title');
      const sub = heroRef.current?.querySelector('.gsap-hero-sub');
      const cta = heroRef.current?.querySelector('.gsap-hero-cta');
      const uiCards = heroRef.current?.querySelectorAll('.hero-float-ui');

      if (title) gsap.fromTo(title, { y: 25 }, { y: 0, duration: 0.8, ease: 'power3.out' });
      if (sub)
        gsap.fromTo(sub, { y: 20 }, { y: 0, duration: 0.8, delay: 0.15, ease: 'power3.out' });
      if (cta)
        gsap.fromTo(
          cta,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.6, delay: 0.3, ease: 'back.out(1.7)' },
        );
      if (uiCards?.length)
        gsap.fromTo(
          uiCards,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.65, delay: 1, stagger: 0.12, ease: 'power2.out' },
        );
    }, heroRef);

    const hero = heroRef.current;
    const handlePointer = (event: PointerEvent) => {
      if (window.matchMedia('(pointer: coarse)').matches) return;
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty(
        '--pointer-x',
        `${((event.clientX - rect.left) / rect.width - 0.5) * 2}`,
      );
      hero.style.setProperty(
        '--pointer-y',
        `${((event.clientY - rect.top) / rect.height - 0.5) * 2}`,
      );
    };
    const handleScroll = () => {
      const rect = hero.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, -rect.top / Math.max(rect.height, 1)));
      hero.style.setProperty('--scroll-depth', `${progress}`);
    };
    hero.addEventListener('pointermove', handlePointer, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      ctx.revert();
      hero.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const faqs = [
    {
      question: 'Can I use Capgen for free?',
      answer:
        'Yes. Every new account gets 5 free video exports with no watermarks, and re-exporting the same project never costs extra credits.',
    },
    {
      question: 'How accurate are the captions?',
      answer:
        'Capgen generates a transcript with word timestamps. Accuracy depends on audio quality, accents and overlapping speech. Preview the captions and review names and technical terms before publishing.',
    },
    {
      question: 'Which languages are supported?',
      answer:
        'The studio includes language choices such as English, Hindi, Nepali, Spanish, French, German, Arabic and Japanese. Results depend on the recording and transcription service. Choose the spoken language when generating captions.',
    },
    {
      question: 'Can I customize caption styles?',
      answer:
        'Yes. Choose built-in caption styles such as The Bumblebee and Versely Cyber Neon, or customize fonts, colors, placement and word highlights. Motion options include pop, marker, bounce, glow, fade-slide and typewriter.',
    },
    {
      question: 'Can I export SRT files?',
      answer:
        'Yes. Download timed captions as an SRT file. SRT contains text and cue times; the video export preserves the fonts, colors and animations.',
    },
    {
      question: 'Which video formats are supported?',
      answer:
        'Upload video formats your browser can play. Free accounts have a 100 MB upload limit; paid plans have larger allowances. Choose 9:16, 1:1 or 16:9 for export. Output format and resolution depend on browser and device support.',
    },
    {
      question: 'Can I edit captions after generation?',
      answer:
        'You can change the caption style, animation and aspect ratio any time, and re-export the same project for free. Editing individual caption words or their timings is not available yet.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-white text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Glass Glow Orbs */}
      <div className="fixed top-24 left-1/4 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-2/3 right-10 w-[450px] h-[450px] bg-purple-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. FLOATING STICKY NAVBAR (GLASS UI) */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2">
        <div className="max-w-5xl mx-auto bg-white/75 backdrop-blur-xl border border-white/80 shadow-lg shadow-blue-500/5 rounded-full px-6 py-3 flex items-center justify-between transition-all">
          {/* Left: Brand Logo */}
          <Logo />

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <Link href="#features" className="hover:text-blue-600 transition-colors">
              Features
            </Link>
            <Link href="#use-cases" className="hover:text-blue-600 transition-colors">
              Use cases
            </Link>
            <Link href="/pricing" className="hover:text-blue-600 transition-colors">
              Pricing
            </Link>
          </nav>

          {/* Right Auth / Action CTA */}
          <div className="flex items-center gap-3">
            {userProfile ? (
              <div className="flex items-center gap-3">
                {!isHome && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-700 text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer backdrop-blur-md"
                  >
                    <span className="hidden sm:inline">{userProfile.credits} Free Exports</span>
                    <span className="sm:hidden">{userProfile.credits}</span>
                  </button>
                )}
                <Link
                  href="/profile"
                  className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20 hover:scale-105 transition-transform"
                  title={userProfile.name}
                >
                  {userProfile.name.charAt(0).toUpperCase()}
                </Link>
              </div>
            ) : (
              <Link
                href="/editor"
                className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-105 items-center gap-1.5"
              >
                <span>Get Started</span>
              </Link>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-h-11 px-2 text-xs font-semibold text-slate-700 hover:text-blue-600 focus:outline-none"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="home-mobile-menu"
            >
              {mobileMenuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <div
            id="home-mobile-menu"
            className="md:hidden max-w-5xl mx-auto mt-2 bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 font-semibold text-slate-700 text-sm"
          >
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
            >
              Features
            </Link>
            <Link
              href="#use-cases"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
            >
              Use cases
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/editor"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white text-center rounded-xl font-bold shadow-md shadow-blue-500/20"
            >
              Open Studio Editor
            </Link>
          </div>
        )}
      </header>

      {/* 2. CINEMATIC CAPTION GALLERY HERO */}
      <main id="main-content">
        <section ref={heroRef} className="capgen-cinematic-hero">
          <div className="hero-sky-layer" aria-hidden="true" />
          <div className="hero-atmosphere" aria-hidden="true" />

          <div className="hero-copy-wrap">
            <div className="hero-kicker"> AI video caption generator</div>
            <h1 className="gsap-hero-title">
              <span>Turn Your Voice</span>
              <span className="hero-gradient-copy">into Captions</span>
              <em>Automatically</em>
            </h1>
            <p className="gsap-hero-sub">
              Upload your video, generate captions synced to speech, customize the style, and export
              a clip ready to share.
            </p>
            <button
              onClick={() => (userProfile ? router.push('/editor') : setShowAuthModal(true))}
              className="gsap-hero-cta hero-primary-cta"
            >
              <span>Start Captioning</span>
            </button>
            <ul className="hero-benefits" aria-label="Included with your new account">
              <li>5 Free Exports</li>
              <li>No Watermark</li>
              <li>SRT Export</li>
            </ul>
          </div>

          <div className="caption-gallery-shell">
            <div className="caption-orbit" aria-hidden="true" />
            <div className="hero-float-ui float-ui-left">
              <span>
                <b>Voice → Captions</b>
                <small>Automatically</small>
              </span>
            </div>
            <div className="hero-float-ui float-ui-right">
              <span>
                <b>Auto Captions</b>
                <small>On your video</small>
              </span>
            </div>
            <div className="hero-float-ui float-ui-timing">
              <span className="timing-dot" /> <b>Word-level timing</b>
            </div>

            <CaptionStream clips={streamClips} />
          </div>
          <p className="gallery-sample-note">
            Still-image caption illustrations. Try your own video in the Studio.
          </p>
        </section>

        {/* ================= BELOW THE FOLD ================= */}
        <div className="capgen-below">
          {/* 01 — PRODUCT VALUE */}
          <section id="features" className="max-w-6xl mx-auto px-6 pt-6 pb-14 scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              <div className="lg:col-span-5">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  From raw video to
                  <br className="hidden sm:block" /> ready-to-share captions.
                </h2>
                <p className="mt-4 text-slate-600 text-base leading-relaxed max-w-md">
                  Capgen is an AI video caption generator for Reels, TikTok and YouTube Shorts. Turn
                  video speech into timed subtitles, customize the style, and download a captioned
                  video or an SRT file.
                </p>
                <Link
                  href="/editor"
                  className="inline-flex items-center gap-2 mt-7 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Open the Studio
                </Link>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Auto captions */}
                <div className="capgen-feature-card">
                  <div className="flex items-center gap-2.5">
                    <span className="capgen-feature-tag">AUTO CAPTIONS</span>
                  </div>
                  <h3 className="capgen-feature-title">Auto Captions</h3>
                  <p className="capgen-feature-desc">
                    Generate timed captions from your video&apos;s spoken audio.
                  </p>
                  <div className="fv-preview fv-auto">
                    <Image
                      src="/stream-creator.jpg"
                      alt=""
                      width={540}
                      height={960}
                      sizes="(max-width: 767px) 45vw, 260px"
                    />
                    <span className="fv-overlay">Captions synced to speech</span>
                    <span className="fv-wave">
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                </div>

                {/* Word-level timing */}
                <div className="capgen-feature-card">
                  <div className="flex items-center gap-2.5">
                    <span className="capgen-feature-tag capgen-tag-purple">WORD-LEVEL TIMING</span>
                  </div>
                  <h3 className="capgen-feature-title">Word-Level Timing</h3>
                  <p className="capgen-feature-desc">Highlight words in sync with the speaker.</p>
                  <div className="fv-preview fv-word">
                    <span>Light up</span>
                    <em>every</em>
                    <span>word as you speak</span>
                  </div>
                </div>

                {/* Caption styles */}
                <div className="capgen-feature-card">
                  <div className="flex items-center gap-2.5">
                    <span className="capgen-feature-tag capgen-tag-violet">CAPTION STYLES</span>
                  </div>
                  <h3 className="capgen-feature-title">Caption Styles</h3>
                  <p className="capgen-feature-desc">
                    Choose fonts, colors, layouts and caption presets.
                  </p>
                  <div className="fv-preview fv-styles">
                    <span className="fs-chip fs-default">Default</span>
                    <span className="fs-chip fs-neon">Neon</span>
                    <span className="fs-chip fs-bold">BOLD</span>
                    <span className="fs-chip fs-marker">Marker</span>
                  </div>
                </div>

                {/* Animated captions */}
                <div className="capgen-feature-card">
                  <div className="flex items-center gap-2.5">
                    <span className="capgen-feature-tag capgen-tag-amber">ANIMATED CAPTIONS</span>
                  </div>
                  <h3 className="capgen-feature-title">Animated Captions</h3>
                  <p className="capgen-feature-desc">Add pop, marker, glow or typewriter motion.</p>
                  <div className="fv-preview fv-anim">
                    <span className="fv-pop">POP!</span>
                  </div>
                </div>

                {/* SRT export */}
                <div className="capgen-feature-card">
                  <div className="flex items-center gap-2.5">
                    <span className="capgen-feature-tag capgen-tag-emerald">SRT EXPORT</span>
                  </div>
                  <h3 className="capgen-feature-title">SRT Export</h3>
                  <p className="capgen-feature-desc">Download your captions as an SRT file.</p>
                  <div className="fv-preview fv-srt">
                    <span className="srt-file"> captions.srt</span>
                    <span className="srt-line">
                      <b>00:01.200</b> → <b>00:03.850</b> Hello world
                    </span>
                    <span className="srt-line">
                      <b>00:03.850</b> → <b>00:06.200</b> This is Capgen
                    </span>
                  </div>
                </div>

                {/* Aspect ratios */}
                <div className="capgen-feature-card">
                  <div className="flex items-center gap-2.5">
                    <span className="capgen-feature-tag capgen-tag-cyan">
                      MULTIPLE ASPECT RATIOS
                    </span>
                  </div>
                  <h3 className="capgen-feature-title">Multiple Aspect Ratios</h3>
                  <p className="capgen-feature-desc">Create videos for 9:16, 1:1 and 16:9.</p>
                  <div className="fv-preview fv-ratio">
                    <span className="frame f9-16">
                      <i />
                      9:16
                    </span>
                    <span className="frame f1-1">
                      <i />
                      1:1
                    </span>
                    <span className="frame f16-9">
                      <i />
                      16:9
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 02 — WORKFLOW */}
          <section className="capgen-workflow">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <h2 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                From video to finished captions.
              </h2>
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="capgen-step">
                  <span className="capgen-step-num">01</span>
                  <h3>Upload your video</h3>
                  <p>Choose a video from your device.</p>
                </div>
                <div className="capgen-step">
                  <span className="capgen-step-num">02</span>
                  <h3>Generate captions</h3>
                  <p>Select the spoken language and generate synchronized captions.</p>
                </div>
                <div className="capgen-step">
                  <span className="capgen-step-num">03</span>
                  <h3>Customize &amp; export</h3>
                  <p>
                    Choose fonts, colors and animation, then export a captioned video or SRT
                    subtitles.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 03 — CAPTION STYLE SHOWCASE */}
          <section className="max-w-6xl mx-auto px-6 pt-14 pb-14">
            <div className="text-center max-w-2xl mx-auto">
              <span className="capgen-eyebrow">Caption Styles</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                See how your captions can look.
              </h2>
              <p className="mt-3 text-slate-600 text-base leading-relaxed">
                Compare fonts, word highlights and contrast using presets from the Studio. These are
                style illustrations, not exported clips.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              <div className="capgen-style-card">
                <div className="capgen-style-media">
                  <Image
                    src="/stream-creator.jpg"
                    alt="Default caption style preview"
                    width={540}
                    height={960}
                    sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 220px"
                  />
                  <div className="capgen-style-caption">
                    <CaptionStyleSample
                      presetId="clean_minimal"
                      text="Here's how I made this video."
                      activeWord={3}
                    />
                  </div>
                  <span className="capgen-style-bar">
                    <i />
                  </span>
                </div>
                <p className="capgen-style-name">Default</p>
                <p className="caption-preset-name">Apple Minimalist</p>
              </div>

              <div className="capgen-style-card">
                <div className="capgen-style-media">
                  <Image
                    src="/stream-creator.jpg"
                    alt="Bold caption style preview"
                    width={540}
                    height={960}
                    sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 220px"
                  />
                  <div className="capgen-style-caption">
                    <CaptionStyleSample
                      presetId="versely_bold"
                      text="MAKE EVERY WORD COUNT."
                      activeWord={2}
                    />
                  </div>
                  <span className="capgen-style-bar">
                    <i />
                  </span>
                </div>
                <p className="capgen-style-name">Bold</p>
                <p className="caption-preset-name">Versely Bold Impact</p>
              </div>

              <div className="capgen-style-card">
                <div className="capgen-style-media">
                  <Image
                    src="/stream-creator.jpg"
                    alt="Highlight caption style preview"
                    width={540}
                    height={960}
                    sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 220px"
                  />
                  <div className="capgen-style-caption">
                    <CaptionStyleSample
                      presetId="tidemark"
                      text="Small changes. Better videos."
                      activeWord={2}
                    />
                  </div>
                  <span className="capgen-style-bar">
                    <i />
                  </span>
                </div>
                <p className="capgen-style-name">Highlight</p>
                <p className="caption-preset-name">Tidemark Marker</p>
              </div>

              <div className="capgen-style-card">
                <div className="capgen-style-media">
                  <Image
                    src="/stream-creator.jpg"
                    alt="Neon caption style preview"
                    width={540}
                    height={960}
                    sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 220px"
                  />
                  <div className="capgen-style-caption">
                    <CaptionStyleSample
                      presetId="versely_neon"
                      text="LET YOUR STORY STAND OUT."
                      activeWord={2}
                    />
                  </div>
                  <span className="capgen-style-bar">
                    <i />
                  </span>
                </div>
                <p className="capgen-style-name">Neon</p>
                <p className="caption-preset-name">Versely Cyber Neon</p>
              </div>

              <div className="capgen-style-card">
                <div className="capgen-style-media">
                  <Image
                    src="/stream-creator.jpg"
                    alt="Pop caption style preview"
                    width={540}
                    height={960}
                    sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 220px"
                  />
                  <div className="capgen-style-caption">
                    <CaptionStyleSample
                      presetId="bumblebee"
                      text="Wait until you see this!"
                      activeWord={3}
                    />
                  </div>
                  <span className="capgen-style-bar">
                    <i />
                  </span>
                </div>
                <p className="capgen-style-name">Pop</p>
                <p className="caption-preset-name">The Bumblebee</p>
              </div>
            </div>
          </section>

          {/* 04 — PRODUCT DEMONSTRATION */}
          <section id="use-cases" className="max-w-6xl mx-auto px-6 pt-14 pb-14 scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <div className="lg:col-span-5">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Turn speech into captions automatically.
                </h2>
                <p className="mt-4 text-slate-600 text-base leading-relaxed max-w-md">
                  Upload a video, generate timed captions, then adjust the fonts, colors and layout
                  in one studio. Preview the result before exporting.
                </p>
                <ul className="capgen-checklist">
                  <li> Automatic transcription</li>
                  <li> Word-level timing</li>
                  <li> Custom caption styles</li>
                  <li> Export-ready videos</li>
                </ul>
              </div>

              <div className="lg:col-span-7">
                <p className="mb-3 text-xs text-slate-600">
                  Studio illustration. Caption words and timings are not individually editable.
                </p>
                <div
                  className="capgen-editor-mock"
                  role="img"
                  aria-label="Non-interactive Studio illustration with generated clips, a caption preview, and Templates, Motion and Layout panels"
                >
                  <div className="mock-window-bar">
                    <span className="mock-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="mock-window-title">Capgen Studio — untitled.mp4</span>
                  </div>
                  <div className="mock-header">
                    <span className="mock-credits"> 5 Free Exports</span>
                    <span className="mock-srt-btn">SRT</span>
                    <span className="mock-export-btn">Export HD Video</span>
                  </div>
                  <div className="mock-body">
                    <aside className="mock-clips">
                      <div className="mock-panel-label"> Clips</div>
                      <div className="mock-clip active">
                        <span className="mock-clip-thumb">
                          <Image
                            src="/stream-gaming.jpg"
                            alt=""
                            width={540}
                            height={960}
                            sizes="40px"
                          />
                        </span>
                        <span className="mock-clip-meta">
                          <b>This game is crazy!</b>
                          <span className="mock-word-chip">Clip #1</span>
                          <small>00:12 · 4 words</small>
                        </span>
                      </div>
                      <div className="mock-clip">
                        <span className="mock-clip-thumb">
                          <Image
                            src="/stream-creator.jpg"
                            alt=""
                            width={540}
                            height={960}
                            sizes="40px"
                          />
                        </span>
                        <span className="mock-clip-meta">
                          <b>This is insane!</b>
                          <small>00:08 · 3 words</small>
                        </span>
                      </div>
                      <div className="mock-clip">
                        <span className="mock-clip-thumb">
                          <Image
                            src="/stream-podcast.jpg"
                            alt=""
                            width={540}
                            height={960}
                            sizes="40px"
                          />
                        </span>
                        <span className="mock-clip-meta">
                          <b>Building cool stuff…</b>
                          <small>00:05 · 5 words</small>
                        </span>
                      </div>
                      <div className="mock-clip-add">Generated caption clips</div>
                    </aside>

                    <div className="mock-canvas">
                      <div className="mock-video">
                        <Image
                          src="/stream-gaming.jpg"
                          alt=""
                          width={540}
                          height={960}
                          sizes="(max-width: 767px) 40vw, 260px"
                        />
                        <div className="mock-caption">
                          This game is <em>crazy</em>!
                        </div>
                        <div className="mock-playbar">
                          <span className="mock-play">Preview</span>
                          <span className="mock-progress">
                            <i />
                          </span>
                          <span className="mock-time">00:04</span>
                          <span className="mock-sound">
                            <i />
                            <i />
                            <i />
                            <i />
                          </span>
                        </div>
                      </div>
                      <div className="mock-timeline">
                        <div className="mock-tl-head">
                          <span>Timeline</span>
                          <span>00:04 / 00:12</span>
                        </div>
                        <div className="mock-tl-track">
                          <span className="mock-tl-wave">
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                          </span>
                          <span className="mock-tl-caption" />
                          <span className="mock-tl-playhead" />
                        </div>
                      </div>
                    </div>

                    <aside className="mock-inspector">
                      <div className="mock-tabs">
                        <span className="active">Templates</span>
                        <span>Motion</span>
                        <span>Layout</span>
                      </div>
                      <div className="mock-tpl-grid">
                        <span className="mock-tpl tpl-bee">
                          <i>
                            The <b>Bumblebee</b>
                          </i>
                        </span>
                        <span className="mock-tpl tpl-neon">
                          <i>
                            Cyber <b>Neon</b>
                          </i>
                        </span>
                        <span className="mock-tpl tpl-bold">
                          <i>
                            BOLD <b>IMPACT</b>
                          </i>
                        </span>
                        <span className="mock-tpl tpl-marker">
                          <i>
                            Ali <b>Marker</b>
                          </i>
                        </span>
                      </div>
                      <div className="mock-style-rows">
                        <div className="mock-style-row">
                          <span>Font</span>
                          <b>Anton</b>
                        </div>
                        <div className="mock-style-row">
                          <span>Size</span>
                          <b>24 px</b>
                        </div>
                        <div className="mock-style-row">
                          <span>Highlight</span>
                          <span className="mock-color-dots">
                            <i />
                            <i />
                            <i />
                            <i />
                          </span>
                        </div>
                      </div>
                      <div className="mock-style-row mock-animation-row">
                        <span>Animation</span>
                        <b>Pop</b>
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 05 — FINAL CTA */}
          <section className="max-w-6xl mx-auto px-6 pt-8 pb-14">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Caption videos for the way you publish
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Prepare your own footage for{' '}
              <Link href="/platforms/instagram" className="text-blue-600 underline">
                Instagram Reels
              </Link>
              ,{' '}
              <Link href="/platforms/tiktok" className="text-blue-600 underline">
                TikTok videos
              </Link>{' '}
              or{' '}
              <Link href="/platforms/youtube" className="text-blue-600 underline">
                YouTube Shorts
              </Link>
              . Each guide covers captions inside the video, canvas choice and manual upload.
            </p>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Browse{' '}
              <Link href="/templates" className="text-blue-600 underline">
                animated caption styles
              </Link>
              , learn the{' '}
              <Link href="/features/srt-subtitles" className="text-blue-600 underline">
                SRT subtitle workflow
              </Link>
              , or explore{' '}
              <Link href="/use-cases" className="text-blue-600 underline">
                captioning workflows for creators, podcasters and teams
              </Link>
              .
            </p>
          </section>
          <section className="max-w-6xl mx-auto px-6 pt-14 pb-14">
            <div className="capgen-cta">
              <div className="capgen-cta-copy">
                <h2>
                  Ready to caption
                  <br />
                  your next video?
                </h2>
                <p>Generate timed captions, choose a style and export your video.</p>
                <div className="capgen-cta-actions">
                  <button
                    onClick={() => (userProfile ? router.push('/editor') : setShowAuthModal(true))}
                    className="cta-btn-primary"
                  >
                    Start Captioning
                  </button>
                  <button
                    onClick={() => (userProfile ? router.push('/editor') : setShowAuthModal(true))}
                    className="cta-btn-secondary"
                  >
                    Open Studio
                  </button>
                </div>
              </div>
              <div className="capgen-cta-visual" aria-hidden="true">
                <div className="cta-phone">
                  <div className="cta-phone-screen">
                    <Image src="/stream-vibes.jpg" alt="" width={540} height={960} sizes="160px" />
                    <div className="cta-phone-caption">
                      Good <em>vibes</em> only.
                    </div>
                    <div className="cta-phone-bar">
                      <span className="cta-phone-progress">
                        <i />
                      </span>
                      <span className="cta-phone-wave">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 06 — FAQ */}
          <section className="max-w-3xl mx-auto px-6 pt-14 pb-14">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Frequently asked questions
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Free exports, supported formats and what you can customize.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = faqActive === index;
                return (
                  <div
                    key={index}
                    className="bg-white/70 backdrop-blur-xl border border-white/85 rounded-2xl overflow-hidden shadow-sm hover:bg-white/85 transition-all"
                  >
                    <button
                      onClick={() => setFaqActive(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      aria-controls={`home-faq-${index}`}
                      className="w-full px-6 py-4 text-left font-bold text-slate-900 flex justify-between items-center text-sm sm:text-base cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <span className="disclosure-label">{isOpen ? 'Hide' : 'Show'}</span>
                    </button>
                    <div
                      id={`home-faq-${index}`}
                      hidden={!isOpen}
                      className="px-6 pb-4 text-slate-600 text-sm leading-relaxed border-t border-slate-200/50 pt-3"
                    >
                      {faq.answer}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* 07 — FOOTER */}
      <footer className="capgen-footer">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              Turn spoken video into styled captions and SRT subtitles.
            </p>
          </div>

          <nav className="flex gap-14" aria-label="Footer">
            <div className="capgen-footer-col">
              <b>Product</b>
              <Link href="#features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/editor">Studio</Link>
            </div>
            <div className="capgen-footer-col">
              <b>Company</b>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/about">About</Link>
            </div>
          </nav>

          <span className="text-xs text-slate-500">© 2026 Capgen.app. All rights reserved.</span>
        </div>
      </footer>

      {/* Auth Required & Upgrade Modals */}
      {showAuthModal && (
        <AuthRequiredModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => router.push('/editor')}
        />
      )}
      {showUpgradeModal && (
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
