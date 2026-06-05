import { notFound } from 'next/navigation';
import SFCity from '@/components/game/SFCity';
import { parseVenueSlug, VENUE_SLUGS, worldOffForVenueRoute } from '@/lib/venueRoutes';

export function generateStaticParams() {
  return VENUE_SLUGS.map(venue => ({ venue }));
}

type VenuePageProps = {
  params: Promise<{ venue: string }>;
};

export default async function VenuePage({ params }: VenuePageProps) {
  const { venue } = await params;
  const route = parseVenueSlug(venue);
  if (!route) notFound();

  return <SFCity spawnWorldOff={worldOffForVenueRoute(route)} />;
}
