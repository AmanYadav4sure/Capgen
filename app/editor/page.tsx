'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  useSyncExternalStore,
  useReducer,
} from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  Type,
  Palette,
  Volume2,
  VolumeX,
  Zap,
  Search,
  Film,
  Sliders,
  CheckCircle2,
  CloudUpload,
  Pencil,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  AudioLines,
  Captions,
  Video as VideoIcon,
} from 'lucide-react';
import { extractAudioFromVideo } from '@/lib/extractAudio';
import { useAuth } from '@/components/AuthProvider';
import { deductUserCredit, saveProject, fetchProject } from '@/lib/data';
import { CaptionWord, StyleSettings, AspectRatio, DEFAULT_STYLE_SETTINGS } from '@/lib/types';
const UpgradeModal = dynamic(
  () => import('@/components/UpgradeModal').then((m) => m.UpgradeModal),
  { ssr: false },
);
const FontSelectionModal = dynamic(
  () => import('@/components/FontSelectionModal').then((m) => m.FontSelectionModal),
  { ssr: false },
);
const AuthRequiredModal = dynamic(
  () => import('@/components/AuthRequiredModal').then((m) => m.AuthRequiredModal),
  { ssr: false },
);
import { generateSRT, buildPhrases, CaptionPhrase } from '@/lib/subtitles';
import { PREMIUM_STYLES, PremiumStyle } from '@/lib/premiumStyles';
import { CaptionCanvasRenderer } from '@/lib/exportCaptionRenderer';
import { detectTier, redrawInterval } from '@/lib/exportPerf';
import {
  buildDisplayPhrases,
  normalizeDisplayPhrases,
  activeWordIndex,
  DisplayPhrase,
} from '@/lib/wordChunking';
import {
  CAPTION_SCALE_BASE,
  CaptionMetrics,
  captionFontString,
  captionMetrics,
  layoutCaptionBlock,
  measureCaptionWidth,
  resetCaptionWidthCache,
  typewriterWordCount,
} from '@/lib/captionLayout';
import { getUserUploadLimit } from '@/lib/planLimits';
import { LogoIcon } from '@/components/Logo';
import Modal from '@/components/Modal';

import { CREATOR_FONTS } from '@/lib/creator-fonts';

const LANGUAGES = [
  { code: 'auto', name: 'Auto Detect (Multi-language)' },
  { code: 'en', name: 'English (US/UK)' },
  { code: 'hi', name: 'Hinglish (Hindi + English)' },
  { code: 'ne', name: 'Nepali (नेपाली)' },
  { code: 'hi-IN', name: 'Hindi (हिन्दी)' },
  { code: 'ur', name: 'Urdu (اردو)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'tr', name: 'Turkish (Türkçe)' },
  { code: 'id', name: 'Indonesian (Bahasa Indonesia)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'pl', name: 'Polish (Polski)' },
  { code: 'sv', name: 'Swedish (Svenska)' },
  { code: 'no', name: 'Norwegian (Norsk)' },
  { code: 'da', name: 'Danish (Dansk)' },
  { code: 'fi', name: 'Finnish (Suomi)' },
  { code: 'el', name: 'Greek (Ελληνικά)' },
  { code: 'he', name: 'Hebrew (עברית)' },
  { code: 'ms', name: 'Malay (Bahasa Melayu)' },
  { code: 'th', name: 'Thai (ไทย)' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)' },
  { code: 'uk', name: 'Ukrainian (Українська)' },
  { code: 'cs', name: 'Czech (Čeština)' },
  { code: 'ro', name: 'Romanian (Română)' },
  { code: 'hu', name: 'Hungarian (Magyar)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
];

// Web Audio API singletons to prevent InvalidStateError on repeated exports
let globalAudioCtx: AudioContext | null = null;
const audioGraphs = new WeakMap<
  HTMLVideoElement,
  {
    source: MediaElementAudioSourceNode;
    destination: MediaStreamAudioDestinationNode;
    connected: boolean;
  }
>();

function formatMinutesSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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

// ---------------- Caption visual engine (shared math for canvas export & DOM preview) ----------------

const POP_START_SCALE = 0.82; // spring-in only ever shrinks — see lib/captionLayout

function easeOutCubic(t: number): number {
  const c = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - c, 3);
}

type CaptionMotion = NonNullable<StyleSettings['animationType']>;

function templateMotion(styles: StyleSettings): CaptionMotion {
  if (styles.animationType) return styles.animationType;
  switch (styles.template) {
    case 'ali_abdaal_marker':
    case 'tidemark':
    case 'sunset_glow':
    case 'frost_glass':
    case 'sunrise_purple_pill':
      return 'marker';
    case 'hormozi_viral':
    case 'frosted_ice':
    case 'versely_neon':
    case 'versely_glow':
    case 'cyberpunk_glitch':
    case 'electric_violet':
    case 'shamani_gold_glow':
    case 'cyber_magenta_pop':
      return 'glow';
    case 'typewriter':
    case 'terminal_typewriter':
    case 'matrix_green':
      return 'typewriter';
    case 'elevate':
    case 'golden_hour':
    case 'clean_minimal':
      return 'fade-slide';
    case 'emerald_beast':
      return 'bounce';
    default:
      return 'pop';
  }
}

interface CaptionVisual {
  color: string;
  strokeColor: string | null;
  strokeWidth: number; // in CAPTION_SCALE_BASE units (multiply by frame scale)
  boxColor: string | null; // marker highlighter box behind the word
  boxRadius: number;
  boxPadX: number;
  boxPadY: number;
  scale: number; // word scale factor
  lift: number; // translateY in base units (negative = up)
  alpha: number;
  glow: number; // shadowBlur in base units
  glowColor: string | null;
  sweep: number; // 0..1 marker box sweep progress
}

function computeCaptionVisual(
  word: CaptionWord,
  currentTime: number,
  styles: StyleSettings,
  motion: CaptionMotion,
  isActive: boolean,
): CaptionVisual {
  // 180ms spring-in: pop/bounce/sweep all ease out from the word's start time
  const p = easeOutCubic((currentTime - word.start) / 0.18);

  const v: CaptionVisual = {
    color: styles.textColor || '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 3,
    boxColor: null,
    boxRadius: 8,
    boxPadX: 12,
    boxPadY: 4,
    scale: 1,
    lift: 0,
    alpha: 1,
    glow: 0,
    glowColor: null,
    sweep: 1,
  };

  if (isActive) {
    v.sweep = p;
    switch (motion) {
      case 'pop':
        // Spring IN from slightly small to the word's own size. Growing past
        // 1.0 is what made a highlighted word reach over its neighbour.
        v.scale = POP_START_SCALE + (1 - POP_START_SCALE) * p;
        break;
      case 'bounce':
        v.lift = -8 * (1 - p); // quick upward bounce → settle
        break;
      case 'fade-slide':
        v.alpha = 0.15 + 0.85 * p;
        v.lift = (1 - p) * 8;
        break;
      case 'glow':
        v.glow = 10 + 5 * Math.sin(currentTime * 10); // pulsing radial glow
        break;
      case 'marker':
        v.sweep = p; // lime box sweeps across the word
        break;
      case 'typewriter':
        break;
    }
  }

  const bg =
    styles.backgroundColor && styles.backgroundColor !== 'transparent'
      ? styles.backgroundColor
      : null;

  switch (styles.template) {
    case 'ali_abdaal_marker':
      // Homepage hero style: lime-green marker box, bold black text, white inactive words
      v.boxColor = isActive ? styles.highlightBg || bg || '#A3E635' : null;
      v.color = isActive ? '#000000' : styles.textColor || '#FFFFFF';
      v.strokeColor = isActive ? null : '#000000';
      break;
    case 'mrbeast_gold':
      // Thick black outline, gold punch word
      v.strokeWidth = 8;
      v.color = isActive ? styles.highlightColor || '#FFE600' : '#FFFFFF';
      v.strokeColor = '#000000';
      break;
    case 'hormozi_viral':
      v.strokeColor = null;
      v.color = isActive ? styles.highlightColor || '#00F0FF' : '#FFFFFF';
      if (isActive) {
        v.glow = Math.max(v.glow, 14);
        v.glowColor = styles.highlightColor || '#00F0FF';
      }
      break;
    case 'shamani_gold_glow':
      // Fiery amber bloom, dark 3px stroke on all words
      v.strokeColor = '#18181B';
      v.strokeWidth = 3;
      v.color = isActive ? styles.highlightColor || '#FFB800' : '#FFFFFF';
      if (isActive) {
        v.glow = Math.max(v.glow, 18);
        v.glowColor = '#FF9900';
      }
      break;
    case 'sunrise_purple_pill':
      // Royal purple pill sweeps behind; neon yellow active text
      v.boxColor = isActive ? styles.highlightBg || '#7C3AED' : null;
      v.boxRadius = 8;
      v.boxPadX = 10;
      v.boxPadY = 4;
      v.color = isActive ? styles.highlightColor || '#FACC15' : '#FFFFFF';
      v.strokeColor = isActive ? null : '#000000';
      break;
    case 'figuring_out_emerald':
      // Heavy 6px outline; the neon green punch reads through colour + outline,
      // not through a 1.2x box that would overlap the next word.
      v.strokeWidth = 6;
      v.strokeColor = '#000000';
      v.color = isActive ? styles.highlightColor || '#22C55E' : '#FFFFFF';
      if (isActive) {
        v.glow = Math.max(v.glow, 8);
        v.glowColor = styles.highlightColor || '#22C55E';
      }
      break;
    case 'cyber_magenta_pop':
      v.strokeColor = null;
      v.color = isActive ? styles.highlightColor || '#EC4899' : '#FFFFFF';
      if (isActive) {
        v.glow = Math.max(v.glow, 16);
        v.glowColor = '#00F0FF';
      }
      break;
    case 'frosted_ice':
      v.strokeColor = null;
      v.color = isActive ? styles.highlightColor || '#2060F6' : '#FFFFFF';
      if (isActive) {
        v.glow = Math.max(v.glow, 10);
        v.glowColor = styles.highlightColor || '#2060F6';
      }
      break;
    default:
      if (isActive) {
        if (motion === 'marker' && bg) {
          // Legacy marker presets (tidemark, sunset…) sweep their own highlight bg
          v.boxColor = bg;
          v.color = '#000000';
          v.strokeColor = null;
        } else {
          v.color = styles.highlightColor || '#FFE500';
          v.strokeColor = '#000000';
        }
      }
      break;
  }

  return v;
}

/*
 * Export caption rendering moved to lib/exportCaptionRenderer.ts — a per-export
 * class that caches phrases/word-widths/template rules at setup time (the old
 * per-frame rebuild was the export bottleneck). The DOM preview below stays the
 * WYSIWYG mirror of that engine.
 */

/**
 * Preview of the optional burned-in Reels/Shorts timeline bar. Mirrors
 * CaptionCanvasRenderer.drawProgress() exactly (track + animated fill) so
 * what the creator sees is what gets rendered into the MP4.
 */
function ProgressBarOverlay({
  currentTime,
  duration,
  styles,
  containerRef,
}: {
  currentTime: number;
  duration: number;
  styles: StyleSettings;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { width } = useElementSize(containerRef);
  if (!styles.progressBarEnabled || duration <= 0) return null;
  const scale = width > 0 ? width / CAPTION_SCALE_BASE : 1;
  const h = Math.max(2, styles.progressBarHeight || 6) * scale;
  const pct = Math.min(100, Math.max(0, (currentTime / duration) * 100));
  return (
    <div
      aria-hidden
      className={`absolute left-0 right-0 z-20 pointer-events-none ${
        styles.progressBarPosition === 'top' ? 'top-0' : 'bottom-0'
      }`}
      style={{ height: `${h}px` }}
    >
      <div className="w-full h-full" style={{ background: 'rgba(0, 0, 0, 0.35)' }} />
      <div
        className="absolute left-0 top-0 h-full"
        style={{ width: `${pct}%`, background: styles.progressBarColor || '#2060F6' }}
      />
    </div>
  );
}

function useElementSize(ref: React.RefObject<HTMLElement | null>): {
  width: number;
  height: number;
} {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({ width: r.width, height: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/**
 * Webfonts change text metrics when they land. Caption widths are measured with
 * measureText() to lay the block out, so the cache must be dropped and the
 * block re-measured once the real face is available — otherwise a word measured
 * in the fallback font keeps its old slot and the painted glyphs overrun it.
 */
function useFontsSettled(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    if (typeof document === 'undefined' || !document.fonts) return;
    document.fonts.ready.then(() => {
      if (!alive) return;
      resetCaptionWidthCache();
      setTick((t) => t + 1);
    });
    return () => {
      alive = false;
    };
  }, []);
  return tick;
}

/**
 * WYSIWYG DOM caption overlay — the preview of CaptionCanvasRenderer. It shares
 * lib/captionLayout with the exporter (same gap, leading, safe box and block
 * fit) so a frame that looks right here cannot come out corrupted in the MP4.
 *
 * Layout contract (this is what the word-corruption bugs violated):
 *  - ONE container per active segment; the browser places the words with flex;
 *  - each word is an atomic flex item (never shrunk, never broken mid-word);
 *  - animation only paints (colour, opacity, glow, box, scale<=1, translateY)
 *    — it can never move a neighbour or change the block layout;
 *  - a word is shown complete or not at all.
 */
function CaptionOverlay({
  phrases,
  currentTime,
  styles,
  containerRef,
  isDragging,
  onPointerDown,
  staticLayout,
}: {
  phrases: DisplayPhrase[];
  currentTime: number;
  styles: StyleSettings;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  /** dev-only: plain flex caption with every animation disabled */
  staticLayout?: boolean;
}) {
  const { width, height } = useElementSize(containerRef);
  const fontsTick = useFontsSettled();
  const scale = width > 0 ? width / CAPTION_SCALE_BASE : 1;
  const fontPx = (styles.fontSize || 24) * scale;
  const motion = templateMotion(styles);

  // The active segment comes from the SAME derived phrases the timeline and
  // the MP4 export consume — never re-chunk the raw transcript here.
  const phrase = useMemo(
    () => phrases.find((p) => currentTime >= p.start && currentTime < p.end),
    [phrases, currentTime],
  );

  const upper = styles.uppercase ?? true;
  const texts = useMemo(
    () => (phrase ? phrase.words.map((w) => (upper ? w.word.toUpperCase() : w.word)) : []),
    [phrase, upper],
  );

  // Freeze the block geometry (lines + whole-block fit) per segment, exactly as
  // the exporter does. Words wrap between themselves, never inside a word.
  const block = useMemo(() => {
    if (!width || !height || texts.length === 0) {
      return { fit: 1, m: null as CaptionMetrics | null };
    }
    const m = captionMetrics({
      fontSizePx: fontPx,
      frameWidth: width,
      frameHeight: height,
      centerX: ((styles.captionXPercent ?? 50) / 100) * width,
      centerY: ((styles.captionYPercent ?? 72) / 100) * height,
    });
    const widths = texts.map((t) => measureCaptionWidth(t, captionFontString(styles, fontPx)));
    if (widths.some((w) => w === 0)) return { fit: 1, m };
    return { fit: layoutCaptionBlock(widths, m).fit, m };
    // fontsTick re-measures once the real webfont is available
  }, [texts, width, height, fontPx, styles, fontsTick]);

  if (!phrase) return null;

  const m = block.m;
  const gapX = m ? m.gapX : 8 * scale;
  const gapY = m ? m.gapY : 0;
  const outsetLimit = m ? m.outsetLimit : 6 * scale;
  const maxLift = m ? m.maxLift : 8 * scale;

  const activeIdx = staticLayout ? -1 : activeWordIndex(phrase.words, currentTime);
  const shown =
    staticLayout || motion !== 'typewriter'
      ? phrase.words.length
      : typewriterWordCount(phrase.words, currentTime, phrase.start);

  const items = phrase.words.slice(0, shown).map((w, idx) => ({
    text: upper ? w.word.toUpperCase() : w.word,
    v: computeCaptionVisual(w, currentTime, styles, motion, idx === activeIdx),
  }));

  if (items.length === 0) return null;

  const pillColor =
    styles.backgroundColor &&
    styles.backgroundColor !== 'transparent' &&
    styles.backgroundColor !== 'rgba(0,0,0,0)'
      ? styles.backgroundColor
      : null;

  // Item 13 of the layout spec: a plain flex caption with no animation at all,
  // used to prove the corruption lives in the animation and not the text.
  if (staticLayout) {
    return (
      <div
        className="absolute z-10 select-none ed-caption-static"
        style={{
          left: `${styles.captionXPercent ?? 50}%`,
          top: `${styles.captionYPercent ?? 72}%`,
          transform: 'translate(-50%, -50%)',
          fontFamily: `"${styles.fontFamily || 'Anton'}", sans-serif`,
          fontSize: `${fontPx}px`,
          color: styles.textColor || '#FFFFFF',
        }}
        data-caption-static="1"
      >
        <div
          className="flex flex-wrap items-center justify-center text-center"
          style={{ gap: `${gapX}px`, maxWidth: '85%', marginInline: 'auto' }}
        >
          {items.map((it, idx) => (
            <span key={idx} className="ed-caption-word" data-capword="1">
              {it.text}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        left: `${styles.captionXPercent ?? 50}%`,
        top: `${styles.captionYPercent ?? 72}%`,
        transform: `translate(-50%, -50%) scale(${block.fit})`,
        fontFamily: `"${styles.fontFamily || 'Anton'}", sans-serif`,
        fontSize: `${fontPx}px`,
        fontWeight: 900,
        lineHeight: 1.18,
        backgroundColor: pillColor || 'transparent',
        padding: pillColor ? `${8 * scale}px ${14 * scale}px` : 0,
        borderRadius: pillColor ? `${12 * scale}px` : 0,
      }}
      className={`absolute z-10 select-none w-fit max-w-[85%] flex items-center justify-center text-center cursor-move ${
        isDragging ? 'ring-2 ring-blue-500' : ''
      } ${process.env.NODE_ENV !== 'production' ? 'ed-caption-overlay-dev' : ''}`}
      data-caption-fit={block.fit.toFixed(3)}
    >
      <div
        className="flex flex-wrap items-center justify-center"
        style={{ gap: `${gapY}px ${gapX}px`, width: '100%', marginInline: 'auto' }}
      >
        {items.map((it, idx) => {
          const v = it.v;
          const strokePx = v.strokeColor ? Math.max(0.8, v.strokeWidth * scale * 0.4) : 0;
          const liftPx = Math.max(-maxLift, Math.min(maxLift, v.lift * scale));
          return (
            <span
              key={idx}
              className="relative ed-caption-word"
              data-capword="1"
              data-active={
                process.env.NODE_ENV !== 'production' ? (idx === activeIdx ? '1' : '0') : undefined
              }
              style={{
                color: v.color,
                opacity: v.alpha,
                // transform never changes layout, and scale stays <= 1 so the
                // highlighted word can never grow into its neighbour
                transform: `scale(${Math.min(1, v.scale)}) translateY(${liftPx}px)`,
                WebkitTextStroke: strokePx > 0 ? `${strokePx}px ${v.strokeColor}` : undefined,
                paintOrder: 'stroke',
                textShadow:
                  v.glow > 0
                    ? `0 0 ${v.glow * scale}px ${v.glowColor || v.color}, 0 0 ${v.glow * 2 * scale}px ${v.glowColor || v.color}`
                    : v.strokeColor
                      ? '0 2px 6px rgba(0,0,0,0.55)'
                      : undefined,
              }}
            >
              {v.boxColor && (
                <span
                  aria-hidden
                  className="absolute ed-caption-box"
                  style={{
                    top: `${-Math.min(v.boxPadY * scale, fontPx * 0.3)}px`,
                    bottom: `${-Math.min(v.boxPadY * scale, fontPx * 0.3)}px`,
                    left: `${-Math.min(v.boxPadX * scale, outsetLimit)}px`,
                    width: `calc(100% + ${Math.min(v.boxPadX * scale, outsetLimit) * 2}px)`,
                    background: v.boxColor,
                    borderRadius: `${v.boxRadius * scale}px`,
                    clipPath: `inset(-30% ${(1 - v.sweep) * 100}% -30% 0)`,
                  }}
                />
              )}
              <span className="relative">{it.text}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(min-width: 768px)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(min-width: 768px)').matches,
    () => false, // SSR snapshot
  );
}

function useIsTablet() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(min-width: 768px) and (max-width: 1279px)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(min-width: 768px) and (max-width: 1279px)').matches,
    () => false,
  );
}

/**
 * Extracts real timeline thumbnails from the uploaded video using a detached,
 * muted <video> element — the main player is never seeked, so playback and
 * caption rendering are untouched.
 */
function useVideoThumbnails(videoUrl: string | null): string[] {
  const [frames, setFrames] = useState<string[]>([]);

  useEffect(() => {
    if (!videoUrl) {
      setFrames([]);
      return;
    }
    let cancelled = false;
    const probe = document.createElement('video');
    probe.src = videoUrl;
    probe.muted = true;
    probe.playsInline = true;
    probe.preload = 'auto';
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    (async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          probe.onloadedmetadata = () => resolve();
          probe.onerror = () => reject(new Error('metadata'));
        });
        if (cancelled || !ctx) return;
        const dur = probe.duration || 0;
        if (dur <= 0) return;
        const count = Math.max(4, Math.min(10, Math.round(dur)));
        const out: string[] = [];
        for (let i = 0; i < count && !cancelled; i++) {
          const t = Math.min(dur - 0.05, (i + 0.5) * (dur / count));
          await new Promise<void>((resolve) => {
            probe.onseeked = () => resolve();
            probe.currentTime = t;
            setTimeout(resolve, 900);
          });
          if (cancelled) break;
          try {
            ctx.drawImage(probe, 0, 0, 160, 90);
            out.push(canvas.toDataURL('image/jpeg', 0.55));
          } catch {
            out.push('');
          }
        }
        if (!cancelled) setFrames(out);
      } catch {
        /* no thumbnails — timeline shows a plain video track */
      }
    })();

    return () => {
      cancelled = true;
      probe.removeAttribute('src');
      probe.load();
    };
  }, [videoUrl]);

  return frames;
}

/**
 * Studio timeline: time ruler, real video-thumbnail track, actual caption
 * segments, playhead synced to the live video. Every interaction is a real
 * seek on the player.
 */
function StudioTimeline({
  duration,
  currentTime,
  phrases,
  thumbnails,
  onSeek,
}: {
  duration: number;
  currentTime: number;
  phrases: CaptionPhrase[];
  thumbnails: string[];
  onSeek: (seconds: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const seekFromEvent = (e: React.MouseEvent) => {
    const el = trackRef.current;
    if (!el || duration <= 0) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(pct * duration);
  };

  if (duration <= 0) return null;

  const pct = Math.min(100, Math.max(0, (currentTime / duration) * 100));
  const tickStep = duration > 120 ? 15 : duration > 60 ? 10 : 5;
  const ticks: number[] = [];
  for (let t = 0; t <= duration + tickStep; t += tickStep) ticks.push(t);

  return (
    <div className="ed-timeline">
      <div className="ed-tl-ruler">
        {ticks.map((t) => (
          <span
            key={t}
            className="ed-tl-tick"
            style={{ left: `${Math.min(100, (t / duration) * 100)}%` }}
          >
            {formatMinutesSeconds(t)}
          </span>
        ))}
      </div>

      <div className="ed-tl-tracks" ref={trackRef}>
        <div className="ed-tl-playhead" style={{ left: `${pct}%` }} aria-hidden="true">
          <span />
        </div>

        {/* VIDEO TRACK — real frames extracted from the uploaded video */}
        <div className="ed-tl-lane ed-tl-video-lane" onClick={seekFromEvent}>
          {thumbnails.length > 0 ? (
            thumbnails.map((src, i) => <img key={i} src={src} alt="" draggable={false} />)
          ) : (
            <span className="ed-tl-lane-placeholder" />
          )}
        </div>

        {/* CAPTION TRACK — actual generated caption segments */}
        <div className="ed-tl-lane ed-tl-caption-lane" onClick={seekFromEvent}>
          {phrases.map((phrase, i) => {
            const left = Math.max(0, (phrase.start / duration) * 100);
            const width = Math.max(1.5, ((phrase.end - phrase.start) / duration) * 100);
            const isActive = currentTime >= phrase.start && currentTime < phrase.end;
            const label = phrase.words.map((w) => w.word).join(' ');
            return (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(phrase.start);
                }}
                className={`ed-tl-segment ${isActive ? 'is-active' : ''}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={label}
              >
                {label}
              </button>
            );
          })}
          {phrases.length === 0 && <span className="ed-tl-lane-placeholder" />}
        </div>

        {/* AUDIO TRACK — structural lane (no waveform data available) */}
        <div className="ed-tl-lane ed-tl-audio-lane" onClick={seekFromEvent} />
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-[#050914] flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-blue-500" />
        </div>
      }
    >
      <EditorStudio />
    </Suspense>
  );
}

function EditorStudio() {
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get('id');

  // Video & Audio State
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Mobile View Navigation State ('video' | 'clips' | 'styles')
  const [mobileTab, setMobileTab] = useState<'video' | 'clips' | 'styles'>('video');
  // True >= 768px. Gates which layout tree is MOUNTED so only ONE <video>
  // element exists at a time (two trees fighting over videoRef was breaking
  // caption rendering on real phones).
  const isDesktop = useIsDesktop();

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
  // Dev-only: renders the caption as a plain flex block with every animation
  // disabled, to separate layout bugs from animation-lifecycle bugs.
  const [devStaticCaptions, setDevStaticCaptions] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // Status & User State
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [needsSource, setNeedsSource] = useState(false);
  const saveGeneration = useRef(0);
  const processing = useRef(false);
  const processingGeneration = useRef(0);
  const reconnectSource = useRef(false);
  const exporting = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);

  // MP4 Export State
  const [isExportingMP4, setIsExportingMP4] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStats, setExportStats] = useState<{
    fps: number;
    dropped: number;
    videoDropped: number;
    tier: string;
    frame: number;
    totalFrames: number;
  } | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [languageSearch, setLanguageSearch] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentTimeRef = useRef<number>(0);

  const {
    user: authUser,
    userProfile: currentUser,
    profileError,
    refreshProfile,
    loading: authLoading,
  } = useAuth();
  const previousOwner = useRef<string | null>(null);
  useEffect(() => {
    const next = authUser?.uid || null;
    if (previousOwner.current && previousOwner.current !== next) {
      ++processingGeneration.current;
      processing.current = false;
      videoRef.current?.pause();
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
      setVideoUrl(null);
      setWords([]);
      setProjectId(null);
      setNeedsSource(false);
      setSaveError(null);
      setError('Your account session changed. Sign in and reopen your project to continue.');
    }
    previousOwner.current = next;
  }, [authUser?.uid]);

  // Studio chrome state
  const isTablet = useIsTablet();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const thumbnails = useVideoThumbnails(videoUrl);

  // Panels default open on full desktop, collapsed on tablet-width screens
  useEffect(() => {
    if (isTablet) {
      // Tablet starts with side panels collapsed — toggled from the canvas toolbar
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    } else {
      setLeftPanelOpen(true);
      setRightPanelOpen(true);
    }
  }, [isTablet]);

  // Undo/redo history for caption style changes
  const stylesRef = useRef(styles);
  const aspectRatio = styles.aspectRatio;
  useEffect(() => {
    stylesRef.current = styles;
  }, [styles]);
  const undoStackRef = useRef<StyleSettings[]>([]);
  const redoStackRef = useRef<StyleSettings[]>([]);
  const [, bumpHistory] = useReducer((x: number) => x + 1, 0);

  const updateStyles = useCallback(
    (fn: ((prev: StyleSettings) => StyleSettings) | StyleSettings, record = true) => {
      if (record) {
        undoStackRef.current.push(stylesRef.current);
        if (undoStackRef.current.length > 50) undoStackRef.current.shift();
        redoStackRef.current = [];
        bumpHistory();
      }
      setStyles(typeof fn === 'function' ? (fn as (prev: StyleSettings) => StyleSettings) : fn);
    },
    [],
  );

  const undoStyles = useCallback(() => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    redoStackRef.current.push(stylesRef.current);
    setStyles(prev);
    bumpHistory();
  }, []);

  const setAspectRatio = useCallback(
    (ratio: AspectRatio) => {
      updateStyles((previous) => ({ ...previous, aspectRatio: ratio }));
    },
    [updateStyles],
  );

  const redoStyles = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(stylesRef.current);
    setStyles(next);
    bumpHistory();
  }, []);

  // Load project from URL
  useEffect(() => {
    let cancelled = false;
    if (urlProjectId && authUser && !authLoading) {
      fetchProject(urlProjectId)
        .then((proj) => {
          if (cancelled) return;
          if (proj) {
            if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
            videoUrlRef.current = null;
            setVideoUrl(null);
            setProjectId(proj.id);
            setProjectTitle(proj.title);
            setWords(proj.words || []);
            if (proj.styleSettings) setStyles(proj.styleSettings);
            setHasDeductedCredit(Boolean(proj.hasDeductedCredit));
            setNeedsSource(true);
            setSaveStatus('saved');
            setSaveError(null);
          } else {
            setError('This project was not found in your account. It may have been deleted.');
          }
        })
        .catch((error) => {
          if (!cancelled) setError(error.message);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [urlProjectId, authUser?.uid, authLoading]);

  useEffect(
    () => () => {
      ++processingGeneration.current;
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    },
    [],
  );

  // Throttled Frame Sync (~30fps max React state updates)
  // NOTE: deps include isDesktop & mobileTab — the <video> element is remounted
  // whenever the active layout/tab changes, so listeners MUST be re-attached to
  // the new element or captions freeze (previously deps were [videoUrl] only).
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

    // Restore playback position after a tab-switch remount
    if (
      currentTimeRef.current > 0.1 &&
      Math.abs(video.currentTime - currentTimeRef.current) > 0.2
    ) {
      try {
        video.currentTime = currentTimeRef.current;
      } catch {}
    }

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

    if (!video.paused) {
      animId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animId);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      const graph = audioGraphs.get(video);
      if (graph?.connected) {
        graph.source.disconnect();
        graph.connected = false;
      }
    };
  }, [videoUrl, isDesktop, mobileTab]);

  // Keep a ref mirror of currentTime for position restoration after remounts
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Only confirmed server writes may be displayed as saved.
  useEffect(() => {
    if (!videoUrl || !projectId || !authUser || isExportingMP4 || isLoading) return;
    const generation = ++saveGeneration.current;
    setSaveStatus('saving');
    const t = setTimeout(() => {
      saveProject({
        id: projectId,
        title: projectTitle,
        words,
        styleSettings: styles,
        hasDeductedCredit,
      })
        .then(({ data, error }) => {
          if (generation !== saveGeneration.current) return;
          if (error || !data) {
            setSaveStatus('error');
            setSaveError(error?.message || 'Your project was not saved.');
          } else {
            setSaveStatus('saved');
            setSaveError(null);
          }
        })
        .catch((error) => {
          if (generation === saveGeneration.current) {
            setSaveStatus('error');
            setSaveError(error.message);
          }
        });
    }, 1200);
    return () => {
      clearTimeout(t);
      ++saveGeneration.current;
    };
  }, [
    projectTitle,
    styles,
    words,
    videoUrl,
    projectId,
    hasDeductedCredit,
    isExportingMP4,
    isLoading,
    authUser?.uid,
  ]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (videoUrl && (saveStatus !== 'saved' || isLoading || isExportingMP4)) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [videoUrl, saveStatus, isLoading, isExportingMP4]);

  // Dev-only: register window.__capgenBenchmark for export-loop profiling
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      import('@/lib/exportBenchmark').catch(() => {});
    }
  }, []);

  // Interactive Relative Dragging
  const handleCaptionPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingCaption(true);
    // Snapshot the pre-drag style so a single undo reverts the whole drag
    undoStackRef.current.push(stylesRef.current);
    redoStackRef.current = [];
    bumpHistory();
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

      updateStyles(
        (prev) => ({
          ...prev,
          captionXPercent: newX,
          captionYPercent: newY,
        }),
        false, // drag moves are one undo step, not dozens
      );
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
    if (!authUser) {
      setShowAuthModal(true);
      return false;
    }
    if (!currentUser) {
      setError(profileError || 'Your account is still loading. Please retry shortly.');
      return false;
    }
    return true;
  };

  const handleFilePicked = (file: File) => {
    if (!requireAuth()) return;
    if (processing.current || exporting.current) {
      setError('Wait for the current operation to finish before choosing another file.');
      return;
    }
    if (
      !file.size ||
      (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v)$/i.test(file.name))
    ) {
      setError('Choose a non-empty video file your browser can play.');
      return;
    }

    // Enforce Tiered Upload Limits (Free 100MB, Pro 200MB, Team 500MB)
    const { maxMB, maxBytes } = getUserUploadLimit(currentUser);
    if (file.size > maxBytes) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setError(
        `File is too large (${fileSizeMB} MB). Your current plan supports up to ${maxMB} MB per upload. Upgrade your plan for larger uploads (up to 500 MB), or trim the clip first.`,
      );
      return;
    }

    if (reconnectSource.current) {
      reconnectSource.current = false;
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      const url = URL.createObjectURL(file);
      videoUrlRef.current = url;
      setVideoUrl(url);
      setFileName(file.name);
      setNeedsSource(false);
      setError(null);
      return;
    }
    if (currentUser && currentUser.credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setPendingVideoFile(file);
    setLanguageSearch('');
    setShowLanguageModal(true);
  };

  const processTranscription = async (file: File, lang: string) => {
    if (processing.current) return;
    processing.current = true;
    const generation = ++processingGeneration.current;
    setShowLanguageModal(false);
    setError(null);
    setFileName(file.name);
    setProjectTitle(file.name.replace(/\.[^/.]+$/, ''));
    setHasDeductedCredit(false);
    setProjectId(crypto.randomUUID());
    setNeedsSource(false);
    setSaveError(null);
    undoStackRef.current = [];
    redoStackRef.current = [];

    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
    }
    const newUrl = URL.createObjectURL(file);
    videoUrlRef.current = newUrl;
    // CRITICAL ghost-text fix: wipe ALL caption state from the previous video
    // BEFORE rendering the new one — old words/clip phrases must never survive
    // into the new project's first frames.
    setWords([]);
    setClipSearch('');
    setCurrentTime(0);
    setIsPlaying(false);
    setVideoUrl(newUrl);

    setIsLoading(true);

    try {
      const wavBlob = await extractAudioFromVideo(file);
      if (generation !== processingGeneration.current) return;
      if (wavBlob.size > 25 * 1024 * 1024)
        throw new Error(
          'The extracted audio exceeds 25 MB. Shorten the clip before generating captions.',
        );

      const formData = new FormData();
      formData.append('file', wavBlob, 'audio.wav');
      formData.append('language', lang);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Transcription failed with status ${res.status}`);
      }

      const data = await res.json();
      if (generation !== processingGeneration.current) return;

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
          })),
        );
      } else {
        throw new Error(
          'No speech was found. Check the audio and choose the spoken language, then try again.',
        );
      }
    } catch (err: unknown) {
      console.error('Transcription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio file.');
    } finally {
      processing.current = false;
      if (generation === processingGeneration.current) setIsLoading(false);
    }
  };

  // Dev-only QA hook: loads a CLEAN (caption-free) test video through the exact
  // same blob-URL pipeline as a real upload, with a synthetic ASR-style
  // transcript (overlapping word windows, sentence pauses). Lets QA verify
  // 1 Word / 2-3 / 4-6 modes and the 0-or-1 active-caption invariant without
  // an auth-gated real upload. Never compiled into production builds.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const transcriptText =
      'This is a clean source video with zero burned in text inside the original frames so every caption you see comes only from Capgen';
    const tokens = transcriptText.split(' ');

    (window as Window & { __capgenQa?: Record<string, unknown> }).__capgenQa = {
      // Dense sweep through the CANVAS export engine (the same
      // CaptionCanvasRenderer an MP4 export uses). At each t, debugFrame(t)
      // reports the ONE segment the renderer would paint and its word texts.
      // Any frame whose texts don't match the single active segment's words
      // (allowing only typewriter prefix-truncation of the LAST words) is a
      // "PHOTOGRWE MAKE"-style concatenation.
      async sweepFrames(opts?: { stepMs?: number; mode?: number }) {
        const step = (opts?.stepMs ?? 33) / 1000;
        if (opts?.mode) {
          setStyles((prev) => ({ ...prev, wordsPerScreen: opts.mode! }));
          await new Promise((r) => setTimeout(r, 80));
        }
        const ph = phrasesRef.current;
        if (!ph.length) throw new Error('no phrases loaded — call loadCleanVideo first');

        const { CaptionCanvasRenderer } = await import('@/lib/exportCaptionRenderer');
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 1280;
        const renderer = new CaptionCanvasRenderer(canvas, ph, stylesRef.current, 999);

        const end = ph[ph.length - 1].end;
        const bad: unknown[] = [];
        let frames = 0;
        for (let t = 0; t <= end + 0.001; t += step) {
          const domIdx = ph.findIndex((p) => t >= p.start && t < p.end);
          const dbg = renderer.debugFrame(t);
          frames++;
          const texts = dbg?.texts ?? [];
          const seg = domIdx >= 0 ? ph[domIdx] : null;
          if ((dbg?.index ?? -1) !== domIdx) {
            bad.push({
              t: Number(t.toFixed(3)),
              reason: 'canvas/DOM segment disagreement',
              canvasIdx: dbg?.index ?? -1,
              domIdx,
            });
            continue;
          }
          if (!seg) {
            if (texts.length)
              bad.push({ t: Number(t.toFixed(3)), reason: 'paints outside any segment', texts });
            continue;
          }
          // Every painted word must be a COMPLETE word of the active segment, in
          // order. Typewriter may paint fewer words, never a slice of one — a
          // frame containing "ROLLERCOAS" is corruption by definition.
          const upper = stylesRef.current.uppercase ?? true;
          const want = seg.words.map((w) => (upper ? w.word.toUpperCase() : w.word));
          const partial = texts.filter((tx) => !want.includes(tx));
          const order = texts.some((tx, i) => tx !== want[i]);
          if (partial.length || order || texts.length > want.length) {
            bad.push({
              t: Number(t.toFixed(3)),
              reason: partial.length
                ? 'partial word painted'
                : 'text not equal to active segment words',
              texts,
              want,
            });
          }
        }
        // Exact boundary probe: at each segment edge the NEXT segment must win.
        for (let i = 1; i < ph.length; i++) {
          const b = ph[i].start;
          const dbg = renderer.debugFrame(b);
          if ((dbg?.index ?? -1) !== i)
            bad.push({
              t: b,
              reason: 'boundary keeps previous segment',
              canvasIdx: dbg?.index ?? -1,
              expectIdx: i,
            });
          const dbgBefore = renderer.debugFrame(b - 0.001);
          if ((dbgBefore?.index ?? -1) !== i - 1 && ph[i - 1].end > b - 0.001)
            bad.push({
              t: b - 0.001,
              reason: 'pre-boundary wrong segment',
              canvasIdx: dbgBefore?.index ?? -1,
            });
        }
        return { frames, bad };
      },

      // Frame-by-frame GEOMETRY sweep of the export engine: proves no painted
      // word intrudes on a neighbour's box, nothing is painted outside the frame
      // and every painted word is complete. These are exactly the three checks
      // that fail on "HIGH MAYB?THE" (collision) and "SPEE"/"ROLLERCOAS"
      // (edge clipping / mid-word slicing).
      async sweepGeometry(opts?: {
        stepMs?: number;
        style?: Partial<StyleSettings>;
        frame?: { w: number; h: number };
      }) {
        const step = (opts?.stepMs ?? 33) / 1000;
        if (opts?.style) {
          setStyles((prev) => ({ ...prev, ...opts.style! }));
          await new Promise((r) => setTimeout(r, 140));
        }
        const stylesProbe = opts?.style
          ? { ...stylesRef.current, ...opts.style }
          : stylesRef.current;
        const ph = phrasesRef.current;
        if (!ph.length) throw new Error('no phrases loaded — call loadCleanVideo first');

        const { CaptionCanvasRenderer } = await import('@/lib/exportCaptionRenderer');
        const canvas = document.createElement('canvas');
        canvas.width = opts?.frame?.w ?? 720;
        canvas.height = opts?.frame?.h ?? 1280;
        const renderer = new CaptionCanvasRenderer(canvas, ph, stylesProbe, 999);

        const end = ph[ph.length - 1].end;
        const bad: unknown[] = [];
        let frames = 0;
        let maxOverlap = 0;
        for (let t = 0; t <= end + 0.001; t += step) {
          const g = renderer.debugFrameGeometry(t);
          frames++;
          if (!g) continue;
          const seg = ph[g.index];
          if (!seg) {
            bad.push({ t: Number(t.toFixed(3)), reason: 'geometry for unknown segment' });
            continue;
          }
          const upper = stylesProbe.uppercase ?? true;
          const want = seg.words.map((w) => (upper ? w.word.toUpperCase() : w.word));
          if (g.texts.some((tx) => !want.includes(tx)))
            bad.push({
              t: Number(t.toFixed(3)),
              reason: 'partial word painted',
              texts: g.texts,
              want,
            });

          for (const r of g.rects) {
            if (
              r.x0 < -0.5 ||
              r.x1 > canvas.width + 0.5 ||
              r.y0 < -0.5 ||
              r.y1 > canvas.height + 0.5
            ) {
              bad.push({
                t: Number(t.toFixed(3)),
                reason: 'word painted outside the frame (would be clipped)',
                word: r.text,
                rect: [r.x0, r.x1, r.y0, r.y1].map((n) => Math.round(n)),
              });
            }
          }

          for (let i = 0; i < g.rects.length; i++) {
            for (let j = i + 1; j < g.rects.length; j++) {
              const a = g.rects[i];
              const b = g.rects[j];
              const h = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
              const v = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
              if (h > 0 && v > 0) {
                maxOverlap = Math.max(maxOverlap, h);
                bad.push({
                  t: Number(t.toFixed(3)),
                  reason: 'words collide',
                  pair: [a.text, b.text],
                  overlapPx: Math.round(h),
                });
              }
            }
          }
        }
        return {
          frames,
          badCount: bad.length,
          bad: bad.slice(0, 40),
          maxOverlapPx: Math.round(maxOverlap),
        };
      },

      // DOM-side geometry check: reads the ACTUAL painted word boxes from the
      // live preview at the requested times and asserts the same invariants the
      // exporter is swept with, so preview and MP4 are proven together.
      async layoutProbe(times: number[]) {
        const root = canvasContainerRef.current;
        const video = videoRef.current;
        if (!root || !video) throw new Error('no video mounted');
        const frame = root.getBoundingClientRect();
        const upper = stylesRef.current.uppercase ?? true;
        const out: unknown[] = [];
        for (const t of times) {
          video.pause();
          video.currentTime = t;
          video.dispatchEvent(new Event('pause'));
          await new Promise((r) => setTimeout(r, 90));
          const overlays = root.querySelectorAll('.ed-caption-overlay-dev, .ed-caption-static');
          const boxes = Array.from(root.querySelectorAll('.ed-caption-word')).map((el) => {
            const r = el.getBoundingClientRect();
            return {
              text: (el.textContent || '').trim(),
              active: (el as HTMLElement).dataset.active === '1',
              x0: r.left - frame.left,
              x1: r.right - frame.left,
              y0: r.top - frame.top,
              y1: r.bottom - frame.top,
            };
          });
          const seg = phrasesRef.current.find((p) => t >= p.start && t < p.end);
          const want = seg ? seg.words.map((w) => (upper ? w.word.toUpperCase() : w.word)) : [];
          const texts = boxes.map((b) => b.text);
          let collisions = 0;
          for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i];
              const b = boxes[j];
              const h = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
              const v = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
              if (h > 0.5 && v > 0.5) collisions++;
            }
          }
          const clipped = boxes.filter(
            (b) =>
              b.x0 < -0.5 || b.x1 > frame.width + 0.5 || b.y0 < -0.5 || b.y1 > frame.height + 0.5,
          );
          out.push({
            t,
            overlays: overlays.length,
            texts,
            want,
            complete: texts.every((tx) => want.includes(tx)),
            collisions,
            clipped: clipped.map((b) => b.text),
            activeWords: boxes.filter((b) => b.active).length,
            fit: overlays.length ? ((overlays[0] as HTMLElement).dataset.captionFit ?? null) : null,
          });
        }
        return out;
      },

      // Layout-spec item 13: swap the animated caption for a plain flex block to
      // separate layout defects from animation-lifecycle defects.
      setStaticCaptions(on: boolean) {
        setDevStaticCaptions(!!on);
        return { staticCaptions: !!on };
      },

      applyStyles(patch: Partial<StyleSettings>) {
        setStyles((prev) => ({ ...prev, ...patch }));
        return { applied: Object.keys(patch) };
      },

      // Paints the caption layer of ONE export frame onto a transparent canvas
      // and checks the PIXELS against the envelope the renderer declared for
      // itself. Slot arithmetic can look perfect while the paint is wrong (that
      // is exactly how the textAlign offset shipped), so: every strong-ink
      // pixel must land inside some word's paint envelope or the background
      // pill, every word must actually have ink, and no envelope may reach past
      // the frame edge.
      async frameInk(t: number, opts?: { w?: number; h?: number }) {
        const ph = phrasesRef.current;
        if (!ph.length) throw new Error('no phrases loaded');
        const W = opts?.w ?? 720;
        const H = opts?.h ?? 1280;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const { CaptionCanvasRenderer } = await import('@/lib/exportCaptionRenderer');
        const renderer = new CaptionCanvasRenderer(canvas, ph, stylesRef.current, 999);
        renderer.drawFrame(t);
        const g = renderer.debugFrameGeometry(t);
        const data = canvas.getContext('2d')!.getImageData(0, 0, W, H).data;
        const violations: string[] = [];
        const rects = g?.rects ?? [];
        const block = g?.block ?? null;

        if (!rects.length) {
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 200) {
              violations.push('strong ink painted with no active segment');
              break;
            }
          }
          return { texts: [], violations };
        }

        let stray = 0;
        let strayAt: string | null = null;
        const ink = rects.map(() => 0);
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            // halos are ~55% alpha; 200 keeps this to glyph/box/outline ink
            if (data[(y * W + x) * 4 + 3] <= 200) continue;
            let hit = -1;
            for (let i = 0; i < rects.length; i++) {
              const r = rects[i];
              if (x >= r.paint0 && x <= r.paint1 && y >= r.paintTop && y <= r.paintBottom) {
                hit = i;
                break;
              }
            }
            if (hit >= 0) {
              ink[hit]++;
            } else if (!block || x < block.x0 || x > block.x1 || y < block.y0 || y > block.y1) {
              stray++;
              if (!strayAt) strayAt = `${x},${y}`;
            }
          }
        }
        if (stray)
          violations.push(
            `${stray} stray ink pixels outside every word envelope (first at ${strayAt})`,
          );
        rects.forEach((r, i) => {
          const want = Math.max(24, (r.x1 - r.x0) * 0.03);
          if (ink[i] < want) violations.push(`word "${r.text}" painted but has no ink (vanished)`);
          if (r.paint0 < 0 || r.paint1 > W || r.paintTop < 0 || r.paintBottom > H)
            violations.push(`word "${r.text}" envelope reaches past the frame edge`);
        });
        return {
          texts: g!.texts,
          violations,
          boxes: rects.map((r) => [Math.round(r.x0), Math.round(r.x1)]),
        };
      },

      // Paints a REAL export frame — same cover-crop drawImage + same
      // CaptionCanvasRenderer an MP4 export uses — and returns the PNG, so QA
      // inspects the exact pixels the creator gets in the downloaded file
      // instead of trusting the preview.
      async renderExportFrame(t: number, opts?: { w?: number; h?: number }) {
        const video = videoRef.current;
        if (!video) throw new Error('no video mounted');
        const ph = phrasesRef.current;
        if (!ph.length) throw new Error('no phrases loaded');
        const W = opts?.w ?? 720;
        const H = opts?.h ?? 1280;
        if (Math.abs(video.currentTime - t) > 0.02) {
          await new Promise<void>((resolve) => {
            const on = () => {
              video.removeEventListener('seeked', on);
              resolve();
            };
            video.addEventListener('seeked', on);
            video.currentTime = t;
            setTimeout(resolve, 1500);
          });
        }
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;
        const srcW = video.videoWidth || W;
        const srcH = video.videoHeight || H;
        const crop = Math.max(W / srcW, H / srcH);
        const dw = srcW * crop;
        const dh = srcH * crop;
        ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
        const { CaptionCanvasRenderer } = await import('@/lib/exportCaptionRenderer');
        new CaptionCanvasRenderer(canvas, ph, stylesRef.current, 999).drawFrame(t);
        return canvas.toDataURL('image/png');
      },

      // MutationObserver counting simultaneous .ed-caption-overlay-dev DOM
      // overlays while the video actually plays — catches two caption
      // containers mounted at the same time (stale exit state would show).
      async watchOverlays(ms = 2500) {
        const root = canvasContainerRef.current;
        const video = videoRef.current;
        if (!root || !video) throw new Error('no video mounted');
        let maxOverlays = 0;
        let samples = 0;
        const countOverlays = () => {
          const n = root.querySelectorAll('.ed-caption-overlay-dev').length;
          if (n > maxOverlays) maxOverlays = n;
          samples++;
        };
        const mo = new MutationObserver(countOverlays);
        mo.observe(root, { childList: true, subtree: true });
        video.currentTime = 0;
        await video.play();
        await new Promise((r) => setTimeout(r, ms));
        video.pause();
        countOverlays();
        mo.disconnect();
        return { maxOverlays, samples };
      },

      // Live check on the DOM overlay at a set of times: reads the mounted
      // word spans, their data-active flags and the rendered segment text.
      async domCheck(times: number[]) {
        const out: unknown[] = [];
        const video = videoRef.current;
        if (!video) throw new Error('no video mounted');
        for (const t of times) {
          video.pause();
          video.currentTime = t;
          video.dispatchEvent(new Event('pause'));
          await new Promise((r) => setTimeout(r, 90));
          const roots = document.querySelectorAll('.ed-caption-overlay-dev');
          const words = roots.length
            ? Array.from(roots[0].querySelectorAll('.ed-caption-word')).map((s) => ({
                text: s.textContent?.trim() || '',
                active: (s as HTMLElement).dataset.active === '1',
              }))
            : [];
          out.push({ t, overlays: roots.length, words });
        }
        return out;
      },

      async loadCleanVideo(options?: {
        wordsPerScreen?: number;
        transcript?: string;
        stepSec?: number;
      }) {
        const wps = options?.wordsPerScreen ?? 5;
        const tokensHere = options?.transcript ? options.transcript.split(' ') : tokens;
        const res = await fetch('/test-assets/clean-720x1280.mp4');
        if (!res.ok) throw new Error(`clean test asset missing: ${res.status}`);
        const file = new File([await res.blob()], 'clean-test.mp4', { type: 'video/mp4' });

        setFileName(file.name);
        setProjectTitle('Clean Test Video');
        setHasDeductedCredit(false);
        setError(null);
        setIsLoading(false);

        if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
        const newUrl = URL.createObjectURL(file);
        videoUrlRef.current = newUrl;
        setWords([]);
        setClipSearch('');
        setCurrentTime(0);
        setIsPlaying(false);
        setVideoUrl(newUrl);

        // ASR-style timings: overlapping word windows plus a 0.8s pause before
        // every 6-word group (sentence boundaries). stepSec stretches a short
        // transcript across the whole 16s clip so late samples still have a
        // caption on screen.
        const stepS = options?.stepSec ?? 0.45;
        const words = tokensHere.map((word, i) => {
          const start = Number((i * stepS + Math.floor(i / 6) * 0.8).toFixed(2));
          return { word, start, end: Number((start + stepS + 0.05).toFixed(2)) };
        });
        setWords(words);
        setStyles((prev) => ({ ...prev, wordsPerScreen: wps }));

        return { words: words.length, wps };
      },
    };
    return () => {
      delete (window as Window & { __capgenQa?: Record<string, unknown> }).__capgenQa;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time Canvas Export
  const handleRealtimePlaybackExport = async () => {
    if (!requireAuth()) return;
    if (exporting.current || processing.current) return;

    if (!videoRef.current || !videoUrl) {
      setError('Please upload a video to export.');
      return;
    }
    if (!words.length) {
      setError('Generate captions before exporting a captioned video.');
      return;
    }

    if (!hasDeductedCredit && (!currentUser || currentUser.credits <= 0)) {
      setShowUpgradeModal(true);
      return;
    }

    const videoElement = videoRef.current;
    if (
      !('MediaRecorder' in window) ||
      !Number.isFinite(videoElement.duration) ||
      videoElement.duration <= 0
    ) {
      setError(
        'This video is not ready to export. Wait for it to load, or use a supported browser.',
      );
      return;
    }
    exporting.current = true;
    setError(null);
    let pendingStream: MediaStream | undefined;
    try {
      setIsExportingMP4(true);
      setExportProgress(0);
      setExportStats(null);

      videoElement.muted = false;
      videoElement.volume = 1.0;
      setIsMuted(false);
      videoElement.currentTime = 0;

      await new Promise((r) => setTimeout(r, 150));

      // Export canvas MUST match the selected aspect ratio (9:16 / 1:1 / 16:9),
      // not the raw video dimensions — previously a 9:16 preview produced a
      // stretched 16:9 export (WYSIWYG mismatch bug).
      // Device-tier caps: mid-range phones encode 1080p H.264 slower than real
      // time, which drops captureStream frames. Capping resolution/bitrate to the
      // tier keeps the export real-time and smooth.
      const tier = detectTier();
      const sourceW = videoElement.videoWidth || 1080;
      const sourceH = videoElement.videoHeight || 1920;

      let outW: number;
      let outH: number;
      if (aspectRatio === '9:16') {
        outH = Math.max(1280, Math.min(sourceH, tier.maxOutH));
        outW = Math.round((outH * 9) / 16);
      } else if (aspectRatio === '1:1') {
        outW = Math.max(720, Math.min(sourceW, Math.round((tier.maxOutH * 9) / 16)));
        outH = outW;
      } else {
        outW = Math.max(1280, Math.min(sourceW, Math.round((tier.maxOutH * 16) / 9)));
        outH = Math.round((outW * 9) / 16);
      }

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      // Opaque canvas: the video fill covers every pixel, so alpha blending is
      // pure waste — dropping it saves a composite pass per frame on mobile GPUs.
      const ctx = canvas.getContext('2d', { alpha: false });

      const captureFps = tier.captureFps;
      if (typeof canvas.captureStream !== 'function')
        throw new Error(
          'Video recording is not supported in this browser. Try a supported desktop browser.',
        );
      const canvasStream = canvas.captureStream(captureFps);
      pendingStream = canvasStream;

      try {
        if (!globalAudioCtx) {
          const AudioContextClass =
            window.AudioContext ||
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!AudioContextClass) throw new Error('Audio export is not supported in this browser.');
          globalAudioCtx = new AudioContextClass();
        }
        if (globalAudioCtx.state === 'suspended') {
          await globalAudioCtx.resume();
        }

        let graph = audioGraphs.get(videoElement);
        if (!graph) {
          graph = {
            source: globalAudioCtx.createMediaElementSource(videoElement),
            destination: globalAudioCtx.createMediaStreamDestination(),
            connected: false,
          };
          audioGraphs.set(videoElement, graph);
        }
        if (!graph.connected) {
          graph.source.connect(graph.destination);
          graph.source.connect(globalAudioCtx.destination);
          graph.connected = true;
        }
        if (graph) {
          graph.destination.stream.getAudioTracks().forEach((track) => {
            canvasStream.getAudioTracks().forEach((t) => canvasStream.removeTrack(t));
            canvasStream.addTrack(track);
          });
        }
      } catch (audioErr) {
        throw new Error(
          'This browser could not capture the source audio. Retry in a supported browser; no credit has been recorded.',
        );
      }

      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')
        ? 'video/mp4;codecs=avc1.42E01E,mp4a.40.2'
        : MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
          ? 'video/mp4;codecs=avc1'
          : MediaRecorder.isTypeSupported('video/mp4')
            ? 'video/mp4'
            : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
              ? 'video/webm;codecs=vp9'
              : 'video/webm';

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: tier.bitrate,
        });
      } catch {
        canvasStream.getVideoTracks().forEach((track) => track.stop());
        exporting.current = false;
        setIsExportingMP4(false);
        setError('This browser could not start video recording. Try another supported browser.');
        return;
      }
      const recordedChunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      let isExportRunning = true;
      let exportFailed = false;
      recorder.onerror = () => {
        exportFailed = true;
        if (recorder.state === 'recording') recorder.stop();
      };
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

      // Cover-crop math: fill the output canvas with the video (like CSS object-cover)
      // so the exported frame matches the preview exactly, no stretching.
      const cropScale = Math.max(outW / sourceW, outH / sourceH);
      const drawW = sourceW * cropScale;
      const drawH = sourceH * cropScale;
      const drawX = (outW - drawW) / 2;
      const drawY = (outH - drawH) / 2;

      // Per-export caption renderer: phrases, fonts, word widths and template
      // rules are computed ONCE here instead of per frame (the old path re-ran
      // buildPhrases + measureText for every frame — the main export bottleneck).
      //
      // That one-time freeze must happen against the REAL webfont. Measuring while
      // the fallback face is still active gives every word a slot narrower than the
      // glyphs the encoder later paints, which is how exported words ran into each
      // other ("MAYB?THE") even though the preview looked fine.
      if (typeof document !== 'undefined' && document.fonts) {
        try {
          await document.fonts.load(captionFontString(styles, Math.max(24, styles.fontSize || 24)));
          await document.fonts.ready;
        } catch (fontErr) {
          console.warn('Caption font wait skipped:', fontErr);
        }
        resetCaptionWidthCache();
      }
      const captionRenderer = new CaptionCanvasRenderer(canvas, phrases, styles, totalDur);
      const minFrameInterval = redrawInterval(captureFps);
      let lastDrawTs = 0;

      // Live fps + dropped-frame telemetry shown in the export overlay.
      let frameCount = 0;
      let totalFramesRendered = 0;
      const estimatedTotalFrames = Math.max(1, Math.ceil(totalDur * captureFps));
      let droppedCount = 0;
      let fpsWindowStart = performance.now();
      let videoFramesDropped = 0;
      if (typeof videoElement.getVideoPlaybackQuality === 'function') {
        videoFramesDropped = videoElement.getVideoPlaybackQuality().droppedVideoFrames;
      }

      const renderLoop = (ts?: number) => {
        if (!isExportRunning || !videoRef.current) return;
        if (videoRef.current !== videoElement) {
          exportFailed = true;
          if (recorder.state === 'recording') recorder.stop();
          return;
        }

        const currentVid = videoRef.current;
        const cTime = currentVid.currentTime;

        // Frame pacing: skip caption redraws when this rAF fires faster than the
        // capture rate (e.g. 120Hz ProMotion) — encoder only samples 30/60fps.
        const dueToDraw = ts === undefined || ts - lastDrawTs >= minFrameInterval - 1.5;
        if (dueToDraw) {
          lastDrawTs = ts ?? performance.now();
          try {
            if (ctx) {
              ctx.drawImage(currentVid, drawX, drawY, drawW, drawH);
              captionRenderer.drawFrame(cTime);
            }
            frameCount++;
            totalFramesRendered++;
          } catch (err) {
            console.error('Frame render warning:', err);
          }
        } else {
          droppedCount++;
        }

        onFrameThrottled(cTime, totalDur);

        const now = performance.now();
        if (now - fpsWindowStart >= 500) {
          const fps = Math.round((frameCount * 1000) / (now - fpsWindowStart));
          if (typeof videoElement.getVideoPlaybackQuality === 'function') {
            videoFramesDropped = videoElement.getVideoPlaybackQuality().droppedVideoFrames;
          }
          setExportStats({
            fps,
            dropped: droppedCount,
            videoDropped: videoFramesDropped,
            tier: tier.label,
            frame: totalFramesRendered,
            totalFrames: estimatedTotalFrames,
          });
          frameCount = 0;
          droppedCount = 0;
          fpsWindowStart = now;
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

        try {
          if (exportFailed)
            throw new Error(
              'The recording was interrupted. Retry export without switching the video layout.',
            );
          const finalBlob = new Blob(recordedChunks, { type: mimeType });
          if (!finalBlob.size || videoElement.currentTime < totalDur - 0.25)
            throw new Error(
              'The video recording ended before completion. Keep this tab active and retry export.',
            );
          const downloadUrl = URL.createObjectURL(finalBlob);

          // Chrome records real MP4; Safari/Firefox fall back to WebM — the file
          // extension must match, otherwise phones save an unplayable ".mp4".
          const fileExt = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${projectTitle.replace(/\s+/g, '_') || 'capgen_video'}.${fileExt}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);

          if (currentUser) {
            const id = projectId || crypto.randomUUID();
            setProjectId(id);
            const saved = await saveProject({
              id,
              title: projectTitle,
              words,
              styleSettings: styles,
            });
            if (saved.error || !saved.data)
              throw (
                saved.error ||
                new Error('The export downloaded, but your project could not be saved.')
              );
            await deductUserCredit(currentUser.uid, id);
            await refreshProfile();
            setHasDeductedCredit(true);
          }
          setExportProgress(100);
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : 'The export could not be completed. Please retry.',
          );
        } finally {
          canvasStream.getVideoTracks().forEach((track) => track.stop());
          exporting.current = false;
          setIsExportingMP4(false);
          setExportStats(null);
        }
      };

      recorder.start(100);

      try {
        await videoElement.play();
      } catch (playErr) {
        exportFailed = true;
        setError('Video playback could not start. Play the source video once, then retry export.');
        if (recorder.state === 'recording') recorder.stop();
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
    } catch (error) {
      pendingStream?.getVideoTracks().forEach((track) => track.stop());
      exporting.current = false;
      setIsExportingMP4(false);
      setExportStats(null);
      setError(error instanceof Error ? error.message : 'Video recording failed. Please retry.');
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const exportSRT = () => {
    if (!requireAuth()) return;
    if (!words.length) {
      setError('Generate captions before downloading subtitles.');
      return;
    }
    const srt = generateSRT(
      words.map((word) => ({
        ...word,
        word: styles.uppercase ? word.word.toUpperCase() : word.word,
      })),
    );
    downloadFile(srt, `${projectTitle.replace(/\s+/g, '_')}.srt`, 'text/plain');
  };

  // Apply Premium Preset
  const applyPreset = (preset: PremiumStyle) => {
    setActivePresetId(preset.id);
    updateStyles((prev) => ({
      ...prev,
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      textColor: preset.textColor,
      highlightColor: preset.highlightColor,
      highlightBg: preset.highlightBg,
      backgroundColor: preset.highlightBg || 'transparent',
      // Keep the user's Motion-tab choice if they set one manually; otherwise
      // follow the preset's signature animation.
      animationType: prev.animationType || preset.animation,
      // Preset's signature Words-At-A-Time (unless the user picked one manually)
      wordsPerScreen: preset.wordsPerScreen ?? prev.wordsPerScreen,
      template: preset.id,
    }));
  };

  // Set position on 9-point grid
  const setPositionGrid = (x: number, y: number) => {
    updateStyles((prev) => ({
      ...prev,
      captionXPercent: x,
      captionYPercent: y,
    }));
  };

  const toggleFullscreen = () => {
    const el = canvasContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  const handleEditorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) handleFilePicked(file);
  };

  const phrases = useMemo(
    () =>
      styles.wordsPerScreen && styles.wordsPerScreen >= 1
        ? buildDisplayPhrases(words, styles.wordsPerScreen)
        : normalizeDisplayPhrases(buildPhrases(words, styles.template === 'hormozi_viral' ? 2 : 3)),
    [words, styles.wordsPerScreen, styles.template],
  );
  const phrasesRef = useRef(phrases);
  phrasesRef.current = phrases;

  // Dev-only: the single active segment for the on-screen debug HUD. Same
  // half-open lookup as CaptionOverlay — one source of truth.
  const devActive =
    process.env.NODE_ENV !== 'production'
      ? (() => {
          const i = phrases.findIndex((p) => currentTime >= p.start && currentTime < p.end);
          return i >= 0
            ? {
                i,
                text: phrases[i].words.map((w) => w.word).join(' '),
                count: phrases.filter((p) => currentTime >= p.start && currentTime < p.end).length,
              }
            : { i: -1, text: '(none)', count: 0 };
        })()
      : null;

  const filteredPhrases = useMemo(
    () =>
      phrases.filter((p: CaptionPhrase) =>
        clipSearch
          ? p.words.some((w: CaptionWord) =>
              w.word.toLowerCase().includes(clipSearch.toLowerCase()),
            )
          : true,
      ),
    [phrases, clipSearch],
  );

  /* Render Library Panel (Left: Videos + Clips) */
  const renderLibraryPanel = () => {
    const clipThumb = (phrase: CaptionPhrase) => {
      if (!thumbnails.length || !duration) return null;
      const idx = Math.min(
        thumbnails.length - 1,
        Math.max(0, Math.floor((phrase.start / duration) * thumbnails.length)),
      );
      return thumbnails[idx];
    };

    return (
      <div className="flex-1 flex flex-col h-full ed-panel-inner overflow-hidden">
        <div className="ed-panel-head">
          <div className="flex items-center justify-between">
            <h2 className="ed-panel-title">Your Videos</h2>
            <span className="ed-count">{videoUrl ? 1 : 0}</span>
          </div>
          <p className="ed-panel-sub">Source video and generated clips.</p>
        </div>

        <div className="flex-1 overflow-y-auto ed-scroll p-4 space-y-5">
          {/* Upload */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!requireAuth()) return;
              fileInputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!requireAuth()) return;
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleEditorDrop}
            className={`ed-upload-card ${isDragOver ? 'ed-upload-drag' : ''}`}
          >
            <CloudUpload size={18} />
            <div>
              <p className="ed-upload-title">
                {isDragOver ? 'Release to upload' : 'Drop video here'}
              </p>
              <p className="ed-upload-sub">
                or click to upload · MP4, MOV, WEBM · Max {getUserUploadLimit(currentUser).maxMB} MB
              </p>
            </div>
          </div>

          {/* Video */}
          <section className="ed-panel-section">
            <span className="ed-panel-label">Video</span>
            {!videoUrl ? (
              <div className="ed-empty-mini">
                <VideoIcon size={14} />
                <span>No video yet — drop one above.</span>
              </div>
            ) : (
              <div className="ed-video-card">
                {thumbnails[0] ? (
                  <img src={thumbnails[0]} alt={fileName} className="ed-video-thumb" />
                ) : (
                  <div className="ed-video-thumb ed-thumb-placeholder">
                    <Film size={16} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="ed-video-name" title={fileName}>
                    {fileName}
                  </p>
                  <p className="ed-video-meta">{formatMinutesSeconds(duration)}</p>
                </div>
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              </div>
            )}
          </section>

          {/* Clips */}
          <section className="ed-panel-section">
            <div className="flex items-center justify-between mb-2">
              <span className="ed-panel-label">Clips</span>
              <span className="ed-count">{filteredPhrases.length}</span>
            </div>

            <div className="relative mb-2.5">
              <Search size={13} className="absolute left-2.5 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="Search clips…"
                value={clipSearch}
                onChange={(e) => setClipSearch(e.target.value)}
                className="ed-search"
              />
            </div>

            {words.length === 0 ? (
              <div className="ed-empty-mini">
                <Captions size={14} />
                <span>Generate captions to see your clips here.</span>
              </div>
            ) : filteredPhrases.length === 0 ? (
              <div className="ed-empty-mini">
                <Search size={14} />
                <span>No clips match your search.</span>
              </div>
            ) : (
              <div className="ed-clip-list">
                {filteredPhrases.map((phrase: CaptionPhrase, pIdx: number) => {
                  const isClipActive = currentTime >= phrase.start && currentTime < phrase.end;
                  const thumb = clipThumb(phrase);

                  return (
                    <button
                      key={pIdx}
                      onClick={() => {
                        seekTo(phrase.start);
                        if (mobileTab === 'clips') setMobileTab('video');
                      }}
                      className={`ed-clip ${isClipActive ? 'ed-clip-active' : ''}`}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" className="ed-clip-thumb" />
                      ) : (
                        <div className="ed-clip-thumb ed-thumb-placeholder">
                          <Film size={13} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="ed-clip-name">Clip #{pIdx + 1}</span>
                          <span className="ed-clip-time">
                            {formatMinutesSeconds(phrase.start)} —{' '}
                            {formatMinutesSeconds(phrase.end)}
                          </span>
                        </div>
                        <p className="ed-clip-preview">
                          “
                          {phrase.words
                            .slice(0, 8)
                            .map((w: CaptionWord) => w.word)
                            .join(' ')}
                          {phrase.words.length > 8 ? '…' : ''}”
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  };

  /* Render Inspector Components */
  const renderInspectorControls = () => (
    <div className="flex-1 flex flex-col h-full ed-panel-inner overflow-hidden">
      <div className="ed-tabs shrink-0">
        <button
          onClick={() => setActiveTab('templates')}
          className={`ed-tab ${activeTab === 'templates' ? 'ed-tab-active' : ''}`}
        >
          <Sparkles size={13} /> Templates
        </button>
        <button
          onClick={() => setActiveTab('animations')}
          className={`ed-tab ${activeTab === 'animations' ? 'ed-tab-active' : ''}`}
        >
          <Zap size={13} /> Motion
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`ed-tab ${activeTab === 'layout' ? 'ed-tab-active' : ''}`}
        >
          <Sliders size={13} /> Layout
        </button>
      </div>

      <div className="flex-1 overflow-y-auto ed-scroll p-4 space-y-5">
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="ed-section-head">
              <h3 className="ed-heading">Caption Styles</h3>
              <p className="ed-sub">Choose a style for your captions — applied instantly.</p>
            </div>

            <div className="ed-preset-grid">
              {PREMIUM_STYLES.map((preset) => {
                const isSelected = activePresetId === preset.id;
                const previewSize = Math.min(
                  17,
                  Math.max(12, Math.round((preset.fontSize || 24) * 0.6)),
                );

                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      applyPreset(preset);
                      if (mobileTab === 'styles') setMobileTab('video');
                    }}
                    className={`ed-preset ${isSelected ? 'ed-preset-active' : ''}`}
                    aria-pressed={isSelected}
                  >
                    {isSelected && <CheckCircle2 size={15} className="ed-check" />}
                    <span className="ed-preset-name">{preset.name}</span>
                    <span
                      className="ed-preset-preview"
                      style={{
                        fontFamily: preset.fontFamily,
                        backgroundColor: '#0b1425',
                        fontSize: previewSize,
                      }}
                    >
                      <span style={{ color: preset.textColor }}>This is a</span>{' '}
                      <span
                        style={{
                          color: preset.highlightColor,
                          backgroundColor: preset.highlightBg,
                          borderRadius: 4,
                          padding: preset.highlightBg ? '1px 4px' : undefined,
                        }}
                      >
                        test.
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pt-1">
              <div className="ed-section-head">
                <h3 className="ed-heading">Advanced Options</h3>
                <p className="ed-sub">Fine-tune how captions read on screen.</p>
              </div>

              {/* Words At A Time */}
              <div className="ed-field">
                <label className="ed-field-label">Word-level timing</label>
                <p className="ed-field-hint">
                  How many words appear together — re-chunks instantly.
                </p>
                <div className="ed-seg">
                  {[
                    { v: 1, label: '1 Word', hint: 'Hormozi' },
                    { v: 3, label: '2-3 Words', hint: 'Podcast' },
                    { v: 5, label: '4-6 Words', hint: 'Sentence' },
                  ].map((opt) => {
                    const wps = styles.wordsPerScreen ?? 3;
                    const isActive =
                      opt.v === 1 ? wps === 1 : opt.v === 3 ? wps >= 2 && wps <= 3 : wps >= 4;
                    return (
                      <button
                        key={opt.v}
                        onClick={() => setStyles((prev) => ({ ...prev, wordsPerScreen: opt.v }))}
                        className={`ed-seg-btn ${isActive ? 'ed-seg-active' : ''}`}
                      >
                        <span className="block">{opt.label}</span>
                        <span className="ed-seg-hint">{opt.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caption Position */}
              <div className="ed-field">
                <label className="ed-field-label">Caption Position</label>
                <select
                  aria-label="Caption position"
                  value={
                    styles.captionYPercent === 20
                      ? 'top'
                      : styles.captionYPercent === 50
                        ? 'center'
                        : 'bottom'
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setPositionGrid(50, v === 'top' ? 20 : v === 'center' ? 50 : 72);
                  }}
                  className="ed-select"
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>

              {/* Uppercase */}
              <div className="ed-switch-row">
                <div>
                  <p className="ed-field-label">Uppercase text</p>
                  <p className="ed-field-hint">Force all captions to caps.</p>
                </div>
                <button
                  role="switch"
                  aria-label="Uppercase text"
                  aria-checked={styles.uppercase ?? true}
                  onClick={() =>
                    setStyles((prev) => ({ ...prev, uppercase: !(prev.uppercase ?? true) }))
                  }
                  className={`ed-switch ${(styles.uppercase ?? true) ? 'ed-switch-on' : ''}`}
                >
                  <span className="ed-switch-knob" />
                </button>
              </div>
            </div>

            {/* Custom style card */}
            <button onClick={() => setActiveTab('layout')} className="ed-custom-card">
              <Palette size={16} className="text-blue-400" />
              <span className="flex-1 text-left">
                <span className="block font-bold text-[13px]">Need a custom style?</span>
                <span className="ed-field-hint">Tune fonts, colors and position in Layout.</span>
              </span>
              <span aria-hidden className="text-slate-500">
                →
              </span>
            </button>
          </div>
        )}

        {activeTab === 'animations' && (
          <div className="space-y-4">
            <div className="ed-section-head">
              <h3 className="ed-heading">Word Animation</h3>
              <p className="ed-sub">How the active word enters the screen.</p>
            </div>

            <div className="ed-anim-grid">
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
                  onClick={() =>
                    setStyles((prev) => ({
                      ...prev,
                      animationType: anim.id as StyleSettings['animationType'],
                    }))
                  }
                  className={`ed-anim ${styles.animationType === anim.id ? 'ed-anim-active' : ''}`}
                >
                  <span className="ed-anim-icon">{anim.icon}</span>
                  <span className="text-xs font-bold">{anim.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-5">
            <div className="ed-section-head">
              <h3 className="ed-heading">Layout</h3>
              <p className="ed-sub">Position, typography and video extras.</p>
            </div>

            <div className="ed-field">
              <label className="ed-field-label">9-Point Position Grid</label>
              <div className="ed-grid9">
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
                      className={`ed-pos-btn ${isActive ? 'ed-pos-active' : ''}`}
                    >
                      {pos.label}
                    </button>
                  );
                })}
              </div>
              <p className="ed-field-hint">Drag captions on the canvas for fine placement.</p>
            </div>

            <div className="ed-field">
              <div className="flex items-center justify-between">
                <label htmlFor="editor-font-family" className="ed-field-label">
                  Font Family
                </label>
                <button
                  onClick={() => setShowFontModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                >
                  <Type size={12} /> Browse All ↗
                </button>
              </div>
              <select
                id="editor-font-family"
                value={styles.fontFamily}
                onChange={(e) => setStyles((prev) => ({ ...prev, fontFamily: e.target.value }))}
                className="ed-select"
              >
                {CREATOR_FONTS.map((f) => (
                  <option key={f.name} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="ed-field">
              <div className="flex justify-between text-xs">
                <span className="ed-field-label">Font Size</span>
                <span className="font-mono text-blue-300 font-bold">{styles.fontSize || 24}px</span>
              </div>
              <input
                type="range"
                aria-label="Caption font size"
                min={16}
                max={48}
                value={styles.fontSize || 24}
                onChange={(e) =>
                  setStyles((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))
                }
                className="ed-range"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="ed-field">
                <label className="ed-field-label">Text Color</label>
                <div className="ed-color-row">
                  <input
                    type="color"
                    aria-label="Caption text color"
                    value={styles.textColor || '#FFFFFF'}
                    onChange={(e) => setStyles((prev) => ({ ...prev, textColor: e.target.value }))}
                    className="ed-color-input"
                  />
                  <span className="font-mono text-[11px] text-slate-400 uppercase font-bold">
                    {styles.textColor}
                  </span>
                </div>
              </div>

              <div className="ed-field">
                <label className="ed-field-label">Highlight</label>
                <div className="ed-color-row">
                  <input
                    type="color"
                    aria-label="Caption highlight color"
                    value={styles.highlightColor || '#FFE500'}
                    onChange={(e) =>
                      setStyles((prev) => ({ ...prev, highlightColor: e.target.value }))
                    }
                    className="ed-color-input"
                  />
                  <span className="font-mono text-[11px] text-slate-400 uppercase font-bold">
                    {styles.highlightColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Burned-in Reels/Shorts timeline progress bar */}
            <div className="ed-field ed-card">
              <div className="ed-switch-row !p-0">
                <div>
                  <p className="ed-field-label">Video Progress Bar</p>
                  <p className="ed-field-hint">Burned into the exported video.</p>
                </div>
                <button
                  role="switch"
                  aria-label="Video progress bar"
                  aria-checked={styles.progressBarEnabled ?? false}
                  onClick={() =>
                    setStyles((prev) => ({
                      ...prev,
                      progressBarEnabled: !(prev.progressBarEnabled ?? false),
                    }))
                  }
                  className={`ed-switch ${(styles.progressBarEnabled ?? false) ? 'ed-switch-on' : ''}`}
                >
                  <span className="ed-switch-knob" />
                </button>
              </div>

              {styles.progressBarEnabled && (
                <div className="space-y-3 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { c: '#2060F6', n: 'Electric Blue' },
                      { c: '#EF4444', n: 'Neon Red' },
                      { c: '#10B981', n: 'Emerald' },
                      { c: '#FFFFFF', n: 'Pure White' },
                      { c: '#F59E0B', n: 'Sunset Gold' },
                    ].map((sw) => (
                      <button
                        key={sw.c}
                        title={sw.n}
                        onClick={() => setStyles((prev) => ({ ...prev, progressBarColor: sw.c }))}
                        className={`ed-swatch ${(styles.progressBarColor || '#2060F6') === sw.c ? 'ed-swatch-active' : ''}`}
                        style={{ background: sw.c }}
                      />
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="ed-field-label">Bar Height</span>
                      <span className="font-mono font-bold text-blue-300">
                        {styles.progressBarHeight || 6}px
                      </span>
                    </div>
                    <input
                      type="range"
                      aria-label="Progress bar height"
                      min={4}
                      max={12}
                      step={1}
                      value={styles.progressBarHeight || 6}
                      onChange={(e) =>
                        setStyles((prev) => ({
                          ...prev,
                          progressBarHeight: parseInt(e.target.value),
                        }))
                      }
                      className="ed-range"
                    />
                  </div>

                  <div className="ed-seg">
                    {(['bottom', 'top'] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setStyles((prev) => ({ ...prev, progressBarPosition: pos }))}
                        className={`ed-seg-btn py-2! ${(styles.progressBarPosition || 'bottom') === pos ? 'ed-seg-active' : ''}`}
                      >
                        <span className="block">{pos === 'bottom' ? 'Bottom' : 'Top'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`ed-root text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white relative font-sans antialiased ${
        isDesktop
          ? 'h-[100dvh] overflow-hidden' // desktop studio: fixed viewport layout
          : 'min-h-[100dvh] overflow-y-auto pb-24' // mobile: free vertical scroll (no scroll trap)
      }`}
    >
      {/* 1. TOP HEADER — PROJECT TOOLBAR */}
      <header className="ed-header shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <LogoIcon className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
          <span className="hidden md:inline font-extrabold text-[15px] tracking-tight shrink-0">
            Capgen<span className="text-blue-500 font-bold">.app</span>
          </span>
          <div className="h-5 w-px bg-white/10 hidden md:block shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="ed-title-input"
              aria-label="Project name"
            />
            <Pencil size={12} className="text-slate-500 shrink-0" />
          </div>
          <span className={`ed-save-state ed-save-${saveStatus} hidden sm:inline-flex`}>
            {saveStatus === 'saving' ? (
              <>
                <Loader2 size={11} className="animate-spin" /> Saving…
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check size={11} /> Saved
              </>
            ) : (
              'Not saved'
            )}
          </span>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button onClick={() => setShowUpgradeModal(true)} className="ed-credits hidden lg:flex">
            <Zap size={12} className="fill-amber-400 stroke-amber-400" />
            <span>{currentUser ? `${currentUser.credits} Video Credits` : '5 Free Exports'}</span>
          </button>

          <button onClick={exportSRT} className="ed-btn-ghost hidden md:flex">
            <Download size={14} /> SRT
          </button>

          <button
            onClick={handleRealtimePlaybackExport}
            aria-label={isExportingMP4 ? 'Exporting video' : 'Export HD Video'}
            disabled={isExportingMP4 || !videoUrl}
            className="ed-btn-primary"
          >
            {isExportingMP4 ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span className="hidden sm:inline">
                  {exportStats
                    ? `Exporting ${exportProgress}% · ${exportStats.frame}/${exportStats.totalFrames}`
                    : `Exporting (${exportProgress}%)`}
                </span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span className="hidden sm:inline">Export HD Video</span>
              </>
            )}
          </button>
        </div>
      </header>

      {(saveError || profileError || error || needsSource) && (
        <div
          role={saveError || profileError || error ? 'alert' : 'status'}
          className="px-4 py-3 bg-slate-900 border-b border-slate-700 text-sm text-slate-200"
        >
          {saveError ||
            profileError ||
            error ||
            'Caption text and styles loaded. Choose the original video from your device to preview or export; video files are not stored in your account.'}
          {error && (
            <button
              className="ml-3 underline font-semibold min-h-11"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          )}
          {needsSource && (
            <button
              className="ml-3 underline font-semibold min-h-11"
              onClick={() => {
                reconnectSource.current = true;
                fileInputRef.current?.click();
              }}
            >
              Choose original video
            </button>
          )}
          {(saveError || profileError) && (
            <button
              className="ml-3 underline font-semibold min-h-11"
              onClick={async () => {
                await refreshProfile();
                if (saveError) {
                  setSaveStatus('idle');
                  setProjectTitle((title) => title);
                  setSaveError(null);
                  const result = await saveProject({
                    id: projectId || undefined,
                    title: projectTitle,
                    words,
                    styleSettings: styles,
                  });
                  if (result.error) setSaveError(result.error.message);
                  else setSaveStatus('saved');
                }
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}
      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className={`flex-1 flex relative ${isDesktop ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {/* DESKTOP 3-COLUMN STUDIO LAYOUT (>= 768px) — conditionally MOUNTED so only one <video> element ever exists */}
        {isDesktop && (
          <div className="flex flex-1 overflow-hidden w-full">
            {/* Left Column: Videos + Clips */}
            <aside
              className={`ed-panel ed-panel-left flex flex-col shrink-0 ${isTablet && !leftPanelOpen ? 'ed-panel-closed' : ''}`}
            >
              {renderLibraryPanel()}
            </aside>

            {/* Center Column: Canvas + Playback + Timeline */}
            <div
              className="flex-1 flex flex-col items-center justify-center relative ed-canvas-col overflow-hidden"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleEditorDrop}
            >
              {/* Canvas toolbar: undo/redo · aspect ratio · zoom */}
              <div className="ed-canvas-toolbar z-20">
                {isTablet && (
                  <>
                    <button
                      onClick={() => setLeftPanelOpen((v) => !v)}
                      className="ed-tool-btn"
                      title={leftPanelOpen ? 'Hide Videos panel' : 'Show Videos panel'}
                    >
                      <Film size={14} />
                    </button>
                    <div className="h-4 w-px bg-white/10" />
                  </>
                )}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={undoStyles}
                    className="ed-tool-btn"
                    title="Undo"
                    aria-label="Undo"
                  >
                    <Undo2 size={14} />
                  </button>
                  <button
                    onClick={redoStyles}
                    className="ed-tool-btn"
                    title="Redo"
                    aria-label="Redo"
                  >
                    <Redo2 size={14} />
                  </button>
                </div>
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <div className="ed-ratio-group hidden sm:flex">
                  {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((ar) => (
                    <button
                      key={ar}
                      onClick={() => setAspectRatio(ar)}
                      className={`ed-ratio-btn ${aspectRatio === ar ? 'ed-ratio-active' : ''}`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCanvasZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
                    className="ed-tool-btn"
                    title="Zoom out"
                    aria-label="Zoom out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="ed-zoom-label">{Math.round(canvasZoom * 100)}%</span>
                  <button
                    onClick={() => setCanvasZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}
                    className="ed-tool-btn"
                    title="Zoom in"
                    aria-label="Zoom in"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
                {isTablet && (
                  <>
                    <div className="h-4 w-px bg-white/10" />
                    <button
                      onClick={() => setRightPanelOpen((v) => !v)}
                      className="ed-tool-btn"
                      title={rightPanelOpen ? 'Hide Style panel' : 'Show Style panel'}
                    >
                      <Sliders size={14} />
                    </button>
                  </>
                )}
              </div>

              {videoUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                  {/* Dev-only debug HUD: current SOURCE file, the single ACTIVE
                    caption segment (id + text) and how many segments are
                    active — proves caption text comes from the overlay layer,
                    not burned-in pixels of the source video. */}
                  {process.env.NODE_ENV !== 'production' && devActive && (
                    <div className="ed-dev-active-bar" data-active-count={devActive.count}>
                      <span className="ed-dev-src">SOURCE VIDEO: {fileName}</span>
                      <span className="ed-dev-cap">
                        CAPTION LAYER:{' '}
                        {devActive.i >= 0
                          ? `SEGMENT #${devActive.i} “${devActive.text}”`
                          : 'NO ACTIVE SEGMENT'}
                      </span>
                      <span className="ed-dev-t">
                        t={currentTime.toFixed(2)}s · active={devActive.count}
                      </span>
                    </div>
                  )}
                  <div className="relative">
                    <div style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'center' }}>
                      <div
                        ref={canvasContainerRef}
                        className={`ed-canvas ${
                          aspectRatio === '9:16'
                            ? 'ed-canvas-916'
                            : aspectRatio === '1:1'
                              ? 'ed-canvas-11'
                              : 'ed-canvas-169'
                        }`}
                      >
                        <video
                          ref={videoRef}
                          src={videoUrl}
                          playsInline
                          className="w-full h-full object-cover"
                        />

                        {/* Dev-only debug tags: distinguish the ORIGINAL source
                          video's pixels from Capgen's generated caption layer.
                          Rendered only when NODE_ENV !== 'production'. */}
                        {process.env.NODE_ENV !== 'production' && (
                          <>
                            <div className="ed-dev-tag ed-dev-tag-video">SOURCE VIDEO</div>
                            <div className="ed-dev-tag ed-dev-tag-caption">CAPTION OVERLAY</div>
                          </>
                        )}

                        {/* WYSIWYG caption overlay — same engine as the MP4 export */}
                        <CaptionOverlay
                          phrases={phrases}
                          currentTime={currentTime}
                          styles={styles}
                          containerRef={canvasContainerRef}
                          isDragging={isDraggingCaption}
                          onPointerDown={handleCaptionPointerDown}
                          staticLayout={devStaticCaptions}
                        />

                        {/* Burned-in timeline bar preview — same math as export */}
                        <ProgressBarOverlay
                          currentTime={currentTime}
                          duration={duration}
                          styles={styles}
                          containerRef={canvasContainerRef}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Playback controls */}
                  <div className="ed-player-bar">
                    <button
                      onClick={() => seekTo(Math.max(0, currentTime - 5))}
                      className="ed-player-icon"
                      title="Rewind 5s"
                    >
                      <RotateCcw size={15} />
                    </button>

                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          if (isPlaying) videoRef.current.pause();
                          else videoRef.current.play();
                        }
                      }}
                      className="ed-play-btn"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>

                    <span className="ed-time">{formatMinutesSeconds(currentTime)}</span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.01}
                      value={currentTime}
                      onChange={(e) => seekTo(parseFloat(e.target.value))}
                      className="ed-seek"
                      aria-label="Seek"
                    />
                    <span className="ed-time ed-time-muted">{formatMinutesSeconds(duration)}</span>

                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="ed-player-icon"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>

                    <button
                      onClick={toggleFullscreen}
                      className="ed-player-icon"
                      title="Fullscreen"
                    >
                      <Maximize size={15} />
                    </button>
                  </div>

                  {/* Timeline */}
                  <div className="ed-timeline-wrap">
                    <StudioTimeline
                      duration={duration}
                      currentTime={currentTime}
                      phrases={phrases}
                      thumbnails={thumbnails}
                      onSeek={seekTo}
                    />
                  </div>
                </div>
              ) : (
                /* Premium empty editor state — uploader wired to existing logic */
                <div className="flex-1 w-full flex items-center justify-center">
                  <div className={`ed-empty ${isDragOver ? 'ed-empty-drag' : ''}`}>
                    <div className="ed-empty-icon">
                      <CloudUpload size={26} />
                    </div>
                    <h3 className="ed-empty-title">Upload your video</h3>
                    <p className="ed-empty-sub">
                      Drop your video here or{' '}
                      <button
                        onClick={() => {
                          if (!requireAuth()) return;
                          fileInputRef.current?.click();
                        }}
                        className="ed-link-btn"
                      >
                        browse
                      </button>{' '}
                      · MP4, MOV, WEBM · Max {getUserUploadLimit(currentUser).maxMB} MB
                    </p>

                    {error && (
                      <div className="ed-error">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-red-300 break-words">{error}</p>
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => setError(null)} className="ed-btn-mini">
                              Dismiss
                            </button>
                            <button
                              onClick={() => setShowUpgradeModal(true)}
                              className="ed-btn-mini ed-btn-mini-danger"
                            >
                              Upgrade Plan
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="ed-flow">
                      <div className="ed-flow-step">
                        <VideoIcon size={13} />
                        <span>Video</span>
                      </div>
                      <span className="ed-flow-arrow">↓</span>
                      <div className="ed-flow-step">
                        <AudioLines size={13} />
                        <span>Voice</span>
                      </div>
                      <span className="ed-flow-arrow">↓</span>
                      <div className="ed-flow-step">
                        <Captions size={13} />
                        <span>AI Captions</span>
                      </div>
                      <span className="ed-flow-arrow">↓</span>
                      <div className="ed-flow-step ed-flow-step-accent">
                        <Download size={13} />
                        <span>Finished Video</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Templates + Caption Controls */}
            <aside
              className={`ed-panel ed-panel-right flex flex-col shrink-0 ${isTablet && !rightPanelOpen ? 'ed-panel-closed' : ''}`}
            >
              {renderInspectorControls()}
            </aside>
          </div>
        )}

        {/* MOBILE RESPONSIVE LAYOUT (< 768px) — only mounted on phones */}
        {!isDesktop && (
          <div className="flex flex-1 w-full flex-col pb-16">
            {mobileTab === 'video' && (
              <div className="flex-1 flex flex-col items-center justify-center p-3 relative">
                {videoUrl ? (
                  <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                    {/* Dev-only debug HUD — see desktop tree comment */}
                    {process.env.NODE_ENV !== 'production' && devActive && (
                      <div className="ed-dev-active-bar" data-active-count={devActive.count}>
                        <span className="ed-dev-src">SOURCE VIDEO: {fileName}</span>
                        <span className="ed-dev-cap">
                          CAPTION LAYER:{' '}
                          {devActive.i >= 0
                            ? `SEGMENT #${devActive.i} “${devActive.text}”`
                            : 'NO ACTIVE SEGMENT'}
                        </span>
                        <span className="ed-dev-t">
                          t={currentTime.toFixed(2)}s · active={devActive.count}
                        </span>
                      </div>
                    )}
                    {/* max-h keeps controls, clips and styles reachable by a natural scroll on phones */}
                    <div className="relative">
                      <div
                        ref={canvasContainerRef}
                        className={`ed-canvas ed-canvas-mobile ${
                          aspectRatio === '1:1'
                            ? 'aspect-square!'
                            : aspectRatio === '16:9'
                              ? 'aspect-video!'
                              : ''
                        }`}
                      >
                        <video
                          ref={videoRef}
                          src={videoUrl}
                          playsInline
                          className="w-full h-full object-cover"
                        />

                        {/* Dev-only debug tags — see desktop tree comment */}
                        {process.env.NODE_ENV !== 'production' && (
                          <>
                            <div className="ed-dev-tag ed-dev-tag-video">SOURCE VIDEO</div>
                            <div className="ed-dev-tag ed-dev-tag-caption">CAPTION OVERLAY</div>
                          </>
                        )}

                        {/* Mobile WYSIWYG caption overlay — same engine as export */}
                        <CaptionOverlay
                          phrases={phrases}
                          currentTime={currentTime}
                          styles={styles}
                          containerRef={canvasContainerRef}
                          isDragging={isDraggingCaption}
                          onPointerDown={handleCaptionPointerDown}
                          staticLayout={devStaticCaptions}
                        />

                        {/* Burned-in timeline bar preview — same math as export */}
                        <ProgressBarOverlay
                          currentTime={currentTime}
                          duration={duration}
                          styles={styles}
                          containerRef={canvasContainerRef}
                        />
                      </div>
                    </div>

                    {/* Mobile compact playback bar */}
                    <div className="ed-player-bar ed-player-bar-mobile">
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            if (isPlaying) videoRef.current.pause();
                            else videoRef.current.play();
                          }
                        }}
                        className="ed-play-btn"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                      </button>

                      <span className="ed-time">{formatMinutesSeconds(currentTime)}</span>
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        step={0.01}
                        value={currentTime}
                        onChange={(e) => seekTo(parseFloat(e.target.value))}
                        className="ed-seek"
                        aria-label="Seek"
                      />
                      <span className="ed-time ed-time-muted">
                        {formatMinutesSeconds(duration)}
                      </span>

                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.muted = !isMuted;
                            setIsMuted(!isMuted);
                          }
                        }}
                        className="ed-player-icon"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                      </button>
                    </div>

                    {/* Mobile aspect-ratio switch */}
                    <div className="ed-ratio-group flex mt-3">
                      {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((ar) => (
                        <button
                          key={ar}
                          onClick={() => setAspectRatio(ar)}
                          className={`ed-ratio-btn ${aspectRatio === ar ? 'ed-ratio-active' : ''}`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>

                    {/* Mobile timeline */}
                    <div className="ed-timeline-wrap w-full mt-3">
                      <StudioTimeline
                        duration={duration}
                        currentTime={currentTime}
                        phrases={phrases}
                        thumbnails={thumbnails}
                        onSeek={seekTo}
                      />
                    </div>
                  </div>
                ) : (
                  /* Mobile empty state */
                  <div className="w-full max-w-xs p-6 rounded-2xl ed-empty ed-empty-mobile text-center space-y-4">
                    <div className="ed-empty-icon">
                      <CloudUpload size={24} />
                    </div>
                    <h3 className="ed-empty-title">Upload your video</h3>
                    <p className="ed-empty-sub">
                      Drop your video here or{' '}
                      <button
                        onClick={() => {
                          if (!requireAuth()) return;
                          fileInputRef.current?.click();
                        }}
                        className="ed-link-btn"
                      >
                        browse
                      </button>{' '}
                      · Max {getUserUploadLimit(currentUser).maxMB} MB
                    </p>
                  </div>
                )}
              </div>
            )}

            {mobileTab === 'clips' && renderLibraryPanel()}
            {mobileTab === 'styles' && renderInspectorControls()}
          </div>
        )}
      </div>

      {/* Shared hidden file input — every upload surface triggers it via fileInputRef */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          if (!requireAuth()) return;
          const file = e.target.files?.[0];
          if (file) handleFilePicked(file);
          e.target.value = '';
        }}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 ed-bottomnav z-40">
        <button
          onClick={() => setMobileTab('video')}
          className={`ed-nav-btn ${mobileTab === 'video' ? 'ed-nav-active' : ''}`}
        >
          <VideoIcon size={17} />
          <span>Video</span>
        </button>

        <button
          onClick={() => setMobileTab('clips')}
          className={`ed-nav-btn ${mobileTab === 'clips' ? 'ed-nav-active' : ''}`}
        >
          <Film size={17} />
          <span>Clips ({phrases.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('styles')}
          className={`ed-nav-btn ${mobileTab === 'styles' ? 'ed-nav-active' : ''}`}
        >
          <Palette size={17} />
          <span>Styles</span>
        </button>
      </div>

      {/* Transcription processing overlay (isLoading was previously never rendered) */}
      {isLoading && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-[#050914]/85 backdrop-blur-md text-slate-100">
          <Loader2 size={44} className="animate-spin text-blue-500" />
          <div className="text-center space-y-1.5 px-6">
            <p className="text-sm font-bold">Generating your captions…</p>
            <p className="text-xs text-slate-400">
              Transcribing audio with word-level timing. Keep this tab open; processing time depends
              on the recording and service availability.
            </p>
          </div>
        </div>
      )}

      {/* MODALS */}
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <FontSelectionModal
        isOpen={showFontModal}
        onClose={() => setShowFontModal(false)}
        selectedFont={styles.fontFamily}
        onSelectFont={(font: string) => updateStyles((prev) => ({ ...prev, fontFamily: font }))}
      />

      {showUpgradeModal && (
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Live export progress — frosted glass modal with real frame counter */}
      {isExportingMP4 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="ed-modal">
            <div className="flex items-center gap-3">
              <Loader2 size={22} className="animate-spin text-blue-500 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-slate-100">Rendering your video…</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Please keep this tab open while your video renders.
                </p>
              </div>
            </div>

            <div className="text-center">
              <span className="text-4xl font-black font-mono text-blue-400">{exportProgress}%</span>
              <span className="text-sm text-slate-400 font-bold"> completed</span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-[width] duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>

            {exportStats && (
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>
                  Rendering frame {exportStats.frame} of {exportStats.totalFrames}…
                </span>
                <span className="font-mono">
                  {exportStats.fps}fps · {exportStats.tier}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {showLanguageModal && (
        <Modal
          open={showLanguageModal}
          onClose={() => {
            setShowLanguageModal(false);
            setPendingVideoFile(null);
          }}
          title="Select audio language"
          className="ed-modal max-w-md!"
        >
          <div>
            <h3 className="text-lg font-bold text-slate-100">Select Audio Language</h3>
            <p className="text-slate-400 text-xs mt-1">
              Select the language spoken in your video. Automatic transcription can mishear names or
              overlapping speech.
            </p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search language..."
              aria-label="Search spoken languages"
              value={languageSearch}
              onChange={(e) => setLanguageSearch(e.target.value)}
              autoFocus
              className="ed-search py-2.5! pl-9!"
            />
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto ed-scroll">
            {LANGUAGES.filter((lang) => {
              const q = languageSearch.trim().toLowerCase();
              if (!q) return true;
              return lang.name.toLowerCase().includes(q) || lang.code.toLowerCase().includes(q);
            }).map((lang) => (
              <button
                key={lang.code}
                aria-pressed={selectedLanguage === lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`w-full p-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition ${
                  selectedLanguage === lang.code
                    ? 'bg-blue-500/15 border-blue-500/60 text-slate-100'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-blue-500/40 hover:bg-white/[0.06]'
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
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition border border-white/10"
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
        </Modal>
      )}
    </div>
  );
}
