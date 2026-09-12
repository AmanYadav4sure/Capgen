import Link from 'next/link';
import { Shell } from '@/components/site';
import { ShieldCheck, Lock, Eye, HardDrive, Mail } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy · Capgen',
  description: 'Understand how Capgen handles your data, video uploads, and privacy with total transparency.',
};

export default function PrivacyPage() {
  return (
    <Shell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700 text-xs font-extrabold uppercase tracking-wider mb-4 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Privacy Policy
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Your video data belongs to you. Period.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We built Capgen with privacy by default. Here is exactly how we handle your media, transcriptions, and personal data.
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Last updated: September 4, 2026
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-xl shadow-blue-500/5 rounded-3xl p-6 hover:bg-white/90 hover:-translate-y-1 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">In-Browser Processing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Video encoding occurs locally in your browser using WebAssembly. Your full raw MP4 export never leaves your device.
            </p>
          </div>

          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-xl shadow-blue-500/5 rounded-3xl p-6 hover:bg-white/90 hover:-translate-y-1 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">No AI Model Training</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your video audio and transcriptions are strictly processed to generate captions. We never train AI models on your footage.
            </p>
          </div>

          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-xl shadow-blue-500/5 rounded-3xl p-6 hover:bg-white/90 hover:-translate-y-1 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">Ephemeral Audio Stream</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Audio streams sent for speech-to-text transcription are discarded immediately after transcript generation completes.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-blue-500/5 rounded-3xl p-8 sm:p-10 space-y-8 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">1. Information We Collect</h2>
            <p className="mb-2">
              When you use Capgen (capgen.app), we collect the minimal set of data required to provide our studio services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Account Information:</strong> Your email address and display name when creating an account via Google or Email authentication.</li>
              <li><strong>Usage Data:</strong> Basic usage metrics like caption generation count, credit usage, and export count to maintain your subscription status.</li>
              <li><strong>Temporary Audio Buffers:</strong> Audio extracts sent to our transcription pipeline solely for generating timestamped subtitles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">2. How Your Video Data is Handled</h2>
            <p className="mb-2">
              We respect creator copyright and video privacy above all else:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Your uploaded videos stay inside your browser memory during editing.</li>
              <li>Videos are encoded using in-browser WebAssembly (FFmpeg WASM), meaning full video files are NOT stored on remote cloud servers for rendering.</li>
              <li>Transcripts are saved locally to your profile history in Firebase Firestore so you can re-open and edit your captions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">3. Security & Payments</h2>
            <p>
              Payments are securely processed through Paddle Billing. We do not store or transmit your full credit card numbers on Capgen servers. All authentication tokens and user credentials are secured using Firebase Authentication with industry-standard TLS encryption.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">4. Cookies and Local Storage</h2>
            <p>
              We use browser local storage and essential cookies to maintain your session login state, store draft project edits, and remember your caption style preferences.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">5. Your Data Rights</h2>
            <p>
              You have the right to export, inspect, or delete your account data and saved project transcripts at any time. To request complete data deletion, contact us at{' '}
              <a href="mailto:support@capgen.app" className="text-blue-600 font-bold underline hover:text-blue-700">
                support@capgen.app
              </a>.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>Have questions about our privacy practices?</span>
            <a href="mailto:support@capgen.app" className="flex items-center gap-1 text-slate-700 hover:text-blue-600 font-bold">
              <Mail className="w-3.5 h-3.5" />
              Contact Privacy Team
            </a>
          </div>
        </div>
      </div>
    </Shell>
  );
}
