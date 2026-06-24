import { shortNowPlayingTitle } from '@/lib/autopilot/ambientContext';

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export const AUTOPILOT_NPC_CHAT_OPENERS = [
  'hey what\'s good',
  'you vibing?',
  'this set hits',
  'quick chat?',
  'how\'s the crowd',
  'you look busy lol',
  'festie on duty hi',
  'ok real talk',
] as const;

export const AUTOPILOT_NPC_CHAT_FOLLOWUPS = [
  'wait say more',
  'ok ok fair',
  'lol same',
  'wild',
  'respect',
  'no literally though',
] as const;

export const AUTOPILOT_RIVALRY_LINES = [
  (name: string) => `${name} thinks they're main character`,
  (name: string) => `my festie energy > ${name}`,
  (name: string) => `${name} copied my fit`,
  (name: string) => `saw ${name} buy the same hat`,
  (name: string) => `${name} is also unsupervised lol`,
  (name: string) => `rival festie spotted: ${name}`,
] as const;

export const AUTOPILOT_NAP_LINES = [
  'festie needs water',
  'brain offline nap mode',
  'five min eyes closed',
  'autopilot battery low',
  'shhh resting',
  'donut break',
] as const;

export const AUTOPILOT_FLEX_LINES = [
  (detail: string) => detail,
  (detail: string) => `while you were away: ${detail}`,
  (detail: string) => `your festie ${detail}`,
  (detail: string) => `human missed this — ${detail}`,
] as const;

export function pickAutopilotNpcChatOpener(): string {
  return pick(AUTOPILOT_NPC_CHAT_OPENERS);
}

export function pickAutopilotNpcChatFollowup(): string {
  return pick(AUTOPILOT_NPC_CHAT_FOLLOWUPS);
}

export function pickAutopilotRivalryLine(otherName: string): string {
  return pick(AUTOPILOT_RIVALRY_LINES)(otherName.trim() || 'that festie');
}

const AUTOPILOT_HUMAN_APPROACH_GENERIC = [
  'hi human',
  'real person alert',
  'you look suspiciously alive',
  'human detected',
  'hey stranger',
  'festie approaching',
] as const;

const AUTOPILOT_HUMAN_APPROACH_NAMED = [
  (name: string) => `hi ${name}`,
  (name: string) => `${name}? cool name`,
] as const;

const AUTOPILOT_DROP_REACTION_GENERIC = [
  'DROP',
  'here we go',
  'BASS INCOMING',
] as const;

const AUTOPILOT_DROP_REACTION_NAMED = [
  (act: string) => `new song: ${act}`,
  (act: string) => `${act} just dropped`,
  (act: string) => `wait ${act}?`,
  (act: string) => `${act} goes hard`,
] as const;

const AUTOPILOT_LINEUP_VOTE_GENERIC = [
  'democracy but make it festie',
  'my vote my rules',
] as const;

const AUTOPILOT_LINEUP_VOTE_NAMED = [
  (title: string) => `voting for ${title}`,
  (title: string) => `${title} next pls`,
  (title: string) => `need ${title} on deck`,
] as const;

const AUTOPILOT_PARTY_PROP_GENERIC = [
  'visual chaos loading',
  'sorry not sorry',
] as const;

const AUTOPILOT_PARTY_PROP_NAMED = [
  (prop: string) => `${prop} time`,
  (prop: string) => `deploying ${prop}`,
  (prop: string) => `${prop} era begins`,
] as const;

const AUTOPILOT_EASEL_GENERIC = [
  'street canvas acquired',
  'official artist now',
  'watch me paint',
] as const;

const AUTOPILOT_EASEL_NAMED = [
  (topic: string) => `easel time: ${topic}`,
  (topic: string) => `painting ${topic}`,
] as const;

export function pickAutopilotHumanApproachLine(name?: string | null): string {
  if (name?.trim() && Math.random() < 0.5) {
    return pick([...AUTOPILOT_HUMAN_APPROACH_NAMED])(name.trim());
  }
  return pick([...AUTOPILOT_HUMAN_APPROACH_GENERIC]);
}

export function pickAutopilotDropReactionLine(nowPlaying: string | null): string {
  const act = nowPlaying ? shortNowPlayingTitle(nowPlaying) : 'this drop';
  if (Math.random() < 0.65) return pick([...AUTOPILOT_DROP_REACTION_NAMED])(act);
  return pick([...AUTOPILOT_DROP_REACTION_GENERIC]);
}

export function pickAutopilotLineupVoteLine(title: string): string {
  const label = shortNowPlayingTitle(title);
  if (Math.random() < 0.7) return pick([...AUTOPILOT_LINEUP_VOTE_NAMED])(label);
  return pick([...AUTOPILOT_LINEUP_VOTE_GENERIC]);
}

export function pickAutopilotPartyPropLine(propName: string): string {
  const label = propName.trim().toLowerCase() || 'party gear';
  if (Math.random() < 0.65) return pick([...AUTOPILOT_PARTY_PROP_NAMED])(label);
  return pick([...AUTOPILOT_PARTY_PROP_GENERIC]);
}

export function pickAutopilotEaselLine(topic: string): string {
  const label = topic.trim() || 'something';
  if (Math.random() < 0.55) return pick([...AUTOPILOT_EASEL_NAMED])(label);
  return pick([...AUTOPILOT_EASEL_GENERIC]);
}

export function pickAutopilotNapLine(): string {
  return pick(AUTOPILOT_NAP_LINES);
}

export function pickAutopilotFlexLine(detail: string): string {
  return pick(AUTOPILOT_FLEX_LINES)(detail);
}

export function buildAutopilotFlexDetail(
  kind: 'purchase' | 'loss' | 'draw' | 'vote' | 'coins',
  label: string,
): string {
  switch (kind) {
    case 'purchase': return `bought ${label}`;
    case 'loss': return `lost ${label}`;
    case 'draw': return `drew ${label}`;
    case 'vote': return `voted for ${label}`;
    case 'coins': return `spent coins on ${label}`;
    default: return label;
  }
}
