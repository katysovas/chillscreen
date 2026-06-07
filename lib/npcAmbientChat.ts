import type { CharacterDef } from '@/components/game/characters';
import { getStageWorldSnapshot, type StageWorldEntry } from '@/lib/stageWorldSnapshot';

export const AMBIENT_VISIBLE_MS = 2200;
export const AMBIENT_VISIBLE_JITTER_MS = 400;
export const AMBIENT_INTERVAL_MIN_MS = 48_000;
export const AMBIENT_INTERVAL_MAX_MS = 72_000;

const STAGE_MUMBLE_WEIGHT = 0.92;

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
          `${stage.nowPlaying} at ${stage.stageName} — snacks?`,
          `catch ${stage.nowPlaying} at ${stage.stageName}`,
          `${stage.stageName} got ${stage.nowPlaying} rn`,
          `everyone going to ${stage.stageName} for ${stage.nowPlaying}`,
          `${stage.nowPlaying} at ${stage.stageName} = peak hours`,
          `${stage.stageName}: ${stage.nowPlaying}. I'm nearby.`,
          `${stage.nowPlaying} drop incoming — stock the glowsticks`,
          `${stage.stageName} crowd is the move rn`,
        ]
      : [
          `swing by ${stage.stageName} later`,
          `${stage.stageName} slow. good time to restock.`,
          `${stage.stageName} between sets: opportunity`,
          `${stage.stageName} quiet. setting up shop.`,
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
    'mystery bag??',
    'staying hydrated?',
    'glowsticks. just saying',
    'I know a guy',
    'limited supply rn',
    'good energy accepted',
    "don't ask questions",
    'best customers in the biz',
    "restock complete. let's go.",
    'business is booming',
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

export function pickAmbientMumble(character: CharacterDef): string {
  const snapshot = getStageWorldSnapshot();
  const stage = pickStage(snapshot);
  if (Math.random() < STAGE_MUMBLE_WEIGHT) return pickStageMumble(character, stage);
  return pickGenericMumble(character);
}
