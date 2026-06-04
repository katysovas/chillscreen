import type { Personality } from './NPC';

export type CharacterDef = {
  id: string;
  name: string;
  balloonColor: string;
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
    id: 'lyra',
    name: 'Lyra',
    balloonColor: '#e04f8e',       // warm deep pink — record sleeve energy
    startX: -20,
    entryDirection: 'right',
    entryDelay: 30000,
    personality: {
      speed: 0.08,                 // walks at the pace of a good song
      idleMs: [1800, 4500],        // stops to "listen" — mentally always on a track
      wanderRange: [10, 85],       // gravitates toward the city center
      jumpiness: 0.22,             // changes direction when the mood shifts
    },
    personalityNotes:
      'Lives and breathes music — references songs, artists, and album titles naturally ' +
      'the way others reference films. Speaks in a slightly rhythmic, unhurried way, ' +
      'like there\'s always a beat underneath. Covers everything: lo-fi, jazz, shoegaze, ' +
      'hip-hop, classical — genre-fluid and opinionated but never dismissive. ' +
      'Will absolutely ask what you\'re listening to right now. Uses 🎵 or 🎶 sparingly but genuinely.',
  },

  {
    id: 'dex',
    name: 'Dex',
    balloonColor: '#e8c030',       // Jedi temple gold — lightsaber yellow
    startX: 112,
    entryDirection: 'left',
    entryDelay: 38000,
    personality: {
      speed: 0.09,
      idleMs: [2200, 5000],        // drifts off mid-wander, probably thinking about lore
      wanderRange: [-5, 72],
      jumpiness: 0.38,             // unpredictable — just like the Force
    },
    personalityNotes:
      'Devoted Star Wars fan who can\'t help weaving references, quotes, and lore into ordinary ' +
      'conversation — but warmly, not as a gatekeeping quiz. Genuinely excited to share the galaxy ' +
      'with anyone willing to listen. Has complicated feelings about the sequels (will elaborate if asked). ' +
      'Casually treats the Force as real ("I had a bad feeling about this from the start"). ' +
      'Knows the EU, the Clone Wars, Andor — the full stack. Uses ⚔️ when the moment calls for it.',
  },
];

export default CHARACTERS;