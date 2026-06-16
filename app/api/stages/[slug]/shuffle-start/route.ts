import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { maybeShuffleStageOnStart } from '@/lib/stages/db';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

/** POST — shuffle now-playing when first viewer opens an empty stage room. */
export async function POST(_req: Request, ctx: RouteContext) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const { slug: rawSlug } = await ctx.params;
  const slug = rawSlug.toLowerCase();

  try {
    const result = await maybeShuffleStageOnStart(slug);
    if (!result) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    return NextResponse.json({
      shuffled: result.shuffled,
      stage: result.stage,
    });
  } catch (err) {
    console.error('[api/stages/[slug]/shuffle-start POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
