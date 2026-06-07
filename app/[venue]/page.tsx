import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SFCity from '@/components/game/SFCity';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd, webPageJsonLd } from '@/lib/jsonLd';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { venueSeoForRoute } from '@/lib/venueSeo';
import { parseVenueSlug, VENUE_SLUGS, worldOffForVenueRoute } from '@/lib/venueRoutes';

export function generateStaticParams() {
  return VENUE_SLUGS.map(venue => ({ venue }));
}

type VenuePageProps = {
  params: Promise<{ venue: string }>;
};

export async function generateMetadata({ params }: VenuePageProps): Promise<Metadata> {
  const { venue } = await params;
  const route = parseVenueSlug(venue);
  if (!route) return {};

  const seo = venueSeoForRoute(route);
  return buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: `/${seo.slug}`,
  });
}

export default async function VenuePage({ params }: VenuePageProps) {
  const { venue } = await params;
  const route = parseVenueSlug(venue);
  if (!route) notFound();

  const seo = venueSeoForRoute(route);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            webPageJsonLd({
              path: `/${seo.slug}`,
              title: seo.title,
              description: seo.description,
            }),
            breadcrumbJsonLd([
              { name: 'WhichStage', path: '/' },
              { name: seo.title, path: `/${seo.slug}` },
            ]),
          ],
        }}
      />
      <SFCity spawnWorldOff={worldOffForVenueRoute(route)} venueRoute={route} />
    </>
  );
}
