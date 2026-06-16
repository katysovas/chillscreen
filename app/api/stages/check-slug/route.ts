import { NextResponse } from 'next/server';
import { isStageSlugTaken } from '@/lib/stages/db';
import {
  normalizeStageSlug,
  slugRejectMessage,
  validateStageSlugFormat,
} from '@/lib/stages/slugValidation';

export const dynamic = 'force-dynamic';

/** GET — live slug availability check. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = normalizeStageSlug(url.searchParams.get('slug') ?? '');
  if (!slug) {
    return NextResponse.json({ available: false, reason: 'Enter a slug.' });
  }

  const formatErr = validateStageSlugFormat(slug);
  if (formatErr) {
    return NextResponse.json({ available: false, reason: slugRejectMessage(formatErr) });
  }

  const taken = await isStageSlugTaken(slug);
  if (taken) {
    return NextResponse.json({ available: false, reason: slugRejectMessage('taken') });
  }

  return NextResponse.json({ available: true });
}
