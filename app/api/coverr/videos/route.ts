import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams.toString();
  const res = await fetch(`https://api.coverr.co/videos?${params}`, {
    headers: { Authorization: `Bearer ${process.env.COVERR_API_KEY}` },
    next: { revalidate: 3600 },
  });
  return Response.json(await res.json());
}
