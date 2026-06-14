import type { Metadata } from 'next';
import { HomeCityPicker } from '@/components/game/HomeCityPicker';
import { JsonLd } from '@/components/JsonLd';
import { venueItemListJsonLd } from '@/lib/jsonLd';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { SITE_DESCRIPTION, SITE_TAGLINE } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: SITE_TAGLINE,
  description: SITE_DESCRIPTION,
  path: '/',
});

export default function Home() {
  return (
    <>
      <JsonLd data={venueItemListJsonLd()} />
      <HomeCityPicker />
    </>
  );
}
