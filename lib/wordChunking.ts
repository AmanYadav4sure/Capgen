export interface ChunkedPhrase {
  words: { word: string; start: number; end: number }[];
  start: number;
  end: number;
  text: string;
}

/**
 * Re-groups caption words into chunks of `chunkSize` (1 = Hormozi punch,
 * 3 = podcast, 5 = sentence). Used by the Words At A Time control.
 */
export function groupWordsByChunkSize(
  words: { word: string; start: number; end: number }[],
  chunkSize: number,
): ChunkedPhrase[] {
  const size = Math.max(1, Math.round(chunkSize));
  const chunks: ChunkedPhrase[] = [];
  for (let i = 0; i < words.length; i += size) {
    const slice = words.slice(i, i + size);
    chunks.push({
      words: slice,
      start: slice[0].start,
      end: slice[slice.length - 1].end,
      text: slice.map((w) => w.word).join(' '),
    });
  }
  return chunks;
}

/** Maps UI option to chunk size: 'punch' → 1, 'podcast' → 3, 'sentence' → 5 */
export function chunkSizeForMode(mode: 'punch' | 'podcast' | 'sentence' | number): number {
  if (typeof mode === 'number') return Math.max(1, mode);
  switch (mode) {
    case 'punch':
      return 1;
    case 'sentence':
      return 5;
    case 'podcast':
    default:
      return 3;
  }
}

export interface DisplayPhrase {
  words: { word: string; start: number; end: number }[];
  start: number;
  end: number;
}

const SENTENCE_END_RE = /[.!?…]["'”’)\]]*$/;
const LONG_PAUSE_S = 0.6;
const SEGMENT_TAIL_S = 0.15;

type TimedWord = { word: string; start: number; end: number };

/**
 * Coerces raw ASR words into clean, ordered timestamps WITHOUT mutating the
 * input transcript: drops empties, clamps missing/NaN/backwards timing, and
 * merges accidental duplicates (same text with overlapping windows — Groq and
 * Deepgram both emit these occasionally). Distinct repetitions at separate
 * times are preserved.
 */
function sanitizeWords(words: unknown): TimedWord[] {
  if (!Array.isArray(words)) return [];

  let prevEnd = 0;
  const clean: TimedWord[] = [];
  for (const raw of words) {
    if (!raw || typeof raw !== 'object') continue;
    const word = String((raw as { word?: unknown }).word ?? '').trim();
    if (!word) continue;
    const rawStart = (raw as { start?: unknown }).start;
    const rawEnd = (raw as { end?: unknown }).end;
    const start = Number.isFinite(Number(rawStart)) ? Number(rawStart) : prevEnd;
    let end = Number.isFinite(Number(rawEnd)) ? Number(rawEnd) : start + 0.3;
    if (end <= start) end = start + 0.3;
    clean.push({ word, start, end });
    prevEnd = end;
  }
  clean.sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: TimedWord[] = [];
  for (const w of clean) {
    const prev = merged[merged.length - 1];
    if (prev && w.word.toLowerCase() === prev.word.toLowerCase() && w.start < prev.end) {
      prev.end = Math.max(prev.end, w.end);
      continue;
    }
    merged.push({ ...w });
  }
  return merged;
}

/**
 * Resolves the ONE word to highlight inside a segment at time t.
 * ASR engines emit consecutive words with slightly overlapping windows, so a
 * naive `t >= start && t < end` check can flag two words at once — this keeps
 * the LAST matching word (words are sorted by start), guaranteeing at most one
 * highlighted word. Returns -1 for micro-gaps between words (segment renders
 * with no highlight — never an empty caption).
 */
export function activeWordIndex(
  words: { word: string; start: number; end: number }[],
  t: number,
): number {
  let idx = -1;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (t >= w.start && t < w.end) idx = i;
  }
  return idx;
}

/**
 * Single normalization pass for display segments: sort by start, drop invalid
 * or zero-duration segments, and clamp each segment's end to the next
 * segment's start so segments are strictly sequential (half-open intervals
 * then guarantee 0 or 1 active segment at any time). Original word timestamps
 * are preserved — only the derived segment boundary shrinks.
 */
export function normalizeDisplayPhrases(segments: DisplayPhrase[]): DisplayPhrase[] {
  if (!Array.isArray(segments)) return [];

  const sorted = segments
    .filter((s) => s && Array.isArray(s.words) && s.words.length > 0)
    .sort((a, b) => a.start - b.start);

  const out: DisplayPhrase[] = [];
  const seen = new Set<string>();
  for (const seg of sorted) {
    const start = seg.words[0].start;
    let end = Number.isFinite(seg.end) ? seg.end : seg.words[seg.words.length - 1].end;
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (end <= start) end = seg.words[seg.words.length - 1].end;
    if (end <= start) continue;
    const key = `${start.toFixed(3)}|${seg.words.map((w) => w.word).join(' ')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ words: seg.words, start, end });
  }

  for (let i = 0; i < out.length; i++) {
    const next = out[i + 1];
    if (next && out[i].end > next.start) {
      out[i] = { ...out[i], end: next.start };
    }
  }
  return out;
}

/**
 * Single source of truth for display caption segments — the timeline, the
 * video preview and the MP4 export must all consume this same result.
 *
 * wordsPerScreen: 1 = punch (1 word), 3 = podcast (2-3 words), 5 = sentence
 * (4-6 words). The input transcript is never mutated, and incomplete timing
 * data (missing/NaN/negative durations) is clamped instead of crashing.
 * Chunks break early at sentence-ending punctuation or a long pause once the
 * chunk reaches its minimum size, so 4-6 can reduce naturally (6→5→4) but
 * never collapses mid-sentence to a single word. A short final chunk is
 * allowed (trailing fragment of the last sentence). The result is normalized
 * so segments never overlap and at most one is active at any video time.
 */
export function buildDisplayPhrases(
  words: { word: string; start: number; end: number }[] | null | undefined,
  wordsPerScreen?: number | null,
): DisplayPhrase[] {
  const clean = sanitizeWords(words);
  if (clean.length === 0) return [];

  const target = Math.min(6, Math.max(1, Math.round(Number(wordsPerScreen) || 3)));
  if (target === 1) {
    return normalizeDisplayPhrases(
      clean.map((w) => ({ words: [w], start: w.start, end: w.end + SEGMENT_TAIL_S })),
    );
  }

  const minBreak = target >= 4 ? 4 : 2;
  const maxWords = target >= 4 ? 6 : target;

  const phrases: DisplayPhrase[] = [];
  let group: TimedWord[] = [];

  const flush = () => {
    if (group.length === 0) return;
    phrases.push({
      words: group,
      start: group[0].start,
      end: group[group.length - 1].end + SEGMENT_TAIL_S,
    });
    group = [];
  };

  for (let i = 0; i < clean.length; i++) {
    const w = clean[i];
    group.push(w);
    const next = clean[i + 1];
    if (!next) {
      flush();
      break;
    }
    const isSentenceEnd = SENTENCE_END_RE.test(w.word);
    const isLongPause = next.start - w.end > LONG_PAUSE_S;
    if (group.length >= maxWords || ((isSentenceEnd || isLongPause) && group.length >= minBreak)) {
      flush();
    }
  }

  return normalizeDisplayPhrases(phrases);
}
