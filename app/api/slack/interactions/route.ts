export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { verifySlackSignature, publishHome } from '@/lib/slack';

export async function POST(req: NextRequest) {
  // Slack sends interactions as form-encoded: payload=%7B...%7D
  const raw = await req.text();
  const sig = req.headers.get('x-slack-signature');
  const ts = req.headers.get('x-slack-request-timestamp');

  if (!verifySlackSignature(raw, sig, ts)) {
    return new Response('bad signature', { status: 401 });
  }

  const payload = JSON.parse(new URLSearchParams(raw).get('payload') ?? '{}');

  if (
    payload.type === 'block_actions' &&
    payload.actions?.[0]?.action_id === 'set_hero'
  ) {
    const selectedIndex = parseInt(payload.actions[0].value, 10);
    await publishHome(payload.user.id, selectedIndex);
  }

  return new Response('', { status: 200 });
}
