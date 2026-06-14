import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import SFCityLoader from '@/components/game/SFCityLoader';
import { VenueBootOverlay } from '@/components/game/VenueBootOverlay';
import { JsonLd } from '@/components/JsonLd';
import { invitePageCopy, parseFriendParam } from '@/lib/inviteSeo';
import { breadcrumbJsonLd, festivalStageJsonLd, webPageJsonLd } from '@/lib/jsonLd';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { venueSeoForRoute, venuePathForRoute } from '@/lib/venueSeo';
import { parseVenueSlug, VENUE_SLUGS, worldOffForVenueRoute } from '@/lib/venueRoutes';

export const dynamicParams = true;

export function generateStaticParams() {
  return VENUE_SLUGS.map(venue => ({ venue }));
}

type VenuePageProps = {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ friend?: string | string[] }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: VenuePageProps): Promise<Metadata> {
  const { venue } = await params;
  const route = parseVenueSlug(venue);
  if (!route) return {};

  const seo = venueSeoForRoute(route);
  const friendName = parseFriendParam((await searchParams).friend);
  const copy = invitePageCopy(seo, friendName);
  const path = venuePathForRoute(route);

  return buildPageMetadata({
    title: copy.title,
    description: copy.description,
    path,
    keywords: [...seo.keywords, ...seo.title.split(' ')],
  });
}

export default async function VenuePage({ params, searchParams }: VenuePageProps) {
  const { venue } = await params;
  const route = parseVenueSlug(venue);
  if (!route) redirect('/');

  const seo = venueSeoForRoute(route);
  const friendName = parseFriendParam((await searchParams).friend);
  const copy = invitePageCopy(seo, friendName);
  const path = venuePathForRoute(route);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            webPageJsonLd({
              path,
              title: copy.title,
              description: seo.longDescription,
            }),
            festivalStageJsonLd(route),
            breadcrumbJsonLd([
              { name: 'WhichStage', path: '/' },
              { name: 'Stages', path: '/stages' },
              { name: seo.title, path },
            ]),
          ],
        }}
      />
      <VenueBootOverlay />
      <Suspense fallback={null}>
        <SFCityLoader
          spawnWorldOff={worldOffForVenueRoute(route)}
          venueRoute={route}
          serverBootOverlay
        />
      </Suspense>
    </>
  );
}
