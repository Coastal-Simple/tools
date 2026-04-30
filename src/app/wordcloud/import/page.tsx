'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveRawText } from '@/lib/wordcloud/storage';

const ACCEPTED = '.txt,.csv,.md,.text';

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string ?? '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

type Tab = 'paste' | 'upload';

export default function ImportPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('paste');
  const [text, setText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    try {
      const content = await readFileAsText(file);
      setText(content);
      setFileName(file.name);
    } catch {
      setError('Could not read that file. Please try a .txt, .csv, or .md file.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleProceed = () => {
    const trimmed = text.trim();
    if (!trimmed) { setError('Please provide some text first.'); return; }
    saveRawText(trimmed);
    router.push('/wordcloud/filter');
  };

  return (
    <main className="page-main">
      {/* Steps */}
      <div style={{ marginBottom: 24 }}>
        <div className="steps">
          <span className="step-item active">1 · Import</span>
          <span className="step-sep">›</span>
          <span className="step-item future">2 · Filter</span>
          <span className="step-sep">›</span>
          <span className="step-item future">3 · Generate</span>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Import Your Text</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Paste text directly or upload a file to get started.</p>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--border)', padding: 4, borderRadius: 8, width: 'fit-content' }}>
          {(['paste', 'upload'] as Tab[]).map(t => (
            <button
              key={t}
              className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 6, padding: '6px 20px', border: 'none' }}
              onClick={() => { setTab(t); setError(''); }}
            >
              {t === 'paste' ? '✏️ Paste Text' : '📁 Upload File'}
            </button>
          ))}
        </div>

        {tab === 'paste' && (
          <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label htmlFor="paste-area" style={{ fontSize: 13, fontWeight: 600 }}>Paste your text below</label>
            <textarea
              id="paste-area"
              value={text}
              onChange={e => { setText(e.target.value); setError(''); }}
              placeholder="Paste any text here — articles, feedback, reports, notes..."
              style={{ minHeight: 280, resize: 'vertical', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6 }}
            />
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              {text.length > 0 && `${text.length.toLocaleString()} characters · ~${text.trim().split(/\s+/).length.toLocaleString()} words`}
            </div>
          </div>
        )}

        {tab === 'upload' && (
          <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              className={`drop-zone ${dragging ? 'drag-over' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Drop a file here, or click to browse</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Supported: .txt · .csv · .md</p>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED}
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            {fileName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(42,122,122,0.07)', borderRadius: 6 }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{fileName}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 12.5 }}>
                  {text.trim().split(/\s+/).length.toLocaleString()} words
                </span>
              </div>
            )}

            {text && (
              <div>
                <div className="section-title">Preview</div>
                <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 6, padding: '10px 12px', fontSize: 13.5, lineHeight: 1.6, maxHeight: 140, overflow: 'auto', color: 'var(--muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {text.slice(0, 400)}{text.length > 400 ? '…' : ''}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 13.5, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary btn-lg"
            disabled={!text.trim()}
            onClick={handleProceed}
          >
            Filter & Clean →
          </button>
        </div>
      </div>
    </main>
  );
}
