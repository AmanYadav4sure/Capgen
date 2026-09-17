'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Lock, ArrowRight, Loader2, AlertCircle, UserCheck } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

import { GoogleIcon, GithubIcon } from '@/components/icons/BrandIcons';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  message?: string;
}

export function AuthRequiredModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Sign In Required to Upload',
  message = 'Please sign in or create a free account to upload video files and generate AI captions.',
}: AuthRequiredModalProps) {
  const { signInWithGoogle, signInWithGithub } = useAuth();
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading('google');
    try {
      await signInWithGoogle();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('closed')) {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else {
        setError(err?.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    setLoading('github');
    try {
      const user = await signInWithGithub();
      if (user) {
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('closed')) {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else {
        setError(err?.message || 'Failed to sign in with GitHub.');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Lock Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <Lock size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400 block mb-0.5">
              LOGIN FIRST
            </span>
            <h3 className="text-xl font-extrabold text-white tracking-tight">{title}</h3>
          </div>
        </div>

        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{message}</p>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick OAuth Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {loading === 'google' ? <Loader2 size={18} className="animate-spin text-slate-900" /> : <GoogleIcon />}
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleGithubSignIn}
            disabled={loading !== null}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition border border-white/10 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {loading === 'github' ? <Loader2 size={18} className="animate-spin text-white" /> : <GithubIcon />}
            <span>Continue with GitHub</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] text-slate-400 font-semibold uppercase tracking-wider absolute">
            Or
          </span>
        </div>

        {/* Action Links */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/sign-in"
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs text-center border border-white/5 transition"
          >
            Sign In with Email
          </Link>
          <Link
            href="/sign-up"
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1 shadow-md shadow-blue-500/20"
          >
            <span>Create Account</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
