import { FESTIE_LIVE_DURATION_LABEL } from '@/lib/festie/config';

export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  { q: 'How do I move?', a: 'Arrow keys or A / D. Jump with W, ↑ or space.' },
  { q: 'How do I get more coins?', a: 'Keep an eye on the sidewalk — Ground Score!' },
  { q: 'How do I chat?', a: 'Press Enter to shout. Walk up to someone and press Enter to connect.' },
  { q: 'What are coins for?', a: 'Spend them at the festival store (cart icon) — hats, balloons, stickers.' },
  {
    q: 'What\'s festie life?',
    a: `Full glow while you're here. After you leave, your festie keeps vibing at the stage for ${FESTIE_LIVE_DURATION_LABEL} — then naps until you return. Tap the heart in the corner for the timeline + email recap.`,
  },
];
