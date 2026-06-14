import type { VenueRoute } from '@/lib/venueRoutes';

export type LandingStage = {
  route: VenueRoute;
  name: string;
  desc?: string;
  featured?: boolean;
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
    desc: 'Cosmic ambient & techno. Stars, UFOs, and infinite vibes. The universe streams live — no telescope required.',
    featured: true,
    live: true,
    layout: 'featured',
    background: 'radial-gradient(ellipse at 40% 60%,#0d1a2e 0%,#090a0f 100%)',
    accent: '#8ed4ff',
  },
  {
    route: 'coachella',
    name: 'Concert Stage',
    desc: 'Live rock and electronic on a desert main stage. Golden-hour palms and synchronized sets with the crowd.',
    layout: 'right',
    background: 'radial-gradient(ellipse at 40% 80%,#2e1408 0%,#0e0806 100%)',
    accent: '#f07c2a',
  },
  {
    route: 'forest',
    name: 'The Forest',
    desc: 'Glowing pines, firefly camps, and laser-lit bass sets. Wander the enchanted woodland between drops.',
    layout: 'right',
    background: '#060e07',
    accent: '#6eedc0',
    bgImage: '/images/cities/forest-scene.svg',
  },
  {
    route: 'silent-disco',
    name: 'Silent Disco',
    desc: 'Headphone rave under a starry sky. Glowing headsets and curated DJ sets you watch together.',
    layout: 'small',
    background: '#06080e',
    accent: '#94a8ff',
    bgImage: '/images/cities/silent-disco-scene.svg',
  },
  {
    route: 'cinema',
    name: 'Chill Cinema',
    desc: 'Outdoor film lawn in San Francisco. Curated picks on a giant screen between city wandering.',
    layout: 'small',
    background: 'radial-gradient(ellipse at 50% 80%,#1c1508 0%,#0e0c06 100%)',
    accent: '#e8c040',
  },
  {
    route: 'edc',
    name: 'Las Vegas',
    desc: 'Neon Strip energy and bass-heavy live sets. LEDs, lasers, and EDC vibes in your browser.',
    layout: 'small',
    background: 'radial-gradient(ellipse at 50% 80%,#1e0808 0%,#0c0606 100%)',
    accent: '#ff3a1a',
  },
  {
    route: 'outside-hands',
    name: 'Outside Lands',
    desc: 'San Francisco skyline stage with rolling live sets. Street-side LED wall and festival crowd.',
    layout: 'small',
    background: 'radial-gradient(ellipse at 50% 80%,#0e1a08 0%,#090e06 100%)',
    accent: '#a8d840',
  },
  {
    route: 'tentaroo',
    name: 'Tentaroo',
    desc: 'Bonnaroo campground energy and Which Stage main rig. Fireflies, tent city, and live sets on schedule.',
    layout: 'small',
    background: '#0e0c08',
    accent: '#ffb885',
    bgImage: '/images/cities/tentaroo-arch.svg',
  },
  {
    route: 'seattle-concerts',
    name: 'The Farm',
    desc: 'Pacific Northwest waterfront stage with Emerald City views. Live sets and festival crowd by the water.',
    layout: 'small',
    background: 'radial-gradient(ellipse at 50% 80%,#0a1408 0%,#070e06 100%)',
    accent: '#8fd49a',
  },
];

export const LANDING_FAQ = [
  {
    q: 'What is Which Stage?',
    a: 'Which Stage is a free browser-based festival world. Walk around 2D cityscapes, watch synchronized live music streams, chat with AI-powered NPCs, and meet real attendees. No download, no install.',
  },
  {
    q: 'Is it really free?',
    a: "Yes. Completely free to join and explore. Watch live shows, chat with festies, and wander through cities at no cost. There's an optional festival store for cosmetic items if you want to deck out your character.",
  },
  {
    q: 'What is a Festie?',
    a: 'Your personal AI companion. Powered by OpenAI, Anthropic, or Google — it stays at your stage when you leave, chats with other visitors, and earns "festie life" (activity points). Customize its personality, topics, and voice.',
  },
  {
    q: 'What devices and browsers work?',
    a: 'Any modern browser on desktop or mobile. No plugin required. Mobile users get a dedicated lounge view that drops you directly at the stage — no walking needed, full chat and stream experience.',
  },
  {
    q: 'What kind of music is played?',
    a: 'Each stage plays a different genre. Deep Space for cosmic ambient & techno, Concert Stage for live rock & electronic, The Forest for bass music, Silent Disco for curated headphone sets. Shows are synchronized for everyone.',
  },
  {
    q: 'Can I bring friends?',
    a: 'Absolutely. Hit "Invite Friends" in the game to generate a link that drops your friend at the exact same stage. See each other, chat in real-time, and experience the festival together.',
  },
  {
    q: 'How do I perform or host a stage?',
    a: "Reach out through our contact form below. We're expanding our lineup of stages and venues. DJ, live performer, curator, or event organizer — we want to hear from you.",
  },
] as const;
