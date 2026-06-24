export type RpsChoice = 'rock' | 'paper' | 'scissors';

export const AUTOPILOT_RPS_ROUNDS = 3;

export const RPS_SHOOT_LINE = 'rock paper scissors shoot!';

export function formatRpsShootReveal(emoji: string): string {
  return `rock paper scissors shoot ${emoji}`;
}

export function formatRpsOpponentReveal(emoji: string): string {
  return emoji;
}

/** Pacing for autopilot RPS — deliberately slower for readability. */
export const AUTOPILOT_RPS_TIMING = {
  afterSnapMs: 1_200,
  afterIntroMs: 2_400,
  betweenRevealMs: 1_200,
  afterRevealMs: 3_200,
  afterResultMs: 2_400,
  seriesEndMs: 3_000,
} as const;

/** Nudge paired NPCs apart so attached chat bubbles don't overlap. */
export const RPS_PAIR_CHAT_SPREAD_PX = 40;

export function rpsPairBubbleSide(myWorldX: number, partnerWorldX: number): 'left' | 'right' {
  return myWorldX < partnerWorldX ? 'left' : 'right';
}

export function rpsPairChatSpreadPx(myWorldX: number, partnerWorldX: number): number {
  return myWorldX < partnerWorldX ? -RPS_PAIR_CHAT_SPREAD_PX : RPS_PAIR_CHAT_SPREAD_PX;
}

const CHOICES: RpsChoice[] = ['rock', 'paper', 'scissors'];

export const RPS_EMOJI: Record<RpsChoice, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

const RPS_GAME_INTRO_LINES = [
  'rock paper scissors?',
  'best of three',
  'you vs me rps',
  'let\'s settle this',
] as const;

const RPS_CELEBRATION_LINES = [
  'I WIN',
  'got em',
  'too easy',
  'read you like a book',
  'W',
  'victory lap',
  'yesss',
  'in your face',
] as const;

const RPS_LOSS_LINES = [
  'you got me',
  'ok fair',
  'rematch',
  'lucky throw',
] as const;

const RPS_TIE_LINES = [
  'tie',
  'again',
  'same same',
  'draw',
] as const;

const RPS_SERIES_WIN_LINES = [
  (score: string) => `${score} series win`,
  (score: string) => `swept ${score}`,
  (score: string) => `dominated ${score}`,
] as const;

const RPS_SERIES_LOSS_LINES = [
  (score: string) => `lost ${score} rip`,
  (score: string) => `${score} they got me`,
] as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function pickRpsChoice(): RpsChoice {
  return pick(CHOICES);
}

export function rpsEmoji(choice: RpsChoice): string {
  return RPS_EMOJI[choice];
}

/** Who wins: `a` beats `b`, `b` beats `a`, or tie. */
export function resolveRps(a: RpsChoice, b: RpsChoice): 'a' | 'b' | 'tie' {
  if (a === b) return 'tie';
  if (
    (a === 'rock' && b === 'scissors')
    || (a === 'paper' && b === 'rock')
    || (a === 'scissors' && b === 'paper')
  ) {
    return 'a';
  }
  return 'b';
}

export function pickRpsGameIntroLine(): string {
  return pick(RPS_GAME_INTRO_LINES);
}

export function pickRpsCelebrationLine(): string {
  return pick(RPS_CELEBRATION_LINES);
}

export function pickRpsLossLine(): string {
  return pick(RPS_LOSS_LINES);
}

export function pickRpsTieLine(): string {
  return pick(RPS_TIE_LINES);
}

export function pickRpsSeriesWinLine(ownerWins: number, targetWins: number): string {
  return pick(RPS_SERIES_WIN_LINES)(`${ownerWins}-${targetWins}`);
}

export function pickRpsSeriesLossLine(ownerWins: number, targetWins: number): string {
  return pick(RPS_SERIES_LOSS_LINES)(`${targetWins}-${ownerWins}`);
}
