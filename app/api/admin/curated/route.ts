import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest } from 'next/server';

function authorized(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 });
  const raw = readFileSync(join(process.cwd(), 'data/curated.json'), 'utf-8');
  return Response.json(JSON.parse(raw));
}
