import { NextResponse } from 'next/server';
import { getEaselGalleryForStage } from '@/lib/easel/db';
import { canonicalVenueSlug } from '@/lib/venueSlugs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get('stage');
  if (!stage) return NextResponse.json({ items: [] });

  const stageKey = canonicalVenueSlug(stage);
  const limit = Math.min(48, Math.max(1, Number(searchParams.get('limit')) || 24));

  try {
    const items = await getEaselGalleryForStage(stageKey, limit);
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[easel:gallery] GET failed', err);
    return NextResponse.json({ items: [] });
  }
}
