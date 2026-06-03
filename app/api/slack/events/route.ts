export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { verifySlackSignature, publishHome } from '@/lib/slack';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const body = JSON.parse(raw);

  // One-time endpoint verification from the Slack dashboard (no signature required)
  if (body.type === 'url_verification') {
    return Response.json({ challenge: body.challenge });
  }

  const sig = req.headers.get('x-slack-signature');
  const ts = req.headers.get('x-slack-request-timestamp');

  if (!verifySlackSignature(raw, sig, ts)) {
    return new Response('bad signature', { status: 401 });
  }

  if (body.event?.type === 'app_home_opened' && body.event.tab === 'home') {
    await publishHome(body.event.user, 0);
  }

  return new Response('', { status: 200 });
}
