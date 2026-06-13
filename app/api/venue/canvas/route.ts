import { NextResponse } from 'next/server';
import { getVenueCanvas, upsertVenueCanvas } from '@/lib/venueCanvas/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ strokes: [] });
  try {
    const strokes = await getVenueCanvas(slug);
    return NextResponse.json({ strokes });
  } catch {
    return NextResponse.json({ strokes: [] });
  }
}

export async function POST(req: Request) {
  try {
    const { slug, strokes } = await req.json() as { slug: string; strokes: unknown };
    if (!slug) return NextResponse.json({ ok: false }, { status: 400 });
    await upsertVenueCanvas(slug, strokes as never);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
