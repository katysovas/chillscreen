import { HOUSE_MODEL_DEFAULT } from './constants';

/**
 * Low-cost models only — anything else falls back to HOUSE_MODEL.
 * Swap roster modelIds in data/npc-roster.json; this gate prevents accidents.
 */
export const ALLOWED_NPC_MODELS = new Set([
  'openai/gpt-4.1-nano',
  'anthropic/claude-3-haiku',
  'anthropic/claude-haiku-4.5',
  'google/gemini-2.0-flash-lite-001',
  'google/gemini-2.5-flash-preview',
  'meta-llama/llama-3.2-3b-instruct',
  'deepseek/deepseek-chat',
]);

export function resolveModel(modelId: string | undefined, houseModel: string): string {
  const house = houseModel.trim() || HOUSE_MODEL_DEFAULT;
  const pick = modelId?.trim() || house;
  if (ALLOWED_NPC_MODELS.has(pick)) return pick;
  if (ALLOWED_NPC_MODELS.has(house)) return house;
  return HOUSE_MODEL_DEFAULT;
}
