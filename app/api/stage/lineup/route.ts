import { NextResponse } from 'next/server';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';
import {
  fetchLineupChannelState,
  fetchMatchupVotes,
  upsertLineupSuggestion,
  upsertLineupVote,
  upsertMatchupVote,
  clearMatchupVotes,
} from '@/lib/lineup/db';
import type { StageVideo } from '@/lib/stageVideos';
import { isValidLineupVoterId } from '@/lib/superAdmin';

export const dynamic = 'force-dynamic';

function cleanId(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw || null;
}

/** GET — hydrate PartyKit lineup store from Neon. */
export async function GET(request: Request) {
  const denied = verifyChatterRequest(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const roomId = cleanId(url.searchParams.get('roomId'));
  const channel = cleanId(url.searchParams.get('channel'));
  const matchup = url.searchParams.get('matchup') === '1';
  if (!roomId || !channel) {
    return NextResponse.json({ error: 'roomId and channel required' }, { status: 400 });
  }

  try {
    if (matchup) {
      const votes = await fetchMatchupVotes(roomId, channel);
      return NextResponse.json({ votes });
    }
    const state = await fetchLineupChannelState(roomId, channel);
    return NextResponse.json(state);
  } catch (err) {
    console.error('[api/stage/lineup GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

type PostBody = {
  action?: 'vote' | 'suggest' | 'matchup-vote' | 'matchup-reset-votes';
  roomId?: string;
  channel?: string;
  voterId?: string;
  videoId?: string;
  side?: 'a' | 'b';
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
  if (!roomId || !channel) {
    return NextResponse.json({ error: 'roomId and channel required' }, { status: 400 });
  }
  if (body.action !== 'matchup-reset-votes' && (!voterId || !isValidLineupVoterId(voterId))) {
    return NextResponse.json({ error: 'roomId, channel, and voterId required' }, { status: 400 });
  }

  try {
    if (body.action === 'vote') {
      const videoId = cleanId(body.videoId);
      if (!videoId || !voterId) {
        return NextResponse.json({ error: 'videoId required' }, { status: 400 });
      }
      await upsertLineupVote(roomId, channel, voterId, videoId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'matchup-vote') {
      const side = body.side;
      if (side !== 'a' && side !== 'b' || !voterId) {
        return NextResponse.json({ error: 'side required (a|b)' }, { status: 400 });
      }
      await upsertMatchupVote(roomId, channel, voterId, side);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'matchup-reset-votes') {
      await clearMatchupVotes(roomId, channel);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'suggest') {
      const video = body.video;
      if (!video?.id?.trim() || !video.title?.trim() || !voterId) {
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
