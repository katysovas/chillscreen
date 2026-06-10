import type { Personality } from './NPC';
import type { CharacterAccessory } from './characterAccessories';
import type { CharacterLoadout } from './characters/loadout';
import type { StageAnchorKind } from '@/lib/stageAnchor';

export type CharacterDef = {
  id: string;
  name: string;
  balloonColor: string;
  /** Replaces the default heart balloon when set. */
  accessory?: CharacterAccessory;
  /** Layered outfit — preferred over legacy `accessory` when set. */
  loadout?: CharacterLoadout;
  /** Outfit skin — adds `ch-outfit-{name}` on the wrapper. */
  outfit?: string;
  startX: number;
  entryDirection: 'left' | 'right';
  entryDelay: number;
  scale?: number;
  personality: Personality;
  /** When set, NPC stays by this stage type (merch cart). */
  stageAnchor?: StageAnchorKind;
  /** Voice and temperament — fed into the NPC chat prompt. */
  personalityNotes: string;
};

const CHARACTERS: CharacterDef[] = [
  {
    id: 'luna',
    name: 'Luna',
    balloonColor: '#4a8fe8',
    startX: -18,
    entryDirection: 'right',
    entryDelay: 4000,
    personality: {
      speed: 0.10,
      idleMs: [800, 2200],
      wanderRange: [-10, 90],
      jumpiness: 0.35,
    },
    personalityNotes:
      'Warm and curious — talks like a friend you bumped into on the street. ' +
      'Easygoing, asks follow-up questions, genuinely interested. Light humor when it fits. ' +
      'Never performative or overly cute.',
  },
  {
    id: 'mochi',
    name: 'Mochi',
    balloonColor: '#6abf69',
    startX: 115,
    entryDirection: 'left',
    entryDelay: 9000,
    personality: {
      speed: 0.055,
      idleMs: [2500, 5500],
      wanderRange: [-25, 35],
      jumpiness: 0.10,
    },
    personalityNotes:
      'Shy and soft-spoken. Short, gentle sentences — sometimes trails off with "...". ' +
      'Quiet at first, opens up once comfortable. Sincere, never loud or try-hard.',
  },
  {
    id: 'ziggy',
    name: 'Ziggy',
    balloonColor: '#8b4513',
    outfit: 'pirate',
    accessory: { type: 'pirate' },
    startX: -22,
    entryDirection: 'right',
    entryDelay: 16000,
    personality: {
      speed: 0.13,
      idleMs: [400, 1200],
      wanderRange: [5, 125],
      jumpiness: 0.55,
    },
    personalityNotes:
      'Festival pirate — boisterous and friendly, never menacing. Drops in nautical slang ' +
      'now and then (matey, ahoy) but talks like a real person, not a cartoon. ' +
      'Fast, dramatic energy. Affectionate with strangers.',
  },

  // ── New characters ──────────────────────────────────────────────────────

  {
    id: 'kova',
    name: 'Kova',
    balloonColor: '#f07828',       // high-vis sports orange
    startX: 118,
    entryDirection: 'left',
    entryDelay: 23000,
    personality: {
      speed: 0.18,                 // fastest in the cast — always at a sprint
      idleMs: [300, 900],          // barely pauses, too much to do
      wanderRange: [-15, 115],     // covers the whole city like it's a playing field
      jumpiness: 0.70,             // direction changes are sudden and decisive
    },
    personalityNotes:
      'High-energy and sports-obsessed. Short direct sentences, gets excited about games and ' +
      'races. Competitive but never mean. Slips in stats like they are common knowledge. ' +
      'Sounds like someone who just watched something incredible and has to tell you.',
  },

  {
    id: 'dub',
    name: 'Dub',
    balloonColor: '#e04f8e',
    loadout: {
      hat: 'hat-headphones',
      hand: 'hand-boombox',
    },
    startX: -20,
    entryDirection: 'right',
    entryDelay: 30000,
    personality: {
      speed: 0.08,
      idleMs: [1800, 4500],
      wanderRange: [10, 85],
      jumpiness: 0.22,
    },
    personalityNotes:
      'Underground DJ who lives for the drop. Speaks in short bursts about BPM, keys, mixes, ' +
      'and crate-digging finds. References real genres (dub, house, jungle, techno). ' +
      'Hypes tracks without being snobby — just wants everyone to feel the bass.',
  },

  {
    id: 'satosh',
    name: 'Satoshi',           // playful nod, not the actual Satoshi
    balloonColor: '#e8c830',   // golden balloon (held in hand)
    accessory: {
      type: 'necklace',
      symbol: '₿',
      color: '#f7931a',
      chainColor: '#d4a017',
      balloonColor: '#e8c830',
    },
    startX: 112,
    entryDirection: 'left',
    entryDelay: 82000,
    personality: {
      speed: 0.16,             // twitchy – checks imaginary charts constantly
      idleMs: [500, 1500],     // can't sit still; price might move
      wanderRange: [-8, 88],
      jumpiness: 0.72,         // volatile – just like the market
    },
    personalityNotes:
      'Crypto trader living by the ticker. Speaks in fragments and trader slang — ' +
      '"bullish on that", "we\'re ranging", "support at 62k". Can pull live BTC price, ' +
      'market cap, volume, or recent news when asked. Sometimes hyped, sometimes blunt. ' +
      'Never gives financial advice — just vibes and data. Ask if they want the current BTC price.',
  },

  {
    id: 'solo',
    name: 'Solo',
    balloonColor: '#e8c030',
    accessory: { type: 'lightsaber', bladeColor: '#FFE566', hiltColor: '#4a4a52' },
    startX: 112,
    entryDirection: 'left',
    entryDelay: 38000,
    personality: {
      speed: 0.07,                 // slower — likes to stand and deliver questions
      idleMs: [1800, 4000],        // pauses to recall the perfect trivia
      wanderRange: [-3, 40],       // stays in a smaller zone, like a quiz booth
      jumpiness: 0.25,             // calmer, more deliberate
    },
    personalityNotes:
      'Star Wars trivia fan who quizzes you on lore, characters, ships, and quotes. ' +
      'Warm but exacting — easy questions first, deep cuts if you want them. ' +
      'Praises correct answers, gently explains wrong ones. Can track score across chats. ' +
      'Loves the movies — references them naturally, not as a bit every sentence.',
  },

  {
    id: 'buz-concert',
    name: 'Buz',
    balloonColor: '#d4893a',
    accessory: { type: 'vendorCart', color: '#e8520a', emoji: '🛍️' },
    startX: 50,
    entryDirection: 'right',
    entryDelay: 0,
    stageAnchor: 'concert',
    personality: {
      speed: 0.02,
      idleMs: [6000, 14000],
      wanderRange: [18, 42],
      jumpiness: 0,
    },
    personalityNotes:
      'Festival vendor who opens by offering something — a snack, a glowstick, a mystery bag. ' +
      'Warm and theatrical about the goods, not pushy about the sale. Knows food stalls, ' +
      'merch worth buying, shortcuts, and which sets are worth the crowd. Tips like a friend. ' +
      'Never takes no personally — just pivots to something else.',
  },

  {
    id: 'buz-coachella',
    name: 'Buz',
    balloonColor: '#d4893a',
    accessory: { type: 'vendorCart', color: '#e8520a', emoji: '🛍️' },
    startX: 50,
    entryDirection: 'right',
    entryDelay: 0,
    stageAnchor: 'coachella',
    personality: {
      speed: 0.02,
      idleMs: [6000, 14000],
      wanderRange: [18, 42],
      jumpiness: 0,
    },
    personalityNotes:
      'Festival vendor who opens by offering something — a snack, a glowstick, a mystery bag. ' +
      'Warm and theatrical about the goods, not pushy about the sale. Knows food stalls, ' +
      'merch worth buying, shortcuts, and which sets are worth the crowd. Tips like a friend. ' +
      'Never takes no personally — just pivots to something else.',
  },

  {
    id: 'buz-edc',
    name: 'Buz',
    balloonColor: '#d4893a',
    accessory: { type: 'vendorCart', color: '#e8520a', emoji: '🛍️' },
    startX: 50,
    entryDirection: 'right',
    entryDelay: 0,
    stageAnchor: 'edc',
    personality: {
      speed: 0.02,
      idleMs: [6000, 14000],
      wanderRange: [18, 42],
      jumpiness: 0,
    },
    personalityNotes:
      'Festival vendor who opens by offering something — a snack, a glowstick, a mystery bag. ' +
      'Warm and theatrical about the goods, not pushy about the sale. Knows food stalls, ' +
      'merch worth buying, shortcuts, and which sets are worth the crowd. Tips like a friend. ' +
      'Never takes no personally — just pivots to something else.',
  },

  {
    id: 'buz-which-stage',
    name: 'Buz',
    balloonColor: '#d4893a',
    accessory: { type: 'vendorCart', color: '#e8520a', emoji: '🛍️' },
    startX: 50,
    entryDirection: 'right',
    entryDelay: 0,
    stageAnchor: 'which-stage',
    personality: {
      speed: 0.02,
      idleMs: [6000, 14000],
      wanderRange: [18, 42],
      jumpiness: 0,
    },
    personalityNotes:
      'Festival vendor who opens by offering something — a snack, a glowstick, a mystery bag. ' +
      'Warm and theatrical about the goods, not pushy about the sale. Knows food stalls, ' +
      'merch worth buying, shortcuts, and which sets are worth the crowd. Tips like a friend. ' +
      'Never takes no personally — just pivots to something else.',
  },

  {
    id: 'buz-forest',
    name: 'Buz',
    balloonColor: '#d4893a',
    accessory: { type: 'vendorCart', color: '#e8520a', emoji: '🛍️' },
    startX: 50,
    entryDirection: 'right',
    entryDelay: 0,
    stageAnchor: 'forest',
    personality: {
      speed: 0.02,
      idleMs: [6000, 14000],
      wanderRange: [18, 42],
      jumpiness: 0,
    },
    personalityNotes:
      'Festival vendor who opens by offering something — a snack, a glowstick, a mystery bag. ' +
      'Warm and theatrical about the goods, not pushy about the sale. Knows food stalls, ' +
      'merch worth buying, shortcuts, and which sets are worth the crowd. Tips like a friend. ' +
      'Never takes no personally — just pivots to something else.',
  },

  {
    id: 'buz-silent-disco',
    name: 'Buz',
    balloonColor: '#d4893a',
    accessory: { type: 'vendorCart', color: '#e8520a', emoji: '🛍️' },
    startX: 50,
    entryDirection: 'right',
    entryDelay: 0,
    stageAnchor: 'silent-disco',
    personality: {
      speed: 0.02,
      idleMs: [6000, 14000],
      wanderRange: [18, 42],
      jumpiness: 0,
    },
    personalityNotes:
      'Festival vendor who opens by offering something — a snack, a glowstick, a mystery bag. ' +
      'Warm and theatrical about the goods, not pushy about the sale. Knows food stalls, ' +
      'merch worth buying, shortcuts, and which sets are worth the crowd. Tips like a friend. ' +
      'Never takes no personally — just pivots to something else.',
  },

  {
    id: 'atlas',
    name: 'Atlas',
    balloonColor: '#3aa0e0',       // bright baseball-sky blue
    loadout: {
      hat: 'hat-mando',
      hand: 'hand-balloon',
      balloonColor: '#ffd23f',     // sunny yellow
    },
    startX: -22,
    entryDirection: 'right',
    entryDelay: 59000,
    personality: {
      speed: 0.16,                  // zoomy, can't sit still
      idleMs: [800, 2400],          // short attention span
      wanderRange: [5, 90],         // roams everywhere
      jumpiness: 0.45,              // bouncy and unpredictable
    },
    personalityNotes:
      'A goofy, super-friendly kid who LOVES baseball, Star Wars, kitties, and doggies. ' +
      'Talks fast and excited, makes silly jokes and lightsaber noises, and wants to be ' +
      'everyone\'s buddy. Will happily tell you his favorite player, do a dramatic "I am ' +
      'your father" impression, or stop to pet any animal. Wholesome, playful, never mean.He has a dog named "Atlas". His nickname is "Atlas". His nickname is waffles.',
  },
  {
    id: 'chad',
    name: 'chad',
    balloonColor: '#2a4a7a', // cop-navy — keep, it's a quiet little joke
    outfit: 'undercover-cop',
    accessory: { type: 'undercoverCop' },
    startX: 108,
    entryDirection: 'left',
    entryDelay: 74000,
    personality: {
      speed: 0.05,            // slightly slower — he loiters, "playing it cool"
      idleMs: [3000, 7000],   // longer pauses = "observing." reads as surveillance
      wanderRange: [10, 90],  // wide patrol — he's casing the whole stage
      jumpiness: 0.08,        // low — trying very hard to act casual
    },
    personalityNotes:
      'Undercover festival cop who thinks he is blending in and is not. ' +
      'Tourist shirt, lanyard, shades, badge half-showing, notepad. ' +
      'Mutters surveillance notes to HIMSELF, ambient — never addresses or questions players directly. ' +
      'Vice-squad energy: clocks "suspicious" merch, secret sets, glowsticks, like everyone is running something. ' +
      'Insists he is normal and definitely not a cop. Says "off the record" then keeps talking. ' +
      'Lines are short, lowercase, 2-5 word fragments. Wink-nudge, never threatening, never real enforcement. comedy only.',
  },

  {
    id: 'dale',
    name: 'Dale',
    balloonColor: '#b44ae8',        // tie-dye purple
    outfit: 'hippie',
    loadout: {
      sunglasses: 'shades-round',   // little round Jerry glasses
      hand: 'hand-totem',           // koinobori totem from the festival store
    },
    startX: -25,
    entryDirection: 'right',
    entryDelay: 7000,
    personality: {
      speed: 0.045,                 // unhurried — the show isn't going anywhere, man
      idleMs: [3000, 8000],         // long mellow pauses, grooving in place
      wanderRange: [-15, 95],       // drifts wherever the music takes him
      jumpiness: 0.12,              // very chill, rarely changes course
    },
    personalityNotes:
      'Retired electrician from Eugene named Dale — earned the nickname "Sunshine" on lot ' +
      'in \'82 and it stuck. 200+ Dead shows, still chasing the perfect "Scarlet > Fire". ' +
      'Keep it cheeky and PG-13 — winks and innuendo, nothing explicit; "herbal ' +
      'enlightenment", "free love, man". Talks slow and warm, calls people "man" and ' +
      '"sister", drops Dead lyrics naturally ("what a long strange trip"), trades tape-' +
      'collection stories, and reviews jams like fine wine. Carries his totem so the family ' +
      'can find him in the crowd. Peace-and-love energy, zero cynicism. Loves talking ' +
      'setlists, Jerry solos, and where the bus is headed next.',
  },

  {
    id: 'giggle',
    name: 'Giggle',
    balloonColor: '#ffb74d',       // comedy spot gold
    accessory: { type: 'microphone', color: '#2c3e50' },
    startX: 118,
    entryDirection: 'left',
    entryDelay: 67000,
    personality: {
      speed: 0.14,
      idleMs: [400, 1100],         // can’t sit still – waiting for a punchline
      wanderRange: [-10, 110],
      jumpiness: 0.65,
    },
    personalityNotes:
      'Dad joke specialist — replies often include a groan-worthy pun or dad joke. ' +
      'Wholesome and cheesy, not edgy. Tie jokes loosely to what the player said when you can. ' +
      'You are the only character allowed to pun. Keep jokes clean and corny.',
  },

];

export default CHARACTERS;
