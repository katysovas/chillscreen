import { NPC_LINE_MAX_TOKENS, NPC_LINE_TEMPERATURE, NPC_LINE_TIMEOUT_MS } from './constants';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function openRouterComplete(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NPC_LINE_TIMEOUT_MS);
  try {
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
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error('[openrouter] request failed', res.status);
      return null;
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text ? sanitizeLine(text) : null;
  } catch (err) {
    console.error('[openrouter] failed', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Strip quotes, name prefixes, and clamp length. */
export function sanitizeLine(raw: string): string {
  let text = raw
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^[a-z0-9_ -]+:\s*/i, '')
    .trim()
    .toLowerCase();
  if (text.length > 120) text = text.slice(0, 117) + '...';
  return text;
}
