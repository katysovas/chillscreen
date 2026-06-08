import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return new Response('Bad request', { status: 400 });
  }

  const upstream = await fetch(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, {
    next: { revalidate: 86_400 },
  });
  if (!upstream.ok) {
    return new Response('Not found', { status: upstream.status });
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
