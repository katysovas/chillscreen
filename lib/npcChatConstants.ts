/** Client-safe NPC chat constants — no generated-npcs.json in this module. */

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export const NPC_CHAT_MODEL = 'gpt-4.1-nano';

/** Minimum time the typing bubble stays visible before the reply appears. */
export const NPC_TYPING_MS = 1400;
