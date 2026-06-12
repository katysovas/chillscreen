import { loadoutItem, LOADOUT_CATALOG } from '@/components/game/characters/loadout/catalog';
import { wanderingCharacters } from '@/lib/chatterCast';
import { FESTIE_CONFIG } from '@/lib/festie/config';
import type { LifeLogKind } from '@/lib/festie/events';
import { listActiveFestiesForStage } from '@/lib/festie/db';
import type { FestieRow } from '@/lib/festie/types';
import { ownedItemIds } from '@/lib/player/loadoutValidation';
import { getPlayerProfile } from '@/lib/player/db';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import {
  DEFAULT_STAGE_SYNC,
  scheduleFor,
  type StageChannel,
} from '@/lib/stageVideos';
import { MOBILE_LOUNGE_STAGES } from '@/lib/mobileLounge';
import { parseVenueSlug, type VenueRoute } from '@/lib/venueSlugs';

export type LifeLogRng = () => number;

export type LifeLogContext = {
  festie: FestieRow;
  at: Date;
  since: Date;
  until: Date;
  rng: LifeLogRng;
  venueLabel: string;
  route: VenueRoute | null;
  npcPool: { id: string; displayName: string }[];
  peerFestieCount: number;
  ownerOwnedItemNames: string[];
};

type LifeLogResult = { kind: LifeLogKind; text: string } | null;

type LifeLogGenerator = (ctx: LifeLogContext) => LifeLogResult;

const FLAVOR_NPC_NAMES = [
  'baz', 'sunshine', 'greg', 'river', 'nova', 'peach', 'riff', 'cleo',
];

const OVERHEARD_LINES = [
  'I swear that drop reset my whole personality',
  'does anyone know where the silent disco moved to',
  'this is the best $18 water I have ever had',
  'tell your festie I said hi',
  'we are absolutely not ready for the next act and that is the point',
  'whoever brought the inflatable dinosaur is the real headliner',
  'I lost my friends but found a new favorite song',
  'the bass is doing my taxes',
  'pretty sure the ferris wheel winked at me',
  'if this set ends I will simply cease to exist',
  'someone said there is free glitter near the art cars',
  'I came for one song and stayed for the whole vibe shift',
];

const LANDMARKS = [
  'the main stage',
  'the ferris wheel',
  'the art cars',
  'the beer garden',
  'the bridge',
  'the glow tunnel',
  'the vendor row',
  'the lawn',
  'the neon arch',
  'the side stage',
];

const FAILED_PLANS = [
  '{npc} tried to start a conga line. it did not take',
  '{npc} attempted a crowd surf on a pool float. security waved politely',
  '{npc} organized a flash mob. three people showed up. it ruled',
  '{npc} promised a sunrise set location. nobody could find it',
  '{npc} tried to teach everyone a dance. everyone kept walking',
  '{npc} started a chant. it peaked at two people',
  '{npc} brought a megaphone. immediately lost it',
  '{npc} planned a group photo. the photo is just shoes',
];

const SCENERY = [
  '{npc} watched the fog roll in over the bridge. said it was the best set of the night',
  '{npc} stared at the lasers until they forgot what day it was',
  '{npc} said the sunset looked like a album cover',
  '{npc} watched the crowd light up and called it choreography',
  '{npc} claimed the moon was doing backup vocals',
  '{npc} watched the stage lights hit the trees and refused to move',
  '{npc} said the fog machine deserved a headlining slot',
];

const FOOD_INCIDENTS = [
  '{npc} dropped a corn dog and ate it anyway',
  '{npc} traded half a burrito for a fan',
  '{npc} bought two pretzels and ate them in the wrong order on purpose',
  '{npc} spilled lemonade and declared it performance art',
  '{npc} ate a whole pizza slice in one bite. witnesses applauded',
  '{npc} found a fry on the ground. considered it. moved on',
];

const NPC_INTERACTIONS = [
  '{a} asked {b} a lot of questions. {b} left',
  '{a} tried to explain the set list to {b}. {b} nodded and walked away',
  '{a} and {b} argued about the best genre. both were wrong',
  '{a} borrowed {b}\'s fan. returned it with extra glitter',
  '{a} told {b} a secret about the afterparty. {b} already knew',
  '{a} challenged {b} to a dance-off. {b} won by standing still',
];

const GREG_SIGHTINGS = [
  'someone claims they saw greg near the tents. unconfirmed',
  'greg may have been spotted by the art cars. he vanished when approached',
  'two people swear greg was in line for merch. greg denies everything',
  'greg was allegedly seen vibing near the side stage. no photo exists',
  'a vendor thinks greg bought a corn dog. greg has never been here',
];

const NAPS = [
  '{npc} fell asleep during the headliner. woke up for the encore',
  '{npc} napped on the lawn and missed one song. called it worth it',
  '{npc} dozed off standing up. woke up when the bass dropped',
  '{npc} fell asleep mid-conversation. blamed the music',
];

const TRADES = [
  '{npc} traded a sticker for a better sticker',
  '{npc} swapped a bracelet for a glowstick and felt rich',
  '{npc} traded a hat for a high-five. fair deal',
  '{npc} exchanged pins with a stranger. instant best friends',
];

const MYSTERIES = [
  'a folding chair appeared at {venue}. nobody put it there',
  'a single glove appeared on the railing. still there',
  'someone left a perfect playlist on a speaker. nobody claimed it',
  'a mystery totem showed up near the lawn. origin unknown',
];

const CROWD_MILESTONES = [
  'the crowd briefly synchronized clapping. it was an accident',
  'everyone jumped at the same time. physics was concerned',
  'the whole lawn swayed left. then right. then gave up',
  'a spontaneous woah happened. historians took notes',
];

const ANIMAL_CAMEOS = [
  'a seagull stole something from {npc}. {npc} respects it',
  'a pigeon landed on {npc}\'s hat. {npc} called it a collab',
  'a butterfly followed {npc} for three songs',
  'a dog in a bandana walked through the crowd. everyone cheered',
];

const LOST_FOUND = [
  'the lost and found gained a single boot. nobody asked',
  'the lost and found gained sunglasses with no lenses. claimed immediately',
  'someone turned in a glowstick bouquet. no owner came forward',
  'the lost and found now has a very nice scarf. suspiciously nice',
];

const DANCE_LOGS = [
  '{npc} danced alone for one song. then stopped',
  '{npc} danced like nobody was watching. everyone was watching',
  '{npc} did one move and committed for the entire drop',
  '{npc} started dancing and forgot to stop for four minutes',
];

const QUEUE_REPORTS = [
  '{npc} waited in a line without knowing what it was for',
  '{npc} joined a line because it looked important. it was water',
  '{npc} stood in line for merch. bought nothing. no regrets',
  '{npc} queued for food. forgot hunger mid-line. stayed anyway',
];

const WEATHER_NOTES = [
  'it almost rained. everyone looked up at the same time',
  'the wind picked up and everyone held their hats',
  'a cool breeze hit and the crowd collectively said "nice"',
  'it got cold for one song. jackets appeared from nowhere',
];

const MERCH_INCIDENTS = [
  '{npc} bought a shirt two sizes too big. on purpose, {npc} says',
  '{npc} bought merch and wore it immediately over their other shirt',
  '{npc} got a hoodie and refused to take it off all night',
  '{npc} bought a hat that says nothing. loves it',
];

const SOUND_CHECKS = [
  'the bass got turned up at 2am. nobody complained',
  'someone said "turn it up" and the universe listened',
  'the subwoofers hiccupped once. the crowd cheered',
  'a sound check happened during a set. somehow it slapped',
];

const WANDERING_LOGS = [
  '{npc} walked the whole perimeter. twice',
  '{npc} explored every vendor cart and bought nothing',
  '{npc} walked from stage to stage and called it cardio',
  '{npc} did a lap around the festival and called it a warm-up',
];

const COLLECTION_UPDATES = [
  '{npc} added a bottle cap to the collection. the collection is bottle caps',
  '{npc} found a wristband on the ground. added it to the shrine',
  '{npc} collected three stickers and called it a portfolio',
  '{npc} started a pin board. it is already full',
];

function mulberry32(seed: number): LifeLogRng {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function lifeLogSeed(festieId: string, since: string, slot: number): number {
  let h = slot + 1;
  for (const c of `${festieId}:${since}:${slot}`) {
    h = Math.imul(31, h) + c.charCodeAt(0) | 0;
  }
  return h;
}

export function venueLabelForSlug(slug: string): string {
  const route = parseVenueSlug(slug);
  if (route) {
    const match = MOBILE_LOUNGE_STAGES.find(s => s.route === route);
    if (match) return match.title;
  }
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function pickNpc(ctx: LifeLogContext, offset = 0): string {
  const pool = ctx.npcPool.map(n => n.displayName);
  const all = [...pool, ...FLAVOR_NPC_NAMES];
  const idx = Math.floor(ctx.rng() * all.length + offset) % all.length;
  return all[idx] ?? 'someone';
}

function pickTwoNpcs(ctx: LifeLogContext): [string, string] {
  const a = pickNpc(ctx);
  let b = pickNpc(ctx, 3);
  if (b.toLowerCase() === a.toLowerCase()) b = pickNpc(ctx, 7);
  return [a, b];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? key);
}

function truncateTitle(title: string, max = 52): string {
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function pickLandmark(ctx: LifeLogContext): string {
  return LANDMARKS[Math.floor(ctx.rng() * LANDMARKS.length)]!;
}

function purchasedItemNames(): string[] {
  return Object.values(LOADOUT_CATALOG)
    .filter(item => (item.vendorPrice ?? 0) > 0)
    .map(item => item.name.toLowerCase());
}

function pickPurchasedItem(ctx: LifeLogContext): string {
  if (ctx.ownerOwnedItemNames.length > 0) {
    const idx = Math.floor(ctx.rng() * ctx.ownerOwnedItemNames.length);
    return ctx.ownerOwnedItemNames[idx]!;
  }
  const pool = purchasedItemNames();
  return pool[Math.floor(ctx.rng() * pool.length)] ?? 'mystery sticker';
}

function streamAtTime(route: VenueRoute | null, atMs: number): { title: string; hours: number } | null {
  if (!route) return null;
  let channel: StageChannel;
  try {
    channel = stageChannelForRoute(route);
  } catch {
    return null;
  }
  const sched = scheduleFor(channel, atMs, DEFAULT_STAGE_SYNC);
  if (!sched) return null;
  const title = sched.video.title?.trim();
  if (!title) return null;
  const durationSec = sched.video.durationSec ?? 3600;
  const hours = Math.min(2, Math.max(1, Math.round(durationSec / 3600)));
  return { title: truncateTitle(title, 56), hours };
}

const GENERATORS: LifeLogGenerator[] = [
  ctx => ({
    kind: 'overheard',
    text: `overheard near ${pickLandmark(ctx)}: "${OVERHEARD_LINES[Math.floor(ctx.rng() * OVERHEARD_LINES.length)]!}"`,
  }),
  ctx => {
    const npc = pickNpc(ctx);
    const stream = streamAtTime(ctx.route, ctx.at.getTime());
    if (!stream) return null;
    return {
      kind: 'stream_watched',
      text: `${npc.toLowerCase()} watched ${stream.hours} hour${stream.hours === 1 ? '' : 's'} of ${stream.title}`,
    };
  },
  ctx => {
    const npcCount = ctx.npcPool.length;
    const base = ctx.peerFestieCount + Math.ceil(npcCount / 2);
    const bump = Math.floor(ctx.rng() * 3) + (ctx.rng() > 0.5 ? 1 : 0);
    const count = Math.max(1, base + bump);
    const when = ctx.at.getHours() < 12 ? 'this morning' : 'last night';
    return {
      kind: 'presence',
      text: `${count} people hung out at ${ctx.venueLabel} ${when}`,
    };
  },
  ctx => {
    const npc = pickNpc(ctx);
    const coins = 1 + Math.floor(ctx.rng() * 8);
    return {
      kind: 'npc_coins',
      text: `${npc.toLowerCase()} found ${coins} coin${coins === 1 ? '' : 's'} near ${pickLandmark(ctx)}. kept it`,
    };
  },
  ctx => {
    const useOwner = ctx.ownerOwnedItemNames.length > 0 && ctx.rng() > 0.55;
    const name = useOwner ? ctx.festie.name : pickNpc(ctx);
    const item = pickPurchasedItem(ctx);
    return {
      kind: 'lost_item',
      text: `${name.toLowerCase()} lost a ${item}, not looking for it`,
    };
  },
  ctx => {
    const npc = pickNpc(ctx);
    const tpl = FAILED_PLANS[Math.floor(ctx.rng() * FAILED_PLANS.length)]!;
    return { kind: 'failed_plan', text: fill(tpl, { npc: npc.toLowerCase() }) };
  },
  ctx => {
    const npc = pickNpc(ctx);
    const tpl = SCENERY[Math.floor(ctx.rng() * SCENERY.length)]!;
    return { kind: 'scenery', text: fill(tpl, { npc: npc.toLowerCase() }) };
  },
  ctx => {
    const npc = pickNpc(ctx);
    const tpl = FOOD_INCIDENTS[Math.floor(ctx.rng() * FOOD_INCIDENTS.length)]!;
    return { kind: 'food_incident', text: fill(tpl, { npc: npc.toLowerCase() }) };
  },
  ctx => {
    const [a, b] = pickTwoNpcs(ctx);
    const tpl = NPC_INTERACTIONS[Math.floor(ctx.rng() * NPC_INTERACTIONS.length)]!;
    return {
      kind: 'npc_interaction',
      text: fill(tpl, { a: a.toLowerCase(), b: b.toLowerCase() }),
    };
  },
  ctx => ({
    kind: 'greg_sighting',
    text: GREG_SIGHTINGS[Math.floor(ctx.rng() * GREG_SIGHTINGS.length)]!,
  }),
  ctx => {
    const npc = pickNpc(ctx);
    const tpl = NAPS[Math.floor(ctx.rng() * NAPS.length)]!;
    return { kind: 'nap', text: fill(tpl, { npc: npc.toLowerCase() }) };
  },
  ctx => {
    const npc = pickNpc(ctx);
    const tpl = TRADES[Math.floor(ctx.rng() * TRADES.length)]!;
    return { kind: 'trade', text: fill(tpl, { npc: npc.toLowerCase() }) };
  },
  ctx => {
    const tpl = MYSTERIES[Math.floor(ctx.rng() * MYSTERIES.length)]!;
    return { kind: 'mystery', text: fill(tpl, { venue: ctx.venueLabel }) };
  },
  ctx => ({
    kind: 'crowd_milestone',
    text: CROWD_MILESTONES[Math.floor(ctx.rng() * CROWD_MILESTONES.length)]!,
  }),
  ctx => {
    const npc = pickNpc(ctx);
    const tpl = ANIMAL_CAMEOS[Math.floor(ctx.rng() * ANIMAL_CAMEOS.length)]!;
    return { kind: 'animal', text: fill(tpl, { npc: npc.toLowerCase() }) };
  },
  ctx => ({
    kind: 'lost_found',
    text: LOST_FOUND[Math.floor(ctx.rng() * LOST_FOUND.length)]!,
  }),
  ctx => {
    const npc = pickNpc(ctx);
    const tpl = DANCE_LOGS[Math.floor(ctx.rng() * DANCE_LOGS.length)]!;
    return { kind: 'dance', text: fill(tpl, { npc: npc.toLowerCase() }) };
  },
  ctx => {
    const npc = pickNpc(ctx);
    const tpl = QUEUE_REPORTS[Math.floor(ctx.rng() * QUEUE_REPORTS.length)]!;
    return { kind: 'queue', text: fill(tpl, { npc: npc.toLowerCase() }) };
  },
  ctx => ({
    kind: 'weather',
    text: WEATHER_NOTES[Math.floor(ctx.rng() * WEATHER_NOTES.length)]!,
  }),
  ctx => {
    const npc = pickNpc(ctx);
    const tpl = MERCH_INCIDENTS[Math.floor(ctx.rng() * MERCH_INCIDENTS.length)]!;
    return { kind: 'merch', text: fill(tpl, { npc: npc.toLowerCase() }) };
  },
  ctx => ({
    kind: 'sound_check',
    text: SOUND_CHECKS[Math.floor(ctx.rng() * SOUND_CHECKS.length)]!,
  }),
  ctx => {
    const npc = pickNpc(ctx);
    const tpl = WANDERING_LOGS[Math.floor(ctx.rng() * WANDERING_LOGS.length)]!;
    return { kind: 'wandering', text: fill(tpl, { npc: npc.toLowerCase() }) };
  },
  ctx => {
    const npc = pickNpc(ctx);
    const tpl = COLLECTION_UPDATES[Math.floor(ctx.rng() * COLLECTION_UPDATES.length)]!;
    return { kind: 'collection', text: fill(tpl, { npc: npc.toLowerCase() }) };
  },
];

export function targetLifeLogCount(sinceMs: number, untilMs: number, rng: LifeLogRng): number {
  const durationMs = untilMs - sinceMs;
  if (durationMs < 45 * 60 * 1000) return 0;

  const liveEndMs = sinceMs + FESTIE_CONFIG.LIVE_WINDOW_MS;
  const effectiveUntilMs = Math.min(untilMs, liveEndMs);
  const hours = (effectiveUntilMs - sinceMs) / (60 * 60 * 1000);
  if (hours < 0.75) return 0;

  const density = 0.55 + rng() * 0.45;
  return Math.min(18, Math.max(2, Math.round(hours * density)));
}

export function randomLogTimestamp(
  sinceMs: number,
  untilMs: number,
  slotIndex: number,
  total: number,
  rng: LifeLogRng,
): number {
  const span = Math.max(60_000, untilMs - sinceMs - 60_000);
  const base = sinceMs + 30_000 + (span * slotIndex) / total;
  const jitter = (rng() - 0.5) * (span / total) * 0.85;
  return Math.min(untilMs - 30_000, Math.max(sinceMs + 30_000, base + jitter));
}

export function pickLifeLogGenerators(
  count: number,
  festieId: string,
  since: string,
  startSlot: number,
): LifeLogGenerator[] {
  const order = [...GENERATORS];
  const picked: LifeLogGenerator[] = [];
  for (let i = 0; i < count; i++) {
    const slot = startSlot + i;
    const rng = mulberry32(lifeLogSeed(festieId, since, slot));
    const idx = Math.floor(rng() * order.length);
    picked.push(order.splice(idx, 1)[0] ?? GENERATORS[slot % GENERATORS.length]!);
  }
  return picked;
}

export async function buildLifeLogContext(
  festie: FestieRow,
  at: Date,
  since: Date,
  until: Date,
  rng: LifeLogRng,
): Promise<LifeLogContext> {
  const route = parseVenueSlug(festie.stage_slug);
  const wandering = wanderingCharacters().map(ch => ({
    id: ch.id,
    displayName: ch.name,
    personalityNotes: ch.personalityNotes,
  }));
  const peers = await listActiveFestiesForStage(festie.stage_slug, [festie.user_id]);
  const profile = await getPlayerProfile(festie.user_id);
  const owned = profile ? [...ownedItemIds(profile.loadout)] : [];
  const ownerOwnedItemNames = owned
    .map(id => loadoutItem(id)?.name.toLowerCase())
    .filter((n): n is string => Boolean(n));

  return {
    festie,
    at,
    since,
    until,
    rng,
    venueLabel: venueLabelForSlug(festie.stage_slug),
    route,
    npcPool: wandering,
    peerFestieCount: peers.length,
    ownerOwnedItemNames,
  };
}

export async function generateLifeLog(
  festie: FestieRow,
  generator: LifeLogGenerator,
  at: Date,
  since: Date,
  until: Date,
  slot: number,
): Promise<LifeLogResult> {
  const rng = mulberry32(lifeLogSeed(festie.id, since.toISOString(), slot));
  const ctx = await buildLifeLogContext(festie, at, since, until, rng);
  return generator(ctx);
}

/** Alternate venue label for cross-venue mystery logs. */
export function randomVenueLabel(rng: LifeLogRng): string {
  const idx = Math.floor(rng() * MOBILE_LOUNGE_STAGES.length);
  return MOBILE_LOUNGE_STAGES[idx]?.title ?? 'the festival';
}
