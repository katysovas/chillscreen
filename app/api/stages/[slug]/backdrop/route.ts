import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { isSuperAdminUserId } from '@/lib/superAdmin.server';
import {
  getUserStageBySlug,
  toUserStagePublic,
  updateUserStage,
} from '@/lib/stages/db';
import {
  saveStageBackdrop,
  validateBackdropBuffer,
  validateBackdropFile,
  withCacheBust,
} from '@/lib/stages/backdropStorage';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

/** POST — owner uploads a City template skyline backdrop (multipart field: file). */
export async function POST(req: Request, ctx: RouteContext) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const userId = userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { slug: rawSlug } = await ctx.params;
  const slug = rawSlug.toLowerCase();

  try {
    const existing = await getUserStageBySlug(slug);
    if (!existing || existing.taken_down_at) {
      return NextResponse.json({ error: 'Stage not found or not yours' }, { status: 404 });
    }
    const isSuperAdmin = await isSuperAdminUserId(userId);
    if (existing.owner_id !== userId && !isSuperAdmin) {
      return NextResponse.json({ error: 'Stage not found or not yours' }, { status: 404 });
    }
    if (existing.preset !== 'cinema') {
      return NextResponse.json({ error: 'Backdrop upload is only for City stages.' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing image file.' }, { status: 400 });
    }

    const fileErr = validateBackdropFile(file);
    if (fileErr) return NextResponse.json({ error: fileErr }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const dimErr = validateBackdropBuffer(buffer, file.type);
    if (dimErr) return NextResponse.json({ error: dimErr }, { status: 400 });

    let storedPath: string;
    try {
      storedPath = await saveStageBackdrop(slug, buffer, file.type);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not optimize image.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const backdropUrl = withCacheBust(storedPath);

    const row = await updateUserStage(slug, existing.owner_id, { backdropUrl });
    if (!row) {
      return NextResponse.json({ error: 'Could not save backdrop.' }, { status: 500 });
    }

    return NextResponse.json({ stage: toUserStagePublic(row), backdropUrl });
  } catch (err) {
    console.error('[api/stages/[slug]/backdrop POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
