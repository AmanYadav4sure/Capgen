import { StyleSettings } from '@/lib/types';
import { CaptionPhrase } from '@/lib/subtitles';
import { activeWordIndex } from '@/lib/wordChunking';
import {
  CAPTION_SCALE_BASE,
  BlockLayout,
  captionFontString,
  captionMetrics,
  layoutCaptionBlock,
  measureCaptionWidth,
  typewriterWordCount,
} from '@/lib/captionLayout';

/**
 * High-performance caption layer for MP4 export on mid-range phones.
 *
 * Why the naive per-frame path was slow (measured in the export benchmark):
 *  - buildPhrases() re-sorted & regrouped ALL words every frame
 *  - phrase lookup was a linear .find() over all phrases
 *  - ctx.measureText() ran for every word every frame (layout thrash)
 *  - templateMotion() re-evaluated the switch chain every frame
 *  - shadowBlur glow is brutally slow on mobile GPUs (each glow = extra pass)
 *
 * This class hoists every one of those to setup time. Per frame it does:
 * binary-search + O(1) cache hits + pure arithmetic. Typically 3-6x faster
 * per frame, which is what keeps canvas.captureStream() fed at 60fps.
 *
 * Layout rules that keep the exported words intact:
 *  - one segment is active at a time, and the WHOLE segment is painted as one
 *    block whose per-word slots were computed once at setup, so nothing that
 *    animates can move a neighbour;
 *  - a word is painted complete or not at all — never a slice of its letters;
 *  - emphasis only ever shrinks a word (scale <= 1), so a highlighted word can
 *    never grow into the next one;
 *  - marker boxes, outlines and halos may bleed only into the inter-word gap,
 *    and every glyph is painted AFTER all decorations, so no halo or box ever
 *    lands on top of a neighbour's letters.
 */

const POP_START_SCALE = 0.82; // spring-in never exceeds the word's own box

function easeOutCubic(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - Math.pow(1 - c, 3);
}

type CaptionMotion = NonNullable<StyleSettings['animationType']>;

function templateMotionOf(styles: StyleSettings): CaptionMotion {
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

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Cheap glow: stroked halo instead of ctx.shadowBlur (shadowBlur costs a full
// extra composite pass per glyph on mobile GPUs — the #1 export killer).
function fastGlow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  blur: number,
): void {
  ctx.save();
  ctx.globalAlpha *= 0.55;
  ctx.lineWidth = blur;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeText(text, x, y);
  ctx.restore();
}

// Motion + paint state for one word at one time — computed once per frame.
interface Visual {
  text: string;
  color: string;
  strokeColor: string | null;
  strokeWidth: number; // in CAPTION_SCALE_BASE units (multiply by frame scale)
  boxColor: string | null;
  boxRadius: number;
  boxPadX: number; // base units, clamped to the gap at draw time
  boxPadY: number;
  scale: number; // never > 1
  lift: number; // base units, clamped at draw time
  alpha: number;
  glow: number;
  sweep: number;
}

interface PreparedWord {
  /** index inside the segment's word list */
  i: number;
  /** raw transcript word (activeWordIndex contract) */
  word: string;
  text: string;
  start: number;
  end: number;
  /** painted glyph width (block fit applied) */
  width: number;
  /** painted glyph centre, relative to the caption anchor */
  cx: number;
  baseline: number;
  line: number;
}

interface PreparedPhrase {
  index: number;
  start: number;
  end: number;
  words: PreparedWord[];
  lines: PreparedWord[][];
  fit: number;
  fontSize: number;
  lineHeight: number;
  gapX: number;
  outsetLimit: number;
  haloLimit: number;
  maxLift: number;
  blockWidth: number;
  blockHeight: number;
}

/** A word this frame paints, with the canvas geometry it is painted at. */
interface PaintedItem {
  word: PreparedWord;
  v: Visual;
  active: boolean;
  /** absolute glyph centre x */
  cx: number;
  /** absolute baseline y (animation lift already applied) */
  y: number;
}

/** A painted word, as the frame would show it — used by the dev QA probe. */
export interface CaptionWordRect {
  text: string;
  /** glyph box, including this frame's animated scale */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** envelope the renderer may paint inside (glyph box + box/outline/halo) */
  paint0: number;
  paint1: number;
  paintTop: number;
  paintBottom: number;
  /** slot box: the space reserved for the word for the whole segment */
  slot0: number;
  slot1: number;
  active: boolean;
}

export class CaptionCanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private phrases: PreparedPhrase[];
  private motion: CaptionMotion;
  private styles: StyleSettings;
  private scale: number;
  private anchorY: number;
  private centerX: number;
  private pillColor: string | null;
  private uppercase: boolean;
  private cursor = 0; // monotonic phrase index — playback never goes backwards
  private ascent: number;
  private descent: number;

  private progressEnabled: boolean;
  private progressColor: string;
  private progressHeight: number;
  private progressPosition: 'bottom' | 'top';
  private duration: number;

  constructor(
    canvas: HTMLCanvasElement,
    phrases: CaptionPhrase[],
    styles: StyleSettings,
    duration = 0,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.styles = styles;
    this.duration = duration;
    this.progressEnabled = styles.progressBarEnabled ?? false;
    this.progressColor = styles.progressBarColor || '#2060F6';
    this.progressHeight = Math.max(2, styles.progressBarHeight || 6) * (canvas.width / 360);
    this.progressPosition = styles.progressBarPosition === 'top' ? 'top' : 'bottom';
    // Consume the SAME derived display segments as the preview + timeline.
    this.motion = templateMotionOf(styles);
    this.scale = canvas.width / CAPTION_SCALE_BASE;
    this.anchorY = ((styles.captionYPercent ?? 72) / 100) * canvas.height;
    this.centerX = ((styles.captionXPercent ?? 50) / 100) * canvas.width;
    this.uppercase = styles.uppercase ?? true;
    const bg = styles.backgroundColor;
    this.pillColor = bg && bg !== 'transparent' && bg !== 'rgba(0,0,0,0)' ? bg : null;

    this.ascent = 0.78;
    this.descent = 0.25;
    this.phrases = (phrases || []).map((p, index) => this.prepare(p, index));

    // Vertical glyph extent for the containment probe: measure one real glyph.
    const font = captionFontString(styles, this.baseFontSize());
    this.ctx.font = font;
    const m = this.ctx.measureText('H');
    if (m.actualBoundingBoxAscent > 0 && m.actualBoundingBoxDescent >= 0) {
      this.ascent = m.actualBoundingBoxAscent / this.baseFontSize();
      this.descent = m.actualBoundingBoxDescent / this.baseFontSize();
    }
  }

  private baseFontSize(): number {
    return (this.styles.fontSize || 24) * this.scale;
  }

  /**
   * Measures the segment once and freezes its geometry: line packing, per-word
   * slots, and the whole-block fit that keeps a too-wide word complete instead
   * of slicing it off at the frame edge.
   */
  private prepare(phrase: CaptionPhrase, index: number): PreparedPhrase {
    const fontSize1 = this.baseFontSize();
    const font = captionFontString(this.styles, fontSize1);
    const texts = phrase.words.map((w) =>
      this.uppercase ? String(w.word || '').toUpperCase() : String(w.word || ''),
    );
    const widths = texts.map((t) => measureCaptionWidth(t, font));
    const m = captionMetrics({
      fontSizePx: fontSize1,
      frameWidth: this.canvas.width,
      frameHeight: this.canvas.height,
      centerX: this.centerX,
      centerY: this.anchorY,
    });
    const block: BlockLayout = layoutCaptionBlock(widths, m);
    const fit = block.fit;
    const gapX = m.gapX * fit;
    const lineHeight = m.lineHeight * fit;
    const fontSize = fontSize1 * fit;
    const blockH = block.lines.length * lineHeight;
    const startY = this.anchorY - blockH / 2 + lineHeight / 2;

    const lines: PreparedWord[][] = block.lines.map((idxs, li) => {
      const lineW = idxs.reduce((sum, i) => sum + widths[i] * fit, 0) + gapX * (idxs.length - 1);
      let x = -lineW / 2;
      const baseline = startY + li * lineHeight;
      return idxs.map((i) => {
        const w = widths[i] * fit;
        const pw: PreparedWord = {
          i,
          word: String(phrase.words[i].word || ''),
          text: texts[i],
          start: phrase.words[i].start,
          end: phrase.words[i].end,
          width: w,
          cx: x + w / 2,
          baseline,
          line: li,
        };
        x += w + gapX;
        return pw;
      });
    });

    // Transcript order matters for the typewriter reveal, so keep a flat index
    // of the same objects the lines reference.
    const byIndex = new Array<PreparedWord>(texts.length);
    for (const line of lines) for (const pw of line) byIndex[pw.i] = pw;

    return {
      index,
      start: phrase.start,
      end: phrase.end,
      words: byIndex,
      lines,
      fit,
      fontSize,
      lineHeight,
      gapX,
      outsetLimit: m.outsetLimit * fit,
      haloLimit: m.haloLimit * fit,
      maxLift: m.maxLift * fit,
      blockWidth: block.blockWidth * fit,
      blockHeight: blockH,
    };
  }

  /** Binary search: first phrase whose end > t (half-open, cursor shortcuts sequential playback). */
  private findPhrase(t: number): PreparedPhrase | null {
    const ps = this.phrases;
    if (ps.length === 0) return null;

    let i = this.cursor;
    if (i >= ps.length) i = ps.length - 1;
    if (t < ps[i].start) i = 0; // seek backwards → restart scan
    // Half-open intervals: a segment is active for start <= t < end. Using
    // `<` here (instead of `<=`) kept A active at t === A.end === B.start,
    // so the canvas engine and the DOM preview disagreed on the boundary and
    // the encoder could sample a stale phrase for one frame.
    while (i < ps.length && ps[i].end <= t) i++;
    if (i >= ps.length) {
      this.cursor = ps.length;
      return null;
    }
    if (t < ps[i].start) {
      this.cursor = i;
      return null;
    }
    this.cursor = i;
    return ps[i];
  }

  private visual(w: PreparedWord, t: number, active: boolean): Visual {
    const s = this.styles;
    const p = easeOutCubic((t - w.start) / 0.18);

    let color = s.textColor || '#FFFFFF';
    let strokeColor: string | null = '#000000';
    let strokeWidth = 3;
    let boxColor: string | null = null;
    let boxRadius = 8;
    let boxPadX = 12;
    let boxPadY = 4;
    let scl = 1;
    let lift = 0;
    let alpha = 1;
    let glow = 0;
    let sweep = 1;

    if (active) {
      sweep = p;
      switch (this.motion) {
        case 'pop':
          // spring IN from slightly small — growing past 1.0 is what made a
          // highlighted word reach over its neighbour.
          scl = POP_START_SCALE + (1 - POP_START_SCALE) * p;
          break;
        case 'bounce':
          lift = -8 * (1 - p);
          break;
        case 'fade-slide':
          alpha = 0.15 + 0.85 * p;
          lift = (1 - p) * 8;
          break;
        case 'glow':
          glow = 10 + 5 * Math.sin(t * 10);
          break;
        case 'marker':
          sweep = p;
          break;
        case 'typewriter':
          break;
      }
    } else if (this.motion === 'typewriter') {
      // the word that just appeared fades up in the same 180ms window
      alpha = 0.35 + 0.65 * easeOutCubic((t - w.start) / 0.12);
    }

    const bg = s.backgroundColor && s.backgroundColor !== 'transparent' ? s.backgroundColor : null;

    switch (s.template) {
      case 'ali_abdaal_marker':
        boxColor = active ? s.highlightBg || bg || '#A3E635' : null;
        color = active ? '#000000' : s.textColor || '#FFFFFF';
        strokeColor = active ? null : '#000000';
        break;
      case 'mrbeast_gold':
        strokeWidth = 8;
        color = active ? s.highlightColor || '#FFE600' : '#FFFFFF';
        strokeColor = '#000000';
        break;
      case 'hormozi_viral':
        strokeColor = null;
        color = active ? s.highlightColor || '#00F0FF' : '#FFFFFF';
        if (active) glow = Math.max(glow, 14);
        break;
      case 'shamani_gold_glow':
        // Fiery amber bloom on the active word, dark 3px stroke on all words
        strokeColor = '#18181B';
        strokeWidth = 3;
        color = active ? s.highlightColor || '#FFB800' : '#FFFFFF';
        if (active) glow = Math.max(glow, 18);
        break;
      case 'sunrise_purple_pill':
        // Royal purple pill sweeps behind; neon yellow active text
        boxColor = active ? s.highlightBg || '#7C3AED' : null;
        boxRadius = 8;
        boxPadX = 10;
        boxPadY = 4;
        color = active ? s.highlightColor || '#FACC15' : '#FFFFFF';
        strokeColor = active ? null : '#000000';
        break;
      case 'figuring_out_emerald':
        // Heavy 6px outline; neon green punch reads through colour + outline,
        // not through a 1.2x box that would overlap the next word.
        strokeWidth = 6;
        strokeColor = '#000000';
        color = active ? s.highlightColor || '#22C55E' : '#FFFFFF';
        if (active) glow = Math.max(glow, 8);
        break;
      case 'cyber_magenta_pop':
        strokeColor = null;
        color = active ? s.highlightColor || '#EC4899' : '#FFFFFF';
        if (active) glow = Math.max(glow, 16);
        break;
      case 'frosted_ice':
        strokeColor = null;
        color = active ? s.highlightColor || '#2060F6' : '#FFFFFF';
        if (active) glow = Math.max(glow, 10);
        break;
      default:
        if (active) {
          if (this.motion === 'marker' && bg) {
            boxColor = bg;
            color = '#000000';
            strokeColor = null;
          } else {
            color = s.highlightColor || '#FFE500';
            strokeColor = '#000000';
          }
        }
        break;
    }

    return {
      text: w.text,
      color,
      strokeColor,
      strokeWidth,
      boxColor,
      boxRadius,
      boxPadX,
      boxPadY,
      scale: Math.min(1, scl),
      lift,
      alpha,
      glow,
      sweep,
    };
  }

  /** Burns the Reels-style timeline bar into the frame. Called every frame. */
  private drawProgress(currentTime: number): void {
    if (!this.progressEnabled || this.duration <= 0) return;
    const ctx = this.ctx;
    const h = this.progressHeight;
    const y = this.progressPosition === 'bottom' ? this.canvas.height - h : 0;
    // semi-transparent track
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, y, this.canvas.width, h);
    // animated fill
    const p = Math.min(1, Math.max(0, currentTime / this.duration));
    if (p > 0) {
      ctx.fillStyle = this.progressColor;
      ctx.fillRect(0, y, this.canvas.width * p, h);
    }
  }

  /**
   * The words this frame paints for the active segment at `t`. A segment is
   * either fully painted or, for typewriter motion, revealed word by word in
   * transcript order — always COMPLETE words.
   */
  private paintedItems(ph: PreparedPhrase, t: number): PaintedItem[] {
    const activeIdx = activeWordIndex(ph.words, t);
    const count =
      this.motion === 'typewriter' ? typewriterWordCount(ph.words, t, ph.start) : ph.words.length;
    const out: PaintedItem[] = [];
    for (let i = 0; i < count && i < ph.words.length; i++) {
      const word = ph.words[i];
      const v = this.visual(word, t, i === activeIdx);
      out.push({
        word,
        v,
        active: i === activeIdx,
        cx: this.centerX + word.cx,
        y: word.baseline + clampLift(v.lift, this.scale, ph.maxLift),
      });
    }
    return out;
  }

  /**
   * Dev/QA probe: what ONE frame would render at time t — the active phrase
   * index and its complete word texts. Used to prove the 0-or-1-active-segment
   * invariant and to catch cross-segment concatenation ("PHOTOGRWE MAKE").
   */
  debugFrame(t: number): { index: number; texts: string[] } | null {
    const ph = this.findPhrase(t);
    if (!ph) return null;
    return { index: ph.index, texts: this.paintedItems(ph, t).map((it) => it.v.text) };
  }

  /**
   * Dev/QA probe with geometry: every glyph box this frame paints, in canvas
   * pixels, plus the envelope the renderer is ALLOWED to paint inside (glyph box
   * + its own marker box / outline / halo). QA then verifies that the pixels
   * actually landed inside that envelope — slot arithmetic alone cannot catch a
   * paint-time mistake.
   */
  debugFrameGeometry(t: number): {
    index: number;
    texts: string[];
    fontSize: number;
    rects: CaptionWordRect[];
    /** the background pill, when the style paints one */
    block: { x0: number; x1: number; y0: number; y1: number } | null;
  } | null {
    const ph = this.findPhrase(t);
    if (!ph) return null;
    const items = this.paintedItems(ph, t);
    const rects: CaptionWordRect[] = items.map(({ word, v, active, cx, y }) => {
      const halfW = (word.width * v.scale) / 2;
      const outset = Math.max(
        v.boxColor ? Math.min(v.boxPadX * this.scale, ph.outsetLimit) : 0,
        v.strokeColor ? Math.min((v.strokeWidth * this.scale) / 2, ph.outsetLimit) : 0,
        v.glow > 0 ? Math.min(v.glow * this.scale, ph.haloLimit) : 0,
      );
      const padY = Math.min(v.boxPadY * this.scale, ph.fontSize * 0.3);
      const glyphHalf = ((this.ascent + this.descent) * ph.fontSize * v.scale) / 2;
      const halfH = Math.max(glyphHalf, v.boxColor ? (ph.fontSize + padY * 2) / 2 : 0);
      const midY = y - ((this.ascent - this.descent) * ph.fontSize * v.scale) / 2;
      // +2px: glyph ink legitimately overhangs its advance width by a hair
      // (side bearings, round-joined outlines). A shifted word is off by
      // hundreds of pixels, so this tolerance cannot hide the real bug.
      return {
        text: v.text,
        x0: cx - halfW,
        x1: cx + halfW,
        y0: y - this.ascent * ph.fontSize * v.scale,
        y1: y + this.descent * ph.fontSize * v.scale,
        paint0: cx - halfW - outset - 2,
        paint1: cx + halfW + outset + 2,
        paintTop: midY - halfH - outset - 2,
        paintBottom: midY + halfH + outset + 2,
        slot0: cx - word.width / 2 - ph.gapX / 2,
        slot1: cx + word.width / 2 + ph.gapX / 2,
        active,
      };
    });
    const padX = 16 * this.scale;
    const padY = 10 * this.scale;
    return {
      index: ph.index,
      texts: items.map((it) => it.v.text),
      fontSize: ph.fontSize,
      rects,
      block: this.pillColor
        ? {
            x0: this.centerX - ph.blockWidth / 2 - padX,
            x1: this.centerX + ph.blockWidth / 2 + padX,
            y0: this.anchorY - ph.blockHeight / 2 - padY,
            y1: this.anchorY + ph.blockHeight / 2 + padY,
          }
        : null,
    };
  }

  /** Draws one frame. ~O(words in current phrase), no allocations beyond visuals. */
  drawFrame(currentTime: number): void {
    const ctx = this.ctx;
    this.drawProgress(currentTime);
    const ph = this.findPhrase(currentTime);
    if (!ph) return;

    ctx.font = captionFontString(this.styles, ph.fontSize);
    // Words are positioned by their CENTRE (that is what the frozen slots
    // store), so the text must be aligned to it. With the default 'start'
    // alignment every word was painted half its own width too far right: the
    // glyphs of neighbours merged into each other and the last word of a line
    // ran off the frame and was cut ("ROLLERCOAS", "MAYB?THE").
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    const items = this.paintedItems(ph, currentTime);
    if (items.length === 0) return;

    if (this.pillColor) {
      ctx.fillStyle = this.pillColor;
      ctx.beginPath();
      const padX = 16 * this.scale;
      const padY = 10 * this.scale;
      roundRectPath(
        ctx,
        this.centerX - ph.blockWidth / 2 - padX,
        this.anchorY - ph.blockHeight / 2 - padY,
        ph.blockWidth + padX * 2,
        ph.blockHeight + padY * 2,
        12 * this.scale,
      );
      ctx.fill();
    }

    // Pass 1 — decorations (marker boxes, glow halos). Painting every
    // decoration for the whole block BEFORE any glyph means a halo can never
    // land on top of the next word's letters, which is what read as "MAYB?THE".
    for (const it of items) {
      const { word, v } = it;
      if (!v.boxColor || v.sweep <= 0) continue;
      const padX = Math.min(v.boxPadX * this.scale, ph.outsetLimit);
      const padY = Math.min(v.boxPadY * this.scale, ph.fontSize * 0.3);
      const bw = (word.width + padX * 2) * v.sweep;
      const bh = ph.fontSize + padY * 2;
      // Centre the box on the letters, not on the baseline (the DOM preview
      // centres it on the word's text box; baseline-centring sat too low).
      const midY = it.y - ((this.ascent - this.descent) * ph.fontSize * v.scale) / 2;
      ctx.save();
      ctx.globalAlpha = v.alpha;
      ctx.fillStyle = v.boxColor;
      ctx.beginPath();
      roundRectPath(
        ctx,
        it.cx - word.width / 2 - padX,
        midY - bh / 2,
        bw,
        bh,
        v.boxRadius * this.scale,
      );
      ctx.fill();
      ctx.restore();
    }

    // Pass 2 — glyphs, each in its frozen slot.
    for (const it of items) {
      const { v } = it;
      ctx.save();
      ctx.globalAlpha = v.alpha;
      ctx.translate(it.cx, it.y);
      ctx.scale(v.scale, v.scale);

      if (v.glow > 0) {
        const halo = Math.min(v.glow * this.scale, ph.haloLimit);
        fastGlow(ctx, v.text, 0, 0, Math.max(1, halo));
      }

      if (v.strokeColor && v.strokeWidth > 0) {
        const half = Math.min((v.strokeWidth * this.scale) / 2, ph.outsetLimit);
        ctx.lineWidth = half * 2;
        ctx.strokeStyle = v.strokeColor;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(v.text, 0, 0);
      }

      ctx.fillStyle = v.color;
      ctx.fillText(v.text, 0, 0);
      ctx.restore();
    }
  }
}

function clampLift(liftBase: number, scale: number, maxLift: number): number {
  const px = liftBase * scale;
  return Math.max(-maxLift, Math.min(maxLift, px));
}
