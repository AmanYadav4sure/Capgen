'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Video,
  Clock,
  Trash2,
  ExternalLink,
  Plus,
  LogOut,
  Zap,
  Loader2,
} from 'lucide-react';
import { Shell } from '@/components/site';
import { useAuth } from '@/components/AuthProvider';
import { getUserProjects, deleteProject } from '@/lib/data';
import { Project } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    userProfile: profile,
    profileError,
    refreshProfile,
    logOut,
    loading: authLoading,
    sessionActive,
  } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (user) {
      setLoading(true);
      setError(null);
      setProjects([]);
      getUserProjects(user.uid)
        .then((result) => {
          if (!cancelled) {
            setProjects(result.projects);
            setNextCursor(result.nextCursor);
          }
        })
        .catch((error) => {
          if (!cancelled) setError(error.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else if (!authLoading) {
      setProjects([]);
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    setDeletingId(id);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'The project could not be deleted. It has not been removed.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      router.push('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sign-out failed. Please retry.');
    }
  };

  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {(error || profileError) && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <p>{error || profileError}</p>
            <button
              className="mt-2 font-semibold underline min-h-11"
              onClick={async () => {
                setError(null);
                try {
                  const refreshed = await refreshProfile();
                  if (!refreshed) return;
                  const result = await getUserProjects(refreshed.uid);
                  setProjects(result.projects);
                  setNextCursor(result.nextCursor);
                } catch (error) {
                  setError(error instanceof Error ? error.message : 'Please try again.');
                }
              }}
            >
              Retry loading your account
            </button>
          </div>
        )}
        {loading ? (
          <div className="space-y-10 animate-pulse">
            {/* User Profile Card Skeleton */}
            <div className="bg-white/60 border border-slate-200/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-40 bg-slate-200 rounded-md" />
                  <div className="h-4 w-56 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="h-14 w-36 bg-slate-200 rounded-2xl" />
            </div>

            {/* Project Grid Skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-36 bg-slate-200 rounded-md" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-56 bg-white/60 border border-slate-200/80 rounded-3xl p-6 space-y-4"
                  >
                    <div className="h-32 bg-slate-100 rounded-2xl" />
                    <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !sessionActive ? (
          /* Guest Card */
          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-blue-500/10 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-12 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
              <Zap size={32} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900">
                Sign in to view your projects
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Save caption text and styles to your account. Original video files stay on your
                device and must be reselected when reopening a project.
              </p>
            </div>
            <Link
              href="/sign-in"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-105 inline-flex items-center justify-center gap-2 text-sm"
            >
              <span>Sign in with email</span>
            </Link>
          </div>
        ) : !profile ? (
          <p className="py-8 text-slate-600">
            Your session is active, but your account data is unavailable. Use Retry above.
          </p>
        ) : (
          <div className="space-y-10">
            {/* User Profile Card */}
            <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-xl shadow-blue-500/5 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-500/20">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {profile.name}
                  </h1>
                  <span className="text-slate-500 text-sm font-medium">{profile.email}</span>
                </div>
              </div>

              {/* Credits & Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-3 text-center backdrop-blur-md">
                  <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-extrabold uppercase tracking-wide">
                    <Zap size={13} className="fill-amber-500 stroke-amber-500" />
                    <span>Video Credits</span>
                  </div>
                  <b className="text-2xl font-black text-slate-900">
                    {profile.credits}{' '}
                    <span className="text-xs font-semibold text-slate-500">left</span>
                  </b>
                </div>

                <button
                  onClick={handleSignOut}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 border border-slate-200/80 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>

            {/* Projects History Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Your Caption Projects</h2>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    {projects.length} {projects.length === 1 ? 'project' : 'projects'} loaded from
                    your account. Original video files remain on your device.
                  </p>
                </div>
                <Link
                  href="/editor"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-full text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-105 inline-flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>New Caption</span>
                </Link>
              </div>

              {projects.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl border border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                    <Video size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">No caption projects yet</h3>
                    <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
                      Upload a video in the studio to generate auto-timed captions with word
                      highlighting precision.
                    </p>
                  </div>
                  <Link
                    href="/editor"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-full text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
                  >
                    <span>Open Studio Editor</span>
                    <Sparkles size={16} />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {projects.map((proj) => (
                    <article
                      key={proj.id}
                      className="bg-white/75 backdrop-blur-xl border border-white/90 shadow-lg shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10 hover:bg-white hover:-translate-y-1 rounded-3xl p-6 transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            <Link href={`/editor?id=${encodeURIComponent(proj.id)}`}>
                              {proj.title || 'Untitled Project'}
                            </Link>
                          </h3>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60 shrink-0">
                            {proj.styleSettings?.aspectRatio || '9:16'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {proj.transcriptText ||
                            proj.words?.map((w: { word: string }) => w.word).join(' ') ||
                            'No transcript text.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {proj.updatedAt
                            ? new Date(proj.updatedAt).toLocaleDateString()
                            : 'Recent'}{' '}
                          • {proj.words?.length || 0} words
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => handleDelete(proj.id, e)}
                            disabled={deletingId === proj.id}
                            title="Delete project"
                            aria-label={`Delete ${proj.title || 'project'}`}
                            className="text-slate-500 hover:text-rose-500 transition-colors p-3 min-h-11 min-w-11"
                          >
                            {deletingId === proj.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                          <Link
                            href={`/editor?id=${encodeURIComponent(proj.id)}`}
                            className="text-blue-600 font-bold flex items-center gap-1 min-h-11"
                          >
                            Edit <ExternalLink size={12} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {nextCursor && (
                <button
                  disabled={loadingMore}
                  className="min-h-11 px-5 py-3 rounded-full bg-blue-600 text-white disabled:opacity-50"
                  onClick={async () => {
                    if (!user || loadingMore) return;
                    setLoadingMore(true);
                    try {
                      const result = await getUserProjects(user.uid, nextCursor);
                      setProjects((previous) => [
                        ...previous,
                        ...result.projects.filter(
                          (project) => !previous.some((item) => item.id === project.id),
                        ),
                      ]);
                      setNextCursor(result.nextCursor);
                    } catch (error) {
                      setError(
                        error instanceof Error
                          ? error.message
                          : 'More projects could not be loaded.',
                      );
                    } finally {
                      setLoadingMore(false);
                    }
                  }}
                >
                  {loadingMore ? 'Loading projects…' : 'Load more projects'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
