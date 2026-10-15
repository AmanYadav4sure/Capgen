'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Shell } from '@/components/site';
import { useAuth } from '@/components/AuthProvider';

export default function PricingClient() {
  const { userProfile: currentUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [faqActive, setFaqActive] = useState<number | null>(0);
  const [checkoutLoading, setCheckoutLoading] = useState<'pro' | 'team' | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isYearly = billingCycle === 'yearly';

  // Dodo Payments hosted checkout — created server-side with the user's uid
  // in metadata so the webhook credits the right account after payment.
  const handleCheckout = async (planId: 'pro' | 'team') => {
    setCheckoutError(null);
    if (!currentUser) {
      setCheckoutError('Sign in to your account before choosing a paid plan.');
      return;
    }

    setCheckoutLoading(planId);
    try {
      const res = await fetch('/api/dodo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Checkout failed');
      }
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      setCheckoutError(
        err instanceof Error ? err.message : 'Could not start checkout. Please try again.',
      );
      setCheckoutLoading(null);
    }
  };

  const faqs = [
    {
      q: 'How do video credits work?',
      a: 'Credits are deducted only ONCE per video project. Once a credit is used on a video, you can re-edit, change caption presets, and re-download that same video unlimited times for 0 additional credits.',
    },
    {
      q: 'Can I use Capgen for free without a credit card?',
      a: 'Yes. Every new account receives 5 video credits for styled caption exports with no Capgen watermark. No credit card is required to sign up. Free uploads are limited to 100 MB.',
    },
    {
      q: 'What formats can I export?',
      a: 'Export video with styled captions, or download an SRT file containing text and timing. Video format, resolution and frame rate depend on browser and device support. VTT and ASS downloads are not available.',
    },
    {
      q: 'What languages are supported?',
      a: 'The studio offers spoken-language choices including English, Hindi, Nepali, Spanish, Portuguese, German, French, Japanese and Korean. Transcription accuracy depends on the recording and provider.',
    },
  ];

  return (
    <Shell>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/40 to-white pb-20 pt-24 text-slate-900 selection:bg-blue-500 selection:text-white">
        <div className="pointer-events-none fixed left-1/4 top-24 -z-10 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="pointer-events-none fixed right-10 top-2/3 -z-10 h-[450px] w-[450px] rounded-full bg-purple-400/10 blur-3xl" />
        <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
          {/* Hero Heading */}
          <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-white/80 bg-white/45 px-5 py-10 text-center shadow-xl shadow-blue-500/5 backdrop-blur-md sm:px-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
              <span>Video credits and upload limits</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Start free. Choose a plan for your video output.
            </h1>
            <p className="text-base text-slate-600 sm:text-lg">
              No hidden fees, no forced watermarks. Choose the plan that fits your video output.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="pt-6 flex justify-center items-center gap-4">
              <span
                className={`text-sm font-semibold ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}
              >
                Monthly Billing
              </span>
              <button
                onClick={() => setBillingCycle(isYearly ? 'monthly' : 'yearly')}
                role="switch"
                aria-label="Yearly billing"
                aria-checked={isYearly}
                className="relative h-8 w-14 cursor-pointer rounded-full border border-blue-200 bg-white p-1 shadow-sm transition-colors"
              >
                <div
                  className={`h-6 w-6 rounded-full bg-blue-500 transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span
                className={`flex items-center gap-1.5 text-sm font-semibold ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}
              >
                <span>Yearly estimate</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600">
                  About 20% lower
                </span>
              </span>
            </div>
            <p className="mx-auto max-w-xl text-xs leading-relaxed text-slate-600">
              The yearly view is a price estimate, not a checkout selection. Hosted checkout
              confirms the charge and billing period. Credits below follow Capgen&apos;s configured
              plan grants.
            </p>
          </div>

          {checkoutError && (
            <div className="mx-auto max-w-md p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-700 text-sm text-center font-semibold">
              {checkoutError}
            </div>
          )}

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Free Tier */}
            <div className="relative flex flex-col justify-between space-y-6 rounded-3xl border border-white/90 bg-white/70 p-8 shadow-xl shadow-blue-500/5 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/90">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Free Tier
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                  <span className="text-sm text-slate-500">/ forever</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Try the caption workflow with five free exports and no Capgen watermark.
                </p>
                <div className="space-y-3 border-t border-slate-200/80 pt-6">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span>5 Free Video Exports</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span>Word-Level Caption Timing</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span>100 MB Max Video Upload</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
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
                FOR REGULAR PUBLISHING
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Pro Creator
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">Creator Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {isYearly ? '$11' : '$14'}
                  </span>
                  <span className="text-sm text-slate-500">/ month</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  For creators posting daily Reels, Shorts, and TikToks who need high upload limits.
                </p>

                <div className="space-y-3 border-t border-blue-500/20 pt-6">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <b className="text-slate-900">1,500 Video Credits</b>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span>200 MB Max Video Upload</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span>26 Viral Caption Presets</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span>SRT Subtitle Download</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span>Restyle and Re-export Projects</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleCheckout('pro')}
                disabled={checkoutLoading !== null}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm text-center transition shadow-lg shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
              >
                {checkoutLoading === 'pro' ? (
                  <>
                    <span>Redirecting to checkout…</span>
                  </>
                ) : (
                  <>
                    <span>Upgrade to Pro</span>
                  </>
                )}
              </button>
            </div>

            {/* Team Tier */}
            <div className="relative flex flex-col justify-between space-y-6 rounded-3xl border border-white/90 bg-white/70 p-8 shadow-xl shadow-purple-500/5 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/90">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-600">
                  Agencies & Teams
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">Agency Team</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {isYearly ? '$31' : '$39'}
                  </span>
                  <span className="text-sm text-slate-500">/ month</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  A larger upload allowance for longer files and a higher video output.
                </p>

                <div className="space-y-3 border-t border-slate-200/80 pt-6">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <b className="text-slate-900">5,000 Video Credits</b>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span>500 MB Max Video Upload</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span>Custom Fonts, Colors & Placement</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span>Captioned Video & SRT Downloads</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span>No Capgen Watermark</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleCheckout('team')}
                disabled={checkoutLoading !== null}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-purple-50 disabled:opacity-60 disabled:cursor-wait"
              >
                {checkoutLoading === 'team' ? (
                  <>
                    <span>Redirecting…</span>
                  </>
                ) : (
                  <>
                    <span>Get Team Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div className="max-w-3xl mx-auto pt-10 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-slate-600">
                Everything you need to know about plans and billing.
              </p>
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
                      aria-expanded={isOpen}
                      aria-controls={`pricing-faq-${i}`}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left text-sm font-bold text-slate-900 sm:text-base"
                    >
                      <span>{faq.q}</span>
                      <span className="disclosure-label">{isOpen ? 'Hide' : 'Show'}</span>
                    </button>
                    <div
                      id={`pricing-faq-${i}`}
                      hidden={!isOpen}
                      className="border-t border-slate-200/50 px-5 pb-5 pt-3 text-xs leading-relaxed text-slate-600 sm:text-sm"
                    >
                      {faq.a}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
