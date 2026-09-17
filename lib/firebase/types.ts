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
};
