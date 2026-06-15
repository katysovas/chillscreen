import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import { JsonLd } from '@/components/JsonLd';
import { PostHogPageView } from '@/components/PostHogPageView';
import { defaultSiteGraphJsonLd } from '@/lib/jsonLd';
import { rootMetadata } from '@/lib/siteMetadata';
import { CHARACTER_STYLES } from '@/components/game/characterStyles';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-black`}
        suppressHydrationWarning
      >
        <JsonLd data={defaultSiteGraphJsonLd()} />
        <style dangerouslySetInnerHTML={{ __html: CHARACTER_STYLES }} />
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
