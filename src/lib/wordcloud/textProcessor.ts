import type { WordFrequency, FilterSettings } from './types';

const JOIN_CHAR = '·'; // middle dot — won't appear in normal prose

function joinPhrase(phrase: string): string {
  return phrase.toLowerCase().trim().split(/\s+/).join(JOIN_CHAR);
}

export function processText(rawText: string, settings: FilterSettings): WordFrequency[] {
  let text = rawText;

  // Replace multi-word tokens before splitting (longest first to avoid partial matches)
  const multiTokens = [...settings.multiWordTokens]
    .map(t => t.trim())
    .filter(t => t.includes(' '))
    .sort((a, b) => b.length - a.length);

  for (const token of multiTokens) {
    const escaped = token.trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s+');
    const joined = joinPhrase(token);
    text = text.replace(new RegExp(escaped, 'gi'), joined);
  }

  // Extract word-like tokens. Allow digit-leading tokens so "5·whys" is captured.
  const rawWords = text.toLowerCase().match(/[a-z0-9][a-z0-9·]*/g) ?? [];

  const blacklistSet = new Set(settings.blacklist.map(w => w.toLowerCase().trim()));

  const freq = new Map<string, number>();

  for (const raw of rawWords) {
    const isMulti = raw.includes(JOIN_CHAR);
    const display = raw.replace(new RegExp(JOIN_CHAR, 'g'), ' ');

    // Multi-word tokens supersede ALL other filters — add directly.
    if (isMulti) {
      freq.set(display, (freq.get(display) ?? 0) + 1);
      continue;
    }

    // Skip pure numbers
    if (/^\d+$/.test(raw)) continue;

    // Length filter
    if (raw.length < settings.minWordLength) continue;
    if (raw.length > settings.maxWordLength) continue;

    // Blacklist (contains stop words + user additions)
    if (blacklistSet.has(raw)) continue;

    freq.set(display, (freq.get(display) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}
