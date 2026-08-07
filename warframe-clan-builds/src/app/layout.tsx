import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clan Builds — Archivio Warframe',
  description: 'Archivio privato delle build del clan: Warframe, armi e companion.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="dark">
      <body>{children}</body>
    </html>
  );
}
