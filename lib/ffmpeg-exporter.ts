import { CaptionWord, StyleSettings } from '@/lib/firebase/types';

export interface CaptionPhrase {
  words: { word: string; start: number; end: number }[];
  start: number;
  end: number;
}

export function buildPhrases(words: { word: string; start: number; end: number }[]): CaptionPhrase[] {
  if (!words || words.length === 0) return [];

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

  // STRICT RULE: Max 2 to 3 words per phrase!
  const MAX_WORDS = 3;

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
          .join(' ')}\n`
    )
    .join('\n');
}

export async function exportVideoWithFFmpeg({
  videoUrl,
  words,
  styles,
  videoFile,
  onProgress,
}: {
  videoUrl: string;
  words: CaptionWord[];
  styles: StyleSettings;
  videoFile?: File | Blob | null;
  onProgress?: (progress: number) => void;
}): Promise<Blob> {
  onProgress?.(10);

  const srtContent = generateSRT(words);

  // Fetch or use video File/Blob
  let videoBlob: Blob;
  if (videoFile) {
    videoBlob = videoFile;
  } else if (videoUrl.startsWith('blob:') || videoUrl.startsWith('http')) {
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error('Failed to load video file for export');
    videoBlob = await res.blob();
  } else {
    throw new Error('Please upload a video first!');
  }

  onProgress?.(25);

  const captionY = styles.captionYPercent ?? 72;
  const marginV = Math.round((100 - captionY) * 2.8);
  const fontSize = styles.fontSize ? Math.round(styles.fontSize * 0.75) : 22;

  const fontName = styles.fontFamily || 'Montserrat';
  const forceStyle = `FontName=${fontName},FontSize=${fontSize},PrimaryColour=&H00FFFFFF&,OutlineColour=&H00000000&,BorderStyle=1,Outline=2,Shadow=1,MarginV=${marginV},Alignment=2`;

  const formData = new FormData();
  formData.append('video', videoBlob, 'input.mp4');
  formData.append('file', videoBlob, 'input.mp4'); // Backup key
  formData.append('srt', srtContent);
  formData.append('srtContent', srtContent);
  formData.append('margin_v', String(marginV));
  formData.append('font_size', String(fontSize));
  formData.append('styles', JSON.stringify(styles));
  formData.append('fontName', fontName);
  formData.append('force_style', forceStyle);

  onProgress?.(40);

  const RENDER_ENDPOINT = process.env.NEXT_PUBLIC_RENDER_API_URL || 'https://capgen-render.onrender.com/render';

  let response = await fetch(RENDER_ENDPOINT, {
    method: 'POST',
    body: formData,
  }).catch(() => null);

  // Fallback to /export or base URL if endpoint returned error
  if (!response || !response.ok) {
    const baseUrl = RENDER_ENDPOINT.replace(/\/render\/?$/, '');
    response = await fetch(`${baseUrl}/export`, {
      method: 'POST',
      body: formData,
    }).catch(() => null);
  }

  if (!response || !response.ok) {
    const errText = response ? await response.text().catch(() => '') : '';
    throw new Error(errText || `Server rendering failed (${response ? response.status : 'network error'}).`);
  }

  onProgress?.(90);

  const exportedBlob = await response.blob();
  onProgress?.(100);

  return exportedBlob;
}
