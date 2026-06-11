import { NextResponse } from 'next/server';
import { AdminForbiddenError, assertLocalAdminRequest } from '@/lib/adminLocalhost';
import { sanitizeNpcLine } from '@/lib/messageFilter';
import {
  buildSeedGeneratorPrompt,
  parseGeneratedSeeds,
  SEED_GENERATOR_MODEL,
  SEED_STAGE_META,
  type RedditTopicInput,
  type SeedPoolTarget,
} from '@/lib/seedAdmin';

export const dynamic = 'force-dynamic';

type RequestBody = {
  topics?: RedditTopicInput[];
  target?: SeedPoolTarget;
};

function adminError(err: unknown) {
  if (err instanceof AdminForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error('[admin/generate-seeds]', err);
  return NextResponse.json(
    { error: err instanceof Error ? err.message : 'Server error' },
    { status: 500 },
  );
}

async function callOpenAi(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: SEED_GENERATOR_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.95,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const raw: string | undefined = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty model response');
  return raw;
}

/** Turn selected Reddit topics into seed lines via LLM. */
export async function POST(request: Request) {
  try {
    assertLocalAdminRequest(request);

    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openAiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not set' }, { status: 500 });
    }

    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const topics = (body.topics ?? []).filter(
      t => t && typeof t.title === 'string' && t.title.trim().length > 0,
    );
    if (topics.length === 0) {
      return NextResponse.json({ error: 'At least one topic required' }, { status: 400 });
    }
    if (topics.length > 20) {
      return NextResponse.json({ error: 'Max 20 topics per batch' }, { status: 400 });
    }

    const target = body.target;
    if (!target || (target.scope === 'stage' && !target.slug)) {
      return NextResponse.json({ error: 'Invalid target pool' }, { status: 400 });
    }

    const stageLabel =
      target.scope === 'stage'
        ? SEED_STAGE_META.find(s => s.slug === target.slug)?.label
        : undefined;

    const prompt = buildSeedGeneratorPrompt(topics, target, stageLabel);
    const raw = await callOpenAi(prompt, openAiKey);
    const parsed = parseGeneratedSeeds(raw);
    const seeds = parsed
      .map(s => sanitizeNpcLine(s))
      .filter((s): s is string => Boolean(s));

    if (seeds.length === 0) {
      return NextResponse.json({ error: 'No usable seeds after sanitization', raw }, { status: 502 });
    }

    return NextResponse.json({ seeds });
  } catch (err) {
    return adminError(err);
  }
}
