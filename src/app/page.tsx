import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="logo-link">
          <Image src="/logo.png" alt="Coastal Simple" width={32} height={32} />
          <span className="logo-name">Coastal Simple Tools</span>
        </div>
      </header>
      <main className="page-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', gap: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 560 }}>
          <h1 style={{ marginBottom: 12 }}>Simple Tools.<br />Bigger Picture.</h1>
          <p style={{ color: 'var(--muted)', fontSize: 16 }}>
            A collection of clean, no-frills tools built to help you see what matters — fast.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20, width: '100%', maxWidth: 720 }}>
          <Link href="/wordcloud" className="tool-card">
            <div className="card card-p">
              <div style={{ fontSize: 32, marginBottom: 10 }}>☁️</div>
              <h3 style={{ marginBottom: 6 }}>Word Cloud Generator</h3>
              <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Transform unstructured text into a visual word frequency map.</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
