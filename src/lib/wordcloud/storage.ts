import type { FilterSettings, GenerateSettings, WordFrequency } from './types';
import { DEFAULT_GENERATE_SETTINGS } from './types';
import { STOP_WORDS } from './stopWords';

export function getDefaultFilterSettings(): FilterSettings {
  return {
    minWordLength: 3,
    maxWordLength: 25,
    blacklist: Array.from(STOP_WORDS).sort(),
    multiWordTokens: [],
  };
}

const KEYS = {
  rawText: 'wc_raw_text',
  wordData: 'wc_word_data',
  filterSettings: 'wc_filter_settings',
  generateSettings: 'wc_generate_settings',
  filterProfileList: 'wc_filter_profile_list',
  generateProfileList: 'wc_generate_profile_list',
  filterProfile: (name: string) => `wc_filter_profile__${name}`,
  generateProfile: (name: string) => `wc_generate_profile__${name}`,
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Raw text
export const saveRawText = (text: string) => localStorage.setItem(KEYS.rawText, text);
export const loadRawText = (): string => localStorage.getItem(KEYS.rawText) ?? '';

// Processed word data (passed from filter → generate)
export const saveWordData = (words: WordFrequency[]) => safeSet(KEYS.wordData, words);
export const loadWordData = (): WordFrequency[] | null => {
  const raw = localStorage.getItem(KEYS.wordData);
  if (!raw) return null;
  try { return JSON.parse(raw) as WordFrequency[]; } catch { return null; }
};

export const DEFAULT_STOP_WORDS_BLACKLIST = Array.from(STOP_WORDS).sort();

// Filter settings
export const saveFilterSettings = (s: FilterSettings) => safeSet(KEYS.filterSettings, s);
export const loadFilterSettings = (): FilterSettings =>
  safeGet<FilterSettings>(KEYS.filterSettings, getDefaultFilterSettings());

// Generate settings
export const saveGenerateSettings = (s: GenerateSettings) => safeSet(KEYS.generateSettings, s);
export const loadGenerateSettings = (): GenerateSettings =>
  safeGet<GenerateSettings>(KEYS.generateSettings, DEFAULT_GENERATE_SETTINGS);

// Filter profiles
export const listFilterProfiles = (): string[] =>
  safeGet<string[]>(KEYS.filterProfileList, []);

export const saveFilterProfile = (name: string, settings: FilterSettings): void => {
  safeSet(KEYS.filterProfile(name), settings);
  const list = listFilterProfiles();
  if (!list.includes(name)) {
    safeSet(KEYS.filterProfileList, [...list, name]);
  }
};

export const loadFilterProfile = (name: string): FilterSettings | null =>
  safeGet<FilterSettings | null>(KEYS.filterProfile(name), null);

export const deleteFilterProfile = (name: string): void => {
  localStorage.removeItem(KEYS.filterProfile(name));
  safeSet(KEYS.filterProfileList, listFilterProfiles().filter(n => n !== name));
};

// Generate profiles
export const listGenerateProfiles = (): string[] =>
  safeGet<string[]>(KEYS.generateProfileList, []);

export const saveGenerateProfile = (name: string, settings: GenerateSettings): void => {
  safeSet(KEYS.generateProfile(name), settings);
  const list = listGenerateProfiles();
  if (!list.includes(name)) {
    safeSet(KEYS.generateProfileList, [...list, name]);
  }
};

export const loadGenerateProfile = (name: string): GenerateSettings | null =>
  safeGet<GenerateSettings | null>(KEYS.generateProfile(name), null);

export const deleteGenerateProfile = (name: string): void => {
  localStorage.removeItem(KEYS.generateProfile(name));
  safeSet(KEYS.generateProfileList, listGenerateProfiles().filter(n => n !== name));
};

// File export/import helpers
export const settingsToFile = (settings: FilterSettings | GenerateSettings, filename: string): void => {
  const json = JSON.stringify(settings, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const settingsFromFile = (file: File): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try { resolve(JSON.parse(e.target?.result as string)); }
      catch { reject(new Error('Invalid JSON file')); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
