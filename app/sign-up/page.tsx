'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/site';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, AlertCircle, Star, ArrowRight, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';

import { GoogleIcon, GithubIcon } from '@/components/icons/BrandIcons';

export default function SignUp() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, signInWithGithub, isConfigured } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUpWithEmail(email, password, fullName);
      setDone(true);
      setTimeout(() => {
        router.push('/editor');
      }, 900);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setOauthLoading('google');
    try {
      const user = await signInWithGoogle();
      if (user) {
        router.push('/editor');
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('closed')) {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else {
        setError(err?.message || 'Failed to sign in with Google.');
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    setOauthLoading('github');
    try {
      const user = await signInWithGithub();
      if (user) {
        router.push('/editor');
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('closed')) {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else {
        setError(err?.message || 'Failed to sign in with GitHub.');
      }
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-white text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white relative overflow-x-hidden flex flex-col justify-between p-4 sm:p-8">
      {/* Background Ambient Glass Glow Orbs */}
      <div className="fixed top-24 left-1/4 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-2/3 right-10 w-[450px] h-[450px] bg-purple-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Logo */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <Logo />
        <Link
          href="/"
          className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1 bg-white/70 backdrop-blur-md border border-white/80 px-4 py-2 rounded-full shadow-sm"
        >
          <span>Back to home</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Center Auth Card Container */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-blue-500/10 rounded-3xl p-8 sm:p-10 space-y-7">
          {/* Header Badge & Title */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 text-blue-700 text-xs font-extrabold bg-blue-500/10 border border-blue-500/30 px-3.5 py-1 rounded-full backdrop-blur-md">
              <Sparkles size={13} className="fill-blue-500 stroke-blue-500" />
              <span>Get 2 Free Exports • No Credit Card Required</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-1">
              Create your account
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              Generate 9:16 viral captions with sub-second acoustic precision.
            </p>
          </div>

          {!isConfigured && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-amber-600" />
              <span>Firebase credentials not configured.</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {done && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600 animate-bounce" />
              <span>Account created successfully! Redirecting to studio...</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={oauthLoading !== null || loading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] shadow-sm cursor-pointer disabled:opacity-50"
            >
              {oauthLoading === 'google' ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <GoogleIcon />}
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleGithubSignIn}
              disabled={oauthLoading !== null || loading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] shadow-md cursor-pointer disabled:opacity-50"
            >
              {oauthLoading === 'github' ? <Loader2 size={18} className="animate-spin" /> : <GithubIcon />}
              <span>Continue with GitHub</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200/80 w-full" />
            <span className="bg-white/90 backdrop-blur-md px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              or with email
            </span>
            <div className="border-t border-slate-200/80 w-full" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || oauthLoading !== null || done}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] shadow-lg shadow-blue-500/25 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-1">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-blue-600 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-slate-400 py-4">
        © 2026 Capgen.app. All rights reserved.
      </div>
    </div>
  );
}
