'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Building2,
  UserCheck,
} from 'lucide-react';
import { Shell } from '@/components/site';
import { useAuth } from '@/components/AuthProvider';
import { getOrCreateUserProfile } from '@/lib/firebase/db';
import { UserProfile } from '@/lib/firebase/types';
import { startPaddleCheckout } from '@/lib/paddle';

export default function PricingClient() {
  const { user, userProfile: currentUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [faqActive, setFaqActive] = useState<number | null>(0);

  const isYearly = billingCycle === 'yearly';

  const proPriceId = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || 'pri_pro_default';
  const teamPriceId = process.env.NEXT_PUBLIC_PADDLE_TEAM_PRICE_ID || 'pri_team_default';

  const handleCheckout = async (priceId: string) => {
    if (!currentUser) {
      alert('Please sign in first to purchase a subscription plan.');
      return;
    }

    try {
      await startPaddleCheckout({
        priceId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
      });
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const faqs = [
    {
      q: 'How do video credits work?',
      a: 'Credits are deducted only ONCE per video project. Once a credit is used on a video, you can re-edit, change caption presets, and re-download that same video unlimited times for 0 additional credits.',
    },
    {
      q: 'Can I use Capgen for free without a credit card?',
      a: 'Yes! Every new account automatically receives 2 free video credits with full access to 60fps subtitle syncing, 100+ creator fonts, and 0 watermarks. No credit card is required to sign up.',
    },
    {
      q: 'What formats can I export?',
      a: 'You can export fully rendered MP4 videos in 1080p / 4K with burned-in 60fps kinetic captions, or download raw subtitle files (SRT, VTT, ASS) to import into Premiere Pro, Final Cut, or DaVinci Resolve.',
    },
    {
      q: 'What languages are supported?',
      a: 'Capgen supports 99+ languages including English, Hinglish, Nepali, Hindi, Spanish, Portuguese, German, French, Japanese, and Korean with word-level AI timing precision.',
    },
  ];

  return (
    <Shell>
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/40 to-white pb-20 pt-24 text-slate-900 selection:bg-blue-500 selection:text-white">
        <div className="pointer-events-none fixed left-1/4 top-24 -z-10 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="pointer-events-none fixed right-10 top-2/3 -z-10 h-[450px] w-[450px] rounded-full bg-purple-400/10 blur-3xl" />
        <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
          {/* Hero Heading */}
          <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-white/80 bg-white/45 px-5 py-10 text-center shadow-xl shadow-blue-500/5 backdrop-blur-md sm:px-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
              <Sparkles size={14} className="animate-pulse" />
              <span>Transparent Creator Pricing</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Start free. Upgrade as your audience grows.
            </h1>
            <p className="text-base text-slate-600 sm:text-lg">
              No hidden fees, no forced watermarks. Choose the plan that fits your video output.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="pt-6 flex justify-center items-center gap-4">
              <span className={`text-sm font-semibold ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                Monthly Billing
              </span>
              <button
                onClick={() => setBillingCycle(isYearly ? 'monthly' : 'yearly')}
                className="relative h-8 w-14 cursor-pointer rounded-full border border-blue-200 bg-white p-1 shadow-sm transition-colors"
              >
                <div
                  className={`h-6 w-6 rounded-full bg-blue-500 transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                <span>Yearly Billing</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Free Tier */}
            <div className="relative flex flex-col justify-between space-y-6 rounded-3xl border border-white/90 bg-white/70 p-8 shadow-xl shadow-blue-500/5 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/90">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Free Tier</span>
                <h3 className="text-2xl font-extrabold text-slate-900">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                  <span className="text-sm text-slate-500">/ forever</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Perfect for trying Capgen with 2 free video exports and full creator features.
                </p>
                <div className="space-y-3 border-t border-slate-200/80 pt-6">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-emerald-600" />
                    <span>2 Free Video Exports</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-emerald-600" />
                    <span>60fps Word-Level Sync</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-emerald-600" />
                    <span>100 MB Max Video Upload</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-emerald-600" />
                    <span>0 Watermarks</span>
                  </div>
                </div>
              </div>

              <Link
                href="/editor"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-blue-50"
              >
                Try Free Studio
              </Link>
            </div>

            {/* Pro Tier (Popular) */}
            <div className="relative flex flex-col justify-between space-y-6 rounded-3xl border-2 border-blue-500 bg-gradient-to-b from-blue-50/90 to-white/90 p-8 shadow-2xl shadow-blue-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                MOST POPULAR FOR CREATORS
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Pro Creator</span>
                <h3 className="text-2xl font-extrabold text-slate-900">Creator Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{isYearly ? '$11' : '$14'}</span>
                  <span className="text-sm text-slate-500">/ month</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  For creators posting daily Reels, Shorts, and TikToks who need high upload limits.
                </p>

                <div className="space-y-3 border-t border-blue-500/20 pt-6">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-blue-600" />
                    <b className="text-slate-900">30 Video Exports / mo</b>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-blue-600" />
                    <span>200 MB Max Video Upload</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-blue-600" />
                    <span>100+ Premium Creator Fonts</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-blue-600" />
                    <span>SRT / VTT / ASS Subtitle Exports</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-blue-600" />
                    <span>Priority Rendering Speed</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleCheckout(proPriceId)}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm text-center transition shadow-lg shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Upgrade to Pro</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Team Tier */}
            <div className="relative flex flex-col justify-between space-y-6 rounded-3xl border border-white/90 bg-white/70 p-8 shadow-xl shadow-purple-500/5 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/90">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-600">Agencies & Teams</span>
                <h3 className="text-2xl font-extrabold text-slate-900">Agency Team</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{isYearly ? '$31' : '$39'}</span>
                  <span className="text-sm text-slate-500">/ month</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Maximum limits and storage for video production teams and social media agencies.
                </p>

                <div className="space-y-3 border-t border-slate-200/80 pt-6">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-purple-600" />
                    <b className="text-slate-900">100 Video Exports / mo</b>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-purple-600" />
                    <span>500 MB Max Video Upload</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-purple-600" />
                    <span>Custom Brand Presets & Logos</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-purple-600" />
                    <span>Batch Video Captioning</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="shrink-0 text-purple-600" />
                    <span>Dedicated Support</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleCheckout(teamPriceId)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-purple-50"
              >
                <span>Get Team Plan</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div className="max-w-3xl mx-auto pt-10 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Frequently Asked Questions</h2>
              <p className="text-sm text-slate-600">Everything you need to know about plans and billing.</p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => {
                const isOpen = faqActive === i;
                return (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-white/85 bg-white/70 shadow-sm backdrop-blur-xl transition hover:bg-white/90"
                  >
                    <button
                      onClick={() => setFaqActive(isOpen ? null : i)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left text-sm font-bold text-slate-900 sm:text-base"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-200/50 px-5 pb-5 pt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </Shell>
  );
}
