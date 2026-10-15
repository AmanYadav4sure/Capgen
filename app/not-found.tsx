import Link from 'next/link';
import type { Metadata } from 'next';
import { Shell } from '@/components/site';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default function NotFound() {
  return (
    <Shell>
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center pt-24 pb-20 px-4">
        <div className="max-w-md w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-mono text-xs font-bold uppercase tracking-wider mb-6">
            Error 404 · Page Not Found
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
            Page not found
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mb-8 leading-relaxed">
            This address doesn&apos;t match a page. Check the link or return to the homepage.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/editor"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold text-sm shadow-md hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Open Studio Editor
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
            >
              Back to Home
            </Link>
          </div>

          <div className="mt-12 text-xs text-slate-400">
            Need help? Reach out at{' '}
            <a href="mailto:support@capgen.app" className="text-slate-600 font-medium underline">
              support@capgen.app
            </a>
          </div>
        </div>
      </div>
    </Shell>
  );
}
