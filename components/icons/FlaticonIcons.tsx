import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * Flaticon Premium SVG Vector Icons Suite for Capgen
 */

// 👑 Flaticon Crown (Pro / Premium Badge)
export function FlaticonCrown({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill="url(#flaticon-crown-grad)" stroke="none" />
      <path d="M3 20h18v2H3z" fill={color} stroke="none" />
      <defs>
        <linearGradient id="flaticon-crown-grad" x1="2" y1="4" x2="22" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 🔥 Flaticon Fire (Viral Retention Style)
export function FlaticonFire({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 2C10.5 4.5 9 6.8 9 9.5C9 12 10.5 13.5 12 14.5C13.5 13.5 15 12 15 9.5C15 6.8 13.5 4.5 12 2Z"
        fill="#EF4444"
      />
      <path
        d="M12 6C9 10 6 12.5 6 16.5C6 19.5 8.7 22 12 22C15.3 22 18 19.5 18 16.5C18 12.5 15 10 12 6Z"
        fill="url(#flaticon-fire-grad)"
      />
      <path
        d="M12 14C10.8 16 10 17.2 10 18.5C10 19.6 10.9 20.5 12 20.5C13.1 20.5 14 19.6 14 18.5C14 17.2 13.2 16 12 14Z"
        fill="#FDE047"
      />
      <defs>
        <linearGradient id="flaticon-fire-grad" x1="6" y1="6" x2="18" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" />
          <stop offset="1" stopColor="#EF4444" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ✨ Flaticon Magic AI (Deepgram Nova-2 AI Transcription)
export function FlaticonMagic({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 2L14.5 7.5L20 10L14.5 12.5L12 18L9.5 12.5L4 10L9.5 7.5L12 2Z"
        fill="url(#flaticon-magic-grad)"
      />
      <path
        d="M19 16L20.25 18.75L23 20L20.25 21.25L19 24L17.75 21.25L15 20L17.75 18.75L19 16Z"
        fill="#38BDF8"
      />
      <path
        d="M5 2L5.8 3.8L7.6 4.6L5.8 5.4L5 7.2L4.2 5.4L2.4 4.6L4.2 3.8L5 2Z"
        fill="#A855F7"
      />
      <defs>
        <linearGradient id="flaticon-magic-grad" x1="4" y1="2" x2="20" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 💬 Flaticon Subtitles (9:16 Caption Box)
export function FlaticonSubtitles({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <rect x="2" y="4" width="20" height="16" rx="4" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
      <rect x="6" y="9" width="12" height="2.5" rx="1.25" fill="#FFE500" />
      <rect x="6" y="13.5" width="8" height="2" rx="1" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

// ⚡ Flaticon Lightning (Fast Rendering / Deepgram)
export function FlaticonBolt({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill="url(#flaticon-bolt-grad)"
        stroke="#EAB308"
        strokeWidth="0.5"
      />
      <defs>
        <linearGradient id="flaticon-bolt-grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FACC15" />
          <stop offset="1" stopColor="#EAB308" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 📱 Flaticon Mobile Reel Frame (9:16 Shorts)
export function FlaticonMobileVideo({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <rect x="6" y="2" width="12" height="20" rx="3" fill="#0F172A" stroke="#3B82F6" strokeWidth="1.5" />
      <circle cx="12" cy="5" r="0.75" fill="#64748B" />
      <rect x="8" y="14" width="8" height="3" rx="1" fill="#FFE500" />
    </svg>
  );
}
