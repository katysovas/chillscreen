import type { Metadata } from 'next';
import SFCity from '@/components/game/SFCity';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '@/lib/site';

export const metadata: Metadata = buildPageMetadata({
  title: SITE_NAME,
  description: `${SITE_TAGLINE} ${SITE_DESCRIPTION}`,
});

export default function Home() {
  return <SFCity />;
}
