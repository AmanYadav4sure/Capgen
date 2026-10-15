'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { PREMIUM_STYLES } from '@/lib/premiumStyles';

export type StreamClip = {
  id: string;
  src?: string;
  image?: string;
  caption: string;
  label: string;
  accent: string;
  presetId?: string;
  /** Seconds into the clip the card opens on, so a reused file reads as different footage. */
  start?: number;
  /** object-position, used to crop a different slice of the frame. */
  focus?: string;
  /** transform-origin for stills, used to zoom away from baked-in text on stock frames. */
  origin?: string;
};

const WORD_STEP = 0.33;
const WORD_TAIL = 0.7;
// Vertical stagger between the two lanes, as a fraction of card width. Kept small so the lower
// lane's caption stays above the fold; must stay in sync with the shell height in globals.css.
const LANE_OFFSET = 0.12;
const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;
const gapFor = (width: number) => clamp(width * 0.046, 46, 70);
// Depth is re-quantised so a card's raster scale changes ~30 times per crossing instead of
// every frame; only the translate component moves on the hot path.
const quantise = (value: number, step: number) => (Math.round(value / step) * step).toFixed(4);

type Card = {
  el: HTMLElement;
  words: HTMLElement[];
  fill: HTMLElement | null;
  video: HTMLVideoElement | null;
  base: number;
  laneY: number;
  bobPhase: number;
  bobRate: number;
  bobAmp: number;
  clipLen: number;
  local: number;
  activeWord: number;
  painted: boolean;
  move: string;
  rot: string;
  deep: string;
  pct: string;
  dim: boolean;
  inBand: boolean;
  playing: boolean;
  hovered: boolean;
};

export default function CaptionStream({ clips }: { clips: StreamClip[] }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const distRef = useRef(0);
  const [slots, setSlots] = useState(clips.length + 1);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sync = () => {
      const width = root.clientWidth;
      const cardW =
        root.querySelector<HTMLElement>('.caption-phone')?.getBoundingClientRect().width || 180;
      // A seamless loop needs span >= width + 2 * pitch; anything beyond that is invisible layers.
      const needed = Math.ceil(width / (cardW + gapFor(width))) + 2;
      const next = Math.max(4, Math.min(clips.length, needed));
      setSlots((prev) => (prev === next ? prev : next));
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(root);
    return () => observer.disconnect();
  }, [clips.length]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('.caption-phone'));
    if (!els.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = root.clientWidth;
    let height = root.clientHeight;
    let cardW = els[0].getBoundingClientRect().width;
    let pitch = cardW + gapFor(width);
    let speed = pitch / 3.6;

    const cards: Card[] = els.map((el, index) => ({
      el,
      words: Array.from(el.querySelectorAll<HTMLElement>('.caption-word')),
      fill: el.querySelector<HTMLElement>('.video-progress i'),
      video: el.querySelector('video'),
      base: index * pitch,
      laneY: (index % 2 === 0 ? -1 : 1) * cardW * LANE_OFFSET,
      bobPhase: index * 1.83,
      bobRate: 0.82 + (index % 3) * 0.17,
      bobAmp: cardW * 0.024,
      clipLen: 6.5 + (index % 4) * 1.9,
      local: index * 0.74,
      activeWord: -1,
      painted: false,
      move: '',
      rot: '',
      deep: '',
      pct: '',
      dim: false,
      inBand: false,
      playing: false,
      hovered: false,
    }));

    let running = true;

    const paint = (dt: number) => {
      if (cardW < 40) return;
      const span = cards.length * pitch;
      const halfW = width / 2;
      const baseY = (height - (cardW * 16) / 9) / 2;
      for (const card of cards) {
        const x = ((((card.base + distRef.current) % span) + span) % span) - pitch;
        const u = clamp((x + cardW / 2 - halfW) / halfW, -1, 1);
        const edge = Math.abs(u);
        const ease = edge * edge * (3 - 2 * edge);

        if (!card.hovered) card.local += dt;
        const bob = Math.sin(card.local * card.bobRate + card.bobPhase) * card.bobAmp;

        const offScreen = x < -cardW * 1.6 || x > width + cardW * 0.6;
        // A card that has never been painted must still get its first position or it sits at the
        // CSS 0,0 over the hero copy. Depth is written as independent translate/rotate/scale
        // longhands: a per-frame `rotate()` inside one transform string costs ~30fps because the
        // layer's screen coverage changes every frame, whereas a translate-only change is composited.
        if (!offScreen || !card.painted) {
          card.painted = true;
          const nextMove = `${x.toFixed(1)}px ${(baseY + card.laneY + bob).toFixed(1)}px`;
          if (nextMove !== card.move) {
            card.move = nextMove;
            card.el.style.translate = nextMove;
          }
          const nextRot = `${quantise(5 * u, 0.25)}deg`;
          if (nextRot !== card.rot) {
            card.rot = nextRot;
            card.el.style.rotate = nextRot;
          }
          const nextDeep = quantise(1 - 0.12 * ease, 1 / 256);
          if (nextDeep !== card.deep) {
            card.deep = nextDeep;
            card.el.style.scale = nextDeep;
            card.el.style.opacity = quantise(1 - 0.35 * ease, 1 / 128);
          }
        }

        const cycle = card.words.length * WORD_STEP + WORD_TAIL;
        const phase = card.local % cycle;
        const word = phase < card.words.length * WORD_STEP ? Math.floor(phase / WORD_STEP) : -1;
        if (word !== card.activeWord) {
          if (card.activeWord >= 0) card.words[card.activeWord]?.classList.remove('active-word');
          card.words[word]?.classList.add('active-word');
          card.activeWord = word;
        }
        if (!offScreen && card.fill) {
          const pct = quantise((card.local % card.clipLen) / card.clipLen, 1 / 160);
          if (pct !== card.pct) {
            card.pct = pct;
            card.fill.style.scale = `${pct} 1`;
          }
        }

        const dim = edge > 0.72;
        if (dim !== card.dim) {
          card.dim = dim;
          card.el.classList.toggle('stream-dim', dim);
        }
        card.inBand = edge < 0.55 && !offScreen;
        const shouldPlay = card.inBand && running && !card.hovered;
        if (card.video && shouldPlay !== card.playing) {
          card.playing = shouldPlay;
          if (shouldPlay) void card.video.play().catch(() => undefined);
          else card.video.pause();
        }
      }
    };

    const cardOf = (target: EventTarget | null) =>
      cards[Number((target as HTMLElement)?.dataset?.streamSlot)];

    const onEnter = (event: Event) => {
      const card = cardOf(event.currentTarget);
      if (card) card.hovered = true;
    };
    const onLeave = (event: Event) => {
      const card = cardOf(event.currentTarget);
      if (card) card.hovered = false;
    };
    const onSeek = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      const start = Number(video.dataset.start);
      if (Number.isFinite(start) && start > 0) video.currentTime = start;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (onScreen) start();
    };
    const remeasure = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      cardW = els[0].getBoundingClientRect().width;
      pitch = cardW + gapFor(width);
      speed = pitch / 3.6;
      cards.forEach((card, index) => {
        card.base = index * pitch;
        card.laneY = (index % 2 === 0 ? -1 : 1) * cardW * LANE_OFFSET;
        card.bobAmp = cardW * 0.024;
      });
    };

    els.forEach((el) => {
      el.addEventListener('pointerenter', onEnter);
      el.addEventListener('pointerleave', onLeave);
    });
    const videos = Array.from(root.querySelectorAll<HTMLVideoElement>('video[data-start]'));
    videos.forEach((video) => video.addEventListener('loadedmetadata', onSeek));
    window.addEventListener('resize', remeasure);
    document.addEventListener('visibilitychange', onVisibility);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduced) distRef.current += speed * dt;
      paint(reduced ? 0 : dt);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || reduced) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      running = false;
      for (const card of cards) {
        if (card.video && !card.video.paused) card.video.pause();
        card.playing = false;
      }
    };

    paint(0);
    let onScreen = true;
    const viewport = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && !document.hidden) start();
        else stop();
      },
      { rootMargin: '160px' },
    );
    viewport.observe(root);

    return () => {
      stop();
      viewport.disconnect();
      els.forEach((el) => {
        el.removeEventListener('pointerenter', onEnter);
        el.removeEventListener('pointerleave', onLeave);
      });
      videos.forEach((video) => video.removeEventListener('loadedmetadata', onSeek));
      window.removeEventListener('resize', remeasure);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [slots, clips]);

  return (
    <div
      className="caption-phone-track"
      ref={rootRef}
      aria-label="Illustrative caption style samples"
    >
      {Array.from({ length: slots }).map((_, index) => {
        const clip = clips[index % clips.length];
        const preset = PREMIUM_STYLES.find((style) => style.id === clip.presetId);
        return (
          <article
            className="gsap-reel-phone caption-phone"
            key={`${clip.id}-${index}`}
            data-stream-slot={index}
            style={
              {
                '--stream-slot': index,
                '--initial-lane': index % 2 ? 0.241 : 0.001,
              } as React.CSSProperties
            }
          >
            <div className="phone-float">
              <div className="phone-rim">
                <div className="phone-speaker" aria-hidden="true" />
                <div className="phone-screen">
                  {clip.src ? (
                    <video
                      src={clip.src}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      data-start={clip.start ?? 0}
                      style={{ objectPosition: clip.focus ?? 'center' }}
                    />
                  ) : (
                    <Image
                      src={clip.image ?? '/stream-creator.jpg'}
                      alt=""
                      width={540}
                      height={960}
                      sizes="(max-width: 767px) 190px, (max-width: 1100px) 210px, 204px"
                      fetchPriority={index === 1 || index === 2 ? 'high' : 'auto'}
                      loading={index < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="stream-still"
                      style={{
                        objectPosition: clip.focus ?? 'center',
                        transformOrigin: clip.origin,
                      }}
                    />
                  )}
                  <div className="video-vignette" />
                  <span className="video-label">{clip.label}</span>
                  <div
                    className="video-caption"
                    data-preset={preset?.id}
                    style={
                      {
                        '--caption-accent': clip.accent,
                        '--sample-word-color': preset?.highlightColor,
                        '--sample-word-bg': preset?.highlightBg || 'transparent',
                        '--sample-word-shadow':
                          preset?.animation === 'glow'
                            ? `0 0 10px ${preset.highlightColor}`
                            : '0 1px 3px rgba(0,0,0,.8)',
                        fontFamily: preset ? `'${preset.fontFamily}', sans-serif` : undefined,
                        color: preset?.textColor,
                      } as React.CSSProperties
                    }
                  >
                    {clip.caption.split(' ').map((word, wordIndex, all) => (
                      <React.Fragment key={`${word}-${wordIndex}`}>
                        <span className="caption-word">{word}</span>
                        {/* The space must live outside the inline-block span: inside, it is
                            stripped as trailing whitespace and the words render jammed together. */}
                        {wordIndex === all.length - 1 ? null : ' '}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="video-controls">
                    <div className="video-progress">
                      <i />
                    </div>
                    <div className="mini-audio-wave" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
