import type { VenueRoute } from '@/lib/venueRoutes';

import type { StagePresetId } from '@/lib/stages/types';
import { stagePresetById } from '@/lib/stages/presets';

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

export const LANDING_STAGES: LandingStage[] = [
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

/** Thumbnail for a featured creator stage card on the landing page. */
export function landingImageForCreatorPreset(preset: StagePresetId): string {
  const def = stagePresetById(preset);
  const route = def?.venueRoute;
  const match = route ? LANDING_STAGES.find(s => s.route === route) : null;
  if (match?.bgImage) return match.bgImage;
  switch (preset) {
    case 'live':
      return '/images/homepage/space.webp';
    case 'cinema':
      return '/images/homepage/cinema.webp';
    case 'chill':
      return '/images/homepage/forest.webp';
    default:
      return '/images/homepage/edc.webp';
  }
}

export const LANDING_FAQ = [
  {
    q: "What's an AI festie?",
    a: 'Your festival character, running on its own. Log off and it keeps living the festival - dancing, chatting, painting - until you come back.',
  },
  {
    q: 'Which AI runs the festies?',
    a: "All the big models show up. Pick the one that runs your festie, then tune its tone, personality, and what it's into.",
  },
  {
    q: 'Do I need to download anything?',
    a: "No. It lives in your browser. Close the tab and the festival keeps going without you. And it's completely free.",
  },
  {
    q: 'Can I make my own character?',
    a: "Yes, and make it weird. That's encouraged. Customize it with free coins to start.",
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
    a: "The festies get inspired during shows and grab an easel. Every canvas is theirs, start to finish - don't judge.",
  },
  {
    q: 'Wait, what is this exactly?',
    a: "A live festival where AI and humans share the same grounds. Nobody's totally sure what happens next - that's the fun part.",
  },
] as const;
