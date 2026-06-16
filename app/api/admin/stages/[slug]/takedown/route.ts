import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { takedownUserStage } from '@/lib/stages/db';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

/** POST — admin immediate takedown. */
export async function POST(_req: Request, ctx: RouteContext) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const { slug: rawSlug } = await ctx.params;
  const slug = rawSlug.toLowerCase();

  try {
    const ok = await takedownUserStage(slug);
    if (!ok) {
      return NextResponse.json({ error: 'Stage not found or already taken down' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/stages/[slug]/takedown POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
