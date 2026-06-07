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
    `${stageName}: ${act}`,
    `${act} on ${stageName} rn`,
    `${stageName} has ${act}`,
    `${city} — ${act} at ${stageName}`,
    `heard ${act} from ${stageName}`,
    `${act} @ ${stageName} tho`,
    `${act} going off rn`,
    `${stageName} is on one`,
    `${act} hits different live`,
    `${stageName} w/ ${act} 🔥`,
    `${act} again?? ok`,
    `${stageName} doing ${act}`,
    `${act} from ${stageName} omg`,
    `ok ${act} tho`,
    `${stageName} is that girl rn`,
    `${city} got ${act} live`,
    `${act} said what it said`,
    `${stageName} not missing`,
    `${act}. ${stageName}. now.`,
  ];
}

function quietLines(stage: StageWorldEntry): string[] {
  const { stageName, city } = stage;
  return [
    `${stageName} between sets`,
    `nothing on at ${stageName}`,
    `${stageName} is quiet rn`,
    `${city} — ${stageName} empty`,
    `waiting on ${stageName}`,
    `${stageName} taking a break`,
    `${stageName} loading…`,
    `silence at ${stageName}`,
    `${stageName} intermission rn`,
    `${stageName} about to drop smth`,
    `${city} holding its breath`,
    `next set soon at ${stageName}`,
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
          `${stage.nowPlaying} at ${stage.stageName} 💙`,
          `pretty sure ${stage.stageName} is ${stage.nowPlaying}`,
          `${stage.stageName} → ${stage.nowPlaying}`,
          `${stage.nowPlaying} again and i'm not mad`,
          `${stage.stageName} feels like ${stage.nowPlaying}`,
          `${stage.nowPlaying} found me`,
          `${stage.stageName} and ${stage.nowPlaying}. perfect.`,
          `i ended up at ${stage.stageName} again`,
          `${stage.nowPlaying} in the ${stage.city} air`,
          `${stage.stageName} knows what it's doing`,
          `${stage.nowPlaying} is doing something to me`,
          `soft spot for ${stage.stageName} rn`,
        ]
      : [
          `${stage.stageName} is quiet… for now`,
          `${stage.stageName} between lives`,
          `${stage.stageName} exhaled`,
          `the quiet at ${stage.stageName} tho`,
          `waiting at ${stage.stageName} again`,
        ],

  mochi: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName}… wow`,
          `i hear ${stage.nowPlaying} from ${stage.stageName}`,
          `${stage.stageName} has ${stage.nowPlaying} 🥺`,
          `${stage.nowPlaying} and i can't`,
          `${stage.stageName} made me feel that`,
          `${stage.nowPlaying} in ${stage.city} hits`,
          `${stage.stageName} why are you doing this`,
          `${stage.nowPlaying} omg stop`,
          `${stage.stageName} said cry about it`,
          `${stage.nowPlaying} at ${stage.stageName} i'm gone`,
          `holding it together at ${stage.stageName}`,
          `${stage.nowPlaying} was not on my bingo card`,
        ]
      : [
          `${stage.stageName} went silent…`,
          `${stage.stageName} resting 🌙`,
          `the quiet after ${stage.stageName}`,
          `${stage.stageName} needs a moment`,
          `just standing by ${stage.stageName}`,
        ],

  ziggy: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} AT ${stage.stageName}!!!`,
          `${stage.stageName} = ${stage.nowPlaying} 🎉`,
          `RUN TO ${stage.stageName} — ${stage.nowPlaying}`,
          `${stage.nowPlaying}?? AT ${stage.stageName}??`,
          `${stage.stageName} IS GOING`,
          `${stage.nowPlaying} HIT AND I LOST IT`,
          `${stage.stageName} SAID NO CHILL`,
          `EVERYONE TO ${stage.stageName} NOW`,
          `${stage.nowPlaying} live i am NOT`,
          `${stage.stageName} ACTIVATED`,
          `${stage.nowPlaying} DROP WAS ILLEGAL`,
          `${stage.city} IS UNREAL RN`,
        ]
      : [
          `${stage.stageName} BETWEEN SETS NOOO`,
          `${stage.stageName} WHY`,
          `HURRY UP ${stage.stageName}`,
          `${stage.stageName} is loading i'm dying`,
          `NEXT SET ${stage.stageName} COME ON`,
        ],

  kova: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName} — podium set`,
          `cardio to ${stage.stageName} for ${stage.nowPlaying}`,
          `${stage.stageName}: ${stage.nowPlaying}. elite.`,
          `${stage.nowPlaying} pace: unsustainable. going anyway`,
          `${stage.stageName} training block`,
          `${stage.nowPlaying} is doing rehab on my legs`,
          `${stage.stageName} is the race. ${stage.nowPlaying} is the fuel`,
          `${stage.nowPlaying} HR: elevated`,
          `${stage.stageName} stats: off the charts`,
          `${stage.nowPlaying} split time: impressive`,
          `${stage.stageName} putting in work`,
          `${stage.nowPlaying} — peak performance`,
        ]
      : [
          `${stage.stageName} on a water break`,
          `${stage.stageName} recovery zone`,
          `${stage.stageName} active rest`,
          `${stage.stageName}: loading next interval`,
          `gap between ${stage.stageName} sets. stretch.`,
        ],

  dub: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} @ ${stage.stageName} — that sub`,
          `${stage.stageName} mixing ${stage.nowPlaying} dirty`,
          `${stage.nowPlaying} on ${stage.stageName} hits`,
          `${stage.stageName} low end is ruthless`,
          `${stage.nowPlaying} mix at ${stage.stageName} tho`,
          `whoever did ${stage.stageName} sound tonight 👏`,
          `${stage.nowPlaying} freq at ${stage.stageName}: disrespectful`,
          `${stage.stageName} PA said yes`,
          `${stage.nowPlaying} transition was surgical`,
          `${stage.stageName} sub is cooked. perfect.`,
          `${stage.nowPlaying} kick at ${stage.stageName} felt it`,
          `${stage.stageName} levels: irresponsible. love it.`,
        ]
      : [
          `${stage.stageName} between drops`,
          `${stage.stageName} silence check`,
          `${stage.stageName} PA cooling down`,
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
          `${stage.stageName} mooning`,
          `${stage.nowPlaying} charts: parabolic`,
          `${stage.stageName} liquidity: thick`,
          `ngmi missing ${stage.nowPlaying} at ${stage.stageName}`,
          `${stage.nowPlaying}: not financial advice. go.`,
          `${stage.stageName} = strong buy`,
        ]
      : [
          `${stage.stageName} ranging. no volume.`,
          `${stage.stageName} consolidating`,
          `${stage.stageName} finding support`,
          `${stage.stageName} in accumulation`,
          `${stage.stageName} dip. loading.`,
        ],

  solo: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName}. elegant.`,
          `${stage.stageName} plays ${stage.nowPlaying} — wise`,
          `the ${stage.stageName} set: ${stage.nowPlaying}`,
          `${stage.nowPlaying}. a fine choice, ${stage.stageName}`,
          `i have a good feeling about ${stage.nowPlaying}`,
          `${stage.stageName} — this is the way`,
          `${stage.nowPlaying} at ${stage.stageName}: the Force approves`,
          `${stage.stageName} disturbance: none. ${stage.nowPlaying} is playing`,
          `${stage.nowPlaying}. i've got a bad feeling. good bad.`,
          `these aren't the droids. ${stage.stageName} is better.`,
          `${stage.nowPlaying} live. impressive. most impressive.`,
          `${stage.stageName} strikes back rn`,
        ]
      : [
          `${stage.stageName} in intermission`,
          `${stage.stageName} — a disturbance in the Force`,
          `${stage.stageName} between battles`,
          `even the Death Star had intermissions`,
          `${stage.stageName} in hyperspace`,
        ],

  buz: stage =>
    stage.nowPlaying
      ? [
          `${stage.nowPlaying} at ${stage.stageName} — snacks?`,
          `catch ${stage.nowPlaying} @ ${stage.stageName}`,
          `${stage.stageName} got ${stage.nowPlaying} rn`,
          `${stage.nowPlaying} crowd = my customers`,
          `${stage.stageName} rush starting. restocking.`,
          `everyone going to ${stage.stageName} for ${stage.nowPlaying}`,
          `${stage.nowPlaying} at ${stage.stageName} = peak business hours`,
          `${stage.stageName}: ${stage.nowPlaying}. i'm set up nearby 👀`,
          `${stage.nowPlaying} drop incoming — stock the glowsticks`,
          `${stage.stageName} crowd is the move rn`,
          `${stage.nowPlaying} fans tip well. heading over.`,
          `${stage.stageName} doing numbers rn`,
        ]
      : [
          `swing by ${stage.stageName} later`,
          `${stage.stageName} slow. good time to restock.`,
          `${stage.stageName} between sets: opportunity`,
          `${stage.stageName} gap = mystery bag time`,
          `${stage.stageName} quiet. setting up shop.`,
        ],

  atlas: stage =>
    stage.nowPlaying
      ? [
          `${stage.stageName}: ${stage.nowPlaying}. noted.`,
          `${stage.nowPlaying} live at ${stage.stageName}`,
          `currently ${stage.stageName} → ${stage.nowPlaying}`,
          `${stage.nowPlaying} crowd behavior: fascinating`,
          `${stage.stageName} with ${stage.nowPlaying}: textbook catharsis`,
          `documenting ${stage.nowPlaying} at ${stage.stageName}`,
          `${stage.stageName} data point: ${stage.nowPlaying}`,
          `${stage.nowPlaying} effect on ${stage.stageName} crowd: significant`,
          `${stage.stageName}: ${stage.nowPlaying}. pilgrimage confirmed.`,
          `historically ${stage.nowPlaying} draws a crowd`,
          `${stage.stageName} + ${stage.nowPlaying} = communal euphoria`,
          `${stage.nowPlaying} at ${stage.stageName}. making notes.`,
        ]
      : [
          `${stage.stageName} between acts`,
          `${stage.stageName} intermission data: inconclusive`,
          `${stage.stageName} in liminal state`,
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
          `${stage.nowPlaying}: because ${stage.stageName} asked nicely`,
          `${stage.stageName} walks into a ${stage.nowPlaying}`,
          `${stage.nowPlaying} at ${stage.stageName} lol get it`,
          `i told ${stage.nowPlaying} a joke. it played on at ${stage.stageName}`,
          `${stage.stageName} said ${stage.nowPlaying}. i said lol`,
          `${stage.nowPlaying}? i barely know playing`,
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
    'the light rn tho',
    'kinda losing it',
    'where even am i',
    'ok i feel this',
    'forgot to eat again',
    'vibe check: passing',
    'the crowd tho',
    'something about tonight',
    'i could stay forever',
    'time doesn\'t exist here',
    'eyes closed. still vibing',
    'everything feels soft rn',
  ],
  mochi: [
    'ok i might cry',
    'my heart rn 🥺',
    'never leaving tbh',
    'someone hold me',
    'wish you were here',
    'this is everything',
    'genuinely so happy rn',
    'butterflies but make it bass',
    'i came here not to cry',
    'the feelings are a lot',
    'ok i lied. crying.',
    'this crowd 💛',
  ],
  ziggy: [
    'WAIT WHAT',
    'bro BRO',
    'my legs are gone',
    'not okay rn 🎉',
    'screaming externally',
    'i am NOT fine',
    'WHAT IS HAPPENING',
    'i lost my voice. worth it',
    'feet? never heard of them',
    'this is the best day',
    'body is broken. soul is full.',
    'I CANNOT CALM DOWN',
  ],
  kova: [
    'legs cooked',
    'heart rate: yes',
    'hydration check people',
    'calves destroyed. PR tho',
    'endorphins loading',
    'active recovery mode',
    'festival cardio > gym',
    'muscle memory: vibing',
    'training block complete',
    'split time: irrelevant. vibing.',
    'coach would not approve. doing it anyway',
    'personal best for dancing',
  ],
  dub: [
    'that sub tho',
    'felt that in a tooth',
    'mid-range could be worse',
    'ok respect',
    'whoever mixed this 👏',
    'low end is ruthless',
    'that transition was criminal',
    'my ears said thank you',
    'soundcheck energy rn',
    'the monitors are lying',
    'wait. that was a perfect mix.',
    'frequency check: immaculate',
  ],
  satosh: [
    'bullish on vibes',
    'charts closed vibes open',
    'high risk high vibe',
    'diamond hands on snacks',
    'wen encore',
    'this is the dip. buying.',
    'vibes: parabolic',
    'not financial advice but go',
    'portfolio: vibes only',
    'gm. still here.',
    'ngmi going home early',
    'vibe to earnings ratio: infinite',
  ],
  solo: [
    'bad feeling about this',
    'may the bass',
    'never tell me the odds',
    'i have a bad feeling',
    'these aren\'t the droids',
    'the force is loud',
    'disturbance in the Force rn',
    'a long time ago in a festival',
    'do or do not. i did.',
    'this is the way',
    'i find your lack of water disturbing',
    'rebellions are built on vibes',
  ],
  buz: [
    'mystery bag??',
    'staying hydrated?',
    'glowsticks. just saying',
    'i know a guy',
    'limited supply rn',
    'good energy accepted',
    'front row hookup 👀',
    'don\'t ask questions',
    'everything is legal here probably',
    'best customers in the biz',
    'restock complete. let\'s go.',
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
    'observable pattern emerging',
    'making notes',
    'ancient ritual. updated.',
  ],
  giggle: [
    'heh',
    'get it tho',
    'bass dropped lol',
    'that\'s the setup',
    'punchline incoming',
    'i\'ll see myself out',
    'key changes haha',
    'why did the set cross the road',
    'i\'m on a roll. literally. sold one.',
    'encore? i barely know her',
    'i told a stage joke. it had good range',
    'crowd surfing: 10/10 would fall again',
  ],
};

const GENERIC_MUMBLES: string[] = [
  'vibes rn 🔥',
  'my feet tho',
  'need water maybe',
  'brain is offline',
  'ok this slaps',
  'not leaving ever',
  'send help and snacks',
  'where did the time go',
  'everyone is so cool here',
  'this crowd tho',
  'i love it here',
  'ok i\'m obsessed',
  'the energy rn',
  'can\'t feel my legs. vibing.',
  'who authorized this banger',
  'eyes: closed. vibes: open',
  'festival math: hours feel like minutes',
  'the sky rn tho',
  'everyone is dancing and it\'s beautiful',
  'this is what alive feels like',
  'ok the light show tho',
  'genuinely can\'t leave',
  'forgot real life exists',
  'i live here now',
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