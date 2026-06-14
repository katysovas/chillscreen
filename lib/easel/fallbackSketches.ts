import { npcPoolKey } from './drawingsPool';
import { isDuplicateTopic } from './drawingHistory';
import type { EaselDrawingContext } from './drawingContext';
import type { DrawingProgram, DrawingStroke } from './types';

type Pt = [number, number];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function jitter(seed: number, base: number, spread = 4): number {
  const n = (seed >> (base % 12)) & 7;
  return Math.max(4, Math.min(92, base + n - 3 + (spread > 4 ? (n % 3) : 0)));
}

function jx(seed: number, x: number, spread = 4): number {
  return jitter(seed + x * 17, x, spread);
}

function jy(seed: number, y: number, spread = 4): number {
  return jitter(seed + y * 23, y, spread);
}

function stroke(pi: number, w: number, p: Pt[]): DrawingStroke {
  return { pi, w, p };
}

function projectorScene(seed: number): DrawingStroke[] {
  return [
    stroke(1, 3, [[jx(seed, 18), jy(seed, 58)], [jx(seed, 78), jy(seed, 58)]]),
    stroke(0, 3, [[jx(seed, 22), jy(seed, 58)], [jx(seed, 74), jy(seed, 58)], [jx(seed, 74), jy(seed, 24)], [jx(seed, 22), jy(seed, 24)], [jx(seed, 22), jy(seed, 58)]]),
    stroke(3, 2, [[jx(seed, 28), jy(seed, 30)], [jx(seed, 68), jy(seed, 30)]]),
    stroke(2, 2, [[jx(seed, 34), jy(seed, 38)], [jx(seed, 62), jy(seed, 38)]]),
    stroke(1, 2, [[jx(seed, 48), jy(seed, 72)], [jx(seed, 48), jy(seed, 84)]]),
    stroke(0, 3, [[jx(seed, 40), jy(seed, 72)], [jx(seed, 56), jy(seed, 72)], [jx(seed, 58), jy(seed, 80)], [jx(seed, 38), jy(seed, 80)], [jx(seed, 40), jy(seed, 72)]]),
    stroke(3, 2, [[jx(seed, 44), jy(seed, 58)], [jx(seed, 48), jy(seed, 52)], [jx(seed, 52), jy(seed, 58)]]),
    stroke(3, 2, [[jx(seed, 56), jy(seed, 58)], [jx(seed, 60), jy(seed, 52)], [jx(seed, 64), jy(seed, 58)]]),
    stroke(2, 2, [[jx(seed, 30), jy(seed, 62)], [jx(seed, 36), jy(seed, 66)], [jx(seed, 42), jy(seed, 62)]]),
    stroke(2, 2, [[jx(seed, 54), jy(seed, 62)], [jx(seed, 60), jy(seed, 66)], [jx(seed, 66), jy(seed, 62)]]),
    stroke(1, 2, [[jx(seed, 12), jy(seed, 78)], [jx(seed, 20), jy(seed, 86)], [jx(seed, 28), jy(seed, 78)]]),
    stroke(1, 2, [[jx(seed, 68), jy(seed, 78)], [jx(seed, 76), jy(seed, 86)], [jx(seed, 84), jy(seed, 78)]]),
    stroke(0, 2, [[jx(seed, 8), jy(seed, 88)], [jx(seed, 88), jy(seed, 88)]]),
    stroke(3, 2, [[jx(seed, 14), jy(seed, 12)], [jx(seed, 18), jy(seed, 8)], [jx(seed, 22), jy(seed, 12)]]),
    stroke(3, 2, [[jx(seed, 74), jy(seed, 12)], [jx(seed, 78), jy(seed, 8)], [jx(seed, 82), jy(seed, 12)]]),
    stroke(1, 2, [[jx(seed, 48), jy(seed, 18)], [jx(seed, 52), jy(seed, 14)], [jx(seed, 56), jy(seed, 18)]]),
  ];
}

function popcornScene(seed: number): DrawingStroke[] {
  return [
    stroke(0, 3, [[jx(seed, 34), jy(seed, 50)], [jx(seed, 62), jy(seed, 50)], [jx(seed, 66), jy(seed, 72)], [jx(seed, 30), jy(seed, 72)], [jx(seed, 34), jy(seed, 50)]]),
    stroke(1, 2, [[jx(seed, 38), jy(seed, 54)], [jx(seed, 62), jy(seed, 54)]]),
    stroke(1, 2, [[jx(seed, 38), jy(seed, 60)], [jx(seed, 62), jy(seed, 60)]]),
    stroke(1, 2, [[jx(seed, 38), jy(seed, 66)], [jx(seed, 62), jy(seed, 66)]]),
    stroke(2, 2, [[jx(seed, 40), jy(seed, 44)], [jx(seed, 44), jy(seed, 40)], [jx(seed, 48), jy(seed, 44)]]),
    stroke(2, 2, [[jx(seed, 50), jy(seed, 42)], [jx(seed, 54), jy(seed, 38)], [jx(seed, 58), jy(seed, 42)]]),
    stroke(2, 2, [[jx(seed, 56), jy(seed, 46)], [jx(seed, 60), jy(seed, 42)], [jx(seed, 64), jy(seed, 46)]]),
    stroke(3, 2, [[jx(seed, 42), jy(seed, 58)], [jx(seed, 46), jy(seed, 54)]]),
    stroke(3, 2, [[jx(seed, 52), jy(seed, 58)], [jx(seed, 56), jy(seed, 54)]]),
    stroke(3, 2, [[jx(seed, 48), jy(seed, 64)], [jx(seed, 52), jy(seed, 60)]]),
    stroke(1, 2, [[jx(seed, 46), jy(seed, 72)], [jx(seed, 50), jy(seed, 80)], [jx(seed, 54), jy(seed, 72)]]),
    stroke(0, 2, [[jx(seed, 20), jy(seed, 78)], [jx(seed, 76), jy(seed, 78)]]),
    stroke(1, 2, [[jx(seed, 24), jy(seed, 82)], [jx(seed, 72), jy(seed, 82)]]),
    stroke(2, 2, [[jx(seed, 18), jy(seed, 68)], [jx(seed, 22), jy(seed, 72)], [jx(seed, 26), jy(seed, 68)]]),
    stroke(2, 2, [[jx(seed, 70), jy(seed, 68)], [jx(seed, 74), jy(seed, 72)], [jx(seed, 78), jy(seed, 68)]]),
    stroke(3, 2, [[jx(seed, 30), jy(seed, 28)], [jx(seed, 34), jy(seed, 24)], [jx(seed, 38), jy(seed, 28)]]),
    stroke(3, 2, [[jx(seed, 58), jy(seed, 26)], [jx(seed, 62), jy(seed, 22)], [jx(seed, 66), jy(seed, 26)]]),
  ];
}

function blanketCrowdScene(seed: number): DrawingStroke[] {
  return [
    stroke(0, 3, [[jx(seed, 16), jy(seed, 62)], [jx(seed, 80), jy(seed, 62)], [jx(seed, 84), jy(seed, 84)], [jx(seed, 12), jy(seed, 84)], [jx(seed, 16), jy(seed, 62)]]),
    stroke(1, 2, [[jx(seed, 20), jy(seed, 66)], [jx(seed, 80), jy(seed, 66)]]),
    stroke(1, 2, [[jx(seed, 24), jy(seed, 72)], [jx(seed, 76), jy(seed, 72)]]),
    stroke(1, 2, [[jx(seed, 28), jy(seed, 78)], [jx(seed, 72), jy(seed, 78)]]),
    stroke(2, 3, [[jx(seed, 32), jy(seed, 48)], [jx(seed, 44), jy(seed, 48)], [jx(seed, 44), jy(seed, 62)], [jx(seed, 32), jy(seed, 62)], [jx(seed, 32), jy(seed, 48)]]),
    stroke(1, 2, [[jx(seed, 36), jy(seed, 52)], [jx(seed, 40), jy(seed, 56)]]),
    stroke(2, 3, [[jx(seed, 52), jy(seed, 46)], [jx(seed, 64), jy(seed, 46)], [jx(seed, 64), jy(seed, 62)], [jx(seed, 52), jy(seed, 62)], [jx(seed, 52), jy(seed, 46)]]),
    stroke(1, 2, [[jx(seed, 56), jy(seed, 50)], [jx(seed, 60), jy(seed, 54)]]),
    stroke(0, 2, [[jx(seed, 48), jy(seed, 38)], [jx(seed, 48), jy(seed, 44)]]),
    stroke(3, 2, [[jx(seed, 44), jy(seed, 36)], [jx(seed, 52), jy(seed, 36)]]),
    stroke(1, 2, [[jx(seed, 10), jy(seed, 58)], [jx(seed, 14), jy(seed, 54)], [jx(seed, 18), jy(seed, 58)]]),
    stroke(1, 2, [[jx(seed, 78), jy(seed, 58)], [jx(seed, 82), jy(seed, 54)], [jx(seed, 86), jy(seed, 58)]]),
    stroke(3, 2, [[jx(seed, 22), jy(seed, 32)], [jx(seed, 26), jy(seed, 28)], [jx(seed, 30), jy(seed, 32)]]),
    stroke(3, 2, [[jx(seed, 66), jy(seed, 30)], [jx(seed, 70), jy(seed, 26)], [jx(seed, 74), jy(seed, 30)]]),
    stroke(2, 2, [[jx(seed, 38), jy(seed, 88)], [jx(seed, 42), jy(seed, 92)], [jx(seed, 46), jy(seed, 88)]]),
    stroke(2, 2, [[jx(seed, 50), jy(seed, 90)], [jx(seed, 54), jy(seed, 94)], [jx(seed, 58), jy(seed, 90)]]),
    stroke(1, 2, [[jx(seed, 6), jy(seed, 48)], [jx(seed, 90), jy(seed, 48)]]),
  ];
}

function fogMarqueeScene(seed: number): DrawingStroke[] {
  return [
    stroke(1, 2, [[jx(seed, 8), jy(seed, 40)], [jx(seed, 88), jy(seed, 40)]]),
    stroke(1, 2, [[jx(seed, 8), jy(seed, 52)], [jx(seed, 88), jy(seed, 52)]]),
    stroke(1, 2, [[jx(seed, 8), jy(seed, 64)], [jx(seed, 88), jy(seed, 64)]]),
    stroke(0, 3, [[jx(seed, 28), jy(seed, 18)], [jx(seed, 68), jy(seed, 18)], [jx(seed, 72), jy(seed, 36)], [jx(seed, 24), jy(seed, 36)], [jx(seed, 28), jy(seed, 18)]]),
    stroke(3, 2, [[jx(seed, 32), jy(seed, 22)], [jx(seed, 64), jy(seed, 22)]]),
    stroke(3, 2, [[jx(seed, 34), jy(seed, 28)], [jx(seed, 62), jy(seed, 28)]]),
    stroke(2, 2, [[jx(seed, 36), jy(seed, 32)], [jx(seed, 60), jy(seed, 32)]]),
    stroke(1, 2, [[jx(seed, 30), jy(seed, 36)], [jx(seed, 34), jy(seed, 44)]]),
    stroke(1, 2, [[jx(seed, 62), jy(seed, 36)], [jx(seed, 66), jy(seed, 44)]]),
    stroke(0, 2, [[jx(seed, 20), jy(seed, 72)], [jx(seed, 76), jy(seed, 72)]]),
    stroke(0, 2, [[jx(seed, 24), jy(seed, 78)], [jx(seed, 72), jy(seed, 78)]]),
    stroke(0, 2, [[jx(seed, 28), jy(seed, 84)], [jx(seed, 68), jy(seed, 84)]]),
    stroke(2, 2, [[jx(seed, 14), jy(seed, 46)], [jx(seed, 18), jy(seed, 50)], [jx(seed, 22), jy(seed, 46)]]),
    stroke(2, 2, [[jx(seed, 74), jy(seed, 48)], [jx(seed, 78), jy(seed, 52)], [jx(seed, 82), jy(seed, 48)]]),
    stroke(3, 2, [[jx(seed, 44), jy(seed, 8)], [jx(seed, 48), jy(seed, 4)], [jx(seed, 52), jy(seed, 8)]]),
    stroke(1, 2, [[jx(seed, 46), jy(seed, 56)], [jx(seed, 50), jy(seed, 60)], [jx(seed, 54), jy(seed, 56)]]),
    stroke(1, 2, [[jx(seed, 40), jy(seed, 88)], [jx(seed, 60), jy(seed, 88)]]),
  ];
}

const SCENES: { topic: string; build: (seed: number) => DrawingStroke[] }[] = [
  { topic: 'projector glow', build: projectorScene },
  { topic: 'popcorn bucket', build: popcornScene },
  { topic: 'blanket rows', build: blanketCrowdScene },
  { topic: 'fog marquee', build: fogMarqueeScene },
];

function uniqueDrawingId(npcKey: string): string {
  return `fb_${npcKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Rich procedural sketch when the LLM is unavailable — 15+ strokes, scene templates. */
export function buildRichFallbackProgram(ctx: EaselDrawingContext): DrawingProgram {
  const npcKey = npcPoolKey(ctx.npcId);
  const seed = hashSeed(ctx.uniqueNonce);

  const contextual = [
    ctx.streamTitle ? `${ctx.streamTitle.split(/\s+/).slice(0, 3).join(' ')}` : null,
    ctx.seedPrompt ? ctx.seedPrompt.slice(0, 36) : null,
    `${ctx.skyPeriod} lawn`,
    ctx.vibe ? `${ctx.vibe.slice(0, 28)}` : null,
  ].filter((t): t is string => Boolean(t?.trim()));

  let sceneIndex = seed % SCENES.length;
  for (let i = 0; i < SCENES.length; i++) {
    const idx = (sceneIndex + i) % SCENES.length;
    if (!isDuplicateTopic(SCENES[idx]!.topic, ctx.priorTopics)) {
      sceneIndex = idx;
      break;
    }
  }

  let topic = contextual.find(t => !isDuplicateTopic(t, ctx.priorTopics))
    ?? SCENES[sceneIndex]!.topic;
  if (isDuplicateTopic(topic, ctx.priorTopics)) {
    topic = `${SCENES[sceneIndex]!.topic} ${ctx.uniqueNonce.slice(-4)}`;
  }

  const strokes = SCENES[sceneIndex]!.build(seed);

  return {
    id: uniqueDrawingId(npcKey),
    npc: npcKey,
    model: 'fallback',
    topic: topic.slice(0, 48),
    strokes,
  };
}
