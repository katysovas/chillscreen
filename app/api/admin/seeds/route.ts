import { NextResponse } from 'next/server';
import { AdminForbiddenError, assertLocalAdminRequest } from '@/lib/adminLocalhost';
import { normalizeSeedsFile, readSeedsFile, writeSeedsFile, type SeedsFile } from '@/lib/seedsFile';

export const dynamic = 'force-dynamic';

function adminError(err: unknown) {
  if (err instanceof AdminForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error('[admin/seeds]', err);
  return NextResponse.json(
    { error: err instanceof Error ? err.message : 'Server error' },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  try {
    assertLocalAdminRequest(request);
    return NextResponse.json(readSeedsFile());
  } catch (err) {
    return adminError(err);
  }
}

export async function PUT(request: Request) {
  try {
    assertLocalAdminRequest(request);
    const body = (await request.json()) as Partial<SeedsFile>;
    const file = writeSeedsFile(normalizeSeedsFile(body));
    return NextResponse.json({ ok: true, updatedAt: file.updatedAt, file });
  } catch (err) {
    return adminError(err);
  }
}
