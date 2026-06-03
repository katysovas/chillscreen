import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams.toString();
  const url = params
    ? `https://api.coverr.co/categories?${params}`
    : 'https://api.coverr.co/categories';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.COVERR_API_KEY}` },
    next: { revalidate: 86400 },
  });
  return Response.json(await res.json());
}
