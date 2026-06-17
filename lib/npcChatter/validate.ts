import type { RoomChatLine } from './prompts';
import { CHAT_BUFFER_SIZE, PROMPT_WINDOW_LINES, STAGE_CHATTER_PROMPT_LINES } from './constants';
import { CHAT_MESSAGE_MAX_LEN } from '@/lib/messageFilter';

const MAX_TRIGGER_LEN = 200;
const MAX_LINE_BUDGET = 7;

export function sanitizeRecentChat(raw: unknown): RoomChatLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-PROMPT_WINDOW_LINES)
    .map(line => {
      if (!line || typeof line !== 'object') return null;
      const sender = typeof (line as RoomChatLine).sender === 'string'
        ? (line as RoomChatLine).sender.slice(0, 64)
        : '';
      const text = typeof (line as RoomChatLine).text === 'string'
        ? (line as RoomChatLine).text.slice(0, CHAT_MESSAGE_MAX_LEN)
        : '';
      if (!sender || !text) return null;
      return { sender, text };
    })
    .filter((l): l is RoomChatLine => l !== null)
    .slice(-CHAT_BUFFER_SIZE);
}

export function sanitizeStageRecentChat(raw: unknown): RoomChatLine[] {
  return sanitizeRecentChat(raw).slice(-STAGE_CHATTER_PROMPT_LINES);
}

export function clampLineBudget(n: number): number {
  if (!Number.isFinite(n)) return 4;
  return Math.min(MAX_LINE_BUDGET, Math.max(2, Math.floor(n)));
}

export function clampTriggerText(text: string): string {
  return text.trim().slice(0, MAX_TRIGGER_LEN);
}
