import type { Metadata } from 'next';
import { HomeCityPicker } from '@/components/game/HomeCityPicker';
import { LANDING_FAQ } from '@/components/landing/landingData';
import { JsonLd } from '@/components/JsonLd';
import { homePageGraphJsonLd } from '@/lib/jsonLd';
import {
  LANDING_PAGE_DESCRIPTION,
  LANDING_PAGE_KEYWORDS,
  LANDING_PAGE_TITLE,
} from '@/lib/landingSeo';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { getLandingCreatorStageCount } from '@/lib/landing/stageStats';

export const metadata: Metadata = buildPageMetadata({
  title: LANDING_PAGE_TITLE,
  description: LANDING_PAGE_DESCRIPTION,
  path: '/',
  keywords: LANDING_PAGE_KEYWORDS,
});

export default async function Home() {
  const creatorStageCount = await getLandingCreatorStageCount();

  return (
    <>
      <JsonLd data={homePageGraphJsonLd(LANDING_FAQ)} />
      <HomeCityPicker initialCreatorStageCount={creatorStageCount} />
    </>
  );
}
