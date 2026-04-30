'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { FilterSettings, WordFrequency } from '@/lib/wordcloud/types';
import { DEFAULT_FILTER_SETTINGS } from '@/lib/wordcloud/types';
import { processText } from '@/lib/wordcloud/textProcessor';
import {
  loadRawText, loadFilterSettings, saveFilterSettings, saveWordData,
  listFilterProfiles, saveFilterProfile, loadFilterProfile, deleteFilterProfile,
  settingsToFile, settingsFromFile, getDefaultFilterSettings, DEFAULT_STOP_WORDS_BLACKLIST,
} from '@/lib/wordcloud/storage';

type FlashKey = 'maxWordLength' | 'minWordLength' | 'blacklist' | null;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function FilterPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<FilterSettings>(DEFAULT_FILTER_SETTINGS);
  const [rawText, setRawText] = useState('');
  const [words, setWords] = useState<WordFrequency[]>([]);
  const [flash, setFlash] = useState<FlashKey>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Profile management
  const [profiles, setProfiles] = useState<string[]>([]);
  const [profileName, setProfileName] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');

  // Token / blacklist inputs
  const [tokenInput, setTokenInput] = useState('');
  const [blacklistInput, setBlacklistInput] = useState('');
  const [blacklistSearch, setBlacklistSearch] = useState('');

  const debouncedSettings = useDebounce(settings, 200);

  useEffect(() => {
    const text = loadRawText();
    if (!text) { router.push('/wordcloud/import'); return; }
    setRawText(text);
    setSettings(loadFilterSettings());
    setProfiles(listFilterProfiles());
  }, [router]);

  useEffect(() => {
    if (!rawText) return;
    setWords(processText(rawText, debouncedSettings));
  }, [rawText, debouncedSettings]);

  const triggerFlash = useCallback((key: FlashKey) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(key);
    flashTimer.current = setTimeout(() => setFlash(null), 1500);
  }, []);

  const updateSetting = useCallback(
    (updates: Partial<FilterSettings>) => {
      setSettings(prev => {
        const next = { ...prev, ...updates };
        saveFilterSettings(next);
        return next;
      });
    },
    []
  );

  // Word action handlers
  const handleBlacklist = (word: string) => {
    const lw = word.toLowerCase();
    if (settings.blacklist.includes(lw)) return;
    updateSetting({ blacklist: [...settings.blacklist, lw].sort() });
    triggerFlash('blacklist');
  };

  const handleTooLong = (word: string) => {
    const newMax = word.length - 1;
    if (newMax < settings.minWordLength) return;
    updateSetting({ maxWordLength: newMax });
    triggerFlash('maxWordLength');
  };

  const handleTooShort = (word: string) => {
    const newMin = word.length + 1;
    if (newMin > settings.maxWordLength) return;
    updateSetting({ minWordLength: newMin });
    triggerFlash('minWordLength');
  };

  const addToken = () => {
    const val = tokenInput.trim();
    if (!val || settings.multiWordTokens.includes(val)) return;
    updateSetting({ multiWordTokens: [...settings.multiWordTokens, val] });
    setTokenInput('');
  };

  const removeToken = (token: string) => {
    updateSetting({ multiWordTokens: settings.multiWordTokens.filter(t => t !== token) });
  };

  const addBlacklist = () => {
    const val = blacklistInput.trim().toLowerCase();
    if (!val || settings.blacklist.includes(val)) return;
    updateSetting({ blacklist: [...settings.blacklist, val].sort() });
    setBlacklistInput('');
  };

  const removeBlacklist = (word: string) => {
    updateSetting({ blacklist: settings.blacklist.filter(w => w !== word) });
  };

  const resetBlacklistToDefaults = () => {
    updateSetting({ blacklist: [...DEFAULT_STOP_WORDS_BLACKLIST] });
    triggerFlash('blacklist');
  };

  // Profile handlers
  const handleSaveProfile = () => {
    const name = profileName.trim();
    if (!name) return;
    saveFilterProfile(name, settings);
    setProfiles(listFilterProfiles());
    setProfileName('');
  };

  const handleLoadProfile = () => {
    if (!selectedProfile) return;
    const loaded = loadFilterProfile(selectedProfile);
    if (loaded) { setSettings(loaded); saveFilterSettings(loaded); }
  };

  const handleDeleteProfile = () => {
    if (!selectedProfile) return;
    deleteFilterProfile(selectedProfile);
    setProfiles(listFilterProfiles());
    setSelectedProfile('');
  };

  const handleExportFile = () => {
    const name = profileName.trim() || 'settings';
    settingsToFile(settings, `wordcloud_filter_${name}.json`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await settingsFromFile(file) as FilterSettings;
      setSettings(imported);
      saveFilterSettings(imported);
    } catch { /* ignore bad files */ }
    e.target.value = '';
  };

  const handleGenerate = () => {
    saveWordData(words);
    saveFilterSettings(settings);
    router.push('/wordcloud/generate');
  };

  const maxCount = words[0]?.count ?? 1;

  const filteredBlacklist = blacklistSearch
    ? settings.blacklist.filter(w => w.includes(blacklistSearch.toLowerCase()))
    : settings.blacklist;

  return (
    <main className="page-main">
      <div style={{ marginBottom: 20 }}>
        <div className="steps">
          <span className="step-item done" style={{ cursor: 'pointer' }} onClick={() => router.push('/wordcloud/import')}>1 · Import</span>
          <span className="step-sep">›</span>
          <span className="step-item active">2 · Filter</span>
          <span className="step-sep">›</span>
          <span className="step-item future">3 · Generate</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        {/* ── Left: Settings panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Generate button — always at the top */}
          <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={words.length === 0} style={{ width: '100%' }}>
            Generate Word Cloud →
          </button>

          <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3>Filter Settings</h3>

            {/* Multi-word tokens */}
            <div className="form-group">
              <label>Multi-Word Tokens</label>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                Phrases treated as one word — bypass all other filters (e.g. &quot;5 whys&quot;, &quot;United States&quot;)
              </p>
              <div className="input-row">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addToken()}
                  placeholder="Add phrase…"
                />
                <button className="btn btn-secondary btn-sm" onClick={addToken} style={{ flexShrink: 0 }}>Add</button>
              </div>
              {settings.multiWordTokens.length > 0 && (
                <div className="tag-list" style={{ marginTop: 6 }}>
                  {settings.multiWordTokens.map(t => (
                    <span key={t} className="tag">
                      {t}
                      <button className="tag-remove" onClick={() => removeToken(t)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="divider" />

            {/* Word length */}
            <div className={`form-group ${flash === 'minWordLength' ? 'flash-highlight' : ''}`} style={{ padding: '6px 4px' }}>
              <label>Min Word Length: <strong>{settings.minWordLength}</strong></label>
              <input
                type="range" min={1} max={15}
                value={settings.minWordLength}
                onChange={e => updateSetting({ minWordLength: Number(e.target.value) })}
              />
            </div>

            <div className={`form-group ${flash === 'maxWordLength' ? 'flash-highlight' : ''}`} style={{ padding: '6px 4px' }}>
              <label>Max Word Length: <strong>{settings.maxWordLength}</strong></label>
              <input
                type="range" min={5} max={50}
                value={settings.maxWordLength}
                onChange={e => updateSetting({ maxWordLength: Number(e.target.value) })}
              />
            </div>

            <div className="divider" />

            {/* Blacklist */}
            <div className={flash === 'blacklist' ? 'flash-highlight' : ''} style={{ padding: flash === 'blacklist' ? '4px' : undefined, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <label style={{ margin: 0 }}>Blacklist <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 12 }}>({settings.blacklist.length})</span></label>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={resetBlacklistToDefaults}
                  title="Reset to default English stop words"
                  style={{ fontSize: 11.5 }}
                >
                  Reset to defaults
                </button>
              </div>

              {/* Add word */}
              <div className="input-row">
                <input
                  type="text"
                  value={blacklistInput}
                  onChange={e => setBlacklistInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addBlacklist()}
                  placeholder="Add word to blacklist…"
                />
                <button className="btn btn-secondary btn-sm" onClick={addBlacklist} style={{ flexShrink: 0 }}>Add</button>
              </div>

              {/* Search */}
              {settings.blacklist.length > 10 && (
                <input
                  type="text"
                  value={blacklistSearch}
                  onChange={e => setBlacklistSearch(e.target.value)}
                  placeholder={`Search ${settings.blacklist.length} words…`}
                />
              )}

              {/* Scrollable word list */}
              {settings.blacklist.length > 0 && (
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: '8px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 5px' }}>
                    {filteredBlacklist.map(w => (
                      <span
                        key={w}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          padding: '1px 5px 1px 7px', borderRadius: 12,
                          background: 'rgba(192,57,43,0.07)',
                          border: '1px solid rgba(192,57,43,0.18)',
                          fontSize: 12, color: '#8b2828', fontWeight: 500,
                        }}
                      >
                        {w}
                        <button
                          onClick={() => removeBlacklist(w)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: 13, lineHeight: 1, padding: '0 0 0 1px', opacity: 0.65 }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0.65')}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {filteredBlacklist.length === 0 && blacklistSearch && (
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>No matches for &quot;{blacklistSearch}&quot;</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save / Load */}
          <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3>Save / Load Settings</h3>
            <div className="form-group">
              <label>Profile Name</label>
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="e.g. feedback-analysis"
              />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleSaveProfile}>Save Profile</button>
              <button className="btn btn-ghost btn-sm" onClick={handleExportFile}>Export to File</button>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Import from File
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
              </label>
            </div>
            {profiles.length > 0 && (
              <div className="form-group">
                <label>Saved Profiles</label>
                <div className="input-row">
                  <select value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)}>
                    <option value="">— select —</option>
                    {profiles.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={handleLoadProfile} disabled={!selectedProfile}>Load</button>
                  <button className="btn btn-danger btn-sm" onClick={handleDeleteProfile} disabled={!selectedProfile}>Delete</button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Right: Word list ── */}
        <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h3>Word Preview</h3>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {words.length} word{words.length !== 1 ? 's' : ''} · click a word to remove it
            </span>
          </div>

          <div style={{ fontSize: 12.5, color: 'var(--muted)', background: 'rgba(42,122,122,0.06)', padding: '6px 10px', borderRadius: 6 }}>
            <strong>Blacklist</strong> — adds to blacklist &nbsp;|&nbsp;
            <strong>Too Long</strong> — shrinks max length &nbsp;|&nbsp;
            <strong>Too Short</strong> — raises min length
          </div>

          {words.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
              No words match the current filters.
            </div>
          ) : (
            <div className="word-table-wrap">
              <table className="word-table">
                <thead>
                  <tr>
                    <th>Word</th>
                    <th>Count</th>
                    <th>Frequency</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {words.map(({ word, count }) => {
                    const isMulti = word.includes(' ');
                    return (
                      <tr key={word}>
                        <td style={{ fontWeight: 500, maxWidth: 160 }}>
                          {isMulti
                            ? <span style={{ background: 'rgba(42,122,122,0.1)', padding: '1px 6px', borderRadius: 4, fontSize: 12.5 }}>{word}</span>
                            : word}
                        </td>
                        <td style={{ color: 'var(--muted)' }}>{count}</td>
                        <td>
                          <div className="word-count-bar-wrap">
                            <div className="word-count-bar" style={{ width: Math.max(4, Math.round((count / maxCount) * 80)) }} />
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {!isMulti && (
                              <>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleBlacklist(word)}>Blacklist</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleTooLong(word)} disabled={word.length <= settings.minWordLength}>Too Long</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleTooShort(word)} disabled={word.length >= settings.maxWordLength}>Too Short</button>
                              </>
                            )}
                            {isMulti && (
                              <span style={{ fontSize: 11.5, color: 'var(--accent)', fontStyle: 'italic' }}>token — bypasses filters</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
