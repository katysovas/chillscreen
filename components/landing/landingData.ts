import type { VenueRoute } from '@/lib/venueRoutes';
import type { StagePickerTarget } from '@/lib/stagePickerOptions';
import type { FeaturedStageSummary, StagePresetId } from '@/lib/stages/types';
import { stagePresetById } from '@/lib/stages/presets';
import { isHiddenVenueRoute } from '@/lib/hiddenVenues';

export const LANDING_TRENDING_JOIN_LABEL = 'Join the stage';

export type TrendingStageRow = {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  target: StagePickerTarget;
};

export type LandingStage = {
  route: VenueRoute;
  name: string;
  desc?: string;
  /** Layout emphasis on the landing grid (not the DB featured flag). */
  highlight?: boolean;
  live?: boolean;
  layout: 'featured' | 'right' | 'small';
  background: string;
  accent: string;
  bgImage?: string;
};

const LANDING_STAGES_ALL: LandingStage[] = [
  {
    route: 'deep-space',
    name: 'Deep Space',
    desc: 'Drift through the cosmos when the night goes deep and slow.',
    highlight: true,
    live: true,
    layout: 'featured',
    background: 'radial-gradient(ellipse at 40% 60%,#0d1a2e 0%,#090a0f 100%)',
    accent: '#8ed4ff',
    bgImage: '/images/homepage/space.webp',
  },
  {
    route: 'coachella',
    name: 'The Desert',
    desc: 'Golden-hour main-stage energy out in the desert. Inspired by Coachella.',
    layout: 'right',
    background: 'radial-gradient(ellipse at 40% 80%,#2e1408 0%,#0e0806 100%)',
    accent: '#f07c2a',
    bgImage: '/images/homepage/thedesert.webp',
  },
  {
    route: 'forest',
    name: 'The Forest',
    desc: 'Get lost in the woods. Inspired by Electric Forest.',
    layout: 'right',
    background: '#060e07',
    accent: '#6eedc0',
    bgImage: '/images/homepage/forest.webp',
  },
  {
    route: 'hula',
    name: 'Hulaween',
    desc: 'Hula family hangout — full sets from Suwannee.',
    highlight: true,
    live: true,
    layout: 'right',
    background: 'radial-gradient(ellipse at 50% 80%,#0e1a08 0%,#090e06 100%)',
    accent: '#50b87a',
    bgImage: '/images/homepage/hula.webp',
  },
  {
    route: 'headliner',
    name: 'The Headliner',
    desc: 'Iconic main-stage sets under a starry night forest.',
    layout: 'small',
    background: 'radial-gradient(ellipse at 50% 80%,#0e1a08 0%,#090e06 100%)',
    accent: '#50b87a',
    bgImage: '/images/homepage/forest.webp',
  },
  {
    route: 'silent-disco',
    name: 'Silent Disco',
    desc: 'Headsets on, dance till the sun comes up.',
    layout: 'small',
    background: '#06080e',
    accent: '#94a8ff',
    bgImage: '/images/homepage/silentdisco.webp',
  },
  {
    route: 'cinema',
    name: 'Chill Cinema',
    desc: 'Take a breather with chill sets under the SF skyline.',
    layout: 'small',
    background: 'radial-gradient(ellipse at 50% 80%,#1c1508 0%,#0e0c06 100%)',
    accent: '#e8c040',
    bgImage: '/images/homepage/cinema.webp',
  },
  {
    route: 'edc',
    name: 'Las Vegas',
    desc: 'Neon, lasers, and bass with the Strip at your back. Inspired by EDC.',
    layout: 'small',
    background: 'radial-gradient(ellipse at 50% 80%,#1e0808 0%,#0c0606 100%)',
    accent: '#ff3a1a',
    bgImage: '/images/homepage/edc.webp',
  },
  {
    route: 'outside-hands',
    name: 'San Francisco',
    desc: 'Nonstop sets, SF style. Inspired by Outside Lands.',
    layout: 'small',
    background: 'radial-gradient(ellipse at 50% 80%,#0e1a08 0%,#090e06 100%)',
    accent: '#a8d840',
    bgImage: '/images/homepage/sf.webp',
  },
  {
    route: 'tentaroo',
    name: 'The Farm',
    desc: 'Camp out in the fields where the music never stops. Inspired by Bonnaroo.',
    layout: 'small',
    background: '#0e0c08',
    accent: '#ffb885',
    bgImage: '/images/homepage/thefarm.webp',
  },
  {
    route: 'seattle-concerts',
    name: 'Seattle',
    desc: 'Festival energy under Seattle skies.',
    layout: 'small',
    background: 'radial-gradient(ellipse at 50% 80%,#0a1408 0%,#070e06 100%)',
    accent: '#8fd49a',
    bgImage: '/images/homepage/seatlle.webp',
  },
];

export const LANDING_STAGES = LANDING_STAGES_ALL.filter(
  stage => !isHiddenVenueRoute(stage.route),
);

/** Thumbnail for a featured creator stage on the landing page. */
export function landingImageForCreatorPreset(preset: StagePresetId): string {
  const def = stagePresetById(preset);
  const route = def?.venueRoute;
  const match = route ? LANDING_STAGES.find(s => s.route === route) : null;
  if (match?.bgImage) return match.bgImage;
  switch (preset) {
    case 'live':
    case 'chill':
      return '/images/homepage/forest.webp';
    case 'cinema':
      return '/images/homepage/cinema.webp';
    default:
      return '/images/homepage/edc.webp';
  }
}

export function thumbnailForFeaturedStage(stage: FeaturedStageSummary): string {
  if (stage.backdropUrl?.trim()) return stage.backdropUrl;
  return landingImageForCreatorPreset(stage.preset);
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Featured creator stages, then all built-in venue stages. */
export function buildTrendingStageRows(
  featured: FeaturedStageSummary[],
  options?: { randomOrder?: boolean },
): TrendingStageRow[] {
  const creators: TrendingStageRow[] = featured.map(stage => ({
    id: `creator:${stage.slug}`,
    name: stage.displayName,
    description: stage.description?.trim()
      || stagePresetById(stage.preset)?.tagline
      || 'Creator stage',
    thumbnail: thumbnailForFeaturedStage(stage),
    target: { kind: 'creator', slug: stage.slug },
  }));

  const venues: TrendingStageRow[] = LANDING_STAGES.map(stage => ({
    id: `venue:${stage.route}`,
    name: stage.name,
    description: stage.desc ?? '',
    thumbnail: stage.bgImage ?? null,
    target: { kind: 'venue', route: stage.route },
  }));

  const rows = [...creators, ...venues];
  return options?.randomOrder ? shuffleArray(rows) : rows;
}

export const LANDING_FAQ = [
  {
    q: "What's an AI festie?",
    a: 'Your festival character, running on its own. Log off and it keeps living the festival - dancing, chatting, painting - until you come back.',
  },
  {
    q: 'Do I need to download anything?',
    a: "No. It lives in your browser. Close the tab and the festival keeps going without you. And it's completely free.",
  },
  {
    q: 'Can I make my own character?',
    a: "Yes, and make it weird. That's encouraged. Add some character and customize it with free coins to start.",
  },
  {
    q: 'How do I get coins?',
    a: 'Coins dropped across the grounds. Heads down, eyes open, finders keepers.',
  },
  {
    q: 'Is the music real?',
    a: 'The shows are real, live, and streaming in. The crowd is the experiment.',
  },
  {
    q: "What's with all the paintings?",
    a: "The festies get inspired during shows and grab an easel. Every canvas is theirs, start to finish - don't judge. Ask them to paint something for you.",
  },
  {
    q: 'Wait, what is this exactly?',
    a: "A live festival where AI and humans share the same grounds. Nobody's totally sure what happens next - that's the fun part.",
  },
] as const;
