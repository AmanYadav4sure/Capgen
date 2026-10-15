import { StyleSettings } from '@/lib/types';

/**
 * Caption geometry shared by the /editor DOM preview and the MP4 canvas
 * renderer.
 *
 * Both layers lay words out from the SAME numbers: every "words collide / words
 * cut in half" bug came from the preview and the encoder each inventing their
 * own spacing, padding and wrapping rules. A word is an ATOMIC layout unit here
 * — measured whole, wrapped whole, and never widened sideways by its own
 * highlight animation.
 */

/** Preset fontSize is authored against a frame this wide. */
export const CAPTION_SCALE_BASE = 360;
export const CAPTION_LINE_HEIGHT = 1.18;

/** Inter-word gap as a fraction of the caption font size. */
export const WORD_GAP_EM = 0.34;
/** Vertical travel for bounce / fade-slide, in em. Wrapped lines get this much
 *  extra leading on top of line-height so a lifted word can never touch the
 *  line above it. */
export const MAX_LIFT_EM = 0.16;
/** A decoration (marker box, outline) may bleed into the gap but never past its
 *  midpoint — that keeps it clear of the neighbouring glyphs. */
export const OUTSET_GAP_RATIO = 0.5;
/** Soft light (glow halo) is allowed to bleed a little further. */
export const HALO_GAP_RATIO = 0.9;
/** Text box: 85% of the frame, matching the DOM container max-width. */
export const SAFE_WIDTH_RATIO = 0.85;
export const SAFE_HEIGHT_RATIO = 0.7;
/** A segment whose longest word still cannot fit the safe box is scaled down as
 *  a block (never cut off, never re-flowed mid-word). */
export const MIN_FIT = 0.35;
/** Hard floor that only applies to LEADING overflow. A word physically wider
 *  than the frame must shrink past it — the alternatives are splitting the word
 *  (forbidden) or painting it off-screen (the "ROLLERCOAS" bug itself). */
export const ABS_FIT_FLOOR = 0.08;

export interface CaptionMetrics {
  fontSizePx: number;
  /** horizontal gap between word boxes */
  gapX: number;
  /** extra leading between wrapped lines */
  gapY: number;
  /** baseline-to-baseline distance of a wrapped caption */
  lineHeight: number;
  /** max sideways bleed for marker boxes and outlines */
  outsetLimit: number;
  /** max sideways bleed for glow halos */
  haloLimit: number;
  /** max |translateY| a word may animate */
  maxLift: number;
  safeWidth: number;
  safeHeight: number;
}

export interface CaptionMetricsInput {
  /** font size already scaled to the target frame (preview px or export px) */
  fontSizePx: number;
  frameWidth: number;
  frameHeight: number;
  /** caption anchor, in the same pixel space */
  centerX: number;
  centerY: number;
}

export function captionMetrics(input: CaptionMetricsInput): CaptionMetrics {
  const { fontSizePx, frameWidth, frameHeight, centerX, centerY } = input;
  const maxLift = fontSizePx * MAX_LIFT_EM;
  const gapX = fontSizePx * WORD_GAP_EM;
  const roomX = 2 * Math.min(centerX, frameWidth - centerX);
  const roomY = 2 * Math.min(centerY, frameHeight - centerY);
  return {
    fontSizePx,
    gapX,
    gapY: maxLift * 2,
    lineHeight: fontSizePx * CAPTION_LINE_HEIGHT + maxLift * 2,
    outsetLimit: gapX * OUTSET_GAP_RATIO,
    haloLimit: gapX * HALO_GAP_RATIO,
    maxLift,
    safeWidth: Math.min(frameWidth * SAFE_WIDTH_RATIO, roomX * 0.96),
    safeHeight: Math.min(frameHeight * SAFE_HEIGHT_RATIO, roomY * 0.92),
  };
}

/** CSS font shorthand used for BOTH painting and measuring, so a width taken
 *  from measureText() is the width the renderer actually draws. */
export function captionFontString(styles: StyleSettings, fontSizePx: number): string {
  const family = (styles.fontFamily || 'Anton').replace(/["']/g, '');
  return `900 ${fontSizePx}px "${family}", sans-serif`;
}

// ---------------------------------------------------------------------------
// text measurement
// ---------------------------------------------------------------------------

let measureCtx: CanvasRenderingContext2D | null | undefined;
const widthCache = new Map<string, number>();

function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (measureCtx === undefined) {
    measureCtx =
      typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  }
  return measureCtx;
}

/**
 * Width of one styled word, memoized per (font, text). Without a canvas (server
 * render, or a context that refuses to measure) it returns 0 so callers can
 * treat "unknown" as fit = 1 and re-measure on the client instead of guessing a
 * width and clipping real text.
 */
export function measureCaptionWidth(text: string, font: string): number {
  if (!text) return 0;
  const key = `${font}\u0000${text}`;
  const hit = widthCache.get(key);
  if (hit !== undefined) return hit;
  const ctx = getMeasureCtx();
  if (!ctx) return 0;
  ctx.font = font;
  const width = ctx.measureText(text).width;
  widthCache.set(key, width);
  return width;
}

/** Webfonts change metrics after they load — drop the cache and re-measure. */
export function resetCaptionWidthCache(): void {
  widthCache.clear();
  measureCtx = undefined;
}

export function measureCaptionWidths(texts: string[], font: string): number[] {
  return texts.map((t) => measureCaptionWidth(t, font));
}

// ---------------------------------------------------------------------------
// wrapping + fit
// ---------------------------------------------------------------------------

/**
 * Greedy line packing over whole words. A word that is wider than the safe box
 * is NOT split — it takes a line to itself and the block fit below shrinks the
 * block so the complete word stays inside the frame.
 */
export function groupWordLines(widths: number[], gapX: number, safeWidth: number): number[][] {
  const lines: number[][] = [];
  let line: number[] = [];
  let lineWidth = 0;
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i];
    if (line.length === 0) {
      line = [i];
      lineWidth = w;
      continue;
    }
    if (lineWidth + gapX + w > safeWidth) {
      lines.push(line);
      line = [i];
      lineWidth = w;
    } else {
      line.push(i);
      lineWidth += gapX + w;
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

export interface BlockLayout {
  lines: number[][];
  lineWidths: number[];
  blockWidth: number;
  blockHeight: number;
  /** whole-block scale that keeps every complete word inside the safe box */
  fit: number;
}

/**
 * Everything the two renderers need to place one segment: lines, their widths,
 * and the block fit. `fit` only ever goes below 1, and only for a segment that
 * physically cannot fit at the authored size — it prevents frame-edge clipping
 * (the "ROLLERCOAS" artifact) without touching the preset font size of captions
 * that already fit.
 */
export function layoutCaptionBlock(widths: number[], m: CaptionMetrics): BlockLayout {
  const empty: BlockLayout = {
    lines: [],
    lineWidths: [],
    blockWidth: 0,
    blockHeight: 0,
    fit: 1,
  };
  if (widths.length === 0) return empty;
  if (!(m.safeWidth > 0) || !(m.safeHeight > 0)) {
    const lines = groupWordLines(widths, m.gapX, Infinity);
    return {
      lines,
      lineWidths: lines.map((l) => sumWidths(l, widths, m.gapX)),
      blockWidth: 0,
      blockHeight: 0,
      fit: 1,
    };
  }

  let lines = groupWordLines(widths, m.gapX, m.safeWidth);
  const lineWidths = lines.map((l) => sumWidths(l, widths, m.gapX));
  const widestWord = Math.max(...widths);
  const blockHeight = lines.length * m.lineHeight;

  // Width is a hard constraint: an over-wide word shrinks the block as far as
  // needed instead of running off the frame. Leading may shrink to MIN_FIT.
  const fitW = widestWord > m.safeWidth ? m.safeWidth / widestWord : 1;
  const fitH = blockHeight > m.safeHeight ? Math.max(MIN_FIT, m.safeHeight / blockHeight) : 1;
  const fit = Math.max(ABS_FIT_FLOOR, Math.min(1, fitW, fitH));

  if (fit < 1) {
    // metrics scale with the block, so re-pack at the fitted size to be sure
    // no line overflows the safe box any more.
    const fitted = captionMetricsScaled(m, fit);
    lines = groupWordLines(widths, fitted.gapX, fitted.safeWidth);
  }
  return {
    lines,
    lineWidths: lines.map((l) => sumWidths(l, widths, m.gapX * fit)),
    blockWidth: Math.max(0, ...lineWidths),
    blockHeight: lines.length * m.lineHeight * fit,
    fit,
  };
}

function sumWidths(indices: number[], widths: number[], gapX: number): number {
  let total = 0;
  for (let k = 0; k < indices.length; k++) total += widths[indices[k]];
  if (indices.length > 1) total += gapX * (indices.length - 1);
  return total;
}

/** Scales the px-derived metrics of a block fit. Safe-box ratios stay put. */
function captionMetricsScaled(m: CaptionMetrics, fit: number): CaptionMetrics {
  return {
    ...m,
    fontSizePx: m.fontSizePx * fit,
    gapX: m.gapX * fit,
    gapY: m.gapY * fit,
    lineHeight: m.lineHeight * fit,
    outsetLimit: m.outsetLimit * fit,
    haloLimit: m.haloLimit * fit,
    maxLift: m.maxLift * fit,
  };
}

/**
 * Typewriter reveal count at time t. Words appear WHOLE, one by one, as their
 * own start time arrives — the previous per-character reveal drew fragments
 * like "ROLLERCOAS" of "ROLLERCOASTER", which read as a corrupted renderer.
 */
export function typewriterWordCount(
  words: { start: number }[],
  t: number,
  phraseStart: number,
): number {
  let n = 0;
  for (const w of words) if (t >= w.start) n++;
  // never show an empty frame: the first word is up as soon as the segment is
  return Math.max(n, t >= phraseStart && words.length ? 1 : 0);
}
