'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { GenerateSettings, WordFrequency } from '@/lib/wordcloud/types';
import { DEFAULT_GENERATE_SETTINGS } from '@/lib/wordcloud/types';
import { getWordColor } from '@/lib/wordcloud/colorUtils';
import {
  loadWordData, loadGenerateSettings, saveGenerateSettings,
  listGenerateProfiles, saveGenerateProfile, loadGenerateProfile, deleteGenerateProfile,
  settingsToFile, settingsFromFile,
} from '@/lib/wordcloud/storage';

function calcFontSize(count: number, min: number, max: number, minFont: number, maxFont: number, curve: number): number {
  if (max === min) return (minFont + maxFont) / 2;
  const ratio = (count - min) / (max - min);
  const curved = Math.pow(ratio, curve);
  return minFont + curved * (maxFont - minFont);
}

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getRotation(mode: GenerateSettings['rotationMode'], rng: () => number): number {
  if (mode === 'none') return 0;
  if (mode === 'some') return rng() > 0.65 ? 90 : 0;
  return Math.round((rng() * 120) - 60);
}

// Words placed by d3-cloud — colors computed live at render time
interface PlacedWord {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  count: number;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function GeneratePage() {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);

  const [sourceWords, setSourceWords] = useState<WordFrequency[]>([]);
  const [settings, setSettings] = useState<GenerateSettings>(DEFAULT_GENERATE_SETTINGS);
  const seedRef = useRef<number>(Math.floor(Math.random() * 2 ** 32));
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [exportBg, setExportBg] = useState<string>('#ffffff');
  const [exportTransparent, setExportTransparent] = useState(false);
  const [fittedWords, setFittedWords] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [panelTab, setPanelTab] = useState<'settings' | 'export'>('settings');

  // Profile management
  const [profiles, setProfiles] = useState<string[]>([]);
  const [profileName, setProfileName] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');

  // Core layout runner — accepts explicit data so it can be called from mount
  // effect before React state has propagated.
  const runLayout = useCallback(async (words: WordFrequency[], cfg: GenerateSettings, seed: number) => {
    if (words.length === 0) return;
    setIsGenerating(true);

    const rng = mulberry32(seed);

    const activeWords = words.slice(0, cfg.maxWords ?? 150);
    const minCount = activeWords[activeWords.length - 1].count;
    const maxCount = activeWords[0].count;

    interface LayoutWord {
      text: string;
      size: number;
      count: number;
      rotate: number;
      x?: number;
      y?: number;
    }

    const wordsForLayout: LayoutWord[] = activeWords.map(w => ({
      text: w.word,
      size: calcFontSize(w.count, minCount, maxCount, cfg.minFontSize, cfg.maxFontSize, cfg.sizeCurve ?? 1),
      count: w.count,
      rotate: getRotation(cfg.rotationMode, rng),
    }));

    setTotalWords(wordsForLayout.length);

    try {
      await document.fonts.ready;
      const cloudModule = await import('d3-cloud');
      const cloud = cloudModule.default;

      cloud<LayoutWord>()
        .size([cfg.width, cfg.height])
        .words(wordsForLayout)
        .padding(cfg.padding)
        .rotate(d => d.rotate)
        .font("'Aptos', Arial, sans-serif")
        .fontSize(d => d.size)
        .random(rng)
        .on('end', placed => {
          setPlacedWords(placed.map(w => ({
            text: w.text ?? '',
            size: w.size ?? 12,
            x: w.x ?? 0,
            y: w.y ?? 0,
            rotate: w.rotate ?? 0,
            count: w.count ?? 0,
          })));
          setFittedWords(placed.length);
          setIsGenerating(false);
          setHasGenerated(true);
        })
        .start();
    } catch {
      setIsGenerating(false);
    }
  }, []);

  // Load data on mount, then immediately generate
  useEffect(() => {
    const words = loadWordData();
    if (!words || words.length === 0) { router.push('/wordcloud/filter'); return; }
    const saved = loadGenerateSettings();
    setSourceWords(words);
    setSettings(saved);
    setProfiles(listGenerateProfiles());
    runLayout(words, saved, seedRef.current);
  }, [router, runLayout]);

  // Debounce layout-affecting settings; auto-regenerate when they settle.
  // Color and background are intentionally excluded — those update the SVG live.
  const layoutKey = JSON.stringify([
    settings.width, settings.height, settings.padding,
    settings.maxWords ?? 150, settings.minFontSize, settings.maxFontSize,
    settings.sizeCurve ?? 1, settings.rotationMode,
  ]);
  const debouncedLayoutKey = useDebounce(layoutKey, 600);
  const skipFirstDebounce = useRef(true);

  useEffect(() => {
    // The first fire is the initial value from mount — skip it since mount
    // already called runLayout directly.
    if (skipFirstDebounce.current) { skipFirstDebounce.current = false; return; }
    if (sourceWords.length === 0) return;
    runLayout(sourceWords, settings, seedRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedLayoutKey]);

  // Button: rolls a new seed then re-runs layout immediately
  const handleGenerate = () => {
    seedRef.current = Math.floor(Math.random() * 2 ** 32);
    runLayout(sourceWords, settings, seedRef.current);
  };

  const updateSetting = useCallback(<K extends keyof GenerateSettings>(key: K, val: GenerateSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val };
      saveGenerateSettings(next);
      return next;
    });
  }, []);

  const updateColor = useCallback(<K extends keyof GenerateSettings['colors']>(key: K, val: GenerateSettings['colors'][K]) => {
    setSettings(prev => {
      const next = { ...prev, colors: { ...prev.colors, [key]: val } };
      saveGenerateSettings(next);
      return next;
    });
  }, []);

  // Export helpers
  const getSvgString = (): string | null => {
    if (!svgRef.current) return null;
    return new XMLSerializer().serializeToString(svgRef.current);
  };

  const exportSvg = () => {
    const svgStr = getSvgString();
    if (!svgStr) return;
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wordcloud.svg'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCanvas = (format: 'png' | 'jpg') => {
    const svgStr = getSvgString();
    if (!svgStr) return;

    const canvas = document.createElement('canvas');
    canvas.width = settings.width;
    canvas.height = settings.height;
    const ctx = canvas.getContext('2d')!;

    const useTransparent = exportTransparent && format === 'png';
    if (!useTransparent) { ctx.fillStyle = exportBg; ctx.fillRect(0, 0, canvas.width, canvas.height); }

    // Strip the embedded background rect so the canvas fill above controls it.
    // The SVG background rect is always the first (and only) <rect> in the markup.
    const svgForExport = svgStr.replace(/<rect\b[^>]*\/>/, '');
    const blob = new Blob([svgForExport], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const a = document.createElement('a');
      a.href = canvas.toDataURL(mime, 0.95);
      a.download = `wordcloud.${format}`;
      a.click();
    };
    img.src = url;
  };

  // Profile handlers
  const handleSaveProfile = () => {
    const name = profileName.trim();
    if (!name) return;
    saveGenerateProfile(name, settings);
    setProfiles(listGenerateProfiles());
    setProfileName('');
  };

  const handleLoadProfile = () => {
    if (!selectedProfile) return;
    const loaded = loadGenerateProfile(selectedProfile);
    if (loaded) { setSettings(loaded); saveGenerateSettings(loaded); }
  };

  const handleDeleteProfile = () => {
    if (!selectedProfile) return;
    deleteGenerateProfile(selectedProfile);
    setProfiles(listGenerateProfiles());
    setSelectedProfile('');
  };

  const handleExportFile = () => {
    const name = profileName.trim() || 'settings';
    settingsToFile(settings, `wordcloud_generate_${name}.json`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await settingsFromFile(file) as GenerateSettings;
      setSettings(imported); saveGenerateSettings(imported);
    } catch { /* ignore bad files */ }
    e.target.value = '';
  };

  const bgForPreview = settings.backgroundColor ?? undefined;

  return (
    <main className="page-main">
      <div style={{ marginBottom: 20 }}>
        <div className="steps">
          <span className="step-item done" style={{ cursor: 'pointer' }} onClick={() => router.push('/wordcloud/import')}>1 · Import</span>
          <span className="step-sep">›</span>
          <span className="step-item done" style={{ cursor: 'pointer' }} onClick={() => router.push('/wordcloud/filter')}>2 · Filter</span>
          <span className="step-sep">›</span>
          <span className="step-item active">3 · Generate</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* ── Left: preview ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            className={`card ${!bgForPreview ? 'transparent-bg' : ''}`}
            style={{
              background: bgForPreview || undefined,
              minHeight: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {!hasGenerated && !isGenerating && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>☁️</div>
                <p style={{ fontWeight: 600 }}>Configure settings and click Generate</p>
                <p style={{ fontSize: 13 }}>Your word cloud will appear here</p>
              </div>
            )}

            {isGenerating && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
                <p>Generating word cloud…</p>
              </div>
            )}

            {hasGenerated && placedWords.length > 0 && (
              <svg
                ref={svgRef}
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${settings.width} ${settings.height}`}
                width={settings.width}
                height={settings.height}
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
              >
                {settings.backgroundColor && (
                  <rect width={settings.width} height={settings.height} fill={settings.backgroundColor} />
                )}
                <g transform={`translate(${settings.width / 2},${settings.height / 2})`}>
                  {placedWords.map((w, i) => (
                    <text
                      key={i}
                      transform={`translate(${w.x},${w.y}) rotate(${w.rotate})`}
                      textAnchor="middle"
                      style={{ fontSize: `${w.size}px`, fontFamily: "'Aptos', Arial, sans-serif", fill: getWordColor(w.text, i, placedWords.length, settings.colors) }}
                    >
                      {w.text}
                    </text>
                  ))}
                </g>
              </svg>
            )}
          </div>

        </div>

        {/* ── Right: generate button + tabbed panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Generate button — always at the top */}
          <button
            className="btn btn-primary btn-lg"
            onClick={handleGenerate}
            disabled={isGenerating || sourceWords.length === 0}
            style={{ width: '100%' }}
          >
            {isGenerating ? 'Generating…' : '✦ Generate Word Cloud'}
          </button>

          {/* Tab strip */}
          <div style={{ display: 'flex', background: 'var(--border)', padding: 3, borderRadius: 8, gap: 3 }}>
            {(['settings', 'export'] as const).map(t => (
              <button
                key={t}
                onClick={() => setPanelTab(t)}
                className={`btn ${panelTab === t ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, borderRadius: 6, border: 'none', position: 'relative' }}
              >
                {t === 'settings' ? 'Settings' : 'Export'}
                {t === 'export' && hasGenerated && panelTab !== 'export' && (
                  <span style={{
                    position: 'absolute', top: 4, right: 6,
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#2a9d8f',
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* ── Settings tab ── */}
          {panelTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Canvas */}
              <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3>Canvas</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label>Width (px)</label>
                    <input type="number" min={200} max={4000} value={settings.width}
                      onChange={e => updateSetting('width', Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Height (px)</label>
                    <input type="number" min={100} max={4000} value={settings.height}
                      onChange={e => updateSetting('height', Number(e.target.value))} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Max Words: <strong>{settings.maxWords ?? 150}</strong>
                    <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 12, marginLeft: 6 }}>
                      (of {sourceWords.length} available)
                    </span>
                  </label>
                  <input
                    type="range" min={5} max={Math.max(sourceWords.length, 5)} step={1}
                    value={Math.min(settings.maxWords ?? 150, Math.max(sourceWords.length, 5))}
                    onChange={e => updateSetting('maxWords', Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>Word Padding: <strong>{settings.padding}px</strong></label>
                  <input type="range" min={0} max={20} value={settings.padding}
                    onChange={e => updateSetting('padding', Number(e.target.value))} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label>Min Font (px)</label>
                    <input type="number" min={6} max={100} value={settings.minFontSize}
                      onChange={e => updateSetting('minFontSize', Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Max Font (px)</label>
                    <input type="number" min={12} max={300} value={settings.maxFontSize}
                      onChange={e => updateSetting('maxFontSize', Number(e.target.value))} />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label>Size Curve: <strong>{(settings.sizeCurve ?? 1).toFixed(1)}</strong></label>
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                      {(settings.sizeCurve ?? 1) < 0.9 ? 'uniform' : (settings.sizeCurve ?? 1) > 1.1 ? 'amplified' : 'linear'}
                    </span>
                  </div>
                  <input
                    type="range" min={0.2} max={4} step={0.1}
                    value={settings.sizeCurve ?? 1}
                    onChange={e => updateSetting('sizeCurve', Number(e.target.value))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    <span>uniform</span>
                    <span>linear (1.0)</span>
                    <span>amplified</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Word Rotation</label>
                  <select value={settings.rotationMode} onChange={e => updateSetting('rotationMode', e.target.value as GenerateSettings['rotationMode'])}>
                    <option value="none">Horizontal only</option>
                    <option value="some">Mostly horizontal (some vertical)</option>
                    <option value="random">Random angles</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Background Color</label>
                  <div className="input-row">
                    <input type="color" value={settings.backgroundColor ?? '#ffffff'}
                      onChange={e => updateSetting('backgroundColor', e.target.value)} />
                    <button
                      className={`btn btn-sm ${settings.backgroundColor === null ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => updateSetting('backgroundColor', settings.backgroundColor === null ? '#ffffff' : null)}
                    >
                      {settings.backgroundColor === null ? 'Transparent ✓' : 'Set Transparent'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3>Colors</h3>

                <div className="form-group">
                  <label>Color Mode</label>
                  <select value={settings.colors.mode} onChange={e => updateColor('mode', e.target.value as GenerateSettings['colors']['mode'])}>
                    <option value="gradient">Gradient (frequency-based)</option>
                    <option value="per-word">Unique per word</option>
                    <option value="random-list">Random from palette</option>
                    <option value="single">Single color</option>
                  </select>
                </div>

                {settings.colors.mode === 'single' && (
                  <div className="form-group">
                    <label>Color</label>
                    <input type="color" value={settings.colors.single}
                      onChange={e => updateColor('single', e.target.value)} />
                  </div>
                )}

                {settings.colors.mode === 'gradient' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group">
                      <label>Start Color</label>
                      <input type="color" value={settings.colors.gradientStart}
                        onChange={e => updateColor('gradientStart', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>End Color</label>
                      <input type="color" value={settings.colors.gradientEnd}
                        onChange={e => updateColor('gradientEnd', e.target.value)} />
                    </div>
                  </div>
                )}

                {settings.colors.mode === 'random-list' && (
                  <div className="form-group">
                    <label>Palette Colors</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      {settings.colors.list.map((c, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <input type="color" value={c}
                            onChange={e => {
                              const list = [...settings.colors.list];
                              list[i] = e.target.value;
                              updateColor('list', list);
                            }} />
                          <button
                            className="btn btn-sm"
                            style={{ padding: '1px 5px', fontSize: 11, background: 'none', border: '1px solid var(--border)', color: 'var(--danger)', cursor: 'pointer' }}
                            onClick={() => updateColor('list', settings.colors.list.filter((_, j) => j !== i))}
                          >×</button>
                        </div>
                      ))}
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => updateColor('list', [...settings.colors.list, '#2a7a7a'])}>
                        + Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Save / Load */}
              <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3>Save / Load Settings</h3>
                <div className="form-group">
                  <label>Profile Name</label>
                  <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)}
                    placeholder="e.g. presentation" />
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
          )}

          {/* ── Export tab ── */}
          {panelTab === 'export' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!hasGenerated ? (
                <div className="card card-p" style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 24px' }}>
                  <p style={{ fontSize: 15, marginBottom: 6 }}>No image yet</p>
                  <p style={{ fontSize: 13 }}>Generate a word cloud first, then come back here to export.</p>
                </div>
              ) : (
                <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3>Export Image</h3>

                  <div className="form-group">
                    <label>Background</label>
                    <div className="input-row">
                      <input
                        type="color" value={exportBg}
                        onChange={e => setExportBg(e.target.value)}
                        disabled={exportTransparent}
                        style={{ opacity: exportTransparent ? 0.4 : 1 }}
                      />
                      <div className="checkbox-row">
                        <input type="checkbox" id="transparent-export" checked={exportTransparent}
                          onChange={e => setExportTransparent(e.target.checked)} />
                        <label htmlFor="transparent-export">Transparent</label>
                      </div>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>JPG does not support transparency.</p>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => exportCanvas('png')}>↓ PNG</button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => exportCanvas('jpg')}>↓ JPG</button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={exportSvg}>↓ SVG</button>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                    {fittedWords} of {totalWords} words placed · {settings.width} × {settings.height}px
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
