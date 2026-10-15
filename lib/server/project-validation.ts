import { DEFAULT_STYLE_SETTINGS, type CaptionWord, type StyleSettings } from '@/lib/types';
import { ApiError } from './http';

export function projectId(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value))
    throw new ApiError(400, 'Invalid project ID.');
  return value;
}
export function projectInput(input: Record<string, unknown>) {
  if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 200)
    throw new ApiError(400, 'Use a project title between 1 and 200 characters.');
  if (!Array.isArray(input.words) || input.words.length > 12000)
    throw new ApiError(400, 'The transcript is too large or invalid.');
  const words: CaptionWord[] = input.words.map((value: unknown) => {
    if (!value || typeof value !== 'object') throw new ApiError(400, 'Invalid caption word.');
    const word = value as CaptionWord;
    if (
      typeof word.word !== 'string' ||
      !word.word.trim() ||
      word.word.length > 500 ||
      !Number.isFinite(word.start) ||
      !Number.isFinite(word.end) ||
      word.start < 0 ||
      word.end < word.start ||
      word.end > 86400
    )
      throw new ApiError(400, 'Caption words must have valid text and timing.');
    return { word: word.word, start: word.start, end: word.end };
  });
  if (
    !input.styleSettings ||
    typeof input.styleSettings !== 'object' ||
    Array.isArray(input.styleSettings)
  )
    throw new ApiError(400, 'Invalid caption style.');
  const supplied = input.styleSettings as Record<string, unknown>;
  const styleSettings: Record<string, unknown> = { ...DEFAULT_STYLE_SETTINGS };
  const strings = [
    'template',
    'highlightColor',
    'textColor',
    'backgroundColor',
    'fontFamily',
    'position',
    'aspectRatio',
    'animationType',
    'highlightBg',
    'progressBarColor',
    'progressBarPosition',
  ];
  const booleans = ['uppercase', 'progressBarEnabled'];
  for (const key of strings)
    if (supplied[key] !== undefined) {
      if (typeof supplied[key] !== 'string' || (supplied[key] as string).length > 150)
        throw new ApiError(400, 'Invalid caption style value.');
      styleSettings[key] = supplied[key];
    }
  for (const key of booleans)
    if (supplied[key] !== undefined) {
      if (typeof supplied[key] !== 'boolean')
        throw new ApiError(400, 'Invalid caption style value.');
      styleSettings[key] = supplied[key];
    }
  const bounds: Record<string, [number, number]> = {
    fontSize: [1, 200],
    maxWordsPerScreen: [1, 30],
    wordsPerScreen: [1, 30],
    captionYPercent: [0, 100],
    captionXPercent: [0, 100],
    progressBarHeight: [1, 30],
  };
  for (const [key, [min, max]] of Object.entries(bounds))
    if (supplied[key] !== undefined) {
      const value = supplied[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
        throw new ApiError(400, 'Caption style values are outside their supported range.');
      styleSettings[key] = value;
    }
  if (
    !['9:16', '1:1', '16:9'].includes(String(styleSettings.aspectRatio)) ||
    !['bottom', 'center', 'top'].includes(String(styleSettings.position))
  )
    throw new ApiError(400, 'Unsupported caption layout.');
  if (
    styleSettings.animationType &&
    !['pop', 'marker', 'typewriter', 'glow', 'fade-slide', 'bounce'].includes(
      String(styleSettings.animationType),
    )
  )
    throw new ApiError(400, 'Unsupported caption animation.');
  if (
    input.transcriptText !== undefined &&
    (typeof input.transcriptText !== 'string' || input.transcriptText.length > 150000)
  )
    throw new ApiError(400, 'The transcript text is too large.');
  if (
    input.revision !== undefined &&
    (!Number.isSafeInteger(input.revision) || Number(input.revision) < 0)
  )
    throw new ApiError(400, 'Invalid project revision.');
  return {
    title: input.title.trim(),
    words,
    styleSettings: styleSettings as unknown as StyleSettings,
    transcriptText:
      typeof input.transcriptText === 'string'
        ? input.transcriptText
        : words.map((word) => word.word).join(' '),
  };
}
