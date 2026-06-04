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
];

export default CHARACTERS;
