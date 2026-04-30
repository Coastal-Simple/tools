import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coastal Simple Tools',
  description: 'Simple, effective tools by Coastal Simple.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
