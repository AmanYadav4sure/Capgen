import { CaptionWord, StyleSettings, DEFAULT_STYLE_SETTINGS } from '@/lib/types';
import { buildPhrases } from '@/lib/subtitles';

/**
 * Dev-only export render benchmark.
 *
 * Simulates the export render loop WITHOUT MediaRecorder/encoding (which is
 * hardware-specific) and measures exactly the part this app controls: the
 * per-frame canvas compositing + caption drawing cost, i.e. the main-thread
 * budget that determines whether captureStream() gets fed at 60fps.
 *
 * A mid-range phone needs every simulated frame under ~12ms (well under the
 * 16.6ms frame budget) to sustain real-time capture.
 *
 * Usage (console):
 *   __capgenBenchmark({ frames: 300 })              // current engine
 *   __capgenBenchmark({ frames: 300, engine: 'naive' }) // pre-optimization path
 */

interface BenchmarkResult {
  engine: 'optimized' | 'naive';
  frames: number;
  canvasW: number;
  canvasH: number;
  wordCount: number;
  totalMs: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  fpsEquivalent: number;
  within16ms: number; // % of frames inside a 60fps budget
}

function makeSyntheticWords(count: number): CaptionWord[] {
  const dict =
    'calisthenics scary workout muscle fail gym never give up transform body shred beast mode train insane'.split(
      ' ',
    );
  const words: CaptionWord[] = [];
  let t = 0.2;
  for (let i = 0; i < count; i++) {
    const dur = 0.28 + Math.random() * 0.35;
    words.push({ word: dict[i % dict.length], start: +t.toFixed(3), end: +(t + dur).toFixed(3) });
    t += dur + 0.06;
  }
  return words;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function drawFakeVideoFrame(ctx: CanvasRenderingContext2D, w: number, h: number, i: number) {
  // Approximates the per-frame video blit (drawImage of a photo-sized source).
  ctx.fillStyle = `hsl(${(i * 3) % 360} 40% 30%)`;
  ctx.fillRect(0, 0, w, h);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

async function runBenchmark(opts?: {
  frames?: number;
  engine?: 'optimized' | 'naive';
}): Promise<BenchmarkResult> {
  const frames = opts?.frames ?? 300;
  const engine = opts?.engine ?? 'optimized';

  const [{ CaptionCanvasRenderer }, { buildPhrases }] = await Promise.all([
    import('@/lib/exportCaptionRenderer'),
    import('@/lib/subtitles'),
  ]);

  const w = 720;
  const h = 1280;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d', { alpha: false })!;

  const words = makeSyntheticWords(220);
  const styles: StyleSettings = {
    ...DEFAULT_STYLE_SETTINGS,
    template: 'ali_abdaal_marker',
    fontFamily: 'Anton',
    fontSize: 24,
    textColor: '#FFFFFF',
    highlightColor: '#FFE600',
    highlightBg: '#A3E635',
    backgroundColor: 'transparent',
    uppercase: true,
    captionXPercent: 50,
    captionYPercent: 72,
    position: 'bottom',
    maxWordsPerScreen: 3,
    aspectRatio: '9:16',
  };

  const renderer = new CaptionCanvasRenderer(canvas, buildPhrases(words), styles);
  // phrases built ONCE here only for the optimized path; the naive path
  // rebuilds them every frame (as the old drawCaptionsToCanvas did).
  const totalDur = words[words.length - 1].end;

  const times: number[] = [];
  // warmup (JIT + font load)
  for (let i = 0; i < 30; i++) {
    const t = (i / 30) * totalDur;
    renderer.drawFrame(t);
  }

  for (let i = 0; i < frames; i++) {
    const t = (i / frames) * totalDur;
    const t0 = performance.now();
    drawFakeVideoFrame(ctx, w, h, i);
    if (engine === 'optimized') {
      renderer.drawFrame(t);
    } else {
      // Faithful old path: buildPhrases (sort+group over ALL words) ran
      // inside every frame — this is what killed mid-range phones.
      drawNaiveCaptions(ctx, canvas, words, t, styles);
    }
    times.push(performance.now() - t0);
  }

  // Yield so the stats don't fight the compositor
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  const sorted = [...times].sort((a, b) => a - b);
  const total = times.reduce((a, b) => a + b, 0);
  const avg = total / times.length;
  const result: BenchmarkResult = {
    engine,
    frames,
    canvasW: w,
    canvasH: h,
    wordCount: words.length,
    totalMs: +total.toFixed(1),
    avgMs: +avg.toFixed(2),
    p50Ms: +percentile(sorted, 50).toFixed(2),
    p95Ms: +percentile(sorted, 95).toFixed(2),
    maxMs: +sorted[sorted.length - 1].toFixed(2),
    fpsEquivalent: +(1000 / avg).toFixed(1),
    within16ms: +((sorted.filter((t) => t <= 16.6).length / sorted.length) * 100).toFixed(1),
  };

  // eslint-disable-next-line no-console
  console.table([result]);
  return result;
}

// Faithful port of the OLD per-frame path (rebuild phrases + measureText per
// frame) so the comparison is honest.
function drawNaiveCaptions(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  words: CaptionWord[],
  currentTime: number,
  styles: StyleSettings,
) {
  const phrases = buildPhrases(words, 3); // per-frame rebuild — the old bug
  const phrase = phrases.find((p) => currentTime >= p.start && currentTime <= p.end);
  if (!phrase) return;
  const activeWords = phrase.words.filter((w) => currentTime >= w.start && currentTime <= w.end);
  if (activeWords.length === 0) return;

  const scale = canvas.width / 360;
  const fontSize = (styles.fontSize || 24) * scale;
  const fontFamily = styles.fontFamily || 'Anton';
  const y = ((styles.captionYPercent ?? 72) / 100) * canvas.height;
  const targetX = ((styles.captionXPercent ?? 50) / 100) * canvas.width;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const wordItems = activeWords.map((w) => {
    const text = (styles.uppercase ?? true) ? w.word.toUpperCase() : w.word;
    ctx.font = `900 ${fontSize}px "${fontFamily}", sans-serif`;
    return { text, width: ctx.measureText(text).width };
  });

  const gap = 10 * scale;
  const totalWidth = wordItems.reduce((a, it) => a + it.width, 0) + (wordItems.length - 1) * gap;
  let x = targetX - totalWidth / 2;

  for (const item of wordItems) {
    ctx.font = `900 ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.lineWidth = 3 * scale;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(item.text, x + item.width / 2, y);
    ctx.fillStyle = '#FFE600';
    ctx.fillText(item.text, x + item.width / 2, y);
    x += item.width + gap;
  }
  ctx.restore();
}

export { runBenchmark };

declare global {
  interface Window {
    __capgenBenchmark?: typeof runBenchmark;
    __capgenStylesFallback?: Partial<StyleSettings>;
  }
}

if (typeof window !== 'undefined') {
  window.__capgenBenchmark = runBenchmark;
}
