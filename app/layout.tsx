import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChillScreen — A calm Home tab for Slack',
  description:
    'Pick a calming wallpaper scene for your Slack Home tab. One click. No noise.',
  openGraph: {
    title: 'ChillScreen',
    description: 'A calm Home tab for Slack. Pick your scene. Breathe.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
