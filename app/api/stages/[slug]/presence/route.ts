import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { touchUserStageActive } from '@/lib/stages/db';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

/** POST — bump last_active_at on any presence in the stage. */
export async function POST(_req: Request, ctx: RouteContext) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const { slug: rawSlug } = await ctx.params;
  const slug = rawSlug.toLowerCase();

  try {
    await touchUserStageActive(slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/stages/[slug]/presence POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
