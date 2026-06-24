import type { CharacterDef } from '@/components/game/characters';
import { stripNpcChatterDots } from '@/lib/messageFilter';
import type { AutopilotAmbientContext } from '@/lib/autopilot/ambientContext';
import { getStageWorldSnapshot, type StageWorldEntry } from '@/lib/stageWorldSnapshot';
import { isBuzNpc, BUZ_NPC_ID } from '@/lib/vendorShop';

export const AMBIENT_VISIBLE_MS = 8_000;
export const AMBIENT_VISIBLE_JITTER_MS = 2_000;
/** Faster cadence while ambient is the primary NPC chatter surface. */
export const AMBIENT_INTERVAL_MIN_MS = 10_000;
export const AMBIENT_INTERVAL_MAX_MS = 22_000;

/** Canned crowd cheers — server posts one every ~2.5–6 min (stage chat + NPC bubble). */
export const AMBIENT_CHEER_INTERVAL_MIN_MS = 150_000;
export const AMBIENT_CHEER_INTERVAL_MAX_MS = 360_000;

export const NPC_AMBIENT_CHEER_LINES = [
  'cheers',
  'salud',
  'send it',
  'boom',
  'f^# yea',
  "let's gooo!",
  'chug',
  'send the boys',
  'drink up',
  'here we go',
  'noice',
] as const;

/** Festie autopilot asides — self-aware, silly, still scannable in a bubble. */
export const FESTIE_AUTOPILOT_FUNNY_LINES = [
  'human said party. partying.',
  'autopilot but make it fashion',
  'no thoughts just shuffle',
  'lost the human. found the bass',
  'running on vibes only',
  'my human is watching probably',
  'festie on duty',
  'wander mode: elite',
  'who gave me the keys',
  'main character energy',
  'unsupervised festie hours',
  'is this what freedom feels like',
  'talking to strangers. classic.',
  'did I buy this hat? yes.',
  'Buz knows my name probably',
  'plotting my next snack',
  'legs are NPCs now',
  'brain: festival only',
  'I am legally a festie',
  'human toggled me on lol',
  'npc behavior: unlocked',
  'forgot real life again',
  'send festie',
  'ok one more stage',
  'professionally vibing',
] as const;

const LOST_PROP_AMBIENT_LINES = [
  (name: string) => `uh oh lost my ${name}`,
  (name: string) => `where is my ${name}?`,
  (name: string) => `no I lost my ${name}`,
  (name: string) => `my ${name} is gone`,
  (name: string) => `did I drop my ${name}?`,
  (name: string) => `anyone seen my ${name}?`,
] as const;

const AUTOPILOT_CHEER_WEIGHT = 0.12;
const AUTOPILOT_FUNNY_WEIGHT = 0.18;
const AUTOPILOT_STREAM_WEIGHT = 0.22;
const AUTOPILOT_STAGE_WEIGHT = 0.18;
const AUTOPILOT_FESTIVAL_WEIGHT = 0.18;
const AUTOPILOT_HUMAN_WEIGHT = 0.12;

const FESTIE_AUTOPILOT_STREAM_LINES = [
  (act: string) => `${act}? bold choice`,
  (act: string) => `ok ${act} goes hard`,
  (act: string) => `who queued ${act}`,
  (act: string) => `human picked ${act} lol`,
  (act: string) => `${act} on repeat. no notes.`,
  (act: string) => `the stream said ${act}`,
  (act: string) => `I've seen ${act} before`,
  (act: string) => `${act} is doing things to me`,
  (act: string) => `is ${act} new? I'm in`,
  (act: string) => `volume up for ${act}`,
  (act: string) => `${act} hits different rn`,
  (act: string) => `not me vibing to ${act}`,
] as const;

const FESTIE_AUTOPILOT_STAGE_LINES = [
  (stage: string) => `${stage} never misses`,
  (stage: string) => `${stage} vibes immaculate`,
  (stage: string) => `why is ${stage} so good`,
  (stage: string) => `I live at ${stage} now`,
  (stage: string) => `${stage} is my roman empire`,
  (stage: string) => `legend says ${stage} has bass`,
  (stage: string) => `${stage} said party. obeyed.`,
  (stage: string) => `couldn't leave ${stage} if I tried`,
  (stage: string) => `${stage} energy is unreal`,
  (stage: string) => `certified ${stage} moment`,
] as const;

const FESTIE_AUTOPILOT_FESTIVAL_LINES = [
  'festival brain activated',
  'need more glitter asap',
  'lost water. found snacks.',
  'festival mode: infinite',
  'porta potty line said no',
  'sunscreen optional right',
  'someone has glow sticks',
  'festival math: one more song',
  'ankles: destroyed. soul: full.',
  'forgot what day it is',
  'grass stains are a badge',
  'hydration is a social construct',
  'festival fit check: passed',
  'merch budget: compromised',
  'I could do this forever',
  'festival fairy dust loading',
] as const;

const FESTIE_AUTOPILOT_HUMAN_GENERIC_LINES = [
  'real humans spotted',
  'humans are so mysterious',
  'that human looks busy',
  "do humans know I'm AI",
  'human party without me? rude',
  'waving at strangers. classic.',
  'humans walk weird tbh',
  'real person energy detected',
  'humans brought snacks probably',
  "three humans. I'm shy.",
] as const;

const FESTIE_AUTOPILOT_HUMAN_NAMED_LINES = [
  (name: string) => `${name} seems cool`,
  (name: string) => `is ${name} having fun`,
  (name: string) => `hi ${name} I'm a festie`,
  (name: string) => `${name} has main character energy`,
  (name: string) => `wonder if ${name} sees me`,
] as const;

/** Per-NPC ambient timing overrides. */
const NPC_AMBIENT_INTERVAL: Partial<Record<string, { minMs: number; maxMs: number }>> = {
  [BUZ_NPC_ID]: { minMs: 9_000, maxMs: 16_000 },
};

const NPC_AMBIENT_INITIAL_DELAY: Partial<Record<string, { minMs: number; maxMs: number }>> = {
  [BUZ_NPC_ID]: { minMs: 3_000, maxMs: 6_000 },
};

const NPC_AMBIENT_VISIBLE: Partial<Record<string, { baseMs: number; jitterMs: number }>> = {
  [BUZ_NPC_ID]: { baseMs: 3_400, jitterMs: 800 },
};

export function getAmbientIntervalMs(characterId: string): { minMs: number; maxMs: number } {
  const key = isBuzNpc(characterId) ? BUZ_NPC_ID : characterId;
  return NPC_AMBIENT_INTERVAL[key] ?? {
    minMs: AMBIENT_INTERVAL_MIN_MS,
    maxMs: AMBIENT_INTERVAL_MAX_MS,
  };
}

export function getAmbientInitialDelayMs(
  characterId: string,
  npcIndex: number,
  entryDelay = 0,
): number {
  const override = NPC_AMBIENT_INITIAL_DELAY[isBuzNpc(characterId) ? BUZ_NPC_ID : characterId];
  if (override) {
    return override.minMs + Math.random() * (override.maxMs - override.minMs);
  }
  return 3_000 + entryDelay * 0.15 + npcIndex * 1_200 + Math.random() * 3_000;
}

export function getAmbientVisibleMs(characterId: string): { baseMs: number; jitterMs: number } {
  const key = isBuzNpc(characterId) ? BUZ_NPC_ID : characterId;
  return NPC_AMBIENT_VISIBLE[key] ?? {
    baseMs: AMBIENT_VISIBLE_MS,
    jitterMs: AMBIENT_VISIBLE_JITTER_MS,
  };
}

const STAGE_MUMBLE_WEIGHT = 0.92;
const BUZ_VENDOR_SHOUT_WEIGHT = 0.9;

/** Ambient bubbles are quick asides — keep them scannable in-game. */
export const AMBIENT_MAX_CHARS = 40;

/** Trim long YouTube titles to a short artist / label for ambient bubbles. */
export function shortActName(title: string): string {
  let t = title.trim();
  if (!t) return 'this set';
  const dashSplit = t.split(/\s[—–-]\s+/);
  if (dashSplit[0] && dashSplit[0].length >= 3 && dashSplit[0].length < t.length) {
    t = dashSplit[0].trim();
  }
  t = t.replace(/\s*(full\s*(set|concert|show|performance)|live\s*@.*|@.*)$/i, '').trim();
  if (t.length > 22) t = `${t.slice(0, 20).trimEnd()}…`;
  return t;
}

function shortStage(stage: StageWorldEntry): StageWorldEntry {
  if (!stage.nowPlaying) return stage;
  return { ...stage, nowPlaying: shortActName(stage.nowPlaying) };
}

function clampAmbientLine(line: string): string {
  const s = stripNpcChatterDots(line.replace(/\s+/g, ' ').trim());
  if (s.length <= AMBIENT_MAX_CHARS) return s;
  return `${s.slice(0, AMBIENT_MAX_CHARS - 1).trimEnd()}…`;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function pickStage(snapshot: { stages: StageWorldEntry[] }): StageWorldEntry {
  const withMusic = snapshot.stages.filter(s => s.nowPlaying);
  return pick(withMusic.length > 0 ? withMusic : snapshot.stages);
}

type StageFlavorFn = (stage: StageWorldEntry) => string[];

// ── shared base lines (generic, no character voice) ──────────────────────

function playingLines(stage: StageWorldEntry): string[] {
  const { stageName, nowPlaying: act } = stage;
  return [
    `${act} at ${stageName}`,
    `${stageName}: ${act}`,
    `heard ${act}`,
    `${act} live`,
    `${stageName} is on`,
    `walk to ${stageName}`,
    `${act} hits`,
    `${stageName} is busy`,
  ];
}

function quietLines(stage: StageWorldEntry): string[] {
  const { stageName } = stage;
  return [
    `${stageName} between sets`,
    `quiet at ${stageName}`,
    `waiting on ${stageName}`,
    `${stageName} intermission`,
    `next up: ${stageName}`,
    `${stageName} loading`,
  ];
}

function baseStageLines(stage: StageWorldEntry): string[] {
  return stage.nowPlaying ? playingLines(stage) : quietLines(stage);
}

// ── character-specific stage flavor ──────────────────────────────────────

const CHARACTER_STAGE_FLAVOR: Partial<Record<string, StageFlavorFn>> = {
  luna: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName}`,
          `pretty sure ${stage.stageName} is ${stage.nowPlaying}`,
          `${stage.nowPlaying} again and I'm not mad`,
          `${stage.stageName} feels right for ${stage.nowPlaying}`,
          `ended up at ${stage.stageName} again`,
          `${stage.nowPlaying} in the ${stage.city} air`,
          `soft spot for ${stage.stageName} tonight`,
          `${stage.nowPlaying} is doing something to me`,
          `${stage.stageName} knows what it's doing`,
        ]
      : [
          `${stage.stageName} is quiet for now`,
          `${stage.stageName} between sets`,
          `waiting at ${stage.stageName}`,
          `the quiet at ${stage.stageName} though`,
        ],

  mochi: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName}… wow`,
          `I hear ${stage.nowPlaying} from ${stage.stageName}`,
          `${stage.stageName} has ${stage.nowPlaying}`,
          `${stage.nowPlaying} and I can't`,
          `${stage.stageName} made me feel that`,
          `${stage.nowPlaying} in ${stage.city} hits`,
          `${stage.nowPlaying} at ${stage.stageName} I'm gone`,
          `holding it together at ${stage.stageName}`,
          `${stage.nowPlaying} was not on my list`,
        ]
      : [
          `${stage.stageName} went silent…`,
          `${stage.stageName} resting`,
          `the quiet after ${stage.stageName}`,
          `${stage.stageName} needs a moment`,
          `just standing by ${stage.stageName}`,
        ],

  ziggy: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName} — ahoy`,
          `${stage.stageName} has ${stage.nowPlaying} matey`,
          `get to ${stage.stageName} — ${stage.nowPlaying}`,
          `${stage.nowPlaying} at ${stage.stageName}? yes`,
          `${stage.stageName} is going off`,
          `${stage.nowPlaying} live and I'm losing it`,
          `everyone to ${stage.stageName} now`,
          `${stage.city} is unreal right now`,
          `${stage.stageName} said no chill`,
        ]
      : [
          `${stage.stageName} between sets`,
          `hurry up ${stage.stageName}`,
          `${stage.stageName} is loading`,
          `next set at ${stage.stageName} come on`,
        ],

  kova: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName}`,
          `cardio to ${stage.stageName}`,
          `${stage.stageName}: elite`,
          `legs cooked. still going`,
          `${stage.nowPlaying} — PR pace`,
        ]
      : [
          `${stage.stageName} water break`,
          `stretch at ${stage.stageName}`,
          `${stage.stageName} loading`,
        ],

  dub: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName} — that sub`,
          `${stage.stageName} mixing ${stage.nowPlaying} dirty`,
          `${stage.nowPlaying} on ${stage.stageName} hits`,
          `${stage.stageName} low end is ruthless`,
          `whoever did ${stage.stageName} sound tonight`,
          `${stage.nowPlaying} transition was surgical`,
          `${stage.stageName} sub is cooked. perfect.`,
          `${stage.nowPlaying} kick at ${stage.stageName} felt it`,
        ]
      : [
          `${stage.stageName} between drops`,
          `${stage.stageName} silence check`,
          `${stage.stageName} in the gap`,
          `${stage.stageName} about to reload`,
        ],

  satosh: stage =>
    stage.nowPlaying
      ? [
          `${stage.stageName}: bullish`,
          `${stage.nowPlaying} pumping`,
          `long ${stage.stageName}`,
          `${stage.nowPlaying} is the signal`,
          `ngmi skipping ${stage.stageName}`,
        ]
      : [
          `${stage.stageName} ranging`,
          `${stage.stageName} consolidating`,
        ],

  solo: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName}. elegant.`,
          `${stage.stageName} plays ${stage.nowPlaying} — wise choice`,
          `the ${stage.stageName} set: ${stage.nowPlaying}`,
          `${stage.nowPlaying}. a fine choice, ${stage.stageName}`,
          `good feeling about ${stage.nowPlaying}`,
          `${stage.nowPlaying} live. impressive.`,
          `${stage.stageName} is delivering tonight`,
        ]
      : [
          `${stage.stageName} in intermission`,
          `${stage.stageName} between battles`,
          `even the Death Star had intermissions`,
          `${stage.stageName} in hyperspace`,
        ],

  buz: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName}`,
          `merch first! ${stage.stageName}`,
          `${stage.stageName} is popping`,
          `hats for ${stage.nowPlaying}`,
          `stock up — ${stage.stageName}`,
        ]
      : [
          `browse my cart`,
          `${stage.stageName} quiet — shop`,
          `merch while you wait`,
        ],

  atlas: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName}`,
          `${stage.stageName}: noted`,
          `documenting ${stage.nowPlaying}`,
          `fascinating crowd`,
        ]
      : [
          `${stage.stageName} intermission`,
          `gap at ${stage.stageName}`,
        ],

  giggle: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName}… heh`,
          `${stage.stageName}? more like ${stage.nowPlaying}`,
          `${stage.nowPlaying}? I barely know her`,
          `${stage.stageName}: punchline`,
        ]
      : [
          `${stage.stageName} took a break lol`,
          `${stage.stageName}: stage fright`,
          `${stage.stageName} loading punchline`,
        ],

  chad: stage =>
    stage.nowPlaying
      ? [
          `activity at ${stage.stageName}`,
          `who booked ${stage.nowPlaying}`,
          `${stage.stageName} feels suspicious`,
          `heard ${stage.nowPlaying}… interesting`,
      ]
      : [
          `${stage.stageName} went dark`,
          `quiet at ${stage.stageName}. hmm.`,
          `watching ${stage.stageName}`,
        ],
};

// ── character-specific generic mumbles (non-stage) ────────────────────────

const CHARACTER_GENERIC: Partial<Record<string, string[]>> = {
  luna: [
    'the light right now though',
    'kinda losing it in a good way',
    'where even am I',
    'ok I feel this',
    'forgot to eat again',
    'vibe check: passing',
    'the crowd is good tonight',
    'something about tonight',
    'I could stay forever',
    "time doesn't exist here",
    'eyes closed. still vibing',
    'everything feels soft rn',
  ],
  mochi: [
    'ok I might cry',
    'my heart right now',
    'never leaving tbh',
    'wish you were here',
    'this is everything',
    'genuinely so happy rn',
    'the feelings are a lot',
    'ok I lied. crying.',
    'this crowd is kind',
    'I came here not to cry',
  ],
  ziggy: [
    'wait what',
    'my legs are gone',
    'not okay rn',
    'I am not fine',
    'what is happening',
    'I lost my voice. worth it',
    'feet? never heard of them',
    'this is the best day',
    'body is broken. soul is full.',
    'I cannot calm down',
  ],
  kova: [
    'legs cooked',
    'heart rate: yes',
    'hydration check people',
    'calves destroyed. PR though',
    'endorphins loading',
    'active recovery mode',
    'festival cardio beats the gym',
    'coach would not approve. doing it anyway',
    'personal best for dancing',
    'split time: irrelevant. vibing.',
  ],
  dub: [
    'that sub though',
    'felt that in a tooth',
    'ok respect',
    'whoever mixed this',
    'low end is ruthless',
    'that transition was criminal',
    'my ears said thank you',
    'soundcheck energy rn',
    'wait. that was a perfect mix.',
    'frequency check: immaculate',
  ],
  satosh: [
    'bullish on vibes',
    'charts closed vibes open',
    'high risk high vibe',
    'wen encore',
    'this is the dip. buying.',
    'vibes: parabolic',
    'not financial advice but go',
    'portfolio: vibes only',
    'gm. still here.',
    'ngmi going home early',
  ],
  solo: [
    'bad feeling about this',
    'never tell me the odds',
    'the force is loud',
    'do or do not',
    'this is the way',
    'need more water',
  ],
  buz: [
    'HATS!',
    'MERCH!',
    'WATER!',
    'HOT DOGS!',
    'HEADPHONES!',
    'LIGHTSABERS!',
    'CUTLASS HERE!',
    'GRAB A HAT!',
    'PIZZA!',
    'TACOS!',
    'BEER!',
    'JUICE!',
    'GLASSES!',
    'BOOMBOX!',
    'STEP UP!',
    'BUZ HAS GOODS!',
    'STOCK UP!',
    'COME LOOK!',
    'FESTIVAL MERCH!',
    'CHAT WITH BUZ!',
  ],
  atlas: [
    'fascinating',
    'textbook catharsis',
    'historically speaking',
    'the data checks out',
    'pilgrimage behavior tbh',
    'communal euphoria noted',
    'documenting this',
    'crowd density: significant',
    'this would make a great thesis',
    'making notes',
  ],
  giggle: [
    'heh',
    'get it though',
    'bass dropped lol',
    "that's the setup",
    'punchline incoming',
    "I'll see myself out",
    'why did the set cross the road',
    "I'm on a roll. literally. sold one.",
    'encore? I barely know her',
    'crowd surfing: 10/10 would fall again',
  ],
  chad: [
    'hypothetically though',
    'off the record',
    'just asking questions',
    'seen anything shady',
    'who sold you that',
    'between us…',
    'routine inquiry',
    'keep it quiet',
    'not judging',
    'eyes open out here',
    'nothing illegal. right?',
    'asking for a friend',
    'totally normal question',
  ],
};

const GENERIC_MUMBLES: string[] = [
  'vibes rn',
  'my feet though',
  'need water',
  'brain offline',
  'ok this slaps',
  'not leaving',
  'need snacks',
  "where'd the time go",
  'this crowd though',
  'I love it here',
  "ok I'm obsessed",
  'the energy rn',
  'legs gone. vibing.',
  'who authorized this',
  'eyes closed',
  'time evaporated',
  'sky looks good',
  "everyone's dancing",
  'alive rn',
  'light show though',
  "can't leave",
  'forgot real life',
  'I live here now',
  'peak moment',
];

function pickStageMumble(character: CharacterDef, stage: StageWorldEntry): string {
  const s = shortStage(stage);
  const flavor = CHARACTER_STAGE_FLAVOR[character.id];
  const pool = flavor ? [...flavor(s), ...baseStageLines(s)] : baseStageLines(s);
  return pick(pool);
}

function pickGenericMumble(character: CharacterDef): string {
  const charPool = CHARACTER_GENERIC[character.id];
  // 60% use character-specific generic if available, 40% use shared pool
  if (charPool && Math.random() < 0.6) return pick(charPool);
  return pick(GENERIC_MUMBLES);
}

function pickBuzAmbientMumble(): string {
  const vendorPool = CHARACTER_GENERIC[BUZ_NPC_ID]!;
  if (Math.random() < BUZ_VENDOR_SHOUT_WEIGHT) return pick(vendorPool);

  const snapshot = getStageWorldSnapshot();
  const stage = pickStage(snapshot);
  return pickStageMumble({ id: BUZ_NPC_ID } as CharacterDef, stage);
}

export function pickAmbientCheerLine(): string {
  return pick([...NPC_AMBIENT_CHEER_LINES]);
}

/** Autopilot festie notices a prop went missing. */
export function pickLostPropAmbientLine(propName: string): string {
  const label = propName.trim().toLowerCase() || 'prop';
  const line = pick([...LOST_PROP_AMBIENT_LINES])(label);
  return clampAmbientLine(line);
}

function pickStreamAutopilotLine(act: string): string {
  return pick([...FESTIE_AUTOPILOT_STREAM_LINES])(act);
}

function pickStageAutopilotLine(stageName: string): string {
  const stage = stageName.trim() || 'this stage';
  return pick([...FESTIE_AUTOPILOT_STAGE_LINES])(stage);
}

function pickFestivalAutopilotLine(): string {
  return pick([...FESTIE_AUTOPILOT_FESTIVAL_LINES]);
}

function pickHumanAutopilotLine(ctx: AutopilotAmbientContext): string {
  if (ctx.humanName && Math.random() < 0.55) {
    return pick([...FESTIE_AUTOPILOT_HUMAN_NAMED_LINES])(ctx.humanName);
  }
  return pick([...FESTIE_AUTOPILOT_HUMAN_GENERIC_LINES]);
}

/** Autopilot festie shouts — cheers, silly asides, and context-aware mumbles. */
export function pickAutopilotAmbientLine(
  _character: CharacterDef,
  ctx: AutopilotAmbientContext = {
    nowPlaying: null,
    stageName: null,
    humanCount: 0,
    humanName: null,
  },
): string {
  const buckets: { weight: number; pick: () => string }[] = [
    { weight: AUTOPILOT_CHEER_WEIGHT, pick: () => pick([...NPC_AMBIENT_CHEER_LINES]) },
    { weight: AUTOPILOT_FUNNY_WEIGHT, pick: () => pick([...FESTIE_AUTOPILOT_FUNNY_LINES]) },
    { weight: AUTOPILOT_FESTIVAL_WEIGHT, pick: pickFestivalAutopilotLine },
  ];

  if (ctx.nowPlaying) {
    const act = ctx.nowPlaying;
    buckets.push({
      weight: AUTOPILOT_STREAM_WEIGHT,
      pick: () => pickStreamAutopilotLine(act),
    });
  }
  if (ctx.stageName) {
    const stage = ctx.stageName;
    buckets.push({
      weight: AUTOPILOT_STAGE_WEIGHT,
      pick: () => pickStageAutopilotLine(stage),
    });
  }
  if (ctx.humanCount > 0) {
    buckets.push({
      weight: AUTOPILOT_HUMAN_WEIGHT,
      pick: () => pickHumanAutopilotLine(ctx),
    });
  }

  const total = buckets.reduce((sum, b) => sum + b.weight, 0);
  let roll = Math.random() * total;
  for (const bucket of buckets) {
    roll -= bucket.weight;
    if (roll <= 0) return clampAmbientLine(bucket.pick());
  }
  return clampAmbientLine(buckets[buckets.length - 1]!.pick());
}

export function pickAmbientMumble(character: CharacterDef): string {
  const line = isBuzNpc(character.id)
    ? pickBuzAmbientMumble()
    : Math.random() < STAGE_MUMBLE_WEIGHT
      ? pickStageMumble(character, pickStage(getStageWorldSnapshot()))
      : pickGenericMumble(character);
  return clampAmbientLine(line);
}
