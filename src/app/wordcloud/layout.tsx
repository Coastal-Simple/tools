import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Word Cloud Generator — Coastal Simple Tools',
  description: 'Transform your unstructured data into a visual word cloud.',
};

export default function WordCloudLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <Link href="/" className="logo-link">
          <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/logo.png`} alt="Coastal Simple" width={32} height={32} />
          <span className="logo-name">Coastal Simple Tools</span>
        </Link>
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Word Cloud Generator</span>
      </header>
      {children}
    </div>
  );
}
