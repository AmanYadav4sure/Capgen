/** Shared application types; no database or authentication SDK imports. */
export interface CaptionWord {
  word: string;
  start: number;
  end: number;
}

export type CaptionTemplate =
  | 'prime'
  | 'paper_ii'
  | 'elevate'
  | 'prism_pro'
  | 'mrbeast_gold'
  | 'hormozi_punch'
  | 'word_flash'
  | 'fire_alert'
  | 'kinetic_punch'
  | 'ali_abdaal_marker'
  | 'podcast_subtle'
  | 'dark_pill_minimal'
  | 'luxury_editorial'
  | 'terminal_typewriter'
  | 'cyber_neon'
  | 'bouncy_bubble'
  | 'retro_vhs'
  | 'rainbow_chroma'
  | 'sticker_cutout'
  | 'mrbeast'
  | 'bumblebee'
  // Homepage viral presets
  | 'ali_abdaal_marker'
  | 'mrbeast_gold'
  | 'hormozi_viral'
  | 'frosted_ice'
  // Viral podcast presets
  | 'shamani_gold_glow'
  | 'sunrise_purple_pill'
  | 'figuring_out_emerald'
  | 'cyber_magenta_pop'
  // lib/premiumStyles.ts preset ids (assigned to styles.template on apply)
  | 'tidemark'
  | 'sunset_glow'
  | 'frost_glass'
  | 'versely_neon'
  | 'versely_bold'
  | 'versely_glow'
  | 'cyberpunk_glitch'
  | 'hyper_red'
  | 'emerald_beast'
  | 'electric_violet'
  | 'typewriter'
  | 'matrix_green'
  | 'golden_hour'
  | 'clean_minimal'
  | 'tokyo_drift'
  // Legacy aliases
  | 'Hormozi Punch'
  | 'MrBeast Energy'
  | 'Karaoke Pop'
  | 'Ali Abdaal Clean'
  | 'Neon Cyber'
  | 'Editorial Serif'
  | 'Podcast Punch'
  | 'Soft Creator';

export type AspectRatio = '9:16' | '1:1' | '16:9';

export interface StyleSettings {
  template: CaptionTemplate;
  highlightColor: string;
  textColor: string;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
  position: 'bottom' | 'center' | 'top';
  uppercase: boolean;
  maxWordsPerScreen: number;
  aspectRatio: AspectRatio;
  captionYPercent?: number; // 0 to 100
  captionXPercent?: number; // 0 to 100
  animationType?: 'pop' | 'marker' | 'typewriter' | 'glow' | 'fade-slide' | 'bounce';
  highlightBg?: string; // marker/box sweep fill behind the active word
  wordsPerScreen?: number; // chunk size: 1 (Hormozi), 3 (podcast), 5 (sentence)
  progressBarEnabled?: boolean;
  progressBarColor?: string;
  progressBarHeight?: number; // px at export scale (4-12)
  progressBarPosition?: 'bottom' | 'top';
}

export interface Project {
  id: string;
  userId?: string | null;
  title: string;
  videoUrl?: string | null;
  transcriptText?: string;
  words: CaptionWord[];
  styleSettings: StyleSettings;
  hasDeductedCredit?: boolean;
  createdAt?: string;
  updatedAt?: string;
  revision?: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
  plan?: string;
  isPro?: boolean;
}

export const DEFAULT_STYLE_SETTINGS: StyleSettings = {
  template: 'prime',
  highlightColor: '#FFE500', // Yellow
  textColor: '#ffffff',
  backgroundColor: 'transparent',
  fontSize: 28,
  fontFamily: 'Anton',
  position: 'bottom',
  uppercase: true,
  maxWordsPerScreen: 3,
  aspectRatio: '9:16',
  captionYPercent: 72,
  captionXPercent: 50,
  wordsPerScreen: 3,
  progressBarEnabled: false,
  progressBarColor: '#2060F6',
  progressBarHeight: 6,
  progressBarPosition: 'bottom',
};
