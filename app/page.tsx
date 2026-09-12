'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import {
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  ChevronDown,
  Video,
  Mic,
  Wand2,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getOrCreateUserProfile } from '@/lib/firebase/db';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile } from '@/lib/firebase/types';
import { UpgradeModal } from '@/components/UpgradeModal';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import Logo from '@/components/Logo';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { user, userProfile } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [faqActive, setFaqActive] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroRef = useRef<HTMLDivElement | null>(null);

  // GSAP Smooth Hero & Reel Entrance
  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const title = heroRef.current?.querySelector('.gsap-hero-title');
      const sub = heroRef.current?.querySelector('.gsap-hero-sub');
      const cta = heroRef.current?.querySelector('.gsap-hero-cta');
      const phones = document.querySelectorAll('.gsap-reel-phone');

      if (title) gsap.fromTo(title, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      if (sub) gsap.fromTo(sub, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.15, ease: 'power3.out' });
      if (cta) gsap.fromTo(cta, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.3, ease: 'back.out(1.7)' });
      if (phones.length > 0) gsap.fromTo(phones, { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.4, stagger: 0.1, ease: 'power2.out' });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const faqs = [
    {
      question: 'Can I try VideoCaptions.AI for free?',
      answer: 'Yes! Every new account gets 2 free video exports with zero watermarks and full commercial rights.',
    },
    {
      question: 'What languages are supported?',
      answer: 'We support 99+ languages including English, Hinglish (Latin Hindi), Nepali, Devanagari Hindi, Spanish, Arabic, and Japanese.',
    },
    {
      question: 'How accurate is the word-level timing?',
      answer: 'Our AI engine syncs words with 60fps sub-second acoustic precision, so captions light up at the exact millisecond spoken.',
    },
    {
      question: 'Can I re-edit my exported projects without spending credits?',
      answer: 'Absolutely! Credits are deducted only ONCE per project. You get unlimited free re-exports for the same video.',
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
                    <Zap size={13} className="fill-amber-500 stroke-amber-500" />
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
                <ArrowRight size={14} />
              </Link>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:text-blue-600 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden max-w-5xl mx-auto mt-2 bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 font-semibold text-slate-700 text-sm">
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

      {/* 2. HERO SECTION (WITH SKY BACKGROUND /bgimg.avif) */}
      <section ref={heroRef} className="relative pt-36 pb-28 overflow-hidden bg-[url('/bgimg.avif')] bg-cover bg-center min-h-[580px] flex flex-col items-center justify-center text-center px-4">
        {/* Subtle Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-slate-50 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Main H1 Headline */}
          <h1 className="gsap-hero-title text-4xl sm:text-5xl lg:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-tight sm:leading-[1.15]">
            Ai video caption generator for <br className="hidden sm:inline" />
            <span className="inline-flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <span className="bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                Reels
              </span>
              <span className="text-slate-900">,</span>
              <span className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500 bg-clip-text text-transparent">
                Shorts
              </span>
              <span className="text-slate-900">&amp;</span>
              <span className="relative inline-block text-black font-black drop-shadow-[1.5px_1.5px_0px_#25F4EE] [-webkit-text-stroke:0.75px_#FE2C55]">
                TikTok
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="gsap-hero-sub text-slate-700 text-base sm:text-lg max-w-2xl mt-5 font-medium leading-relaxed bg-white/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/60 shadow-sm">
            Auto caption videos with word-level timing, animated subtitles, and creator-ready styles in seconds. Generate captions for Reels, Shorts, TikTok, and podcasts.
          </p>

          {/* Primary Action Button */}
          <button
            onClick={() => {
              if (!userProfile) {
                setShowAuthModal(true);
              } else {
                router.push('/editor');
              }
            }}
            className="gsap-hero-cta bg-blue-500 hover:bg-blue-400 text-white px-8 py-3.5 rounded-full font-semibold text-base shadow-xl shadow-blue-500/30 transition-all hover:scale-105 inline-flex items-center gap-2 mt-8 cursor-pointer"
          >
            <span>Create Captions</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* 3. THE 4 FLOATING IPHONE REELS WITH REAL VIDEOS (HERO OVERLAP - OPTIMIZED FOR MOBILE GPU) */}
      <section className="-mt-16 relative z-20 max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
          {/* Phone 1: mrbeast.mp4 (Primary Video) */}
          <div className="gsap-reel-phone aspect-[9/16] w-36 xs:w-40 sm:w-52 md:w-56 bg-slate-900/95 md:backdrop-blur-xl rounded-[32px] sm:rounded-[36px] p-2 sm:p-2.5 shadow-2xl border-4 border-slate-800/80 relative overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 sm:w-16 h-3 sm:h-3.5 bg-black rounded-full mx-auto absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-20 border border-slate-800" />
            <div className="relative w-full h-full rounded-[24px] sm:rounded-[28px] overflow-hidden bg-black flex flex-col justify-end">
              <video
                src="/mrbeast.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Phone 2: 3.mp4 */}
          <div className="gsap-reel-phone aspect-[9/16] w-36 xs:w-40 sm:w-52 md:w-56 bg-slate-900/95 md:backdrop-blur-xl rounded-[32px] sm:rounded-[36px] p-2 sm:p-2.5 shadow-2xl border-4 border-slate-800/80 relative overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 md:mt-6">
            <div className="w-12 sm:w-16 h-3 sm:h-3.5 bg-black rounded-full mx-auto absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-20 border border-slate-800" />
            <div className="relative w-full h-full rounded-[24px] sm:rounded-[28px] overflow-hidden bg-black flex flex-col justify-end">
              <video
                src="/3.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Phone 3: 2.mp4 (Hidden on small mobile screens to prevent GPU overheat) */}
          <div className="gsap-reel-phone hidden sm:block aspect-[9/16] w-36 xs:w-40 sm:w-52 md:w-56 bg-slate-900/95 md:backdrop-blur-xl rounded-[32px] sm:rounded-[36px] p-2 sm:p-2.5 shadow-2xl border-4 border-slate-800/80 relative overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 sm:w-16 h-3 sm:h-3.5 bg-black rounded-full mx-auto absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-20 border border-slate-800" />
            <div className="relative w-full h-full rounded-[24px] sm:rounded-[28px] overflow-hidden bg-black flex flex-col justify-end">
              <video
                src="/2.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
            </div>
          </div>

          {/* Phone 4: podcast.mp4 (Hidden on small mobile screens to prevent GPU overheat) */}
          <div className="gsap-reel-phone hidden sm:block aspect-[9/16] w-36 xs:w-40 sm:w-52 md:w-56 bg-slate-900/95 md:backdrop-blur-xl rounded-[32px] sm:rounded-[36px] p-2 sm:p-2.5 shadow-2xl border-4 border-slate-800/80 relative overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 md:mt-6">
            <div className="w-12 sm:w-16 h-3 sm:h-3.5 bg-black rounded-full mx-auto absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-20 border border-slate-800" />
            <div className="relative w-full h-full rounded-[24px] sm:rounded-[28px] overflow-hidden bg-black flex flex-col justify-end">
              <video
                src="/podcast.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. "MAKE BETTER VIDEOS IN MINUTES." (WHITE GLASSMORPHIC STUDIO BOX) */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8 leading-tight">
            Make better videos in minutes.
          </h2>

          <div className="space-y-4">
            {/* Feature 1 */}
            <div className="bg-white/65 backdrop-blur-xl border border-white/80 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
                <TrendingUp size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">From video to viral</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Turn raw video to viral clips, accelerate online growth with automated edits.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/65 backdrop-blur-xl border border-white/80 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shrink-0">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Quality in every video</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Context-aware styling that matches the rhythm and emotion of speech.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/65 backdrop-blur-xl border border-white/80 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No hours required</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Skip manual timeline trimming and tedious typing. Done in seconds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Studio Mockup Window (CHANGED TO WHITE GLASSMORPHIC) */}
        <div className="lg:col-span-7">
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-5 border border-white/90 shadow-xl shadow-blue-500/5 text-slate-900">
            {/* Top Window Bar */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">Caption Lite</span>
            </div>

            {/* Editor Canvas Mockup */}
            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner flex items-center justify-center">
              <img
                src="/caption.jpeg"
                alt="Capgen video caption editor preview"
                className="w-full h-full object-cover  opacity-85"
              />
              <div className="absolute bottom-4 inset-x-0 flex justify-center">
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DUAL DEMO CARDS (BOTH NOW IN WHITE FROSTED GLASSMORPHISM) */}
      <section className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6 pb-16">
        {/* Card 1: AI Avatar Demo (White Glassmorphic) */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white/90 rounded-3xl p-6 shadow-xl shadow-blue-500/5 flex flex-col justify-between hover:bg-white/85 hover:shadow-2xl transition-all">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">FEATURE PREVIEW</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1 mb-2">AI Creator Avatar</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Generate lifelike digital creators that speak your exact script with natural facial cadence.
            </p>
          </div>
          <div className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80 flex items-center justify-center shadow-inner">
            <img
              src="/ai-avatar.jpeg"
                alt="AI creator avatar video demo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {/* Card 2: Kinetic Caption Demo (CHANGED FROM DARK TO WHITE GLASSMORPHIC) */}

        <div className="bg-white/70 backdrop-blur-2xl border border-white/90 rounded-3xl p-6 shadow-xl shadow-blue-500/5 flex flex-col justify-between hover:bg-white/85 hover:shadow-2xl transition-all">
  <div>
    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Language Translation</span>
    <h3 className="text-xl font-bold text-slate-900 mt-1 mb-2">Voice Translation</h3>
    <p className="text-slate-600 text-sm leading-relaxed mb-6">
      Change your video language instantly for free.
    </p>
  </div>
  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/90 shadow-inner flex items-center justify-center">
    <img
      src="/lang.jpeg"
      alt="Voice translation video demo"
      className="w-full h-full object-cover object-center"
    />
  </div>
</div>
</section>

      {/* 6. "JUST CREATE TO BE VIRAL" (3-COLUMN BENTO GRID WITH FROSTED GLASS) */}
      <section id="use-cases" className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-10">
          Just create to be viral
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1 */}
          <div className="bg-white/65 backdrop-blur-xl border border-white/85 rounded-3xl p-6 shadow-lg shadow-blue-500/5 hover:bg-white/80 hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 mb-4">
                <Video size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Auto Caption</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Instant sub-second word sync supporting 99+ languages including Hinglish &amp; Nepali.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/50 text-xs font-semibold text-blue-600">
              Sub-second precision →
            </div>
          </div>

          {/* Bento Card 2 */}
          <div className="bg-white/65 backdrop-blur-xl border border-white/85 rounded-3xl p-6 shadow-lg shadow-blue-500/5 hover:bg-white/80 hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 mb-4">
                <Wand2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Avatar</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Create dynamic talking head clips effortlessly without expensive studio equipment.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/50 text-xs font-semibold text-purple-600">
              Instant generation →
            </div>
          </div>

          {/* Bento Card 3 */}
          <div className="bg-white/65 backdrop-blur-xl border border-white/85 rounded-3xl p-6 shadow-lg shadow-blue-500/5 hover:bg-white/80 hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-4">
                <Mic size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Denoise Audio</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Clean studio sound with one-click background noise removal and voice enhancement.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/50 text-xs font-semibold text-emerald-600">
              One-tap enhancement →
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRE-FOOTER "START CREATING" BANNER (FROSTED GLASS CARD) */}
      <section className="max-w-4xl mx-auto px-6 mb-16">
        <div className="bg-gradient-to-br from-blue-500/10 via-white/75 to-purple-500/10 backdrop-blur-2xl border border-white/90 rounded-3xl py-12 px-6 text-center shadow-xl shadow-blue-500/5">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Start Creating</h2>
          <p className="text-slate-600 text-base mb-6 max-w-md mx-auto">
            Start creating with free credits and zero watermarks. No credit card required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/editor"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-105"
            >
              Get Started Free →
            </Link>
            <Link
              href="/editor"
              className="bg-white/80 backdrop-blur-md border border-slate-300 text-slate-800 hover:bg-white px-6 py-3 rounded-full font-semibold text-sm shadow-sm transition-all"
            >
              Open Studio
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FAQ & FOOTER (FROSTED ACCORDIONS) */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = faqActive === index;
            return (
              <div key={index} className="bg-white/70 backdrop-blur-xl border border-white/85 rounded-2xl overflow-hidden shadow-sm hover:bg-white/85 transition-all">
                <button
                  onClick={() => setFaqActive(isOpen ? null : index)}
                  className="w-full px-6 py-4 text-left font-bold text-slate-900 flex justify-between items-center text-sm sm:text-base cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 text-slate-600 text-sm leading-relaxed border-t border-slate-200/50 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white/60 backdrop-blur-lg py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-600 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs">
              CG
            </div>
            <span className="font-bold text-slate-900 tracking-tight">capgen.app</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
            <Link href="/templates" className="hover:text-blue-600 transition-colors">
              Templates
            </Link>
            <Link href="/pricing" className="hover:text-blue-600 transition-colors">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">
              Terms
            </Link>
          </div>

          <span className="text-xs text-slate-500">© 2026 Capgen.app. All rights reserved.</span>
        </div>
      </footer>

      {/* Auth Required & Upgrade Modals */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => router.push('/editor')}
      />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}