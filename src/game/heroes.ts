// Manga-chibi hero roster. Everything is vector-drawn; these configs drive ChibiHero.tsx.

export type HairStyle = 'spiky' | 'scarf-ninja' | 'twin-tails' | 'witch-hat' | 'topknot' | 'bob' | 'bald' | 'long';

export interface Hero {
  id: string;
  name: string;
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
];

export function heroById(id: string): Hero {
  return HEROES.find((h) => h.id === id) ?? HEROES[0];
}
