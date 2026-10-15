export const CREATOR_FONTS = [
  { name: 'Anton', family: "'Anton', sans-serif", category: 'Viral' },
  { name: 'Bebas Neue', family: "'Bebas Neue', sans-serif", category: 'Viral' },
  { name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'Modern' },
  { name: 'Outfit', family: "'Outfit', sans-serif", category: 'Modern' },
  { name: 'Poppins', family: "'Poppins', sans-serif", category: 'Modern' },
  { name: 'Inter', family: "'Inter', sans-serif", category: 'Modern' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", category: 'Editorial' },
  { name: 'Courier Prime', family: "'Courier Prime', monospace", category: 'Retro' },
  { name: 'Kalam (Nepali/Hindi)', family: "'Kalam', cursive", category: 'Devanagari' },
].map((font) => ({ ...font, value: font.family.split("'")[1] }));
