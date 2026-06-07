import type { Metadata } from 'next';
import SFCity from '@/components/game/SFCity';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { SITE_DESCRIPTION } from '@/lib/site';

export const metadata: Metadata = buildPageMetadata({
  description: SITE_DESCRIPTION,
});

export default function Home() {
  return <SFCity />;
}
