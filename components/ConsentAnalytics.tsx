'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';

export default function ConsentAnalytics({ vercel }: { vercel: boolean }) {
  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    const sync = () => {
      try {
        setAccepted(localStorage.getItem('capgen_cookie_consent') === 'accepted');
      } catch {
        setAccepted(false);
      }
    };
    sync();
    window.addEventListener('capgen-consent-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('capgen-consent-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  if (!accepted) return null;
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-FB0MFNC2PE"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-FB0MFNC2PE');
    `}</Script>
      {vercel && <Analytics />}
    </>
  );
}
