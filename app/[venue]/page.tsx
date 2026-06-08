import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SFCityLoader from '@/components/game/SFCityLoader';
import { JsonLd } from '@/components/JsonLd';
import { invitePageCopy, parseFriendParam } from '@/lib/inviteSeo';
import { breadcrumbJsonLd, webPageJsonLd } from '@/lib/jsonLd';
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
              description: copy.description,
            }),
            breadcrumbJsonLd([
              { name: 'WhichStage', path: '/' },
              { name: seo.title, path },
            ]),
          ],
        }}
      />
      <SFCityLoader spawnWorldOff={worldOffForVenueRoute(route)} venueRoute={route} />
    </>
  );
}
