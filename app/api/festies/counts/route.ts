import { NextResponse } from 'next/server';
import { resolveRealFestieCounts } from '@/lib/festie/stagePresenceCounts';

export const dynamic = 'force-dynamic';

/** GET — real festie counts per stage (`festies`); client adds ambient NPCs. */
export async function GET() {
  try {
    const festies = await resolveRealFestieCounts();
    return NextResponse.json({ festies });
  } catch (err) {
    console.error('[api/festies/counts GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
