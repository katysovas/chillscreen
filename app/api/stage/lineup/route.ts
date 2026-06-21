import { NextResponse } from 'next/server';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';
import {
  fetchLineupChannelState,
  upsertLineupSuggestion,
  upsertLineupVote,
} from '@/lib/lineup/db';
import type { StageVideo } from '@/lib/stageVideos';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanId(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw || null;
}

function isValidVoterId(voterId: string): boolean {
  return UUID_RE.test(voterId) || voterId.startsWith('conn:');
}

/** GET — hydrate PartyKit lineup store from Neon. */
export async function GET(request: Request) {
  const denied = verifyChatterRequest(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const roomId = cleanId(url.searchParams.get('roomId'));
  const channel = cleanId(url.searchParams.get('channel'));
  if (!roomId || !channel) {
    return NextResponse.json({ error: 'roomId and channel required' }, { status: 400 });
  }

  try {
    const state = await fetchLineupChannelState(roomId, channel);
    return NextResponse.json(state);
  } catch (err) {
    console.error('[api/stage/lineup GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

type PostBody = {
  action?: 'vote' | 'suggest';
  roomId?: string;
  channel?: string;
  voterId?: string;
  videoId?: string;
  video?: StageVideo;
};

/** POST — persist lineup vote or suggestion (PartyKit only). */
export async function POST(request: Request) {
  const denied = verifyChatterRequest(request);
  if (denied) return denied;

  let body: PostBody;
  try {
    body = await request.json() as PostBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const roomId = cleanId(body.roomId);
  const channel = cleanId(body.channel);
  const voterId = cleanId(body.voterId);
  if (!roomId || !channel || !voterId || !isValidVoterId(voterId)) {
    return NextResponse.json({ error: 'roomId, channel, and voterId required' }, { status: 400 });
  }

  try {
    if (body.action === 'vote') {
      const videoId = cleanId(body.videoId);
      if (!videoId) {
        return NextResponse.json({ error: 'videoId required' }, { status: 400 });
      }
      await upsertLineupVote(roomId, channel, voterId, videoId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'suggest') {
      const video = body.video;
      if (!video?.id?.trim() || !video.title?.trim()) {
        return NextResponse.json({ error: 'video required' }, { status: 400 });
      }
      const entry = await upsertLineupSuggestion(roomId, channel, video, voterId);
      return NextResponse.json({ ok: true, suggestion: entry });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[api/stage/lineup POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
