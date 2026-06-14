import { ierror, iwarn } from '@/lib/internalDebug';
import { NPC_LINE_MAX_TOKENS, NPC_LINE_TEMPERATURE, NPC_LINE_TIMEOUT_MS } from './constants';
import { openRouterComplete, sanitizeLine, type ChatMessage } from './openrouter';

/** Map OpenRouter slug → OpenAI direct API model id. */
function openAiDirectModel(openRouterSlug: string): string {
  if (openRouterSlug.startsWith('openai/')) {
    return openRouterSlug.slice('openai/'.length);
  }
  return 'gpt-4.1-nano';
}

async function openAiDirectComplete(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NPC_LINE_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: NPC_LINE_MAX_TOKENS,
        temperature: NPC_LINE_TEMPERATURE,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      ierror('[openai] request failed', res.status, model, detail.slice(0, 300));
      return null;
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      iwarn('[openai] empty NPC line completion', model);
      return null;
    }
    return sanitizeLine(raw);
  } catch (err) {
    ierror('[openai] failed', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Generate one NPC line — OpenRouter first, OpenAI direct when credits/key fail. */
export async function completeNpcLine(
  model: string,
  messages: ChatMessage[],
  fallbackModel?: string,
): Promise<string | null> {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    const text = await openRouterComplete(model, messages, openRouterKey, fallbackModel);
    if (text) return text;
  } else {
    iwarn('[npc-chatter] OPENROUTER_API_KEY missing — trying OpenAI direct', model);
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openAiKey) {
    ierror('[npc-chatter] no LLM keys configured (OPENROUTER_API_KEY / OPENAI_API_KEY)');
    return null;
  }

  if (openRouterKey) {
    iwarn('[npc-chatter] OpenRouter failed — falling back to OpenAI direct', model);
  }

  const direct = openAiDirectModel(model);
  const text = await openAiDirectComplete(direct, messages, openAiKey);
  if (text) return text;

  if (fallbackModel && fallbackModel !== model) {
    const fallbackText = await openAiDirectComplete(openAiDirectModel(fallbackModel), messages, openAiKey);
    if (fallbackText) return fallbackText;
  }

  ierror('[npc-chatter] all LLM providers failed for line', { model, fallbackModel });
  return null;
}

export function npcChatterLlmConfigured(): boolean {
  return Boolean(
    process.env.OPENROUTER_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim(),
  );
}
