import { completeDrawingText } from './completeDrawing';

export type DrawSubjectInput = {
  userPrompt?: string;
  seedPrompt?: string | null;
  streamTitle?: string | null;
  channelName?: string;
  skyPeriod?: string;
  npcName?: string;
  priorTopics?: string[];
};

const SUBJECT_SYSTEM = [
  'Pick ONE drawable subject from the context.',
  'Reply with ONLY 1–3 words — a concrete noun (cat, dog, person, hotel, rocket, tree, pizza).',
  'Never reply with a sentence, quote, chat line, or fragment.',
  'Convert vibes and long phrases into a single thing to draw.',
].join('\n');

/** True when text is already a short drawable label (not a chat line). */
export function isShortDrawSubject(text: string): boolean {
  const t = text.trim();
  if (t.length < 2 || t.length > 36) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;
  if (words.length > 2 && /[.!?]/.test(t)) return false;
  if (words.length > 2 && /\b(is|are|was|were|not|because|evolved|suffering|people|hotel)\b/i.test(t)) {
    return false;
  }
  return true;
}

export function sanitizeDrawSubject(raw: string): string {
  let s = raw.trim().replace(/^["'`]+|["'`]+$/g, '');
  s = s.replace(/^(?:draw|doodle|sketch|paint)\s+(?:a\s+|an\s+|me\s+)?/i, '').trim();
  s = s.split('\n')[0]!.replace(/[.!?,;:]+$/g, '').trim();
  return s.split(/\s+/).slice(0, 3).join(' ').slice(0, 24);
}

function heuristicDrawSubject(input: DrawSubjectInput): string {
  const source = [
    input.userPrompt,
    input.seedPrompt,
    input.streamTitle,
  ].find(s => s?.trim())?.trim() ?? '';

  const words = source
    .replace(/[.!?,;:()"']/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2);

  const skip = new Set([
    'the', 'and', 'are', 'not', 'you', 'for', 'that', 'with', 'this', 'from',
    'have', 'was', 'were', 'people', 'hotel', 'evolved', 'suffering', 'per',
  ]);

  const candidates = words.filter(w => !skip.has(w.toLowerCase()));
  if (candidates.length === 0) return 'sketch';
  return candidates[candidates.length - 1]!.toLowerCase().slice(0, 24);
}

function buildResolveUserPrompt(input: DrawSubjectInput): string {
  const lines = [
    input.userPrompt ? `Player asked to draw: ${input.userPrompt}` : null,
    input.seedPrompt ? `Nearby chat line (do NOT use verbatim): ${input.seedPrompt}` : null,
    input.streamTitle ? `Stream on screen: ${input.streamTitle}` : null,
    input.channelName ? `Channel: ${input.channelName}` : null,
    input.skyPeriod ? `Time: ${input.skyPeriod}` : null,
    input.npcName ? `Painter: ${input.npcName}` : null,
    input.priorTopics?.length
      ? `Already painted (pick something else): ${input.priorTopics.join(', ')}`
      : null,
    'What ONE noun should they draw? Reply with only that noun.',
  ].filter(Boolean);
  return lines.join('\n');
}

/** Collapse seeds, chat lines, and long prompts to a short drawable noun. */
export async function resolveDrawSubject(
  backendModel: string,
  input: DrawSubjectInput,
): Promise<string> {
  if (input.userPrompt?.trim() && isShortDrawSubject(input.userPrompt)) {
    return sanitizeDrawSubject(input.userPrompt);
  }

  const raw = await completeDrawingText(backendModel, [
    { role: 'system', content: SUBJECT_SYSTEM },
    { role: 'user', content: buildResolveUserPrompt(input) },
  ]);

  if (raw) {
    const candidate = sanitizeDrawSubject(raw);
    if (candidate && candidate.length >= 2) {
      if (isShortDrawSubject(candidate)) return candidate;
      if (!candidate.includes('.') && candidate.split(/\s+/).length <= 3) {
        return candidate;
      }
    }
  }

  return heuristicDrawSubject(input);
}
