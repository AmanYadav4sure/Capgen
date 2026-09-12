'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Sparkles,
  Video,
  Clock,
  Trash2,
  ExternalLink,
  Plus,
  LogOut,
  Zap,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Shell } from '@/components/site';
import { useAuth } from '@/components/AuthProvider';
import { getOrCreateUserProfile, getUserProjects, deleteFirebaseProject } from '@/lib/firebase/db';
import { Project, UserProfile } from '@/lib/firebase/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile: profile, logOut, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getUserProjects(user.uid).then((userProjects) => {
        setProjects(userProjects);
        setLoading(false);
      });
    } else if (!authLoading) {
      setProjects([]);
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    setDeletingId(id);
    await deleteFirebaseProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  };

  const handleSignOut = async () => {
    await logOut();
    router.push('/');
  };

  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 size={36} className="animate-spin text-blue-600" />
          </div>
        ) : !profile ? (
          /* Guest Card */
          <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-blue-500/10 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-12 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
              <Zap size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Sign in to View Your Projects</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Sign in to claim your 2 free video exports, sync your projects to Cloud Firestore, and access your captions from any device.
              </p>
            </div>
            <Link
              href="/sign-in"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-105 inline-flex items-center justify-center gap-2 text-sm"
            >
              <span>Sign in with Google or Email</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* User Profile Card */}
            <div className="bg-white/75 backdrop-blur-2xl border border-white/90 shadow-xl shadow-blue-500/5 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-500/20">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{profile.name}</h1>
                  <span className="text-slate-500 text-sm font-medium">{profile.email}</span>
                </div>
              </div>

              {/* Credits & Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-3 text-center backdrop-blur-md">
                  <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-extrabold uppercase tracking-wide">
                    <Zap size={13} className="fill-amber-500 stroke-amber-500" />
                    <span>Free Exports</span>
                  </div>
                  <b className="text-2xl font-black text-slate-900">
                    {profile.credits} <span className="text-xs font-semibold text-slate-500">left</span>
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
                    {projects.length} {projects.length === 1 ? 'project' : 'projects'} saved in Cloud Firestore
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
                      Upload a video in the studio to generate auto-timed captions with word highlighting precision.
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
                    <div
                      key={proj.id}
                      onClick={() => router.push(`/editor?id=${proj.id}`)}
                      className="bg-white/75 backdrop-blur-xl border border-white/90 shadow-lg shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10 hover:bg-white hover:-translate-y-1 rounded-3xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {proj.title || 'Untitled Project'}
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
                          {proj.updatedAt ? new Date(proj.updatedAt).toLocaleDateString() : 'Recent'} •{' '}
                          {proj.words?.length || 0} words
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => handleDelete(proj.id, e)}
                            disabled={deletingId === proj.id}
                            title="Delete project"
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          >
                            {deletingId === proj.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                          <span className="text-blue-600 font-bold flex items-center gap-1">
                            Edit <ExternalLink size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
