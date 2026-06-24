import { verifyChatterRequest } from '@/lib/npcChatter/auth';
import {
  announceDescriptionForChannel,
  discordWebhookEnvKey,
} from '@/lib/stageAnnounce/config';
import {
  buildDiscordAnnounceEmbed,
  discordWebhookBody,
} from '@/lib/stageAnnounce/discord';
import type { StageChannel } from '@/lib/stageVideos';

const loggedMissingWebhook = new Set<string>();
const deadWebhookSlugs = new Set<string>();

type AnnounceBody = {
  slug?: string;
  key?: string;
  displayName?: string;
  channel?: StageChannel;
};

export async function POST(req: Request) {
  const authErr = verifyChatterRequest(req);
  if (authErr) return authErr;

  let body: AnnounceBody;
  try {
    body = await req.json() as AnnounceBody;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const displayName = body.displayName?.trim();
  const channel = body.channel;
  if (!slug || !displayName || !channel) {
    return Response.json({ error: 'slug, displayName, and channel required' }, { status: 400 });
  }

  if (deadWebhookSlugs.has(slug)) {
    return Response.json({ dead: true }, { status: 410 });
  }

  const envKey = discordWebhookEnvKey(slug);
  const webhookUrl = process.env[envKey]?.trim();
  if (!webhookUrl) {
    if (!loggedMissingWebhook.has(slug)) {
      loggedMissingWebhook.add(slug);
      console.warn(`[announce] missing env ${envKey}`);
    }
    return new Response(null, { status: 204 });
  }

  const embed = buildDiscordAnnounceEmbed(slug, channel, displayName);
  const payload = discordWebhookBody(embed);

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      console.warn('[announce] discord 429', slug, retryAfter ?? '');
      return new Response(null, { status: 429 });
    }

    if (res.status === 404) {
      deadWebhookSlugs.add(slug);
      console.warn('[announce] discord webhook deleted for', slug);
      return Response.json({ dead: true }, { status: 410 });
    }

    if (!res.ok) {
      console.error('[announce] discord', res.status, await res.text());
      return Response.json({ error: 'discord error' }, { status: 502 });
    }

    return Response.json({ ok: true, description: announceDescriptionForChannel(channel) });
  } catch (err) {
    console.error('[announce] discord fetch failed', err);
    return Response.json({ error: 'discord fetch failed' }, { status: 502 });
  }
}

/** Health check — not used by DO; documents channel mapping for ops. */
export async function GET() {
  return Response.json({ ok: true });
}
