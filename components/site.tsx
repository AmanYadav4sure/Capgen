'use client';



import Link from 'next/link';

import { usePathname } from 'next/navigation';

import React, { useState, useEffect } from 'react';

import { ArrowRight, ChevronDown, Menu, Sparkles, X, Zap, User, LogOut } from 'lucide-react';
import { LightningBoltIcon, RocketIcon } from '@radix-ui/react-icons';

import { useAuth } from '@/components/AuthProvider';

import { getOrCreateUserProfile } from '@/lib/firebase/db';

import { UserProfile } from '@/lib/firebase/types';

import { UpgradeModal } from './UpgradeModal';



export const nav = [

  ['Use cases', '/use-cases'],

  ['Templates', '/templates'],

  ['Pricing', '/pricing'],

];



export const footerGroups = [

  {

    title: 'Product',

    links: [

      ['Studio Editor', '/editor'],

      ['My Projects', '/profile'],

      ['Templates', '/templates'],

      ['Pricing', '/pricing'],

    ],

  },

  {

    title: 'Use cases',

    links: [

      ['Creators', '/use-cases/creators'],

      ['Podcasters', '/use-cases/podcasters'],

      ['Agencies', '/use-cases/agencies'],

      ['Education', '/use-cases/education'],

    ],

  },

  {

    title: 'Platforms',

    links: [

      ['Instagram', '/platforms/instagram'],

      ['YouTube', '/platforms/youtube'],

      ['TikTok', '/platforms/tiktok'],

      ['LinkedIn', '/platforms/linkedin'],

    ],

  },

  {

    title: 'Company',

    links: [

      ['About', '/about'],

      ['Contact', '/contact'],

      ['Privacy', '/privacy'],

      ['Terms', '/terms'],

    ],

  },

];



import Logo from '@/components/Logo';

export { Logo };



export function Button({
  children,
  href = '/editor',
  variant = 'primary',
}: {
  children: React.ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs transition-all duration-200 ${
        isPrimary
          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 hover:scale-105'
          : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-sm hover:border-slate-300'
      }`}
    >
      <span>{children}</span>
      <ArrowRight size={14} />
    </Link>
  );
}




export function Shell({ children }: { children: React.ReactNode }) {

  const [open, setOpen] = useState(false);

  const pathname = usePathname();

  const isHome = pathname === '/';

  const { user, userProfile } = useAuth();

  const [showUpgrade, setShowUpgrade] = useState(false);



  return (

    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-white text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white relative overflow-x-hidden flex flex-col justify-between">

      {/* Background Ambient Glass Glow Orbs */}

      <div className="fixed top-24 left-1/4 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="fixed top-2/3 right-10 w-[450px] h-[450px] bg-purple-400/10 rounded-full blur-3xl pointer-events-none -z-10" />



      {/* Floating Sticky Glass Navbar */}

      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2">

        <div className="max-w-5xl mx-auto bg-white/75 backdrop-blur-xl border border-white/80 shadow-lg shadow-blue-500/5 rounded-full px-6 py-3 flex items-center justify-between transition-all">

          <Logo />



          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">

            {nav.map(([l, h]) => (

              <Link href={h} key={l} className="hover:text-blue-600 transition-colors">

                {l}

              </Link>

            ))}

          </nav>



          <div className="flex items-center gap-3">

            {userProfile ? (

              <div className="flex items-center gap-3">

                {!isHome && (

                  <button

                    onClick={() => setShowUpgrade(true)}

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

              <div className="hidden sm:flex items-center gap-3">

                <Link href="/sign-in" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">

                  Sign in

                </Link>

                <Button href="/editor">Get started</Button>

              </div>

            )}



            <button

              className="md:hidden p-2 text-slate-700 hover:text-blue-600 focus:outline-none"

              onClick={() => setOpen(!open)}

              aria-label="Toggle menu"

            >

              {open ? <X size={22} /> : <Menu size={22} />}

            </button>

          </div>

        </div>



        {/* Mobile Dropdown Menu */}

        {open && (

          <div className="md:hidden max-w-5xl mx-auto mt-2 bg-white/95 backdrop-blur-2xl border border-white/90 shadow-xl rounded-2xl p-4 flex flex-col gap-3 font-semibold text-slate-700 animate-in fade-in slide-in-from-top-2">

            {nav.map(([l, h]) => (

              <Link

                href={h}

                key={l}

                onClick={() => setOpen(false)}

                className="px-4 py-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"

              >

                {l}

              </Link>

            ))}

            {userProfile ? (

              <Link

                href="/profile"

                onClick={() => setOpen(false)}

                className="px-4 py-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"

              >

                My Profile &amp; Projects

              </Link>

            ) : (

              <Link

                href="/sign-in"

                onClick={() => setOpen(false)}

                className="px-4 py-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"

              >

                Sign in

              </Link>

            )}

          </div>

        )}

      </header>



      {/* Main Page Content */}

      <main className="pt-24 pb-16 flex-1">{children}</main>



      <Footer />



      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />

    </div>

  );

}



export function Footer() {

  return (

    <footer className="border-t border-slate-200/80 bg-white/60 backdrop-blur-lg py-12 px-6">

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-600 text-sm">

        <div className="flex items-center gap-3">

          <Logo />

          <span className="text-xs text-slate-500 border-l border-slate-200 pl-3 hidden sm:inline">

            Make every word worth watching.

          </span>

        </div>



        <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">

          {footerGroups.flatMap((g) => g.links).map(([l, h]) => (

            <Link href={h} key={l + h} className="hover:text-blue-600 transition-colors">

              {l}

            </Link>

          ))}

        </div>



        <span className="text-xs text-slate-500">© 2026 Capgen.app. All rights reserved.</span>

      </div>

    </footer>

  );

}



export function Icon3D({ kind = 'blue', label }: { kind?: string; label?: string }) {

  return (

    <div className={`icon-3d ${kind}`} aria-hidden="true">

      <Sparkles size={32} />

      {label && <small>{label}</small>}

    </div>

  );

}



export function SectionTitle({

  eyebrow,

  title,

  copy,

}: {

  eyebrow: string;

  title: string;

  copy?: string;

}) {

  return (

    <div className="section-title">

      <span className="eyebrow">{eyebrow}</span>

      <h2>{title}</h2>

      {copy && <p>{copy}</p>}

    </div>

  );

}



export function FAQ() {

  const qs = [

    ['Can I try it for free?', 'Yes. Start with 2 free exports with zero watermark.'],

    ['What languages are supported?', 'Generate captions in 99+ languages including English, Hinglish, Nepali, and Hindi.'],

    ['Do I need editing experience?', 'Not at all. Upload a video, pick a style, and the studio handles timing automatically.'],

  ];

  const [active, setActive] = useState(0);

  return (

    <div className="faq">

      {qs.map(([q, a], i) => (

        <div className="faq-row" key={q}>

          <button onClick={() => setActive(active === i ? -1 : i)}>

            <span>{q}</span>

            <ChevronDown className={active === i ? 'rotate' : ''} />

          </button>

          {active === i && <p>{a}</p>}

        </div>

      ))}

    </div>

  );

}



export const features = [

  'Automatic word-level timing at 60fps',

  '99+ caption languages including Hinglish & Nepali',

  'One-tap resize (9:16, 1:1, 16:9)',

  '4K & 1080p MP4 export with no watermark',

  'Hormozi, MrBeast, & viral motion templates',

  'Cloud Firestore project sync',

];



export function FeatureList() {

  return (

    <ul className="feature-list">

      {features.map((x) => (

        <li key={x}>✓ {x}</li>

      ))}

    </ul>

  );

}



export function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {

  return <div className={`reveal ${className}`}>{children}</div>;

} 

