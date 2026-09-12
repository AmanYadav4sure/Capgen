import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

/**
 * Format Firebase Auth error codes into clean human-readable messages.
 */
export function formatAuthError(err: any): string {
  if (!err) return 'An unknown error occurred.';
  const code = err.code || '';
  const message = err.message || '';

  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Domain unauthorized! Please add your domain to Firebase Console -> Authentication -> Settings -> Authorized Domains.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled in your Firebase Console.';
    default:
      return message || 'Authentication failed. Please try again.';
  }
}

function createAuthError(err: any): Error {
  const formatted = formatAuthError(err);
  const errorObj = new Error(formatted);
  (errorObj as any).code = err?.code;
  return errorObj;
}

/**
 * Register a new user with email and password in Firebase Authentication.
 */
export async function signUpUser(email: string, password: string, displayName?: string) {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not configured. Please set your environment variables.');
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && credential.user) {
      await updateProfile(credential.user, { displayName });
    }
    return credential.user;
  } catch (err: any) {
    throw createAuthError(err);
  }
}

/**
 * Sign in an existing user with email and password.
 */
export async function signInUser(email: string, password: string) {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not configured. Please set your environment variables.');
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (err: any) {
    throw createAuthError(err);
  }
}

/**
 * Sign in or sign up with Google popup (with automatic Redirect fallback).
 */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not configured. Please set your environment variables.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: any) {
    const isPopupRestricted =
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.message?.includes('Cross-Origin-Opener-Policy') ||
      err?.message?.includes('COOP');

    if (isPopupRestricted) {
      console.warn('Popup restricted by COOP/browser. Falling back to Google redirect authentication...');
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw createAuthError(err);
  }
}

/**
 * Direct Google Redirect sign in.
 */
export async function signInWithGoogleRedirect() {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not configured. Please set your environment variables.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithRedirect(auth, provider);
}

/**
 * Sign in or sign up with GitHub popup (with automatic Redirect fallback).
 */
export async function signInWithGithub() {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not configured. Please set your environment variables.');
  }

  const provider = new GithubAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: any) {
    const isPopupRestricted =
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.message?.includes('Cross-Origin-Opener-Policy') ||
      err?.message?.includes('COOP');

    if (isPopupRestricted) {
      console.warn('Popup restricted by COOP/browser. Falling back to GitHub redirect authentication...');
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw createAuthError(err);
  }
}

/**
 * Send a password reset email.
 */
export async function resetUserPassword(email: string) {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not configured. Please set your environment variables.');
  }

  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (err: any) {
    throw createAuthError(err);
  }
}

/**
 * Sign out the current user.
 */
export async function logOutUser() {
  if (isFirebaseConfigured() && auth) {
    await signOut(auth);
  }
}

/**
 * Listen for Firebase auth state changes and resolve pending redirect results.
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured() || !auth) {
    callback(null);
    return () => {};
  }

  // Handle redirect result if user authenticated via redirect fallback
  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        callback(result.user);
      }
    })
    .catch((err) => {
      console.warn('Redirect auth result warning:', err);
    });

  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}
