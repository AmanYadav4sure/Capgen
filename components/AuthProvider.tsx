'use client';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import type { UserProfile } from '@/lib/types';
import { dataRequest } from '@/lib/data';

export interface SessionUser {
  uid: string;
  email: string;
  name: string;
}
interface AuthContextType {
  user: SessionUser | null;
  userProfile: UserProfile | null;
  profileError: string | null;
  loading: boolean;
  isConfigured: boolean;
  sessionActive: boolean;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}
const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  profileError: null,
  loading: true,
  isConfigured: false,
  sessionActive: false,
  logOut: async () => {},
  refreshProfile: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const clerk = useClerk();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userProfile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const sequence = useRef(0);
  const activeId = useRef<string | null>(null);
  const pendingRequest = useRef<{ id: string; promise: Promise<UserProfile | null> } | null>(null);
  const id = clerkUser?.id || null;
  activeId.current = id;

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const target = activeId.current;
    if (!target) return null;
    if (pendingRequest.current?.id === target) return pendingRequest.current.promise;
    const generation = ++sequence.current;
    const request = (async () => {
      try {
        const session = await dataRequest<{ user: SessionUser | null }>('/api/auth/session');
        if (!session.user) throw new Error('Your sign-in session changed. Sign in again.');
        if (generation !== sequence.current || activeId.current !== target) return null;
        setUser(session.user);
        const result = await dataRequest<{ profile: UserProfile }>('/api/profile');
        if (generation !== sequence.current || activeId.current !== target) return null;
        setProfile(result.profile);
        setError(null);
        return result.profile;
      } catch (error) {
        if (generation === sequence.current && activeId.current === target) {
          setProfile(null);
          setError(
            error instanceof Error
              ? error.message
              : 'Your account could not be loaded. Retry in a moment.',
          );
        }
        return null;
      } finally {
        if (generation === sequence.current) setPending(false);
        if (generation === sequence.current) pendingRequest.current = null;
      }
    })();
    pendingRequest.current = { id: target, promise: request };
    return request;
  }, []);

  useEffect(() => {
    ++sequence.current;
    pendingRequest.current = null;
    setUser(null);
    setProfile(null);
    setError(null);
    if (!isLoaded) return;
    if (!id) {
      setPending(false);
      return;
    }
    setPending(true);
    void refreshProfile();
    return () => {
      ++sequence.current;
    };
  }, [isLoaded, id, refreshProfile]);

  useEffect(() => {
    const focus = () => {
      if (activeId.current) void refreshProfile();
    };
    window.addEventListener('focus', focus);
    return () => window.removeEventListener('focus', focus);
  }, [refreshProfile]);

  const logOut = useCallback(async () => {
    await clerk.signOut();
    ++sequence.current;
    setUser(null);
    setProfile(null);
    setError(null);
    setPending(false);
  }, [clerk]);
  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        profileError,
        loading: !isLoaded || (!!isSignedIn && pending),
        isConfigured: true,
        sessionActive: !!isSignedIn,
        logOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
