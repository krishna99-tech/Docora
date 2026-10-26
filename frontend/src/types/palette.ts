export type ColorPaletteId = 'ocean' | 'violet' | 'emerald' | 'sunset' | 'aurora' | 'monochrome';

export interface ColorPaletteConfig {
  id: ColorPaletteId;
  name: string;
  category: 'Analogous' | 'Complementary' | 'Triadic' | 'Tetradic' | 'Monochrome';
  description: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  previewGradient: string;
}

export const COLOR_PALETTES: ColorPaletteConfig[] = [
  {
    id: 'ocean',
    name: 'Electric Ocean',
    category: 'Analogous',
    description: 'DocAutomate brand palette blending electric blue and cyan',
    primaryHex: '#0066FF',
    secondaryHex: '#00C6FF',
    accentHex: '#38BDF8',
    previewGradient: 'linear-gradient(135deg, #0066FF 0%, #00C6FF 100%)',
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    category: 'Analogous',
    description: 'Deep royal purple and electric indigo high-tech scheme',
    primaryHex: '#7C3AED',
    secondaryHex: '#A855F7',
    accentHex: '#C084FC',
    previewGradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
  },
  {
    id: 'emerald',
    name: 'Emerald Mint',
    category: 'Complementary',
    description: 'FinTech green and deep teal symbolizing growth and verified revenue',
    primaryHex: '#10B981',
    secondaryHex: '#0D9488',
    accentHex: '#34D399',
    previewGradient: 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
  },
  {
    id: 'sunset',
    name: 'Sunset Ember',
    category: 'Triadic',
    description: 'Warm coral, tangerine orange, and radiant rose hues',
    primaryHex: '#EA580C',
    secondaryHex: '#F43F5E',
    accentHex: '#FB923C',
    previewGradient: 'linear-gradient(135deg, #EA580C 0%, #F43F5E 100%)',
  },
  {
    id: 'aurora',
    name: 'Cyber Aurora',
    category: 'Tetradic',
    description: 'High-energy neon cyan, magenta, and fluorescent violet',
    primaryHex: '#06B6D4',
    secondaryHex: '#EC4899',
    accentHex: '#8B5CF6',
    previewGradient: 'linear-gradient(135deg, #06B6D4 0%, #EC4899 100%)',
  },
  {
    id: 'monochrome',
    name: 'Obsidian Slate',
    category: 'Monochrome',
    description: 'Refined neutral monochrome for executive clarity',
    primaryHex: '#18181B',
    secondaryHex: '#52525B',
    accentHex: '#71717A',
    previewGradient: 'linear-gradient(135deg, #18181B 0%, #52525B 100%)',
  },
];
