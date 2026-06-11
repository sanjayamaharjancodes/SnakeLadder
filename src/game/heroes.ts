// Manga-chibi hero roster. Everything is vector-drawn; these configs drive ChibiHero.tsx.

export type HairStyle =
  | 'spiky'
  | 'scarf-ninja'
  | 'twin-tails'
  | 'witch-hat'
  | 'topknot'
  | 'bob'
  | 'bald'
  | 'long'
  | 'laurel'
  | 'winged-helm'
  | 'wizard'
  | 'turban'
  | 'fox-ears'
  | 'feather-cap'
  | 'monkey-king'
  | 'mermaid';

export type HeroSet = 'classic' | 'myth';

export interface Hero {
  id: string;
  name: string;
  /** roster group shown in the lobby */
  set: HeroSet;
  /** UI theme color (chips, rings, glow) */
  color: string;
  colorDark: string;
  skin: string;
  hair: string;
  hairShade: string;
  eye: string;
  outfit: string;
  outfitShade: string;
  accent: string;
  style: HairStyle;
}

export const HEROES: Hero[] = [
  {
    id: 'kaito',
    name: 'Kaito',
    set: 'classic',
    color: '#38BDF8',
    colorDark: '#0C4A6E',
    skin: '#FFD9B3',
    hair: '#1E2A45',
    hairShade: '#0F1730',
    eye: '#0EA5E9',
    outfit: '#243B6B',
    outfitShade: '#16264A',
    accent: '#E11D48',
    style: 'scarf-ninja',
  },
  {
    id: 'taro',
    name: 'Taro',
    set: 'classic',
    color: '#FB923C',
    colorDark: '#7C2D12',
    skin: '#FFD9B3',
    hair: '#FCD34D',
    hairShade: '#D97706',
    eye: '#16A34A',
    outfit: '#F97316',
    outfitShade: '#C2410C',
    accent: '#2563EB',
    style: 'spiky',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    set: 'classic',
    color: '#F472B6',
    colorDark: '#9D174D',
    skin: '#FFE3C9',
    hair: '#F9A8D4',
    hairShade: '#EC4899',
    eye: '#DB2777',
    outfit: '#FDF2F8',
    outfitShade: '#FBCFE8',
    accent: '#F43F5E',
    style: 'twin-tails',
  },
  {
    id: 'ryu',
    name: 'Ryu',
    set: 'classic',
    color: '#F87171',
    colorDark: '#7F1D1D',
    skin: '#F5C99B',
    hair: '#27272A',
    hairShade: '#111113',
    eye: '#92400E',
    outfit: '#991B1B',
    outfitShade: '#601414',
    accent: '#FBBF24',
    style: 'topknot',
  },
  {
    id: 'luna',
    name: 'Luna',
    set: 'classic',
    color: '#A78BFA',
    colorDark: '#4C1D95',
    skin: '#FFE3C9',
    hair: '#7C3AED',
    hairShade: '#5B21B6',
    eye: '#8B5CF6',
    outfit: '#312E81',
    outfitShade: '#1E1B4B',
    accent: '#FCD34D',
    style: 'witch-hat',
  },
  {
    id: 'mei',
    name: 'Mei',
    set: 'classic',
    color: '#4ADE80',
    colorDark: '#14532D',
    skin: '#FFD9B3',
    hair: '#34D399',
    hairShade: '#059669',
    eye: '#0D9488',
    outfit: '#365314',
    outfitShade: '#1A2E05',
    accent: '#A3E635',
    style: 'bob',
  },
  {
    id: 'goro',
    name: 'Goro',
    set: 'classic',
    color: '#FBBF24',
    colorDark: '#78350F',
    skin: '#E8B98A',
    hair: '#3F3F46',
    hairShade: '#27272A',
    eye: '#57534E',
    outfit: '#B45309',
    outfitShade: '#7C3A0E',
    accent: '#FEF3C7',
    style: 'bald',
  },
  {
    id: 'rei',
    name: 'Rei',
    set: 'classic',
    color: '#94A3B8',
    colorDark: '#334155',
    skin: '#FFE3C9',
    hair: '#E2E8F0',
    hairShade: '#94A3B8',
    eye: '#475569',
    outfit: '#1E293B',
    outfitShade: '#0F172A',
    accent: '#38BDF8',
    style: 'long',
  },
  // ---- myths & tales ----
  {
    id: 'herc',
    name: 'Herc',
    set: 'myth',
    color: '#B45309',
    colorDark: '#5B2A09',
    skin: '#C98A52',
    hair: '#6B3F23',
    hairShade: '#4A2A15',
    eye: '#92400E',
    outfit: '#A16207',
    outfitShade: '#6E430A',
    accent: '#FCD34D',
    style: 'laurel',
  },
  {
    id: 'freya',
    name: 'Freya',
    set: 'myth',
    color: '#7DD3FC',
    colorDark: '#1D4E89',
    skin: '#FFE3C9',
    hair: '#FDE68A',
    hairShade: '#F59E0B',
    eye: '#2563EB',
    outfit: '#94A3B8',
    outfitShade: '#475569',
    accent: '#FCD34D',
    style: 'winged-helm',
  },
  {
    id: 'merlin',
    name: 'Merlin',
    set: 'myth',
    color: '#818CF8',
    colorDark: '#3730A3',
    skin: '#FFE3C9',
    hair: '#E2E8F0',
    hairShade: '#94A3B8',
    eye: '#4F46E5',
    outfit: '#4338CA',
    outfitShade: '#312E81',
    accent: '#FCD34D',
    style: 'wizard',
  },
  {
    id: 'jinn',
    name: 'Jinn',
    set: 'myth',
    color: '#2DD4BF',
    colorDark: '#115E59',
    skin: '#BFE8E0',
    hair: '#134E4A',
    hairShade: '#0F3D3A',
    eye: '#0D9488',
    outfit: '#0F766E',
    outfitShade: '#115E59',
    accent: '#F59E0B',
    style: 'turban',
  },
  {
    id: 'kitsu',
    name: 'Kitsu',
    set: 'myth',
    color: '#E11D48',
    colorDark: '#881337',
    skin: '#FFE3C9',
    hair: '#F8FAFC',
    hairShade: '#CBD5E1',
    eye: '#B91C1C',
    outfit: '#B91C1C',
    outfitShade: '#7F1D1D',
    accent: '#FB923C',
    style: 'fox-ears',
  },
  {
    id: 'robin',
    name: 'Robin',
    set: 'myth',
    color: '#16A34A',
    colorDark: '#14532D',
    skin: '#FFD9B3',
    hair: '#92400E',
    hairShade: '#6E2F0A',
    eye: '#15803D',
    outfit: '#166534',
    outfitShade: '#0B3D20',
    accent: '#DC2626',
    style: 'feather-cap',
  },
  {
    id: 'wukong',
    name: 'Wukong',
    set: 'myth',
    color: '#EAB308',
    colorDark: '#713F12',
    skin: '#E0A368',
    hair: '#7C4A21',
    hairShade: '#573212',
    eye: '#B45309',
    outfit: '#DC2626',
    outfitShade: '#7F1D1D',
    accent: '#FCD34D',
    style: 'monkey-king',
  },
  {
    id: 'naia',
    name: 'Naia',
    set: 'myth',
    color: '#0891B2',
    colorDark: '#155E75',
    skin: '#FFE3C9',
    hair: '#2DD4BF',
    hairShade: '#0D9488',
    eye: '#0E7490',
    outfit: '#0E7490',
    outfitShade: '#155E75',
    accent: '#FBCFE8',
    style: 'mermaid',
  },
];

export function heroById(id: string): Hero {
  return HEROES.find((h) => h.id === id) ?? HEROES[0];
}
