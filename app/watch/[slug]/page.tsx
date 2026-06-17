import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { UserStageShell } from '@/components/create/UserStageShell';
import { getUserStagePublicBySlug } from '@/lib/stages/db';
import { getDb } from '@/lib/db';
import { JsonLd } from '@/components/JsonLd';
import { creatorStageGraphJsonLd } from '@/lib/jsonLd';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { SITE_NAME } from '@/lib/site';
import { creatorStageSeo } from '@/lib/stages/creatorSeo';

export const dynamicParams = true;

type WatchPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!getDb()) return {};

  const userStage = await getUserStagePublicBySlug(slug.toLowerCase());
  if (!userStage || userStage.takenDown || userStage.tier === 'reclaimable') {
    return {};
  }

  const seo = creatorStageSeo(userStage);
  return buildPageMetadata({
    title: seo.metaTitle,
    description: seo.description,
    path: seo.path,
    keywords: seo.keywords,
    image: `${seo.path}/opengraph-image`,
    imageAlt: `${seo.name} — ${SITE_NAME}`,
    // Dormant stages stay reachable but drop out of the index to save crawl budget.
    noIndex: userStage.tier === 'dormant',
  });
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;
  if (!getDb()) redirect('/');

  const userStage = await getUserStagePublicBySlug(slug.toLowerCase());
  if (!userStage || userStage.takenDown || userStage.tier === 'reclaimable') {
    redirect('/');
  }

  return (
    <>
      <JsonLd data={creatorStageGraphJsonLd(userStage)} />
      <Suspense fallback={null}>
        <UserStageShell stage={userStage} />
      </Suspense>
    </>
  );
}
