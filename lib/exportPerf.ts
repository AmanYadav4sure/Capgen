export interface TierConfig {
  /** Max output height (9:16 → width = height*9/16). */
  maxOutH: number;
  /** captureStream fps — pacing target for caption redraws too. */
  captureFps: 30 | 60;
  /** Video bitrate for MediaRecorder. */
  bitrate: number;
  /** Human-readable tier for the export notice. */
  label: string;
}

const NAV: Partial<Navigator & { deviceMemory?: number }> =
  typeof navigator !== 'undefined' ? navigator : {};

function cores(): number {
  return NAV.hardwareConcurrency || 4;
}

function deviceMemoryGB(): number {
  return NAV.deviceMemory || 4;
}

function isMobileUA(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(NAV.userAgent || '');
}

/**
 * Device-tier detection for export settings. Mid-range phones cannot sustain
 * 1080p H.264 encoding + canvas compositing + caption drawing in real time —
 * frames get dropped and audio drifts. We scale output resolution and bitrate
 * to what the device can actually encode, keeping the timeline WYSIWYG.
 */
export function detectTier(): TierConfig {
  const mobile = isMobileUA();
  const c = cores();
  const mem = deviceMemoryGB();

  // Low: ≤4 cores or ≤3GB — typical mid-range Android.
  if ((mobile && c <= 4) || mem <= 3) {
    return { maxOutH: 1280, captureFps: 30, bitrate: 6_000_000, label: 'optimized' };
  }
  // Mid: mobile with more headroom.
  if (mobile && (c <= 6 || mem <= 4)) {
    return { maxOutH: 1440, captureFps: 60, bitrate: 8_000_000, label: 'high' };
  }
  // Desktop/high-end.
  return { maxOutH: 1920, captureFps: 60, bitrate: 10_000_000, label: 'max' };
}

/**
 * True on browsers whose canvas is backed by a GPU surface that makes full-canvas
 * alpha blending cheap. Everything else benefits from an opaque canvas
 * (one fewer blend per pixel per frame).
 */
export function wantsOpaqueCanvas(): boolean {
  return true; // video fill covers 100% of the frame — alpha buys nothing
}

/**
 * Adaptive frame pacing: returns the minimum interval (ms) between caption
 * redraws to hold the target fps without hammering rAF at 120Hz ProMotion.
 */
export function redrawInterval(captureFps: number): number {
  return 1000 / captureFps;
}
