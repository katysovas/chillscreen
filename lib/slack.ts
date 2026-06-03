import crypto from 'crypto';
import { WebClient } from '@slack/web-api';
import { buildHomeView } from './views';

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

export function verifySlackSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  if (!signature || !timestamp) return false;

  // Reject requests older than 5 minutes (replay attack protection)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const base = `v0:${timestamp}:${rawBody}`;
  const hmac = crypto
    .createHmac('sha256', process.env.SLACK_SIGNING_SECRET!)
    .update(base)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(`v0=${hmac}`),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function publishHome(userId: string, selectedIndex = 0) {
  await client.views.publish({
    user_id: userId,
    view: buildHomeView(selectedIndex),
  });
}
