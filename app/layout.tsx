import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChillScreen',
  description: 'Walk forever.',
  openGraph: {
    title: 'ChillScreen',
    description: 'Walk forever.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Browser extensions (Grammarly, etc.) inject attributes onto <body>
          before hydration; suppress the resulting attribute-mismatch warning. */}
      <body
        className={`${inter.className} bg-black overflow-hidden`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
