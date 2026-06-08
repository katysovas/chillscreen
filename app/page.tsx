import type { Metadata } from 'next';
import SFCityLoader from '@/components/game/SFCityLoader';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { SITE_DESCRIPTION, SITE_TAGLINE } from '@/lib/site';

export const metadata: Metadata = buildPageMetadata({
  title: SITE_TAGLINE,
  description: `${SITE_TAGLINE} ${SITE_DESCRIPTION}`,
});

export default function Home() {
  return <SFCityLoader />;
}
