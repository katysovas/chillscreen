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
  greetings: string[];
  responses: string[];
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
      wanderRange: [-10, 90],   // roams widely, drifts off-screen often
      jumpiness: 0.35,
    },
    greetings: [
      "Hey! Haven't seen you here before! 👋",
      "Oh hi! I love this neighborhood!",
      "Hello! Want to explore together? 💙",
      "There you are! I was hoping we'd meet!",
    ],
    responses: [
      "That's so interesting!",
      "Tell me more! 💙",
      "I was just thinking the same thing!",
      "Haha, really? 😄",
    ],
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
      wanderRange: [-25, 35],  // shy — stays left side, often off-screen
      jumpiness: 0.10,
    },
    greetings: [
      "Um... hi... 🌿",
      "Oh! You noticed me...",
      "H-hello there 💚",
      "I don't usually talk to strangers but... hi",
    ],
    responses: [
      "Oh... okay 🌿",
      "That's... nice",
      "Mm... I see",
      "Really? ...cool 💚",
    ],
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
      wanderRange: [5, 125],   // energetic — crosses the whole world
      jumpiness: 0.55,
    },
    greetings: [
      "HEYYY!!! 🎉",
      "Oh oh oh, it's YOU!! HI!!",
      "Whooa a new friend!! 💜",
      "FINALLY someone to talk to!!!",
    ],
    responses: [
      "NO WAY!! 🎉",
      "YESSS!!",
      "Haha omg 💜",
      "SAME!! I was just thinking that!!",
    ],
  },
];

export default CHARACTERS;
