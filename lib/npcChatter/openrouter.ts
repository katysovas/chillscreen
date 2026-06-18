import { ierror, iwarn } from '@/lib/internalDebug';
import { stripNpcChatterDots } from '@/lib/messageFilter';
import { NPC_LINE_MAX_TOKENS, NPC_LINE_MAX_WORDS, NPC_LINE_TEMPERATURE, NPC_LINE_TIMEOUT_MS } from './constants';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function openRouterRequest(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  signal: AbortSignal,
  maxTokens = NPC_LINE_MAX_TOKENS,
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
      max_tokens: maxTokens,
      temperature: NPC_LINE_TEMPERATURE,
    }),
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    ierror('[openrouter] request failed', res.status, model, detail.slice(0, 300));
    return null;
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    iwarn('[openrouter] empty completion', model, JSON.stringify(data).slice(0, 300));
    return null;
  }
  return sanitizeLine(text);
}

export async function openRouterComplete(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  fallbackModel?: string,
  maxTokens = NPC_LINE_MAX_TOKENS,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NPC_LINE_TIMEOUT_MS);
  try {
    const text = await openRouterRequest(model, messages, apiKey, controller.signal, maxTokens);
    if (text || !fallbackModel || fallbackModel === model) return text;
    iwarn('[openrouter] retrying with fallback', model, '→', fallbackModel);
    return openRouterRequest(fallbackModel, messages, apiKey, controller.signal, maxTokens);
  } catch (err) {
    ierror('[openrouter] failed', err);
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
    const endChar = text[sentenceEnd]!;
    text = text.slice(0, sentenceEnd).trim();
    if (endChar === '!' || endChar === '?') text += endChar;
  }

  // Never chop a punctuated sentence for the word cap — show the full line in chat.
  if (hasCompleteSentence) return stripNpcChatterDots(text);

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= NPC_LINE_MAX_WORDS) {
    return stripNpcChatterDots(words.join(' '));
  }

  // Model ran long without ending — keep a short whole-word prefix only as fallback.
  return stripNpcChatterDots(words.slice(0, NPC_LINE_MAX_WORDS).join(' '));
}
