import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { UserStageShell } from '@/components/create/UserStageShell';
import { getUserStagePublicBySlug } from '@/lib/stages/db';
import { getDb } from '@/lib/db';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd, webPageJsonLd } from '@/lib/jsonLd';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { stagePathForSlug } from '@/lib/stages/runtime';

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

  const path = stagePathForSlug(userStage.slug);
  return buildPageMetadata({
    title: `${userStage.slug} — WhichStage`,
    description: `Watch and hang out on ${userStage.slug}, a creator stage on WhichStage.`,
    path,
    keywords: ['stage', 'stream', userStage.slug],
  });
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;
  if (!getDb()) redirect('/');

  const userStage = await getUserStagePublicBySlug(slug.toLowerCase());
  if (!userStage || userStage.takenDown || userStage.tier === 'reclaimable') {
    redirect('/');
  }

  const path = stagePathForSlug(userStage.slug);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            webPageJsonLd({
              path,
              title: `${userStage.slug} — WhichStage`,
              description: 'Creator stage on WhichStage.',
            }),
            breadcrumbJsonLd([
              { name: 'WhichStage', path: '/' },
              { name: userStage.slug, path },
            ]),
          ],
        }}
      />
      <Suspense fallback={null}>
        <UserStageShell stage={userStage} />
      </Suspense>
    </>
  );
}
