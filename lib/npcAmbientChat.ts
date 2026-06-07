import type { CharacterDef } from '@/components/game/characters';
import { getStageWorldSnapshot, type StageWorldEntry } from '@/lib/stageWorldSnapshot';
import { BUZ_NPC_ID } from '@/lib/vendorShop';

export const AMBIENT_VISIBLE_MS = 2200;
export const AMBIENT_VISIBLE_JITTER_MS = 400;
export const AMBIENT_INTERVAL_MIN_MS = 48_000;
export const AMBIENT_INTERVAL_MAX_MS = 72_000;

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
  return NPC_AMBIENT_INTERVAL[characterId] ?? {
    minMs: AMBIENT_INTERVAL_MIN_MS,
    maxMs: AMBIENT_INTERVAL_MAX_MS,
  };
}

export function getAmbientInitialDelayMs(
  characterId: string,
  npcIndex: number,
  entryDelay = 0,
): number {
  const override = NPC_AMBIENT_INITIAL_DELAY[characterId];
  if (override) {
    return override.minMs + Math.random() * (override.maxMs - override.minMs);
  }
  return 12_000 + entryDelay * 0.35 + npcIndex * 4_500 + Math.random() * 8_000;
}

export function getAmbientVisibleMs(characterId: string): { baseMs: number; jitterMs: number } {
  return NPC_AMBIENT_VISIBLE[characterId] ?? {
    baseMs: AMBIENT_VISIBLE_MS,
    jitterMs: AMBIENT_VISIBLE_JITTER_MS,
  };
}

const STAGE_MUMBLE_WEIGHT = 0.92;
const BUZ_VENDOR_SHOUT_WEIGHT = 0.9;

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
  const { stageName, nowPlaying: act, city } = stage;
  return [
    `${act} at ${stageName}`,
    `${stageName} has ${act} on right now`,
    `heard ${act} from ${stageName}`,
    `${act} at ${stageName} sounds good`,
    `${city} — ${act} at ${stageName}`,
    `${stageName} is playing ${act}`,
    `${act} going off at ${stageName}`,
    `people are at ${stageName} for ${act}`,
    `${act} live at ${stageName}`,
    `${stageName} is busy — ${act}`,
    `caught ${act} at ${stageName}`,
    `${act} again at ${stageName}`,
    `${stageName} with ${act} rn`,
    `${act} hits different at ${stageName}`,
    `worth walking to ${stageName} for ${act}`,
  ];
}

function quietLines(stage: StageWorldEntry): string[] {
  const { stageName, city } = stage;
  return [
    `${stageName} between sets`,
    `nothing on at ${stageName} yet`,
    `${stageName} is quiet right now`,
    `${city} — ${stageName} is empty`,
    `waiting on ${stageName}`,
    `${stageName} taking a break`,
    `${stageName} should start soon`,
    `quiet at ${stageName}`,
    `${stageName} intermission`,
    `next set soon at ${stageName}`,
    `${stageName} loading up`,
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
          `${stage.nowPlaying} at ${stage.stageName} — worth the walk`,
          `cardio to ${stage.stageName} for ${stage.nowPlaying}`,
          `${stage.stageName}: ${stage.nowPlaying}. elite.`,
          `${stage.nowPlaying} pace is unsustainable. going anyway`,
          `${stage.stageName} putting in work`,
          `${stage.nowPlaying} — peak performance`,
          `${stage.nowPlaying} is doing rehab on my legs`,
          `${stage.stageName} stats are off the charts`,
        ]
      : [
          `${stage.stageName} on a water break`,
          `${stage.stageName} recovery zone`,
          `gap between ${stage.stageName} sets. stretch.`,
          `${stage.stageName}: loading next interval`,
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
          `${stage.stageName}: ${stage.nowPlaying} — bullish`,
          `${stage.nowPlaying} pumping at ${stage.stageName}`,
          `long ${stage.stageName} / long ${stage.nowPlaying}`,
          `${stage.nowPlaying} at ${stage.stageName}: accumulating`,
          `${stage.stageName} printing rn`,
          `${stage.nowPlaying} is the signal`,
          `ngmi missing ${stage.nowPlaying} at ${stage.stageName}`,
          `${stage.nowPlaying}: not financial advice. go.`,
        ]
      : [
          `${stage.stageName} ranging. no volume.`,
          `${stage.stageName} consolidating`,
          `${stage.stageName} finding support`,
          `${stage.stageName} in accumulation`,
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
          `${stage.nowPlaying} at ${stage.stageName} — merch first!`,
          `heading to ${stage.stageName}? grab a hat on the way`,
          `${stage.stageName} is popping — stock up at my cart`,
          `${stage.nowPlaying} crowd needs PIRATE HATS`,
          `everyone at ${stage.stageName} — headphones!`,
          `${stage.nowPlaying} at ${stage.stageName}. lightsabers ready.`,
          `walk to ${stage.stageName} — cutlass optional`,
          `${stage.stageName} set + festival merch = perfect night`,
        ]
      : [
          `between sets? browse my cart`,
          `${stage.stageName} quiet — good time to shop`,
          `restock while ${stage.stageName} loads up`,
          `merch tent open while ${stage.stageName} waits`,
        ],

  atlas: stage =>
    stage.nowPlaying
      ? [
          `${stage.stageName}: ${stage.nowPlaying}. noted.`,
          `${stage.nowPlaying} live at ${stage.stageName}`,
          `currently ${stage.stageName} — ${stage.nowPlaying}`,
          `${stage.nowPlaying} crowd behavior: fascinating`,
          `documenting ${stage.nowPlaying} at ${stage.stageName}`,
          `${stage.stageName} + ${stage.nowPlaying} = communal euphoria`,
          `${stage.nowPlaying} at ${stage.stageName}. making notes.`,
        ]
      : [
          `${stage.stageName} between acts`,
          `${stage.stageName} intermission`,
          `gap at ${stage.stageName}: sociological pause`,
          `${stage.stageName} between chapters`,
        ],

  giggle: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName}… heh`,
          `what's ${stage.nowPlaying} doing at ${stage.stageName}`,
          `${stage.stageName}? more like ${stage.nowPlaying}`,
          `why did ${stage.nowPlaying} go to ${stage.stageName}? for the set`,
          `${stage.stageName} walks into a ${stage.nowPlaying}`,
          `${stage.nowPlaying}? I barely know playing`,
          `${stage.stageName} dropping ${stage.nowPlaying} and also bars`,
          `${stage.nowPlaying} at ${stage.stageName}: the punchline`,
        ]
      : [
          `${stage.stageName} took a break lol`,
          `${stage.stageName}: stage fright. heh`,
          `why is ${stage.stageName} quiet? needs more stage presence`,
          `${stage.stageName} loading the punchline`,
          `${stage.stageName} intermission: setup phase`,
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
    'I have a bad feeling',
    'the force is loud',
    'a long time ago in a festival',
    'do or do not. I did.',
    'this is the way',
    'I find your lack of water disturbing',
    'rebellions are built on vibes',
  ],
  buz: [
    'HUNTER HATS! CAMO UP!',
    'BASEBALL CAPS! FESTIVAL EDITION!',
    'PAMELA HATS! MAIN CHARACTER ENERGY!',
    'GLASSES! LOOK COOL STAY MYSTERIOUS!',
    'BLUE GLASSES! FESTIVAL NIGHT VISION!',
    'GREEN GLASSES! LAWN CROWD ENERGY!',
    'CIRCLE GLASSES! RETRO FESTIVAL VIBES!',
    'YELLOW GLASSES! SUNNY SET ENERGY!',
    'OPTIC GLASSES! READ THE SETLIST!',
    'SKI GOGGLES! SLOPE-READY SHADES!',
    'HORNS UP! VIKING HATS HERE!',
    'HEADPHONES! BLOCK OUT THE CROWD!',
    'CUTLASS IN STOCK! WHO NEEDS A BLADE?',
    'LIGHTSABERS! LIMITED RUN!',
    'STEP RIGHT UP! FESTIVAL MERCH!',
    'BUZ HAS THE GOODS!',
    'MERCH TENT IS OPEN!',
    'TALK TO BUZ — BEST STUFF HERE!',
    'WHO NEEDS A NICE HAT?',
    'HEADPHONES FOR THE HEADLINER IN YOU!',
    'SWORDS AND SABERS! STEP UP!',
    "DON'T WALK PAST WITHOUT LOOKING!",
    'FRESH MERCH! RIGHT HERE!',
    "I GOT WHAT YOU'RE MISSING!",
    'PIRATE OR DJ — PICK YOUR LOOK!',
    'EVERYONE NEEDS MERCH!',
    'CHAT WITH ME — I\'LL HOOK YOU UP!',
    'CUTLASS CHECK! WHO\'S READY?',
    'LIGHTSABER ENERGY ONLY!',
    'TRICORNS! … WELL, PIRATE HATS!',
    'MERCH OVER HERE!',
    "DON'T BE SHY — COME LOOK!",
    'ONLY THE GOOD STUFF!',
    'FESTIVAL MERCH! RIGHT THIS WAY!',
    'WHO WANTS A LIGHTSABER?',
    'HEADPHONES! FEEL THE BASS IN PEACE!',
    'BEST CART AT THE FESTIVAL!',
    'STOCK UP BEFORE THE NEXT SET!',
    'I SEE YOU LOOKING — COME CHAT!',
    'MERCH MERCH MERCH!',
    'GET EQUIPPED! TALK TO BUZ!',
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
};

const GENERIC_MUMBLES: string[] = [
  'vibes right now',
  'my feet though',
  'need water maybe',
  'brain is offline',
  'ok this slaps',
  'not leaving ever',
  'send help and snacks',
  'where did the time go',
  'everyone is so cool here',
  'this crowd though',
  'I love it here',
  "ok I'm obsessed",
  'the energy rn',
  "can't feel my legs. vibing.",
  'who authorized this banger',
  'eyes: closed. vibes: open',
  'festival math: hours feel like minutes',
  'the sky right now though',
  "everyone is dancing and it's beautiful",
  'this is what alive feels like',
  'ok the light show though',
  "genuinely can't leave",
  'forgot real life exists',
  'I live here now',
  'peak moment. no notes.',
];

function pickStageMumble(character: CharacterDef, stage: StageWorldEntry): string {
  const flavor = CHARACTER_STAGE_FLAVOR[character.id];
  const pool = flavor ? [...flavor(stage), ...baseStageLines(stage)] : baseStageLines(stage);
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

export function pickAmbientMumble(character: CharacterDef): string {
  if (character.id === BUZ_NPC_ID) return pickBuzAmbientMumble();

  const snapshot = getStageWorldSnapshot();
  const stage = pickStage(snapshot);
  if (Math.random() < STAGE_MUMBLE_WEIGHT) return pickStageMumble(character, stage);
  return pickGenericMumble(character);
}
