import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { JsonLd } from '@/components/JsonLd';
import { defaultSiteGraphJsonLd } from '@/lib/jsonLd';
import { rootMetadata } from '@/lib/siteMetadata';
import { CHARACTER_STYLES } from '@/components/game/characterStyles';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-black overflow-hidden`}
        suppressHydrationWarning
      >
        <JsonLd data={defaultSiteGraphJsonLd()} />
        <style dangerouslySetInnerHTML={{ __html: CHARACTER_STYLES }} />
        {children}
      </body>
    </html>
  );
}
