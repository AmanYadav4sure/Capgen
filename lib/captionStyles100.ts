export interface CaptionPreset {
  id: string;
  name: string;
  category: 'Viral' | 'Clean' | 'Neon' | 'Retro' | 'Minimal';
  fontFamily: string;
  textColor: string;
  highlightColor: string;
  highlightBoxColor?: string;
  animationType:
    | 'pop'
    | 'box-sweep'
    | 'bounce'
    | 'glow'
    | 'fade-rise'
    | 'shake'
    | 'word-flash'
    | 'ghost'
    | 'typewriter'
    | 'sticker';
  strokeWidth: number;
  strokeColor: string;
  shadow: string;
}

const ANIMATION_TYPES: (
  | 'pop'
  | 'box-sweep'
  | 'bounce'
  | 'glow'
  | 'fade-rise'
  | 'shake'
  | 'word-flash'
  | 'ghost'
  | 'typewriter'
  | 'sticker'
)[] = [
  'pop',
  'box-sweep',
  'bounce',
  'glow',
  'fade-rise',
  'shake',
  'word-flash',
  'ghost',
  'typewriter',
  'sticker',
];

const THEMES = [
  { name: 'MrBeast Gold', font: 'Anton', text: '#FFFFFF', highlight: '#FFE500', stroke: 4, strokeColor: '#000000', cat: 'Viral' },
  { name: 'Hormozi Emerald', font: 'Montserrat', text: '#FFFFFF', highlight: '#10B981', stroke: 3, strokeColor: '#000000', cat: 'Viral' },
  { name: 'Cyber Cyan', font: 'Outfit', text: '#FFFFFF', highlight: '#00F0FF', stroke: 0, strokeColor: 'transparent', cat: 'Neon' },
  { name: 'Magenta Synth', font: 'Outfit', text: '#FFFFFF', highlight: '#FF007F', stroke: 0, strokeColor: 'transparent', cat: 'Neon' },
  { name: 'Ali Abdaal Lime', font: 'Plus Jakarta Sans', text: '#FFFFFF', highlight: '#000000', box: '#A3E635', stroke: 0, strokeColor: 'transparent', cat: 'Clean' },
  { name: 'Pastel Lavender', font: 'Poppins', text: '#1E293B', highlight: '#7C3AED', box: '#DDD6FE', stroke: 0, strokeColor: 'transparent', cat: 'Clean' },
  { name: 'Anime Crimson', font: 'Titan One', text: '#FFDD00', highlight: '#FF1100', stroke: 4, strokeColor: '#000000', cat: 'Viral' },
  { name: 'Forbes Gold', font: 'Playfair Display', text: '#F5E6C8', highlight: '#EAB308', stroke: 0, strokeColor: 'transparent', cat: 'Minimal' },
  { name: 'Retro 80s Yellow', font: 'Special Elite', text: '#FACC15', highlight: '#FFFFFF', box: '#111111', stroke: 2, strokeColor: '#000000', cat: 'Retro' },
  { name: 'Terminal Green', font: 'Courier Prime', text: '#22C55E', highlight: '#FFFFFF', box: '#0A0A0A', stroke: 0, strokeColor: 'transparent', cat: 'Retro' },
];

export function generate100Presets(): CaptionPreset[] {
  const presets: CaptionPreset[] = [];

  THEMES.forEach((theme, tIdx) => {
    ANIMATION_TYPES.forEach((anim) => {
      const id = `preset_${tIdx + 1}_${anim}`;
      const animName = anim.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      presets.push({
        id,
        name: `${theme.name} · ${animName}`,
        category: theme.cat as any,
        fontFamily: theme.font,
        textColor: theme.text,
        highlightColor: theme.highlight,
        highlightBoxColor: (theme as any).box,
        animationType: anim,
        strokeWidth: theme.stroke,
        strokeColor: theme.strokeColor,
        shadow: anim === 'glow' ? `0 0 16px ${theme.highlight}` : '0 4px 10px rgba(0,0,0,0.8)',
      });
    });
  });

  return presets;
}
