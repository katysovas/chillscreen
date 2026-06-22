import { ierror, iwarn } from '@/lib/internalDebug';
import { renderGridToSpritePng } from './quantize';
import { structuralGridCheck } from './structuralQc';
import type { DoodleGridFile } from './types';

const QC_MODEL = 'google/gemini-2.5-flash';
const QC_FLOOR = 6;
const QC_TIMEOUT_MS = 30_000;

export type QcResult = {
  pass: boolean;
  score: number;
  raw: string | null;
};

function parseScore(text: string): number | null {
  const match = text.match(/\b(\d{1,2})\s*\/\s*10\b/i) ?? text.match(/\bscore[:\s]+(\d{1,2})\b/i);
  if (match) {
    const n = Number(match[1]);
    if (n >= 1 && n <= 10) return n;
  }
  const lone = text.match(/\b([1-9]|10)\b/);
  if (lone) return Number(lone[1]);
  if (/\byes\b/i.test(text) && !/\bno\b/i.test(text)) return 8;
  if (/\bno\b/i.test(text)) return 3;
  return null;
}

/** Vision gate — recognizable as subject? */
export async function scoreDoodleRecognizability(
  grid: DoodleGridFile,
  subject: string,
  opts?: { model?: string; apiKey?: string; floor?: number },
): Promise<QcResult> {
  const structural = structuralGridCheck(grid);
  if (!structural.pass) {
    return { pass: false, score: 0, raw: structural.reason ?? 'structural fail' };
  }

  const apiKey = opts?.apiKey ?? process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    iwarn('[doodle:qc] OPENROUTER_API_KEY missing — skipping gate');
    return { pass: true, score: 7, raw: null };
  }

  const png = await renderGridToSpritePng(grid, 6);
  const b64 = png.toString('base64');
  const prompt = [
    `This pixel art should depict a ${subject}.`,
    'Is it recognizable as that subject?',
    'Reply with: yes/no, score 1-10.',
  ].join(' ');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QC_TIMEOUT_MS);
  const floor = opts?.floor ?? QC_FLOOR;

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
        model: opts?.model ?? QC_MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
          ],
        }],
        max_tokens: 64,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      ierror('[doodle:qc] request failed', res.status, detail.slice(0, 200));
      return { pass: false, score: 0, raw: null };
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? null;
    const score = raw ? parseScore(raw) : null;
    if (score == null) {
      iwarn('[doodle:qc] unparseable score', raw);
      return { pass: false, score: 0, raw };
    }
    return { pass: score >= floor, score, raw };
  } catch (err) {
    ierror('[doodle:qc] failed', err);
    return { pass: false, score: 0, raw: null };
  } finally {
    clearTimeout(timer);
  }
}

export { QC_FLOOR, QC_MODEL };
