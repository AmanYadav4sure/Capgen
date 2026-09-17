'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import {
  subscribeToAuth,
  signInWithGoogle as firebaseGoogleSignIn,
  signInWithGoogleRedirect as firebaseGoogleRedirectSignIn,
  signInWithGithub as firebaseGithubSignIn,
  signInUser as firebaseSignIn,
  signUpUser as firebaseSignUp,
  logOutUser as firebaseLogOut,
  resetUserPassword as firebaseResetPassword,
} from '@/lib/firebase/auth';
import { getOrCreateUserProfile } from '@/lib/firebase/db';
import { UserProfile } from '@/lib/firebase/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signInWithGoogleRedirect: () => Promise<void>;
  signInWithGithub: () => Promise<User | null>;
  signInWithEmail: (e: string, p: string) => Promise<User>;
  signUpWithEmail: (e: string, p: string, name?: string) => Promise<User>;
  logOut: () => Promise<void>;
  resetPassword: (e: string) => Promise<boolean>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isConfigured: false,
  signInWithGoogle: async () => { throw new Error('AuthContext not initialized'); },
  signInWithGoogleRedirect: async () => {},
  signInWithGithub: async () => { throw new Error('AuthContext not initialized'); },
  signInWithEmail: async () => { throw new Error('AuthContext not initialized'); },
  signUpWithEmail: async () => { throw new Error('AuthContext not initialized'); },
  logOut: async () => {},
  resetPassword: async () => false,
  refreshProfile: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  const syncUserProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setUserProfile(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('captionstd_firebase_local_user');
      }
      return null;
    }

    try {
      const profile = await getOrCreateUserProfile({
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
      });
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.warn('Error syncing user profile on auth change:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserProfile]);

  const handleLogOut = async () => {
    await firebaseLogOut();
    setUser(null);
    setUserProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('captionstd_firebase_local_user');
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isConfigured: configured,
    signInWithGoogle: firebaseGoogleSignIn,
    signInWithGoogleRedirect: firebaseGoogleRedirectSignIn,
    signInWithGithub: firebaseGithubSignIn,
    signInWithEmail: firebaseSignIn,
    signUpWithEmail: firebaseSignUp,
    logOut: handleLogOut,
    resetPassword: firebaseResetPassword,
    refreshProfile: () => syncUserProfile(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
