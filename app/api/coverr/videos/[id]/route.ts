import { NextRequest } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await fetch(`https://api.coverr.co/videos/${id}?urls=true`, {
    headers: { Authorization: `Bearer ${process.env.COVERR_API_KEY}` },
    next: { revalidate: 3600 },
  });
  return Response.json(await res.json());
}
