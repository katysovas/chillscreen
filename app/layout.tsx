import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChillScreen — Full-screen ambient scenes',
  description: 'Full-screen looping ambient videos with optional ambient audio. Breathe.',
  openGraph: {
    title: 'ChillScreen',
    description: 'Full-screen ambient scenes for focus, rest, and calm.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black overflow-hidden`}>{children}</body>
    </html>
  );
}
