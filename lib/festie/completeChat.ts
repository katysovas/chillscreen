import { sanitizeNpcLine } from '@/lib/messageFilter';
import {
  HOUSE_MODEL_DEFAULT,
  NPC_LINE_MAX_TOKENS,
  NPC_LINE_TEMPERATURE,
} from '@/lib/npcChatter/constants';
import { resolveModel } from '@/lib/npcChatter/models';
import { openRouterComplete } from '@/lib/npcChatter/openrouter';
import {
  festieModelIdForProvider,
  festieOpenAiDirectModel,
  type FestieLlmProvider,
} from '@/lib/festie/llmProviders';

export type FestieChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

/** Run festie NPC chat against the owner's chosen provider + conversation seed prompt. */
export async function completeFestieChat(
  provider: FestieLlmProvider,
  messages: FestieChatMessage[],
): Promise<string | null> {
  const modelId = festieModelIdForProvider(provider);
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();

  if (openRouterKey) {
    const house = resolveModel(undefined, HOUSE_MODEL_DEFAULT);
    const model = resolveModel(modelId, house);
    const text = await openRouterComplete(model, messages, openRouterKey, house);
    return text ?? null;
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openAiKey) return null;

  const directModel = festieOpenAiDirectModel(provider);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: directModel,
        messages,
        max_tokens: NPC_LINE_MAX_TOKENS,
        temperature: NPC_LINE_TEMPERATURE,
      }),
    });

    if (!res.ok) {
      console.error('[festie chat] OpenAI error', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    return raw ? sanitizeNpcLine(raw) : null;
  } catch (err) {
    console.error('[festie chat] OpenAI failed', err);
    return null;
  }
}
