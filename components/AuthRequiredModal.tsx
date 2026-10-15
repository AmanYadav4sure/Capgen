'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthProvider';

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
  title = 'Sign in to Capgen',
  message = 'Sign in to save captions and styles to your account.',
}: AuthRequiredModalProps) {
  const { userProfile, profileError, refreshProfile, sessionActive } = useAuth();
  useEffect(() => {
    if (isOpen && userProfile) {
      onClose();
      onSuccess?.();
    }
  }, [isOpen, userProfile, onClose, onSuccess]);
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Sign in to Capgen"
      className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl text-slate-900"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-extrabold">{title}</h2>
          <p className="text-sm text-slate-600 mt-2">{message}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close sign-in dialog"
          className="min-h-11 px-3 text-xs font-semibold rounded-xl bg-slate-100"
        >
          Close
        </button>
      </div>
      {sessionActive ? (
        <div role={profileError ? 'alert' : 'status'} className="text-sm text-slate-700">
          <p>{profileError || 'Opening your account…'}</p>
          {profileError && (
            <button
              onClick={() => void refreshProfile()}
              className="mt-3 min-h-11 text-blue-700 font-semibold underline"
            >
              Retry loading your account
            </button>
          )}
        </div>
      ) : (
        <SignIn
          routing="hash"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/editor"
          appearance={{
            elements: {
              rootBox: 'w-full',
              cardBox: 'w-full shadow-none',
              card: 'shadow-none p-0 border-0',
            },
          }}
        />
      )}
      <p className="text-center mt-4 text-xs text-slate-600">
        <Link href="/sign-in" onClick={onClose} className="underline">
          Open full-page sign-in
        </Link>
      </p>
    </Modal>
  );
}
