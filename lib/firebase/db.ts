import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './config';
import { Project, UserProfile, DEFAULT_STYLE_SETTINGS } from './types';

const LOCAL_STORAGE_PROJECTS_KEY = 'captionstd_firebase_local_projects';
const LOCAL_STORAGE_USER_KEY = 'captionstd_firebase_local_user';

/**
 * Helper to convert Firestore timestamp or value to ISO string
 */
function toIsoString(val: any, fallback: string): string {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val?.toDate === 'function') {
    try {
      return val.toDate().toISOString();
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * Automatically checks and retrieves or creates a user profile in Firestore (`users/{uid}`).
 * 1. Checks if users/{uid} document exists.
 * 2. If existing, fetches and returns without redundant writes.
 * 3. If new user, immediately writes default values (credits: 2, serverTimestamp) to Firestore.
 */
export async function getOrCreateUserProfile(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<UserProfile> {
  const name = user.displayName || user.email?.split('@')[0] || 'Creator';
  const email = user.email || '';
  const nowIso = new Date().toISOString();

  const fallbackProfile: UserProfile = {
    uid: user.uid,
    name,
    email,
    credits: 2,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // 1. Instant local cache lookup for zero UI delay
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.uid === user.uid) {
          // Asynchronously verify with Firestore in background without blocking caller
          if (isFirebaseConfigured() && db) {
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then(async (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                const fresh: UserProfile = {
                  uid: user.uid,
                  name: data.name || name,
                  email: data.email || email,
                  credits: typeof data.credits === 'number' ? data.credits : 2,
                  createdAt: toIsoString(data.createdAt, nowIso),
                  updatedAt: toIsoString(data.updatedAt, nowIso),
                };
                localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fresh));
              } else {
                // If user document is missing in Firestore, create it immediately
                const newUserData = {
                  uid: user.uid,
                  name,
                  email,
                  credits: 2,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                };
                await setDoc(userRef, newUserData);
              }
            }).catch(() => {});
          }
          return parsed;
        }
      } catch {}
    }
  }

  // 2. Synchronous Firestore check & creation
  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const profile: UserProfile = {
          uid: user.uid,
          name: data.name || name,
          email: data.email || email,
          credits: typeof data.credits === 'number' ? data.credits : 2,
          createdAt: toIsoString(data.createdAt, nowIso),
          updatedAt: toIsoString(data.updatedAt, nowIso),
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
        }
        return profile;
      } else {
        // Brand new user -> Immediately create document in Firestore users/{uid}
        const newUserData = {
          uid: user.uid,
          name,
          email,
          credits: 2,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, newUserData);

        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fallbackProfile));
        }
        return fallbackProfile;
      }
    } catch (err) {
      console.warn('Firestore user profile check/creation error, using fallback:', err);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fallbackProfile));
  }

  return fallbackProfile;
}

/**
 * Deducts 1 credit from user profile in Firestore.
 */
export async function deductUserCredit(uid: string): Promise<number> {
  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const currentCredits = snapshot.data().credits ?? 2;
        const newCredits = Math.max(0, currentCredits - 1);
        await setDoc(userRef, { credits: newCredits, updatedAt: serverTimestamp() }, { merge: true });

        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              parsed.credits = newCredits;
              localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(parsed));
            } catch {}
          }
        }
        return newCredits;
      }
    } catch (err) {
      console.warn('Credit deduction Firestore error:', err);
    }
  }

  // Local fallback
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        parsed.credits = Math.max(0, (parsed.credits ?? 2) - 1);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(parsed));
        return parsed.credits;
      } catch {}
    }
  }

  return 1;
}

/**
 * Adds credits to user profile in Firestore.
 */
export async function addCreditsToUser(uid: string, creditsToAdd: number): Promise<number> {
  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const currentCredits = snapshot.data().credits ?? 2;
        const newCredits = currentCredits + creditsToAdd;
        await setDoc(userRef, { credits: newCredits, updatedAt: serverTimestamp() }, { merge: true });

        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              parsed.credits = newCredits;
              localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(parsed));
            } catch {}
          }
        }
        return newCredits;
      }
    } catch (err) {
      console.warn('Credit addition Firestore error:', err);
    }
  }
  return creditsToAdd;
}

/**
 * Persists a caption project to Cloud Firestore (or localStorage fallback).
 */
export async function saveFirebaseProject(
  project: Partial<Project>
): Promise<{ data: Project | null; error: Error | null; isLocal: boolean }> {
  try {
    if (isFirebaseConfigured() && db) {
      const currentUid = auth?.currentUser?.uid || project.userId || null;
      const projectId = project.id || doc(collection(db, 'projects')).id;

      const projectData = {
        title: project.title || 'Untitled Project',
        videoUrl: project.videoUrl || null,
        transcriptText: project.transcriptText || '',
        words: project.words || [],
        styleSettings: project.styleSettings || DEFAULT_STYLE_SETTINGS,
        hasDeductedCredit: project.hasDeductedCredit ?? false,
        userId: currentUid,
        updatedAt: new Date().toISOString(),
      };

      const docRef = doc(db, 'projects', projectId);
      await setDoc(docRef, projectData, { merge: true });

      const savedProject: Project = {
        id: projectId,
        ...projectData,
        createdAt: project.createdAt || new Date().toISOString(),
      };

      return { data: savedProject, error: null, isLocal: false };
    }
  } catch (err: any) {
    console.warn('Firestore save failed, falling back to local store:', err.message);
  }

  // Local storage fallback
  try {
    if (typeof window === 'undefined') {
      return { data: null, error: new Error('Window is undefined'), isLocal: true };
    }

    const savedRaw = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
    const existing: Project[] = savedRaw ? JSON.parse(savedRaw) : [];

    const now = new Date().toISOString();
    const projectId = project.id || `proj_${Date.now()}`;

    const completeProject: Project = {
      id: projectId,
      userId: project.userId || null,
      title: project.title || 'Untitled Project',
      videoUrl: project.videoUrl || null,
      transcriptText: project.transcriptText || '',
      words: project.words || [],
      styleSettings: project.styleSettings || DEFAULT_STYLE_SETTINGS,
      createdAt: project.createdAt || now,
      updatedAt: now,
    };

    const idx = existing.findIndex((p) => p.id === projectId);
    if (idx >= 0) {
      existing[idx] = completeProject;
    } else {
      existing.unshift(completeProject);
    }

    localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(existing));
    return { data: completeProject, error: null, isLocal: true };
  } catch (localErr: any) {
    return { data: null, error: localErr, isLocal: true };
  }
}

/**
 * Loads a project by ID from Cloud Firestore or localStorage.
 */
export async function fetchFirebaseProject(id: string): Promise<Project | null> {
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'projects', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Project;
      }
    } catch {
      // fallback
    }
  }

  if (typeof window !== 'undefined') {
    const savedRaw = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
    if (savedRaw) {
      const existing: Project[] = JSON.parse(savedRaw);
      return existing.find((p) => p.id === id) || null;
    }
  }

  return null;
}

/**
 * Fetches all projects for a specific user.
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const projects: Project[] = [];
      snapshot.forEach((docSnap) => {
        projects.push({ id: docSnap.id, ...docSnap.data() } as Project);
      });
      // Sort by updatedAt descending
      return projects.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    } catch (err) {
      console.warn('Failed to load user projects from Firestore:', err);
    }
  }

  // Local fallback
  if (typeof window !== 'undefined') {
    const savedRaw = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
    if (savedRaw) {
      try {
        const existing: Project[] = JSON.parse(savedRaw);
        return existing.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      } catch {}
    }
  }

  return [];
}

/**
 * Deletes a project by ID.
 */
export async function deleteFirebaseProject(id: string): Promise<boolean> {
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'projects', id));
      return true;
    } catch (err) {
      console.warn('Failed to delete project from Firestore:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const savedRaw = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
    if (savedRaw) {
      try {
        const existing: Project[] = JSON.parse(savedRaw);
        const filtered = existing.filter((p) => p.id !== id);
        localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(filtered));
        return true;
      } catch {}
    }
  }

  return false;
}
