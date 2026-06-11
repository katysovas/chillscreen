import { HOUSE_MODEL_DEFAULT } from './constants';

/** Retired OpenRouter slugs → current endpoints (checked against /api/v1/models). */
const DEPRECATED_MODEL_ALIASES: Record<string, string> = {
  'google/gemini-2.0-flash-lite-001': 'google/gemini-2.5-flash-lite',
  'google/gemini-2.0-flash-001': 'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-preview': 'google/gemini-2.5-flash',
  'mistralai/ministral-8b': 'mistralai/ministral-8b-2512',
  'qwen/qwen-turbo': 'qwen/qwen3.6-flash',
  'x-ai/grok-2-1212': 'x-ai/grok-4.3',
};

/** Explicit allowlist — fast-path for known low-cost models. */
export const ALLOWED_NPC_MODELS = new Set([
  'openai/gpt-4.1-nano',
  'openai/gpt-4.1-mini',
  'openai/gpt-4o-mini',
  'openai/gpt-4o-mini-2024-07-18',
  'anthropic/claude-3-haiku',
  'anthropic/claude-3.5-haiku',
  'anthropic/claude-haiku-4.5',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'meta-llama/llama-3.2-1b-instruct',
  'meta-llama/llama-3.2-3b-instruct',
  'meta-llama/llama-3.1-8b-instruct',
  'deepseek/deepseek-chat',
  'deepseek/deepseek-r1-distill-llama-70b',
  'mistralai/mistral-small-3.1-24b-instruct',
  'mistralai/ministral-8b-2512',
  'qwen/qwen-2.5-7b-instruct',
  'qwen/qwen3.6-flash',
  'x-ai/grok-4.3',
  'cohere/command-r7b-12-2024',
]);

export function normalizeNpcModelId(modelId: string): string {
  const id = modelId.trim();
  if (!id) return id;
  return DEPRECATED_MODEL_ALIASES[id] ?? id;
}

/** Any model from these OpenRouter providers is allowed. */
const ALLOWED_PROVIDER_PREFIXES = [
  'openai/',
  'anthropic/',
  'google/',
  'meta-llama/',
  'deepseek/',
  'mistralai/',
  'qwen/',
  'x-ai/',
  'cohere/',
];

export function isAllowedNpcModel(modelId: string): boolean {
  const id = modelId.trim();
  if (!id) return false;
  if (ALLOWED_NPC_MODELS.has(id)) return true;
  return ALLOWED_PROVIDER_PREFIXES.some(prefix => id.startsWith(prefix));
}

export function resolveModel(modelId: string | undefined, houseModel: string): string {
  const house = normalizeNpcModelId(houseModel.trim() || HOUSE_MODEL_DEFAULT);
  const pick = normalizeNpcModelId(modelId?.trim() || house);
  if (isAllowedNpcModel(pick)) return pick;
  if (isAllowedNpcModel(house)) return house;
  return normalizeNpcModelId(HOUSE_MODEL_DEFAULT);
}
