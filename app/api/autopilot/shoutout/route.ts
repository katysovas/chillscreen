import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getFestieByUserId } from '@/lib/festie/db';
import {
  buildFestieDescribeShoutoutPrompt,
  clampFestieDescribeShoutout,
  fallbackFestieDescribeShoutout,
  FESTIE_SHOUTOUT_MAX_TOKENS,
} from '@/lib/festie/describeShoutouts';
import { completeNpcLine } from '@/lib/npcChatter/completeLine';
import { HOUSE_MODEL_DEFAULT } from '@/lib/npcChatter/constants';
import { festieModelIdForProvider } from '@/lib/festie/llmProviders';
import { resolveModel } from '@/lib/npcChatter/models';
import { canonicalVenueSlug } from '@/lib/venueSlugs';

/** POST — owner festie personality shoutout while autopilot is on. */
export async function POST(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const body = await request.json() as { stage?: string };
    const stage = canonicalVenueSlug(String(body.stage ?? '').trim());
    if (!stage) {
      return NextResponse.json({ error: 'stage is required' }, { status: 400 });
    }

    const festie = await getFestieByUserId(userId);
    const notes = festie?.personality_notes?.trim();
    if (!festie || !notes) {
      return NextResponse.json({ error: 'no_notes' }, { status: 400 });
    }

    const system = buildFestieDescribeShoutoutPrompt({
      festieName: festie.name?.trim() || 'festie',
      describeNotes: notes,
      stage,
      autopilot: true,
    });
    const model = resolveModel(festieModelIdForProvider(festie.llm_provider), HOUSE_MODEL_DEFAULT);
    const raw = await completeNpcLine(
      model,
      [{ role: 'system', content: system }],
      HOUSE_MODEL_DEFAULT,
      FESTIE_SHOUTOUT_MAX_TOKENS,
    );
    const text = raw
      ? clampFestieDescribeShoutout(raw)
      : fallbackFestieDescribeShoutout(notes);
    if (!text) {
      return NextResponse.json({ error: 'generation_failed' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, text });
  } catch (err) {
    console.error('[api/autopilot/shoutout POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
