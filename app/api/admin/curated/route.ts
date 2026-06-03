import { put, head } from '@vercel/blob';
import { NextRequest } from 'next/server';

const BLOB_PATH = 'curated.json';

function authorized(req: NextRequest) {
  const auth = req.headers.get('x-admin-password');
  return auth === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 });
  try {
    const meta = await head(BLOB_PATH);
    const res = await fetch(meta.url);
    return Response.json(await res.json());
  } catch {
    return Response.json({ videos: [], audio: [], categories: [] });
  }
}

export async function PUT(req: NextRequest) {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 });
  const body = await req.json();
  const blob = await put(BLOB_PATH, JSON.stringify(body), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  });
  return Response.json({ url: blob.url });
}
