import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { CharacterStylesTag } from '@/components/game/CharacterStylesTag';
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
  if (slug.toLowerCase() === 'hulaween') {
    return buildPageMetadata({
      title: 'Hulaween Stage — Live Suwannee Sets & AI Festies',
      description:
        'The Hulaween stage on WhichStage streams full festival sets from Suwannee — synchronized for everyone in the room, with multiplayer chat and AI festies.',
      path: '/hula',
      image: '/images/homepage/hula.webp',
      imageAlt: `Hulaween — ${SITE_NAME}`,
    });
  }
  if (!getDb()) return {};

  const userStage = await getUserStagePublicBySlug(slug.toLowerCase());
  if (!userStage || userStage.takenDown || userStage.tier === 'reclaimable') {
    return {};
  }

  const seo = creatorStageSeo(userStage);
  const shareImage = userStage.backdropUrl?.trim() || `${seo.path}/opengraph-image`;
  return buildPageMetadata({
    title: seo.metaTitle,
    description: seo.description,
    path: seo.path,
    keywords: seo.keywords,
    image: shareImage,
    imageAlt: `${seo.name} — ${SITE_NAME}`,
    // Dormant stages stay reachable but drop out of the index to save crawl budget.
    noIndex: userStage.tier === 'dormant',
  });
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;
  if (slug.toLowerCase() === 'hulaween') redirect('/hula');
  if (!getDb()) redirect('/');

  const userStage = await getUserStagePublicBySlug(slug.toLowerCase());
  if (!userStage || userStage.takenDown || userStage.tier === 'reclaimable') {
    redirect('/');
  }

  return (
    <>
      <CharacterStylesTag />
      <JsonLd data={creatorStageGraphJsonLd(userStage)} />
      <Suspense fallback={null}>
        <UserStageShell stage={userStage} />
      </Suspense>
    </>
  );
}
