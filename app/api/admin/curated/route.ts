import { NextRequest } from 'next/server';
import curatedData from '@/data/curated.json';

function authorized(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 });
  return Response.json(curatedData);
}
