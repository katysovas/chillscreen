/** Festie owner picks a provider family — we map to a concrete OpenRouter slug server-side. */

export type FestieLlmProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'meta-llama'
  | 'deepseek'
  | 'mistralai'
  | 'qwen'
  | 'x-ai'
  | 'cohere';

export const DEFAULT_FESTIE_LLM_PROVIDER: FestieLlmProvider = 'openai';

export type FestieLlmProviderOption = {
  id: FestieLlmProvider;
  label: string;
  modelId: string;
};

export const FESTIE_LLM_PROVIDER_OPTIONS: FestieLlmProviderOption[] = [
  { id: 'anthropic', label: 'Claude', modelId: 'anthropic/claude-haiku-4.5' },
  { id: 'openai', label: 'GPT', modelId: 'openai/gpt-4.1-nano' },
  { id: 'google', label: 'Gemini', modelId: 'google/gemini-2.5-flash-lite' },
  { id: 'meta-llama', label: 'Llama', modelId: 'meta-llama/llama-3.2-3b-instruct' },
  { id: 'deepseek', label: 'DeepSeek', modelId: 'deepseek/deepseek-chat' },
  { id: 'mistralai', label: 'Mistral', modelId: 'mistralai/ministral-8b-2512' },
  { id: 'qwen', label: 'Qwen', modelId: 'qwen/qwen3.6-flash' },
  { id: 'x-ai', label: 'Grok', modelId: 'x-ai/grok-4.3' },
  { id: 'cohere', label: 'Cohere', modelId: 'cohere/command-r7b-12-2024' },
];

const PROVIDER_SET = new Set<string>(FESTIE_LLM_PROVIDER_OPTIONS.map(o => o.id));

const MODEL_BY_PROVIDER = Object.fromEntries(
  FESTIE_LLM_PROVIDER_OPTIONS.map(o => [o.id, o.modelId]),
) as Record<FestieLlmProvider, string>;

export function parseFestieLlmProvider(raw: unknown): FestieLlmProvider | null {
  if (typeof raw !== 'string') return null;
  const id = raw.trim().toLowerCase();
  return PROVIDER_SET.has(id) ? (id as FestieLlmProvider) : null;
}

export function festieModelIdForProvider(provider: FestieLlmProvider): string {
  return MODEL_BY_PROVIDER[provider] ?? MODEL_BY_PROVIDER[DEFAULT_FESTIE_LLM_PROVIDER];
}

/** OpenAI direct API slug when OpenRouter is unavailable (openai provider only). */
export function festieOpenAiDirectModel(provider: FestieLlmProvider): string {
  if (provider === 'openai') return 'gpt-4.1-nano';
  return 'gpt-4.1-nano';
}
