'use client';

import { useState } from 'react';

function calculate(start: string, final: string): {
  result: number | null;
  difference: number;
  ratio: number;
  error: string | null;
} {
  const s = parseFloat(start);
  const f = parseFloat(final);

  if (start.trim() === '' || final.trim() === '') {
    return { result: null, difference: 0, ratio: 0, error: null };
  }
  if (isNaN(s) || isNaN(f)) {
    return { result: null, difference: 0, ratio: 0, error: 'Please enter valid numbers.' };
  }
  if (s === 0) {
    return { result: null, difference: 0, ratio: 0, error: 'Starting value cannot be zero.' };
  }

  const difference = f - s;
  const ratio = difference / Math.abs(s);
  const result = ratio * 100;
  return { result, difference, ratio, error: null };
}

function fmt(n: number): string {
  return n % 1 === 0 ? n.toString() : parseFloat(n.toPrecision(10)).toString();
}

function fmtPct(n: number): string {
  const rounded = Math.round(n * 10000) / 10000;
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toString();
}

export default function PercentageIncreasePage() {
  const [startVal, setStartVal] = useState('');
  const [finalVal, setFinalVal] = useState('');

  const { result, difference, ratio, error } = calculate(startVal, finalVal);

  const hasResult = result !== null && !error;
  const isIncrease = hasResult && result > 0;
  const isDecrease = hasResult && result < 0;
  const isNeutral = hasResult && result === 0;

  const resultColor = isIncrease
    ? '#1a8a4a'
    : isDecrease
    ? 'var(--danger)'
    : 'var(--text)';

  const resultBg = isIncrease
    ? 'rgba(26, 138, 74, 0.08)'
    : isDecrease
    ? 'rgba(192, 57, 43, 0.08)'
    : 'rgba(83, 84, 86, 0.06)';

  const resultLabel = isIncrease ? 'increase' : isDecrease ? 'decrease' : 'no change';

  return (
    <main className="page-main">
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

        <div>
          <h2 style={{ marginBottom: 6 }}>Percentage Increase Calculator</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Enter a starting value and a final value to calculate the percentage change.
          </p>
        </div>

        {/* Inputs */}
        <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="start-val" style={{ fontSize: 13.5, fontWeight: 600 }}>Starting Value</label>
              <input
                id="start-val"
                type="number"
                value={startVal}
                onChange={e => setStartVal(e.target.value)}
                placeholder="e.g. 36"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="final-val" style={{ fontSize: 13.5, fontWeight: 600 }}>Final Value</label>
              <input
                id="final-val"
                type="number"
                value={finalVal}
                onChange={e => setFinalVal(e.target.value)}
                placeholder="e.g. 45"
              />
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13.5, display: 'flex', gap: 6 }}>
              <span>⚠️</span> {error}
            </div>
          )}
        </div>

        {/* Result */}
        {hasResult && (
          <div
            className="card card-p"
            style={{ background: resultBg, border: `1.5px solid ${resultColor}`, borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', textAlign: 'center' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: resultColor, opacity: 0.75 }}>
              Percentage {resultLabel}
            </div>
            <div style={{ fontSize: 48, fontWeight: 700, color: resultColor, lineHeight: 1.1 }}>
              {isDecrease ? '' : '+'}{fmtPct(result)}%
            </div>
            {!isNeutral && (
              <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                {isIncrease ? 'Increased' : 'Decreased'} by {Math.abs(result) === Math.round(Math.abs(result)) ? Math.abs(result).toFixed(0) : fmtPct(Math.abs(result))}% from {fmt(parseFloat(startVal))} to {fmt(parseFloat(finalVal))}
              </div>
            )}
          </div>
        )}

        {/* Step-by-step breakdown */}
        {hasResult && (
          <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="section-title">Step-by-step breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ minWidth: 22, fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>1</span>
                <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Subtract the starting value from the final value</span>
                <span style={{ marginLeft: 'auto', fontSize: 13.5, fontWeight: 600, fontFamily: 'monospace' }}>
                  {fmt(parseFloat(finalVal))} − {fmt(parseFloat(startVal))} = {difference >= 0 ? '+' : ''}{fmt(difference)}
                </span>
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ minWidth: 22, fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>2</span>
                <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Divide by the absolute value of the starting value</span>
                <span style={{ marginLeft: 'auto', fontSize: 13.5, fontWeight: 600, fontFamily: 'monospace' }}>
                  {fmt(difference)} ÷ |{fmt(parseFloat(startVal))}| = {parseFloat(ratio.toPrecision(6))}
                </span>
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ minWidth: 22, fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>3</span>
                <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Multiply by 100 to get the percentage</span>
                <span style={{ marginLeft: 'auto', fontSize: 13.5, fontWeight: 600, fontFamily: 'monospace' }}>
                  {parseFloat(ratio.toPrecision(6))} × 100 = <span style={{ color: resultColor }}>{fmtPct(result)}%</span>
                </span>
              </div>

            </div>

            <div style={{ marginTop: 4, padding: '10px 14px', background: 'rgba(42,122,122,0.06)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--muted)', fontFamily: 'monospace', textAlign: 'center', letterSpacing: '0.01em' }}>
              ( Final − Starting ) ÷ |Starting| × 100
            </div>
          </div>
        )}

        {/* Explainer */}
        <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="section-title">What is percentage increase?</div>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
            Percentage increase (or decrease) expresses how much a value has changed relative to where it started — as a fraction of 100. A result of <strong>+25%</strong> means the final value is one-quarter larger than the starting value. A result of <strong>−10%</strong> means it shrank by one-tenth.
          </p>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
            It's commonly used to compare prices over time, track growth in metrics like revenue or followers, measure score improvements, or evaluate any change where the starting point provides context for how significant the shift actually is.
          </p>
          <div style={{ padding: '10px 14px', background: 'rgba(42,122,122,0.06)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: 6 }}>Formula</div>
            <div style={{ fontSize: 13.5, fontFamily: 'monospace', color: 'var(--text)' }}>
              % change = ( Final Value − Starting Value ) ÷ |Starting Value| × 100
            </div>
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
            The absolute value of the starting value is used in the denominator so the direction (increase vs. decrease) is captured entirely by the sign of the result — not obscured by a negative denominator.
          </p>
        </div>

      </div>
    </main>
  );
}
