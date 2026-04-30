import type { ColorConfig } from './types';

const PALETTE = [
  '#2a9d8f', '#e9c46a', '#f4a261', '#e63946', '#457b9d',
  '#264653', '#8338ec', '#fb5607', '#3a86ff', '#06d6a0',
  '#118ab2', '#ffbe0b', '#ff006e', '#8ecae6', '#a8dadc',
  '#c77dff', '#4cc9f0', '#f72585', '#b5838d', '#6d6875',
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

export function interpolateColor(hex1: string, hex2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function getWordColor(word: string, index: number, total: number, config: ColorConfig): string {
  switch (config.mode) {
    case 'single':
      return config.single;

    case 'per-word':
      return PALETTE[hashString(word) % PALETTE.length];

    case 'random-list': {
      const list = config.list.length > 0 ? config.list : PALETTE;
      return list[hashString(word) % list.length];
    }

    case 'gradient': {
      const t = total <= 1 ? 0 : index / (total - 1);
      return interpolateColor(config.gradientStart, config.gradientEnd, t);
    }

    default:
      return config.single;
  }
}
