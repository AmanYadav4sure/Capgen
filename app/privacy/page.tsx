import { Shell } from '@/components/site';
import { getLandingMetadata } from '@/lib/seo';
import PageSchema from '@/components/PageSchema';

export const metadata = getLandingMetadata('/privacy');

export default function PrivacyPage() {
  return (
    <Shell>
      <PageSchema path="/privacy" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700 text-xs font-extrabold uppercase tracking-wider mb-4 backdrop-blur-md">
            Privacy Policy
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Your video data belongs to you. Period.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We built Capgen with privacy by default. Here is exactly how we handle your media,
            transcriptions, and personal data.
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium">Last updated: October 15, 2026</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-xl shadow-blue-500/5 rounded-3xl p-6 hover:bg-white/90 hover:-translate-y-1 transition-all">
            <h3 className="font-extrabold text-slate-900 mb-1">In-Browser Processing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Video editing and export use browser capabilities, including canvas and MediaRecorder.
              Extracted audio is sent for transcription.
            </p>
          </div>

          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-xl shadow-blue-500/5 rounded-3xl p-6 hover:bg-white/90 hover:-translate-y-1 transition-all">
            <h3 className="font-extrabold text-slate-900 mb-1">Transcription Providers</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The transcription pipeline uses Groq and may use Deepgram as a fallback. Provider
              processing and retention terms also apply to submitted audio.
            </p>
          </div>

          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-xl shadow-blue-500/5 rounded-3xl p-6 hover:bg-white/90 hover:-translate-y-1 transition-all">
            <h3 className="font-extrabold text-slate-900 mb-1">Extracted Audio</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Audio is extracted from your video to create timed captions. Contact support for
              questions about processing and provider retention.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-blue-500/5 rounded-3xl p-8 sm:p-10 space-y-8 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">
              1. Information We Collect
            </h2>
            <p className="mb-2">
              When you use Capgen (capgen.app), we collect the minimal set of data required to
              provide our studio services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Account Information:</strong> Your verified email address and display name.
                Clerk manages sign-in and authentication sessions.
              </li>
              <li>
                <strong>Usage Data:</strong> Basic usage metrics like caption generation count,
                credit usage, and export count to maintain your subscription status.
              </li>
              <li>
                <strong>Temporary Audio Buffers:</strong> Audio extracts sent to our transcription
                pipeline solely for generating timestamped subtitles.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">
              2. How Your Video Data is Handled
            </h2>
            <p className="mb-2">We respect creator copyright and video privacy above all else:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Your uploaded videos stay inside your browser memory during editing.</li>
              <li>
                The current studio exports video in the browser and sends extracted audio through
                the server transcription endpoint.
              </li>
              <li>
                Project transcripts and styling are saved in Neon PostgreSQL through
                Clerk-authorized server APIs. A cloud-save failure is shown as unsaved rather than
                silently falling back to browser storage. Original video files must be selected
                again when reopening a project.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">3. Security & Payments</h2>
            <p>
              Payments are securely processed through Dodo Payments. We do not store or transmit
              your full credit card numbers on Capgen servers. All authentication tokens and user
              credentials are secured using encrypted, industry-standard TLS connections.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">
              4. Cookies and Local Storage
            </h2>
            <p>
              Clerk uses essential cookies to maintain authentication sessions and support sign-in
              security. Capgen no longer issues its former email-code challenge cookies. Browser
              local storage remembers privacy choices; older browser-only drafts may remain on the
              device but are not treated as cloud-saved projects. Optional Google Analytics and, on
              supported deployments, Vercel Analytics load after you accept analytics in the privacy
              choices banner.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">5. Your Data Rights</h2>
            <p>
              You have the right to export, inspect, or delete your account data and saved project
              transcripts at any time. To request complete data deletion, contact us at{' '}
              <a
                href="mailto:support@capgen.app"
                className="text-blue-600 font-bold underline hover:text-blue-700"
              >
                support@capgen.app
              </a>
              .
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>Have questions about our privacy practices?</span>
            <a
              href="mailto:support@capgen.app"
              className="flex items-center gap-1 text-slate-700 hover:text-blue-600 font-bold"
            >
              Contact Privacy Team
            </a>
          </div>
        </div>
      </div>
    </Shell>
  );
}
