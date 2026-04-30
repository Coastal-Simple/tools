export interface WordFrequency {
  word: string;
  count: number;
}

export interface FilterSettings {
  minWordLength: number;
  maxWordLength: number;
  blacklist: string[];
  multiWordTokens: string[];
}

export type ColorMode = 'single' | 'per-word' | 'random-list' | 'gradient';

export interface ColorConfig {
  mode: ColorMode;
  single: string;
  list: string[];
  gradientStart: string;
  gradientEnd: string;
}

export type RotationMode = 'none' | 'some' | 'random';

export interface GenerateSettings {
  width: number;
  height: number;
  maxWords: number;
  padding: number;
  minFontSize: number;
  maxFontSize: number;
  sizeCurve: number;   // 1 = linear, >1 = top words larger, <1 = more uniform
  rotationMode: RotationMode;
  colors: ColorConfig;
  backgroundColor: string | null;
}

export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  minWordLength: 3,
  maxWordLength: 25,
  blacklist: [],   // storage.ts overrides this with STOP_WORDS via getDefaultFilterSettings()
  multiWordTokens: [],
};

export const DEFAULT_GENERATE_SETTINGS: GenerateSettings = {
  width: 800,
  height: 500,
  maxWords: 150,
  padding: 5,
  minFontSize: 12,
  maxFontSize: 80,
  sizeCurve: 1,
  rotationMode: 'some',
  colors: {
    mode: 'gradient',
    single: '#2a7a7a',
    list: ['#2a7a7a', '#e63946', '#457b9d', '#e9c46a', '#f4a261'],
    gradientStart: '#2a9d8f',
    gradientEnd: '#e9c46a',
  },
  backgroundColor: '#ffffff',
};

export interface ComputedWord {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
  count: number;
}
