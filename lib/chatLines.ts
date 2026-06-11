/** Max bubbles shown in a chatter stack (connected + ambient). */
export const CHAT_LINE_MAX = 6;

export type ChatLine = {
  id: string;
  text: string;
  at: number;
};

export type ChatThreadLine = ChatLine & {
  speaker: 'self' | 'partner';
};

export type KeyedChatLine = ChatLine & {
  speakerKey: string;
};

let chatLineSeq = 0;

export function createChatLine(text: string): ChatLine {
  chatLineSeq += 1;
  return { id: `cl-${Date.now()}-${chatLineSeq}`, text, at: Date.now() };
}

/** Merge both sides into one chronological thread (newest at bottom). */
export function buildChatThread(
  playerMessages: ChatLine[] = [],
  partnerMessages: ChatLine[] = [],
): ChatThreadLine[] {
  return [
    ...(playerMessages ?? []).map(m => ({ ...m, speaker: 'self' as const })),
    ...(partnerMessages ?? []).map(m => ({ ...m, speaker: 'partner' as const })),
  ]
    .sort((a, b) => a.at - b.at)
    .slice(-CHAT_LINE_MAX);
}

export function appendChatLine(prev: ChatLine[], text: string): ChatLine[] {
  const next = [...prev, createChatLine(text)];
  return next.length > CHAT_LINE_MAX ? next.slice(-CHAT_LINE_MAX) : next;
}

/** 0 = newest (bottom); higher = older (higher in stack). */
export function chatBubbleOpacity(ageFromBottom: number, total: number): number {
  if (total <= 1 || ageFromBottom === 0) return 1;
  const fade = ageFromBottom / (total - 1);
  return Math.max(0.3, 1 - fade * 0.62);
}
