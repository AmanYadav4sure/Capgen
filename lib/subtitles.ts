import { groupWordsByChunkSize } from '@/lib/wordChunking';

export interface CaptionPhrase {
  words: { word: string; start: number; end: number }[];
  start: number;
  end: number;
}

export function buildPhrases(
  words: { word: string; start: number; end: number }[],
  maxWordsPerPhrase = 3,
  /** styles.wordsPerScreen override — 'Words At A Time' user control */
  chunkSizeOverride?: number,
): CaptionPhrase[] {
  if (!words || words.length === 0) return [];

  // User's explicit Words-At-A-Time choice wins over template defaults
  if (chunkSizeOverride && chunkSizeOverride >= 1) {
    return groupWordsByChunkSize(words, chunkSizeOverride).map((c) => ({
      words: c.words,
      start: c.start,
      end: c.end + 0.15,
    }));
  }

  const clean = words
    .map((w) => ({
      word: String(w.word || '').trim(),
      start: Number(w.start),
      end: Number(w.end),
    }))
    .filter((w) => w.word.length > 0)
    .sort((a, b) => a.start - b.start);

  const phrases: CaptionPhrase[] = [];
  let currentGroup: { word: string; start: number; end: number }[] = [];

  // STRICT RULE: Max 2 to 3 words per phrase (Hormozi-style presets use 2)
  const MAX_WORDS = Math.max(1, maxWordsPerPhrase);

  for (let i = 0; i < clean.length; i++) {
    currentGroup.push(clean[i]);

    const isPause = i < clean.length - 1 && clean[i + 1].start - clean[i].end > 0.35;
    const isFull = currentGroup.length >= MAX_WORDS;
    const isLast = i === clean.length - 1;

    if (isPause || isFull || isLast) {
      phrases.push({
        words: currentGroup,
        start: currentGroup[0].start,
        end: currentGroup[currentGroup.length - 1].end + 0.15,
      });
      currentGroup = [];
    }
  }

  return phrases;
}

export function generateSRT(words: { word: string; start: number; end: number }[]): string {
  if (!words || words.length === 0) return '';

  const phrases = buildPhrases(words);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 1000);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
  };

  return phrases
    .map(
      (phrase, index) =>
        `${index + 1}\n${formatTime(phrase.start)} --> ${formatTime(phrase.end)}\n${phrase.words
          .map((w) => w.word)
          .join(' ')}\n`,
    )
    .join('\n');
}
