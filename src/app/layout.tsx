import type { Metadata } from 'next';
import './globals.css';

const FAVICON = 'https://img1.wsimg.com/isteam/ip/ba63e074-0c88-4995-94dc-90f07caf9d90/favicon/cb68b57d-e82b-4a76-b5e0-abdfb1172d9c/2a978b5a-439c-4ee1-86ae-2a9768839a54.png';

export const metadata: Metadata = {
  title: 'Coastal Simple Tools',
  description: 'Simple, effective tools by Coastal Simple.',
  icons: {
    icon: [
      { url: `${FAVICON}/:/rs=w:16,h:16,m`, sizes: '16x16' },
      { url: `${FAVICON}/:/rs=w:24,h:24,m`, sizes: '24x24' },
      { url: `${FAVICON}/:/rs=w:32,h:32,m`, sizes: '32x32' },
      { url: `${FAVICON}/:/rs=w:48,h:48,m`, sizes: '48x48' },
      { url: `${FAVICON}/:/rs=w:64,h:64,m`, sizes: '64x64' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
