'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  Download,
  Save,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  Type,
  Palette,
  ArrowLeft,
  Trash2,
  Plus,
  Volume2,
  VolumeX,
  Zap,
  Globe,
  Search,
  Move,
  Crown,
  Grid,
  Layers,
  Film,
  Sparkle,
  Sliders,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { extractAudioFromVideo } from '@/lib/extractAudio';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { useAuth } from '@/components/AuthProvider';
import {
  getOrCreateUserProfile,
  deductUserCredit,
  saveFirebaseProject,
  fetchFirebaseProject,
} from '@/lib/firebase/db';
import {
  CaptionWord,
  CaptionTemplate,
  StyleSettings,
  AspectRatio,
  DEFAULT_STYLE_SETTINGS,
  UserProfile,
} from '@/lib/firebase/types';
import { UpgradeModal } from '@/components/UpgradeModal';
import { FontSelectionModal } from '@/components/FontSelectionModal';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import { exportVideoWithFFmpeg, generateSRT, buildPhrases, CaptionPhrase } from '@/lib/ffmpeg-exporter';
import { PREMIUM_STYLES, PremiumStyle } from '@/lib/premiumStyles';
import { LightningBoltIcon, MagicWandIcon, RocketIcon } from '@radix-ui/react-icons';
import { getUserUploadLimit } from '@/lib/planLimits';
import Logo from '@/components/Logo';

export const CREATOR_FONTS = [
  { name: 'Anton', family: "'Anton', sans-serif", category: 'Viral' },
  { name: 'Bebas Neue', family: "'Bebas Neue', sans-serif", category: 'Viral' },
  { name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'Modern' },
  { name: 'Outfit', family: "'Outfit', sans-serif", category: 'Modern' },
  { name: 'Poppins', family: "'Poppins', sans-serif", category: 'Modern' },
  { name: 'Inter', family: "'Inter', sans-serif", category: 'Modern' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", category: 'Editorial' },
  { name: 'Courier Prime', family: "'Courier Prime', monospace", category: 'Retro' },
  { name: 'Kalam (Nepali/Hindi)', family: "'Kalam', cursive", category: 'Devanagari' },
];

const LANGUAGES = [
  { code: 'auto', name: 'Auto Detect (Multi-language)' },
  { code: 'en', name: 'English' },
  { code: 'ne', name: 'Nepali (नेपाली)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
];

// Web Audio API singletons to prevent InvalidStateError on repeated exports
let globalAudioCtx: AudioContext | null = null;
let globalMediaSource: MediaElementAudioSourceNode | null = null;
let globalDestNode: MediaStreamAudioDestinationNode | null = null;

function formatMinutesSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formatTimestamp(seconds: number, separator = ','): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}${separator}${pad(ms, 3)}`;
}

function getActiveChunk(words: CaptionWord[], currentTime: number): CaptionWord[] {
  if (!words || words.length === 0) return [];
  const phrases = buildPhrases(words);

  const activePhrase = phrases.find((p) => currentTime >= p.start && currentTime <= p.end);
  if (activePhrase) {
    return activePhrase.words;
  }

  const nearbyPhrase = phrases.find(
    (p) => (currentTime >= p.start - 0.25 && currentTime < p.start) || (currentTime > p.end && currentTime <= p.end + 0.25)
  );
  if (nearbyPhrase) {
    return nearbyPhrase.words;
  }

  return [];
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 2D Canvas Caption Rendering Engine for MP4 Recording Exports
 * (Renders clean subtitles without black bounding rectangles)
 */
function drawCaptionsToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  words: CaptionWord[],
  currentTime: number,
  styles: StyleSettings
) {
  const activeWords = getActiveChunk(words, currentTime);
  if (activeWords.length === 0) return;

  const activeWordObj = activeWords.find((w) => currentTime >= w.start && currentTime <= w.end) || activeWords[0];

  const scale = canvas.width / 360;
  const fontSize = (styles.fontSize || 24) * scale;
  const fontFamily = styles.fontFamily || 'Anton';
  const uppercase = styles.uppercase ?? true;

  const yPercent = styles.captionYPercent ?? 72;
  const xPercent = styles.captionXPercent ?? 50;

  const y = (yPercent / 100) * canvas.height;
  const targetX = (xPercent / 100) * canvas.width;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const wordItems = activeWords.map((w) => {
    const text = uppercase ? w.word.toUpperCase() : w.word;
    ctx.font = `900 ${fontSize}px "${fontFamily}", sans-serif`;
    const metrics = ctx.measureText(text);
    return {
      wordObj: w,
      text,
      width: metrics.width,
      isActive: activeWordObj && w.start === activeWordObj.start && w.word === activeWordObj.word,
    };
  });

  const gap = 12 * scale;
  const totalWidth = wordItems.reduce((acc, item) => acc + item.width, 0) + (wordItems.length - 1) * gap;

  let x = targetX - totalWidth / 2;

  // Background Box / Pill (Only drawn if explicitly configured with a non-transparent color)
  if (styles.backgroundColor && styles.backgroundColor !== 'transparent' && styles.backgroundColor !== 'rgba(0,0,0,0)') {
    ctx.fillStyle = styles.backgroundColor;
    const paddingX = 16 * scale;
    const paddingY = 10 * scale;
    const boxX = targetX - totalWidth / 2 - paddingX;
    const boxY = y - fontSize / 2 - paddingY;
    const boxW = totalWidth + paddingX * 2;
    const boxH = fontSize + paddingY * 2;
    const radius = 12 * scale;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, radius);
    ctx.fill();
  }

  wordItems.forEach((item) => {
    ctx.save();
    if (item.isActive) {
      if (styles.template === 'mrbeast' || styles.template === 'bumblebee') {
        ctx.translate(x + item.width / 2, y);
        ctx.scale(1.15, 1.15);
        ctx.translate(-(x + item.width / 2), -y);
      }

      ctx.fillStyle = styles.highlightColor || '#FFE500';
      // Crisp 4px outline stroke with drop shadow
      ctx.lineWidth = 4 * scale;
      ctx.strokeStyle = '#000000';
      ctx.font = `900 ${fontSize}px "${fontFamily}", sans-serif`;
      ctx.strokeText(item.text, x + item.width / 2, y);
    } else {
      ctx.fillStyle = styles.textColor || '#FFFFFF';
      ctx.lineWidth = 3 * scale;
      ctx.strokeStyle = '#000000';
      ctx.font = `900 ${fontSize}px "${fontFamily}", sans-serif`;
      ctx.strokeText(item.text, x + item.width / 2, y);
    }

    ctx.font = `900 ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.fillText(item.text, x + item.width / 2, y);
    ctx.restore();

    x += item.width + gap;
  });

  ctx.restore();
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-slate-50 flex items-center justify-center text-slate-900">
          <Loader2 size={36} className="animate-spin text-blue-600" />
        </div>
      }
    >
      <EditorStudio />
    </Suspense>
  );
}

function EditorStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get('id');

  // Video & Audio State
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');

  // Mobile View Navigation State ('video' | 'clips' | 'styles')
  const [mobileTab, setMobileTab] = useState<'video' | 'clips' | 'styles'>('video');

  // Project & Caption State
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>('Untitled Project');
  const [hasDeductedCredit, setHasDeductedCredit] = useState<boolean>(false);
  const [words, setWords] = useState<CaptionWord[]>([]);

  // Active Inspector Tab ('templates' | 'animations' | 'layout')
  const [activeTab, setActiveTab] = useState<'templates' | 'animations' | 'layout'>('templates');

  // Style Settings (Default transparent background, zero black box)
  const [styles, setStyles] = useState<StyleSettings>({
    ...DEFAULT_STYLE_SETTINGS,
    fontFamily: 'Anton',
    fontSize: 24,
    textColor: '#FFFFFF',
    highlightColor: '#FFE500',
    backgroundColor: 'transparent',
    uppercase: true,
    captionXPercent: 50,
    captionYPercent: 72,
    maxWordsPerScreen: 3,
    template: 'bumblebee',
  });

  const [activePresetId, setActivePresetId] = useState<string>('bumblebee');
  const [clipSearch, setClipSearch] = useState<string>('');

  // Interactive Dragging State
  const [isDraggingCaption, setIsDraggingCaption] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; initialX: number; initialY: number } | null>(null);

  // Status & User State
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);

  // MP4 Export State
  const [isExportingMP4, setIsExportingMP4] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { user: authUser, userProfile: currentUser, refreshProfile } = useAuth();

  // Load project from URL
  useEffect(() => {
    if (urlProjectId) {
      fetchFirebaseProject(urlProjectId).then((proj) => {
        if (proj) {
          setProjectId(proj.id);
          setProjectTitle(proj.title);
          if (proj.words && proj.words.length > 0) setWords(proj.words);
          if (proj.styleSettings) setStyles(proj.styleSettings);
          setHasDeductedCredit(Boolean(proj.hasDeductedCredit));
        }
      });
    }
  }, [urlProjectId]);

  // Throttled Frame Sync (~30fps max React state updates)
  useEffect(() => {
    let animId: number;
    let lastTime = 0;

    const tick = () => {
      if (videoRef.current && !videoRef.current.paused) {
        const now = videoRef.current.currentTime;
        if (Math.abs(now - lastTime) >= 0.033) {
          lastTime = now;
          setCurrentTime(now);
        }
        animId = requestAnimationFrame(tick);
      }
    };

    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      animId = requestAnimationFrame(tick);
    };

    const handlePause = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animId);
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      cancelAnimationFrame(animId);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoUrl]);

  // Interactive Relative Dragging
  const handleCaptionPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingCaption(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialX: styles.captionXPercent ?? 50,
      initialY: styles.captionYPercent ?? 72,
    };
  };

  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!isDraggingCaption || !dragStartRef.current || !canvasContainerRef.current) return;
      const rect = canvasContainerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const deltaX = ((e.clientX - dragStartRef.current.pointerX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.pointerY) / rect.height) * 100;

      const newX = Math.max(5, Math.min(95, Math.round(dragStartRef.current.initialX + deltaX)));
      const newY = Math.max(5, Math.min(95, Math.round(dragStartRef.current.initialY + deltaY)));

      setStyles((prev) => ({
        ...prev,
        captionXPercent: newX,
        captionYPercent: newY,
      }));
    };

    const handleWindowPointerUp = () => {
      setIsDraggingCaption(false);
      dragStartRef.current = null;
    };

    if (isDraggingCaption) {
      window.addEventListener('pointermove', handleWindowPointerMove);
      window.addEventListener('pointerup', handleWindowPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [isDraggingCaption]);

  const requireAuth = (): boolean => {
    if (!currentUser) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const handleFilePicked = (file: File) => {
    if (!requireAuth()) return;

    // Enforce Tiered Upload Limits (Free 100MB, Pro 200MB, Team 500MB)
    const { maxMB, maxBytes } = getUserUploadLimit(currentUser);
    if (file.size > maxBytes) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setError(
        `File is too large (${fileSizeMB} MB). Your current plan supports up to ${maxMB} MB per upload. Upgrade your plan for larger uploads (up to 500 MB), or trim the clip first.`
      );
      return;
    }

    if (currentUser && currentUser.credits <= 0 && !hasDeductedCredit) {
      setShowUpgradeModal(true);
      return;
    }

    setPendingVideoFile(file);
    setShowLanguageModal(true);
  };

  const processTranscription = async (file: File, lang: string) => {
    setShowLanguageModal(false);
    setError(null);
    setFileName(file.name);
    setProjectTitle(file.name.replace(/\.[^/.]+$/, ''));
    setHasDeductedCredit(false);

    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
    }
    const newUrl = URL.createObjectURL(file);
    videoUrlRef.current = newUrl;
    setVideoUrl(newUrl);
    setCurrentTime(0);
    setIsPlaying(false);

    setIsLoading(true);

    try {
      const wavBlob = await extractAudioFromVideo(file);

      const formData = new FormData();
      formData.append('file', wavBlob, 'audio.wav');
      formData.append('language', lang);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Transcription failed with status ${res.status}`);
      }

      const data = await res.json();

      if (Array.isArray(data.words) && data.words.length > 0) {
        setWords(data.words);
      } else if (data.text) {
        const split = data.text.split(/\s+/).filter(Boolean);
        const estDuration = videoRef.current?.duration || 10;
        const step = estDuration / Math.max(split.length, 1);
        setWords(
          split.map((w: string, i: number) => ({
            word: w,
            start: Number((i * step).toFixed(2)),
            end: Number(((i + 1) * step).toFixed(2)),
          }))
        );
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err?.message || 'Failed to transcribe audio file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time Canvas Export
  const handleRealtimePlaybackExport = async () => {
    if (!requireAuth()) return;

    if (!videoRef.current || !videoUrl) {
      setError('Please upload a video to export.');
      return;
    }

    if (hasDeductedCredit) {
      setExportNotice('Re-exporting current project (Free)');
      setTimeout(() => setExportNotice(null), 3500);
    } else {
      if (!currentUser || currentUser.credits <= 0) {
        setShowUpgradeModal(true);
        return;
      }
    }

    const videoElement = videoRef.current;

    setIsExportingMP4(true);
    setExportProgress(0);

    videoElement.muted = false;
    videoElement.volume = 1.0;
    setIsMuted(false);
    videoElement.currentTime = 0;

    await new Promise((r) => setTimeout(r, 150));

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 1080;
    canvas.height = videoElement.videoHeight || 1920;
    const ctx = canvas.getContext('2d');

    const canvasStream = canvas.captureStream(30);

    try {
      if (!globalAudioCtx) {
        globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (globalAudioCtx.state === 'suspended') {
        await globalAudioCtx.resume();
      }

      if (!globalMediaSource && videoElement) {
        globalMediaSource = globalAudioCtx.createMediaElementSource(videoElement);
        globalDestNode = globalAudioCtx.createMediaStreamDestination();
        globalMediaSource.connect(globalDestNode);
        globalMediaSource.connect(globalAudioCtx.destination);
      }

      if (globalDestNode) {
        globalDestNode.stream.getAudioTracks().forEach((track) => {
          canvasStream.getAudioTracks().forEach((t) => canvasStream.removeTrack(t));
          canvasStream.addTrack(track);
        });
      }
    } catch (audioErr) {
      console.warn('Web Audio API routing notice:', audioErr);
    }

    const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
      ? 'video/mp4;codecs=avc1'
      : MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: 8000000,
    });
    const recordedChunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    let isExportRunning = true;
    let animationFrameId: number;

    let lastProgressUpdate = 0;
    const onFrameThrottled = (cTime: number, totalDur: number) => {
      const now = performance.now();
      if (now - lastProgressUpdate > 400) {
        lastProgressUpdate = now;
        setExportProgress(Math.min(99, Math.round((cTime / Math.max(totalDur, 1)) * 100)));
      }
    };

    const totalDur = videoElement.duration || 10;

    const renderLoop = () => {
      if (!isExportRunning || !videoRef.current) return;

      const currentVid = videoRef.current;
      const cTime = currentVid.currentTime;

      try {
        if (ctx) {
          ctx.drawImage(currentVid, 0, 0, canvas.width, canvas.height);
          drawCaptionsToCanvas(ctx, canvas, words, cTime, styles);
        }

        onFrameThrottled(cTime, totalDur);
      } catch (err) {
        console.error('Frame render warning:', err);
      }

      if (!currentVid.paused && !currentVid.ended && currentVid.currentTime < totalDur) {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    };

    const maxDurationMs = ((videoElement.duration || 10) + 1.5) * 1000;
    const safetyTimeout = setTimeout(() => {
      if (recorder.state === 'recording') {
        try {
          videoElement.pause();
        } catch (_) {}
        recorder.stop();
      }
    }, maxDurationMs);

    recorder.onstop = async () => {
      isExportRunning = false;
      cancelAnimationFrame(animationFrameId);
      clearTimeout(safetyTimeout);

      const finalBlob = new Blob(recordedChunks, { type: mimeType });
      const downloadUrl = URL.createObjectURL(finalBlob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${projectTitle.replace(/\s+/g, '_') || 'capgen_video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      if (!hasDeductedCredit && currentUser) {
        await deductUserCredit(currentUser.uid);
        await refreshProfile();
        setHasDeductedCredit(true);
        saveFirebaseProject({
          id: projectId || undefined,
          title: projectTitle,
          words,
          styleSettings: styles,
          hasDeductedCredit: true,
        });
      }

      setIsExportingMP4(false);
      setExportProgress(100);
    };

    recorder.start(100);

    try {
      await videoElement.play();
    } catch (playErr) {
      console.warn('Export playback start notice:', playErr);
    }

    animationFrameId = requestAnimationFrame(renderLoop);

    const handleEnded = () => {
      isExportRunning = false;
      cancelAnimationFrame(animationFrameId);
      if (recorder.state === 'recording') {
        recorder.stop();
      }
      videoElement.removeEventListener('ended', handleEnded);
    };

    videoElement.addEventListener('ended', handleEnded, { once: true });
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const exportSRT = () => {
    if (!requireAuth()) return;
    let srt = '';
    const phrases = buildPhrases(words);

    phrases.forEach((phrase, index) => {
      const start = formatTimestamp(phrase.start, ',');
      const end = formatTimestamp(phrase.end, ',');
      const text = phrase.words.map((w) => (styles.uppercase ? w.word.toUpperCase() : w.word)).join(' ');

      srt += `${index + 1}\n${start} --> ${end}\n${text}\n\n`;
    });

    downloadFile(srt, `${projectTitle.replace(/\s+/g, '_')}.srt`, 'text/plain');
  };

  // Apply Premium Preset
  const applyPreset = (preset: PremiumStyle) => {
    setActivePresetId(preset.id);
    setStyles((prev) => ({
      ...prev,
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      textColor: preset.textColor,
      highlightColor: preset.highlightColor,
      backgroundColor: preset.highlightBg || 'transparent',
      template: preset.id as any,
    }));
  };

  // Set position on 9-point grid
  const setPositionGrid = (x: number, y: number) => {
    setStyles((prev) => ({
      ...prev,
      captionXPercent: x,
      captionYPercent: y,
    }));
  };

  const phrases = buildPhrases(words);
  const activeChunk = getActiveChunk(words, currentTime);
  const activeWordObj = activeChunk.find((w) => currentTime >= w.start && currentTime <= w.end) || activeChunk[0];

  const filteredPhrases = phrases.filter((p) =>
    clipSearch
      ? p.words.some((w) => w.word.toLowerCase().includes(clipSearch.toLowerCase()))
      : true
  );

  /* Render Clips Component */
  const renderClipsBreakdown = () => (
    <div className="flex-1 flex flex-col h-full bg-white/75 backdrop-blur-xl overflow-hidden text-slate-900">
      <div className="p-4 border-b border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-blue-600" />
            <h2 className="font-bold text-sm text-slate-900">Clips breakdown</h2>
          </div>
          <span className="text-xs bg-blue-50 border border-blue-200/80 text-blue-700 px-2 py-0.5 rounded-full font-mono font-bold">
            {phrases.length} clips
          </span>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search clips text..."
            value={clipSearch}
            onChange={(e) => setClipSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {filteredPhrases.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            {words.length === 0 ? 'Upload a video to generate clips' : 'No clips match your search'}
          </div>
        ) : (
          filteredPhrases.map((phrase, pIdx) => {
            const isClipActive = currentTime >= phrase.start && currentTime <= phrase.end;

            return (
              <div
                key={pIdx}
                onClick={() => {
                  seekTo(phrase.start);
                  if (mobileTab === 'clips') setMobileTab('video');
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                  isClipActive
                    ? 'bg-blue-50/90 border-blue-400 shadow-md shadow-blue-500/5'
                    : 'bg-white/80 border-slate-200/80 hover:border-blue-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                      Clip #{pIdx + 1}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {formatMinutesSeconds(phrase.start)} - {formatMinutesSeconds(phrase.end)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      seekTo(phrase.start);
                    }}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
                    title="Replay Clip"
                  >
                    <Play size={12} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {phrase.words.map((wObj, wIdx) => {
                    const isWordActive = currentTime >= wObj.start && currentTime <= wObj.end;

                    return (
                      <span
                        key={wIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          seekTo(wObj.start);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                          isWordActive
                            ? 'bg-amber-400 text-slate-950 font-bold scale-105 shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {styles.uppercase ? wObj.word.toUpperCase() : wObj.word}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  /* Render Inspector Components */
  const renderInspectorControls = () => (
    <div className="flex-1 flex flex-col h-full bg-white/75 backdrop-blur-xl overflow-hidden text-slate-900">
      <div className="flex items-center border-b border-slate-200/80 bg-white/60 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'templates'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles size={14} /> Templates
        </button>
        <button
          onClick={() => setActiveTab('animations')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'animations'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap size={14} /> Motion
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'layout'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Grid size={14} /> Layout
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Signature Presets
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a style to apply high-retention viral styling
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {PREMIUM_STYLES.map((preset) => {
                const isSelected = activePresetId === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      applyPreset(preset);
                      if (mobileTab === 'styles') setMobileTab('video');
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 relative ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 shadow-md ring-1 ring-blue-500/40'
                        : 'bg-white/80 border-slate-200/80 hover:border-blue-300 shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 size={16} className="absolute right-3 top-3 text-blue-600" />
                    )}

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{preset.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700">
                        {preset.tag}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed">
                      {preset.description}
                    </p>

                    <div
                      style={{
                        fontFamily: preset.fontFamily,
                        backgroundColor: preset.highlightBg || '#0F172A',
                      }}
                      className="p-3 rounded-xl border border-slate-200/40 flex items-center justify-center gap-1.5 text-sm font-black shadow-inner"
                    >
                      <span style={{ color: preset.textColor }}>VIRAL</span>
                      <span style={{ color: preset.highlightColor }}>CAPTIONS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'animations' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Word Animation Entrance
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Control active word motion & entrance style
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'pop', name: 'Pop Scale', icon: '˗ˏˋ ★ ˎˊ˗' },
                { id: 'marker', name: 'Box Sweep', icon: '✎ᝰ' },
                { id: 'bounce', name: 'Bounce Spring', icon: 'જ⁀➴' },
                { id: 'glow', name: 'Glow Pulse', icon: '.✦ ݁˖' },
                { id: 'fade-slide', name: 'Fade Rise', icon: 'ノ' },
                { id: 'typewriter', name: 'Typewriter', icon: '🖨' },
              ].map((anim) => (
                <button
                  key={anim.id}
                  onClick={() => setStyles((prev) => ({ ...prev, animationType: anim.id as any }))}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-20 ${
                    styles.animationType === anim.id
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md font-bold'
                      : 'bg-white/80 border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <span className="text-xl">{anim.icon}</span>
                  <span className="text-xs font-bold">{anim.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                9-Point Position Grid
              </h3>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                {[
                  { label: 'Top-L', x: 20, y: 20 },
                  { label: 'Top-C', x: 50, y: 20 },
                  { label: 'Top-R', x: 80, y: 20 },
                  { label: 'Mid-L', x: 20, y: 50 },
                  { label: 'Center', x: 50, y: 50 },
                  { label: 'Mid-R', x: 80, y: 50 },
                  { label: 'Bot-L', x: 20, y: 80 },
                  { label: 'Bot-C', x: 50, y: 72 },
                  { label: 'Bot-R', x: 80, y: 80 },
                ].map((pos) => {
                  const isActive =
                    styles.captionXPercent === pos.x && styles.captionYPercent === pos.y;

                  return (
                    <button
                      key={pos.label}
                      onClick={() => setPositionGrid(pos.x, pos.y)}
                      className={`py-3 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
                      }`}
                    >
                      {pos.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Font Family
                </label>
                <button
                  onClick={() => setShowFontModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1"
                >
                  <Type size={12} /> Browse All ↗
                </button>
              </div>
              <select
                value={styles.fontFamily}
                onChange={(e) => setStyles((prev) => ({ ...prev, fontFamily: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer"
              >
                {CREATOR_FONTS.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">Font Size</span>
                <span className="font-mono text-slate-700 font-bold">{styles.fontSize || 24}px</span>
              </div>
              <input
                type="range"
                min={16}
                max={48}
                value={styles.fontSize || 24}
                onChange={(e) =>
                  setStyles((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Text Color
                </label>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                  <input
                    type="color"
                    value={styles.textColor || '#FFFFFF'}
                    onChange={(e) =>
                      setStyles((prev) => ({ ...prev, textColor: e.target.value }))
                    }
                    className="w-6 h-6 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-xs text-slate-700 uppercase font-bold">
                    {styles.textColor}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Highlight
                </label>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                  <input
                    type="color"
                    value={styles.highlightColor || '#FFE500'}
                    onChange={(e) =>
                      setStyles((prev) => ({ ...prev, highlightColor: e.target.value }))
                    }
                    className="w-6 h-6 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-xs text-slate-700 uppercase font-bold">
                    {styles.highlightColor}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                UPPERCASE TEXT
              </span>
              <input
                type="checkbox"
                checked={styles.uppercase ?? true}
                onChange={(e) =>
                  setStyles((prev) => ({ ...prev, uppercase: e.target.checked }))
                }
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-slate-50 via-blue-50/40 to-white text-slate-900 flex flex-col overflow-hidden selection:bg-blue-500 selection:text-white relative font-sans antialiased">
      {/* Background Ambient Glass Glow Orbs (Matching Homepage) */}
      <div className="fixed top-24 left-1/4 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-2/3 right-10 w-[450px] h-[450px] bg-purple-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. TOP HEADER STUDIO NAVBAR */}
      <header className="h-14 sm:h-16 border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between bg-white/75 backdrop-blur-xl shrink-0 z-30 shadow-sm shadow-blue-500/5">
        <div className="flex items-center gap-3 sm:gap-4">
          <Logo href="/" className="w-7 h-7 sm:w-8 sm:h-8" />
          <div className="h-4 w-px bg-slate-300" />
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-slate-900 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl focus:outline-none transition w-36 sm:w-64 truncate shadow-sm"
          />
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-bold hover:bg-amber-500/20 transition cursor-pointer backdrop-blur-md"
          >
            <Zap size={13} className="fill-amber-500 stroke-amber-500" />
            <span>{currentUser ? `${currentUser.credits} Free Exports` : '2 Free Exports'}</span>
          </button>

          <button
            onClick={exportSRT}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-sm text-xs font-bold transition cursor-pointer"
          >
            <Download size={14} /> SRT
          </button>

          <button
            onClick={handleRealtimePlaybackExport}
            disabled={isExportingMP4 || !videoUrl}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExportingMP4 ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span className="hidden sm:inline">Exporting ({exportProgress}%)</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span className="hidden sm:inline">Export HD Video</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* DESKTOP 3-COLUMN STUDIO LAYOUT (>= 768px) */}
        <div className="hidden md:flex flex-1 overflow-hidden w-full">
          {/* Left Column: Clips */}
          <div className="w-72 lg:w-80 border-r border-slate-200/80 flex flex-col bg-white/75 backdrop-blur-xl shrink-0">
            {renderClipsBreakdown()}
          </div>

          {/* Center Column: Video Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center relative p-4 bg-slate-100/70 overflow-hidden">
            {/* Top Aspect Ratio Pill */}
            <div className="absolute top-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-slate-200/80 p-1.5 rounded-full shadow-md">
              {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    aspectRatio === ar
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ar === '9:16' ? '📱 9:16 Shorts' : ar === '1:1' ? '🟩 1:1 Square' : '💻 16:9 Wide'}
                </button>
              ))}
            </div>

            {videoUrl ? (
              <div className="flex-1 flex flex-col items-center justify-center w-full my-12 relative">
                <div
                  ref={canvasContainerRef}
                  className={`relative rounded-3xl overflow-hidden border-4 border-slate-900/90 shadow-2xl bg-black transition-all duration-300 ${
                    aspectRatio === '9:16'
                      ? 'aspect-[9/16] h-[62vh] max-h-[640px]'
                      : aspectRatio === '1:1'
                      ? 'aspect-square h-[56vh] max-h-[560px]'
                      : 'aspect-[16/9] w-[80%] max-w-[700px]'
                  }`}
                >
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Clean Subtitle Overlay without Black Box */}
                  {activeChunk.length > 0 && (
                    <div
                      onPointerDown={handleCaptionPointerDown}
                      style={{
                        left: `${styles.captionXPercent ?? 50}%`,
                        top: `${styles.captionYPercent ?? 72}%`,
                        transform: 'translate(-50%, -50%)',
                        fontFamily: styles.fontFamily || 'Anton',
                        fontSize: `${styles.fontSize || 24}px`,
                        lineHeight: 1.2,
                        backgroundColor:
                          styles.backgroundColor && styles.backgroundColor !== 'transparent'
                            ? styles.backgroundColor
                            : 'transparent',
                      }}
                      className={`absolute z-10 cursor-move select-none px-3 py-1.5 rounded-2xl flex items-center justify-center max-w-[85%] text-center transition-transform ${
                        isDraggingCaption ? 'ring-2 ring-blue-500 scale-105' : ''
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {activeChunk.map((w, idx) => {
                          const isActive =
                            activeWordObj && w.start === activeWordObj.start && w.word === activeWordObj.word;
                          const wordText = styles.uppercase ? w.word.toUpperCase() : w.word;

                          return (
                            <span
                              key={idx}
                              style={{
                                color: isActive ? styles.highlightColor || '#FFE500' : styles.textColor || '#FFFFFF',
                                textShadow:
                                  '0 2px 8px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.6), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                                WebkitTextStroke: '1.5px rgba(0,0,0,0.85)',
                              }}
                              className={`font-extrabold transition-all duration-150 ${
                                isActive ? 'scale-110' : 'opacity-90'
                              }`}
                            >
                              {wordText}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating Playback Controls Bar */}
                <div className="mt-4 flex items-center gap-4 bg-white/90 backdrop-blur-xl border border-slate-200/80 px-6 py-3 rounded-2xl shadow-xl z-20 text-slate-900">
                  <button
                    onClick={() => seekTo(Math.max(0, currentTime - 5))}
                    className="text-slate-500 hover:text-slate-900 p-1.5 transition"
                    title="Rewind 5s"
                  >
                    <RotateCcw size={18} />
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/30 transition"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-700 font-semibold w-12 text-right">
                      {formatMinutesSeconds(currentTime)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.01}
                      value={currentTime}
                      onChange={(e) => seekTo(parseFloat(e.target.value))}
                      className="w-48 sm:w-64 accent-blue-600 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-500 w-12">
                      {formatMinutesSeconds(duration)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="text-slate-500 hover:text-slate-900 p-1.5 transition"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone Empty State */
              <div className="max-w-md w-full p-8 rounded-3xl border-2 border-dashed border-blue-200 bg-white/90 text-center space-y-6 backdrop-blur-xl shadow-xl shadow-blue-500/5">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                  <Upload size={28} />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-left space-y-2">
                    <div className="flex items-start gap-2.5 text-red-600 text-xs font-semibold">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setError(null)}
                        className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500 shadow-md"
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Upload your video</h3>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                    Drop, paste, or browse · MP4, MOV, WEBM · Your plan supports up to{' '}
                    <b className="text-blue-600">{getUserUploadLimit(currentUser).maxMB} MB</b> per upload.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    if (!requireAuth()) return;
                    const file = e.target.files?.[0];
                    if (file) handleFilePicked(file);
                  }}
                />

                <button
                  onClick={() => {
                    if (!requireAuth()) return;
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition cursor-pointer"
                >
                  Select Video File
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Inspector */}
          <div className="w-80 lg:w-96 border-l border-slate-200/80 flex flex-col bg-white/75 backdrop-blur-xl shrink-0">
            {renderInspectorControls()}
          </div>
        </div>

        {/* MOBILE RESPONSIVE LAYOUT (< 768px) */}
        <div className="flex md:hidden flex-1 flex-col overflow-hidden w-full pb-16">
          {mobileTab === 'video' && (
            <div className="flex-1 flex flex-col items-center justify-center p-3 relative overflow-hidden bg-slate-100/70">
              {videoUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                  <div
                    ref={canvasContainerRef}
                    className="relative max-h-[50dvh] w-auto aspect-[9/16] rounded-2xl overflow-hidden border-2 border-slate-900 shadow-2xl bg-black my-auto"
                  >
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* Mobile Subtitle Overlay */}
                    {activeChunk.length > 0 && (
                      <div
                        onPointerDown={handleCaptionPointerDown}
                        style={{
                          left: `${styles.captionXPercent ?? 50}%`,
                          top: `${styles.captionYPercent ?? 72}%`,
                          transform: 'translate(-50%, -50%)',
                          fontFamily: styles.fontFamily || 'Anton',
                          fontSize: `${Math.max(16, (styles.fontSize || 24) * 0.8)}px`,
                          lineHeight: 1.2,
                          backgroundColor: 'transparent',
                        }}
                        className="absolute z-10 select-none px-2 py-1 flex items-center justify-center max-w-[90%] text-center"
                      >
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {activeChunk.map((w, idx) => {
                            const isActive =
                              activeWordObj && w.start === activeWordObj.start && w.word === activeWordObj.word;
                            const wordText = styles.uppercase ? w.word.toUpperCase() : w.word;

                            return (
                              <span
                                key={idx}
                                style={{
                                  color: isActive ? styles.highlightColor || '#FFE500' : styles.textColor || '#FFFFFF',
                                  textShadow:
                                    '0 2px 6px rgba(0,0,0,0.9), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                                  WebkitTextStroke: '1px rgba(0,0,0,0.85)',
                                }}
                                className={`font-extrabold transition-all duration-150 ${
                                  isActive ? 'scale-110' : 'opacity-90'
                                }`}
                              >
                                {wordText}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Compact Playback Control Bar */}
                  <div className="w-full max-w-xs mt-3 bg-white/90 border border-slate-200/80 p-3 rounded-2xl flex items-center justify-between shadow-lg text-slate-900">
                    <button
                      onClick={() => seekTo(Math.max(0, currentTime - 5))}
                      className="text-slate-500 hover:text-slate-900 p-1"
                    >
                      <RotateCcw size={16} />
                    </button>

                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          if (isPlaying) videoRef.current.pause();
                          else videoRef.current.play();
                        }
                      }}
                      className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>

                    <span className="font-mono text-xs text-slate-700 font-semibold">
                      {formatMinutesSeconds(currentTime)} / {formatMinutesSeconds(duration)}
                    </span>

                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="text-slate-500 hover:text-slate-900 p-1"
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                </div>
              ) : (
                /* Mobile Dropzone */
                <div className="w-full max-w-xs p-6 rounded-2xl border-2 border-dashed border-blue-200 bg-white/90 text-center space-y-4 shadow-lg shadow-blue-500/5">
                  <Upload size={24} className="mx-auto text-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">Upload video file</h3>
                  <p className="text-[11px] text-slate-600">
                    Max {getUserUploadLimit(currentUser).maxMB} MB upload size
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      if (!requireAuth()) return;
                      const file = e.target.files?.[0];
                      if (file) handleFilePicked(file);
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!requireAuth()) return;
                      fileInputRef.current?.click();
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Select Video
                  </button>
                </div>
              )}
            </div>
          )}

          {mobileTab === 'clips' && renderClipsBreakdown()}
          {mobileTab === 'styles' && renderInspectorControls()}
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 border-t border-slate-200/80 flex items-center justify-around z-40 backdrop-blur-xl shadow-lg">
        <button
          onClick={() => setMobileTab('video')}
          className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
            mobileTab === 'video' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Film size={18} />
          <span>Video</span>
        </button>

        <button
          onClick={() => setMobileTab('clips')}
          className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
            mobileTab === 'clips' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Sliders size={18} />
          <span>Clips ({phrases.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('styles')}
          className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
            mobileTab === 'styles' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Palette size={18} />
          <span>Style &amp; Fonts</span>
        </button>
      </div>

      {/* MODALS */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <FontSelectionModal
        isOpen={showFontModal}
        onClose={() => setShowFontModal(false)}
        selectedFont={styles.fontFamily}
        onSelectFont={(font) => setStyles((prev) => ({ ...prev, fontFamily: font }))}
      />

      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white">Select Audio Language</h3>
              <p className="text-slate-400 text-xs mt-1">
                Deepgram Nova-2 will transcribe spoken audio into synchronized 9:16 captions.
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`w-full p-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition ${
                    selectedLanguage === lang.code
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950/60 border-white/5 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <span>{lang.name}</span>
                  {selectedLanguage === lang.code && <Check size={16} className="text-blue-400" />}
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingVideoFile) processTranscription(pendingVideoFile, selectedLanguage);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition"
              >
                Start Transcription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
