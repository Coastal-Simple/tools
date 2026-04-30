import Link from 'next/link';
import Image from 'next/image';

export default function WordCloudLanding() {
  return (
    <main className="page-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', gap: 48, paddingTop: 48, paddingBottom: 48 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, maxWidth: 680, width: '100%', textAlign: 'center' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', width: '100%', maxWidth: 500, borderRadius: 16 }}>
          <Image
            src="/wordcloud.png"
            alt="Word cloud example"
            width={500}
            height={280}
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
            priority
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ fontSize: '2.2rem' }}>Word Cloud Generator</h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--muted)', maxWidth: 580 }}>
            At Coastal Simple, we believe that the clearest path to action starts with seeing the bigger picture—fast.
            That&apos;s why we built this tool: a clean, no-frills word cloud generator that transforms your unstructured
            data into an easy-to-read visual summary. Whether you&apos;re surfacing key themes, simplifying feedback, or
            highlighting trends, this tool helps you cut through the noise and focus on what matters.
            Just like everything we do, it&apos;s built to be simple, effective, and actually useful.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/wordcloud/import" className="btn btn-primary btn-lg">
            Get Started →
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 32, fontSize: 13.5, color: 'var(--muted)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>✓ Paste or upload text</span>
          <span>✓ Smart word filtering</span>
          <span>✓ Fully customizable</span>
          <span>✓ Export PNG, JPG, SVG</span>
        </div>
      </div>
    </main>
  );
}
