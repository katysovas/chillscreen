/** Stable model assignment for generated venue NPCs (client + server safe). */
export const GENERATED_NPC_MODELS = [
  'anthropic/claude-haiku-4.5',
  'openai/gpt-4o-mini',
  'google/gemini-2.5-flash-lite',
  'meta-llama/llama-3.2-3b-instruct',
  'deepseek/deepseek-chat',
  'anthropic/claude-3-haiku',
  'openai/gpt-4.1-mini',
  'google/gemini-2.5-flash',
  'mistralai/ministral-8b-2512',
] as const;

export function modelIdForGeneratedNpc(npcId: string): string {
  let h = 0;
  for (let i = 0; i < npcId.length; i++) {
    h = (h * 31 + npcId.charCodeAt(i)) >>> 0;
  }
  return GENERATED_NPC_MODELS[h % GENERATED_NPC_MODELS.length]!;
}
