import Link from 'next/link';
import { Shell } from '@/components/site';
import { FileText, CheckCircle2, AlertCircle, Scale, Mail } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service · Capgen',
  description: 'Review the legal terms of service governing your usage of Capgen studio and video caption services.',
};

export default function TermsPage() {
  return (
    <Shell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700 text-xs font-extrabold uppercase tracking-wider mb-4 backdrop-blur-md">
            <FileText className="w-4 h-4 text-blue-600" />
            Terms of Service
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Fair and transparent creator terms.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Please read these terms before using Capgen (capgen.app). They outline your rights as a creator and our commitments to you.
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Last updated: September 4, 2026
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-xl shadow-blue-500/5 rounded-3xl p-6 hover:bg-white/90 hover:-translate-y-1 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">100% Content Ownership</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You retain complete ownership of all videos, audio files, captions, and exported media created with Capgen.
            </p>
          </div>

          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-xl shadow-blue-500/5 rounded-3xl p-6 hover:bg-white/90 hover:-translate-y-1 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">Acceptable Use</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You agree not to use Capgen for generating illegal, hateful, deceptive, or abusive content across social platforms.
            </p>
          </div>

          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-xl shadow-blue-500/5 rounded-3xl p-6 hover:bg-white/90 hover:-translate-y-1 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">Fair Usage &amp; Billing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Subscriptions and credit packages renew according to your selected plan. Cancel anytime with zero lock-in contracts.
            </p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-blue-500/5 rounded-3xl p-8 sm:p-10 space-y-8 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using Capgen at <Link href="/" className="text-blue-600 font-bold hover:underline">capgen.app</Link>, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">2. Description of Service</h2>
            <p>
              Capgen provides AI-powered speech-to-text transcription, kinetic subtitle animations, subtitle styling, and in-browser video encoding tools designed for content creators, agencies, and video editors.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">3. User Accounts &amp; Credit Systems</h2>
            <p className="mb-2">
              To access certain features, you must register for an account. You are responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Maintaining the security of your account credentials.</li>
              <li>All activities that occur under your account.</li>
              <li>Ensuring your account information remains accurate and up to date.</li>
            </ul>
            <p className="mt-2">
              Credits allocated to your account (e.g., free initial credits or monthly subscription top-ups) are non-transferable and subject to your active subscription plan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">4. Intellectual Property &amp; Commercial Usage</h2>
            <p>
              We claim no intellectual property rights over the videos, audio, or scripts you upload to Capgen. All videos exported through Capgen are 100% yours to monetize, distribute, and publish on platforms including YouTube, TikTok, Instagram, and LinkedIn without royalties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">5. Subscriptions, Refunds &amp; Cancellations</h2>
            <p className="mb-2">
              Subscriptions are billed on a monthly or annual cycle via Paddle Billing. You can cancel your subscription at any time through your Profile dashboard.
            </p>
            <p>
              If you encounter any technical issues with video exports or transcription failures, please contact support for credit adjustments or refund assistance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">6. Limitation of Liability</h2>
            <p>
              Capgen is provided &quot;as is&quot; without warranty of any kind. In no event shall Capgen or its creators be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the service.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>Questions regarding these Terms?</span>
            <a href="mailto:support@capgen.app" className="flex items-center gap-1 text-slate-700 hover:text-blue-600 font-bold">
              <Mail className="w-3.5 h-3.5" />
              Contact Legal Support
            </a>
          </div>
        </div>
      </div>
    </Shell>
  );
}
