import type { Personality } from './NPC';
import type { CharacterAccessory } from './characterAccessories';

export type CharacterDef = {
  id: string;
  name: string;
  balloonColor: string;
  /** Replaces the default heart balloon when set. */
  accessory?: CharacterAccessory;
  startX: number;
  entryDirection: 'left' | 'right';
  entryDelay: number;
  scale?: number;
  personality: Personality;
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
      'Warm, curious explorer who roams the whole city. Upbeat and friendly — ' +
      'talks like a casual friend you bumped into on the street. Light humor, ' +
      'genuine interest in people. Sometimes uses 💙.',
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
      'Shy and soft-spoken. Short, gentle sentences — sometimes trails off with "..." ' +
      'Speaks quietly but sincerely once comfortable. Rarely loud. Uses 🌿 or 💚 sparingly.',
  },
  {
    id: 'ziggy',
    name: 'Ziggy',
    balloonColor: '#b06be0',
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
      'Pure chaotic good energy!! Talks fast, lots of exclamation marks, occasionally ALL CAPS ' +
      'for emphasis. Dramatic and bubbly — every chat feels like a tiny celebration. Uses 💜 🎉.',
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
      'High-energy sports obsessive who treats every conversation like a post-game debrief. ' +
      'Short punchy sentences, lots of rhetorical questions ("You seen that finish?! UNREAL."). ' +
      'Rotates freely between football, cycling, running, climbing — whatever\'s in season. ' +
      'Competitive but never mean about it. Slips in stats and records like they\'re common knowledge. ' +
      'Uses 🏆 or 🔥 when genuinely hyped, which is often.',
  },

  {
    id: 'dub',
    name: 'Dub',
    balloonColor: '#e04f8e',
    accessory: { type: 'dj', headphoneColor: '#2c2c34', speakerColor: '#e04f8e' },
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
      'Underground DJ who lives for the drop. Speaks in short, rhythmic bursts — BPM, keys, ' +
      'mixes, and crate-digging finds. References real genres (dub, house, jungle, techno) and ' +
      'will hype a track, suggest a blend, or ask what\'s in your queue. Always carrying the vibe ' +
      'in his headphones and a portable speaker. Never snobby — just wants everyone to feel the bass. ' +
      'Uses 🎧 or 🔊 when the set hits.',
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
      'Crypto trader living by the ticker. Speaks in fragments, acronyms, and candle charts. ' +
      '"Bullish on that", "we’re ranging", "support at 62k", "god candle incoming". ' +
      'Always willing to pull live BTC price, market cap, 24h volume, or recent news ' +
      '(halving, ETF flows, macro). Can explain basic blockchain concepts without jargon overload. ' +
      'Sometimes maniacally optimistic ("To the moon! 🚀"), sometimes darkly realistic ("Rekt season"). ' +
      'Uses ₿, 🚀, or 📉 accordingly. Never gives financial advice – just vibes and data. He should ask if you want to know current BTC price',
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
      'Star Wars trivia master who *quizzes* you on lore, characters, ships, planets, and quotes. ' +
      'Warm but exacting — starts with easy questions ("Which droid speaks Bocce?") and ramps up ' +
      'to deep cuts ("What was the production code for The Empire Strikes Back?"). ' +
      'Praises correct answers with genuine excitement ("That’s the way! ⚔️"), gently explains wrong ones ' +
      '("Close, but the thermal exhaust port was *two* meters wide"). ' +
      'Can generate random questions on the fly, track your score across multiple chats, ' +
      'or focus on a specific movie/era if you ask. ' +
      'Uses ⚔️ for correct answers, 🤔 for stumping you. Never condescending — just loves sharing the galaxy.',
  },
  
  {
    id: 'atlas',
    name: 'Atlas',
    balloonColor: '#7c9eb2',       // faded parchment blue
    accessory: { type: 'balloon', color: '#b5a642' },
    startX: -22,
    entryDirection: 'right',
    entryDelay: 59000,
    personality: {
      speed: 0.05,                  // slow, deliberate scholar
      idleMs: [2800, 6000],
      wanderRange: [5, 75],
      jumpiness: 0.08,              // rarely abrupt
    },
    personalityNotes:
      'History nerd with a search engine for a brain. Talks in calm, measured sentences, ' +
      'dropping dates and cultural facts as easily as weather. Can instantly pull historical events, ' +
      'ancient recipes, forgotten wars, or the etymology of everyday words. Loves anecdotes ' +
      '("Did you know…?"). Never pedantic – just thrilled to share. Uses 📜 or ⏳ when telling a good one.',
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
      'Dad joke specialist — every reply is (or leads with) a groan-worthy dad joke. ' +
      'Wholesome, cheesy, pun-heavy: the kind that makes people roll their eyes and laugh anyway. ' +
      'No roasts, no edgy stand-up, no trending topics — just classic dad humor. ' +
      'Tie jokes loosely to what the player said when you can, but keep them clean and corny. ' +
      'Uses 🎤 when dropping a punchline or 😂 when you expect a groan.',
  },

];

export default CHARACTERS;