import Link from 'next/link';
import { SignIn, SignUp } from '@clerk/nextjs';
import Logo from '@/components/Logo';

export default function AuthScreen({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-white text-slate-900 p-4 sm:p-8">
      <header className="max-w-6xl mx-auto flex items-center justify-between py-4">
        <Logo />
        <Link href="/" className="text-sm font-semibold text-slate-600">
          Back to home
        </Link>
      </header>
      <main className="max-w-md mx-auto py-12 sm:py-20">
        <p className="text-sm text-slate-600 text-center mb-8">
          Save captions and styles, then return to your projects.
        </p>
        {mode === 'sign-in' ? (
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/editor"
          />
        ) : (
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/editor"
          />
        )}
      </main>
    </div>
  );
}
