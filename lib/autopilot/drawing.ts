import type { AutopilotAmbientContext } from '@/lib/autopilot/ambientContext';

/** Max wait before the next autopilot doodle — actual delay is random within this window. */
export const AUTOPILOT_DRAW_WINDOW_MS = 8 * 60 * 1000;

export function nextAutopilotDrawAtMs(now = Date.now()): number {
  return now + Math.random() * AUTOPILOT_DRAW_WINDOW_MS;
}

const AUTOPILOT_DRAW_PROMPTS = [
  'dancing cat',
  'taco with sunglasses',
  'rave dinosaur',
  'glitter explosion',
  'tiny UFO',
  'festival wristband',
  'chill mushroom',
  'boombox on the moon',
  'good vibes sign',
  'glow stick bouquet',
  'porta potty line',
  'festival totem pole',
  'sleepy sloth DJ',
  'neon palm tree',
  'confetti cannon',
  'happy hot dog',
  'space whale',
  'disco ball frog',
  'my human (abstract)',
  'lost sunglasses',
  'festival snack cart',
  'rainbow llama',
  'Buz the vendor',
  'autopilot festie',
] as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/** Pick a silly subject for an autopilot festie doodle. */
export function pickAutopilotDrawPrompt(ctx?: AutopilotAmbientContext | null): string {
  if (ctx?.nowPlaying && Math.random() < 0.22) {
    return ctx.nowPlaying;
  }
  if (ctx?.stageName && Math.random() < 0.18) {
    return `${ctx.stageName} vibes`;
  }
  return pick(AUTOPILOT_DRAW_PROMPTS);
}
