import { NextResponse } from 'next/server';
import { AdminForbiddenError, assertLocalAdminRequest } from '@/lib/adminLocalhost';
import {
  buildNpcGeneratorPrompt,
  NPC_GENERATOR_MODEL,
  parseGeneratedNpcs,
} from '@/lib/npcGenerator';
import { NPC_STAGE_CONTEXT } from '@/lib/npcGenerator';
import type { StageChannel } from '@/lib/stageVideos';

export const dynamic = 'force-dynamic';

type RequestBody = {
  channel?: string;
  count?: number;
  /** Names from earlier batches in the same run — avoids duplicates. */
  existingNames?: string[];
};

/** Generate ambient NPCs for a stage — localhost admin only. */
export async function POST(request: Request) {
  try {
    await assertLocalAdminRequest(request);

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not set' }, { status: 500 });
    }

    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const channel = body.channel as StageChannel | undefined;
    if (!channel || !(channel in NPC_STAGE_CONTEXT)) {
      return NextResponse.json({ error: 'Unknown stage channel' }, { status: 400 });
    }
    const count = Math.min(Math.max(Math.round(body.count ?? 20), 1), 30);
    const existingNames = (body.existingNames ?? []).filter(n => typeof n === 'string');

    const prompt = buildNpcGeneratorPrompt(channel, count, existingNames);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NPC_GENERATOR_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
        max_tokens: 12000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('NPC generator OpenAI error', res.status, detail);
      return NextResponse.json(
        { error: `OpenAI error ${res.status}: ${detail.slice(0, 300)}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const raw: string | undefined = data.choices?.[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: 'Empty model response' }, { status: 502 });
    }

    try {
      const npcs = parseGeneratedNpcs(raw);
      return NextResponse.json({ npcs });
    } catch (err) {
      console.error('NPC generator parse error', err, raw.slice(0, 500));
      return NextResponse.json(
        { error: err instanceof Error ? `Parse failed: ${err.message}` : 'Parse failed', raw },
        { status: 502 },
      );
    }
  } catch (err) {
    if (err instanceof AdminForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('NPC generator failed', err);
    return NextResponse.json({ error: 'NPC generation failed' }, { status: 500 });
  }
}
