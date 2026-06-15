import { ierror, iwarn } from '@/lib/internalDebug';
import type { ChatMessage } from '@/lib/npcChatter/openrouter';

const DRAWING_MAX_TOKENS = 4096;
const DRAWING_TEMPERATURE = 0.95;
/** Grid format — lower temp reduces garbage characters in GRID rows. */
const GRID_DRAWING_TEMPERATURE = 0.8;
/** Slower mid-tier models (Pro, etc.) need more headroom than chat lines. */
const DRAWING_TIMEOUT_MS = 45_000;

async function llmComplete(
  model: string,
  messages: ChatMessage[],
  opts?: { json?: boolean; temperature?: number },
): Promise<string | null> {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DRAWING_TIMEOUT_MS);
  const useJson = opts?.json !== false;
  const temperature = opts?.temperature ?? DRAWING_TEMPERATURE;

  try {
    if (openRouterKey) {
      const body: Record<string, unknown> = {
        model,
        messages,
        max_tokens: DRAWING_MAX_TOKENS,
        temperature,
      };
      if (useJson) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://whichstage.com',
          'X-Title': 'WhichStage',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim() ?? null;
        if (!text) {
          iwarn('[openrouter] easel drawing empty completion', model);
        }
        return text;
      }
      const orDetail = await res.text().catch(() => '');
      ierror('[openrouter] easel drawing failed', res.status, model, orDetail.slice(0, 300));
    } else {
      iwarn('[openrouter] OPENROUTER_API_KEY missing — easel drawing trying OpenAI');
    }

    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openAiKey) {
      ierror('[openai] OPENAI_API_KEY missing — easel drawing failed');
      return null;
    }

    const directModel = model.startsWith('openai/') ? model.slice('openai/'.length) : 'gpt-4.1-mini';
    const openAiBody: Record<string, unknown> = {
      model: directModel,
      messages,
      max_tokens: DRAWING_MAX_TOKENS,
      temperature,
    };
    if (useJson) {
      openAiBody.response_format = { type: 'json_object' };
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAiBody),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      ierror('[openai] easel drawing failed', res.status, directModel, detail.slice(0, 300));
      return null;
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? null;
    if (!text) {
      iwarn('[openai] easel drawing empty completion', directModel);
    }
    return text;
  } catch (err) {
    ierror('[easel drawing] LLM request failed', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export { llmComplete as completeDrawingJson };

/** Plain-text completion (pixel-llm GRID format — no JSON response_format). */
export async function completeDrawingText(
  model: string,
  messages: ChatMessage[],
): Promise<string | null> {
  return llmComplete(model, messages, { json: false, temperature: GRID_DRAWING_TEMPERATURE });
}
