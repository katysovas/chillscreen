import { NPC_LINE_MAX_TOKENS, NPC_LINE_MAX_WORDS, NPC_LINE_TEMPERATURE, NPC_LINE_TIMEOUT_MS } from './constants';

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
  if (!text) {
    console.warn('[openrouter] empty completion', model, JSON.stringify(data).slice(0, 300));
    return null;
  }
  return sanitizeLine(text);
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

/** Strip quotes, name prefixes, special chars; keep one complete sentence for display. */
export function sanitizeLine(raw: string): string {
  let text = raw
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^[a-z0-9_ -]+:\s*/i, '')
    .replace(/[;—–…*]/g, '')
    .replace(/\.{2,}/g, '')
    .trim()
    .toLowerCase();

  const sentenceEnd = text.search(/[.!?](?:\s|$)/);
  const hasCompleteSentence = sentenceEnd !== -1;
  if (hasCompleteSentence) {
    text = text.slice(0, sentenceEnd + 1).trim();
  }

  // Never chop a punctuated sentence for the word cap — show the full line in chat.
  if (hasCompleteSentence) return text;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= NPC_LINE_MAX_WORDS) {
    return words.join(' ');
  }

  // Model ran long without ending — keep a short whole-word prefix only as fallback.
  return words.slice(0, NPC_LINE_MAX_WORDS).join(' ');
}
