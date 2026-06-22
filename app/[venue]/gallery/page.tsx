import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EaselGalleryView } from '@/components/easel/EaselGalleryView';
import { venuePathForRoute, venueSeoForRoute } from '@/lib/venueSeo';
import { parseVenueSlug } from '@/lib/venueRoutes';
import { venueSlugForRoute } from '@/lib/venueSlugs';

type Props = {
  params: Promise<{ venue: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venue } = await params;
  const route = parseVenueSlug(venue);
  if (!route) return {};
  const seo = venueSeoForRoute(route);
  return {
    title: `Easel gallery — ${seo.title}`,
    description: `Recent NPC easel doodles from ${seo.title}.`,
  };
}

export default async function VenueGalleryPage({ params }: Props) {
  const { venue } = await params;
  const route = parseVenueSlug(venue);
  if (!route) notFound();

  const seo = venueSeoForRoute(route);
  const stageSlug = venueSlugForRoute(route);

  return (
    <EaselGalleryView
      stageSlug={stageSlug}
      venueLabel={seo.title}
      venuePath={venuePathForRoute(route)}
    />
  );
}
