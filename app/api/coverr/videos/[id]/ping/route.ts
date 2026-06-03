import { NextRequest } from 'next/server';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await fetch(`https://api.coverr.co/videos/${id}/stats/downloads`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${process.env.COVERR_API_KEY}` },
  });
  return new Response(null, { status: 204 });
}
