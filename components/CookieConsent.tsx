'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const CONSENT_KEY = 'capgen_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(CONSENT_KEY) === null);
  }, []);

  if (!visible) return null;

  const choose = (value: 'accepted' | 'essential-only') => {
    localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  };

  return (
    <aside
      aria-label="Cookie and storage preferences"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl sm:flex sm:items-center sm:gap-5"
    >
      <div className="flex-1">
        <h2 className="text-sm font-bold">Privacy choices</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Capgen uses essential browser storage for sign-in and drafts. Read our{' '}
          <Link href="/privacy" className="font-semibold text-blue-600 underline">
            privacy policy
          </Link>{' '}
          before choosing optional analytics.
        </p>
      </div>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <button
          type="button"
          onClick={() => choose('essential-only')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={() => choose('accepted')}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Accept
        </button>
      </div>
    </aside>
  );
}
