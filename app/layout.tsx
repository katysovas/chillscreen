import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { JsonLd } from '@/components/JsonLd';
import { defaultSiteGraphJsonLd } from '@/lib/jsonLd';
import { rootMetadata } from '@/lib/siteMetadata';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = rootMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-black overflow-hidden`}
        suppressHydrationWarning
      >
        <JsonLd data={defaultSiteGraphJsonLd()} />
        {children}
      </body>
    </html>
  );
}
