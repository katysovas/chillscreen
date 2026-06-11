import { NPC_LINE_MAX_TOKENS, NPC_LINE_TEMPERATURE, NPC_LINE_TIMEOUT_MS } from './constants';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function openRouterRequest(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  signal: AbortSignal,
): Promise<string | null> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://whichstage.com',
      'X-Title': 'WhichStage',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: NPC_LINE_MAX_TOKENS,
      temperature: NPC_LINE_TEMPERATURE,
    }),
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[openrouter] request failed', res.status, model, detail.slice(0, 300));
    return null;
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  return text ? sanitizeLine(text) : null;
}

export async function openRouterComplete(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  fallbackModel?: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NPC_LINE_TIMEOUT_MS);
  try {
    const text = await openRouterRequest(model, messages, apiKey, controller.signal);
    if (text || !fallbackModel || fallbackModel === model) return text;
    console.warn('[openrouter] retrying with fallback', model, '→', fallbackModel);
    return openRouterRequest(fallbackModel, messages, apiKey, controller.signal);
  } catch (err) {
    console.error('[openrouter] failed', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Strip quotes, name prefixes, special chars; keep one sentence. */
export function sanitizeLine(raw: string): string {
  let text = raw
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^[a-z0-9_ -]+:\s*/i, '')
    .replace(/[;—–…*]/g, '')
    .replace(/\.{2,}/g, '')
    .trim()
    .toLowerCase();

  const sentenceEnd = text.search(/[.!?](?:\s|$)/);
  if (sentenceEnd !== -1) {
    text = text.slice(0, sentenceEnd + 1).trim();
  } else {
    const clauseBreak = text.search(/[;—–]/);
    if (clauseBreak !== -1) text = text.slice(0, clauseBreak).trim();
  }

  if (text.length > 120) text = text.slice(0, 120).trim();
  return text;
}
