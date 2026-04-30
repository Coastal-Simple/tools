import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Percentage Increase Calculator — Coastal Simple Tools',
  description: 'Calculate the percentage increase or decrease between two values instantly.',
};

export default function PercentageIncreaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <Link href="/" className="logo-link">
          <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/logo.png`} alt="Coastal Simple" width={32} height={32} />
          <span className="logo-name">Coastal Simple Tools</span>
        </Link>
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Percentage Increase Calculator</span>
      </header>
      {children}
    </div>
  );
}
