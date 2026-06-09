import { NextResponse } from 'next/server';
import { AdminForbiddenError, assertLocalAdminRequest } from '@/lib/adminLocalhost';
import { clearStagePlaylistCache } from '@/lib/resolveStagePlaylists';
import {
  channelStoredVideos,
  readStagePlaylistsFile,
  updateChannelVideos,
  writeStagePlaylistsFile,
  type StagePlaylistsFile,
} from '@/lib/stagePlaylistFile';
import type { StageChannel, StageVideo } from '@/lib/stageVideos';

export const dynamic = 'force-dynamic';

function adminError(err: unknown) {
  if (err instanceof AdminForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error('[admin/stage-playlists]', err);
  return NextResponse.json(
    { error: err instanceof Error ? err.message : 'Server error' },
    { status: 500 },
  );
}

/** Load `data/stage-playlists.json` with per-channel video lists. */
export async function GET(request: Request) {
  try {
    assertLocalAdminRequest(request);
    const file = readStagePlaylistsFile();
    const channels = Object.fromEntries(
      (Object.keys(file.channels) as StageChannel[]).map(id => [
        id,
        {
          ...file.channels[id],
          storedVideos: channelStoredVideos(file.channels[id]),
        },
      ]),
    );
    return NextResponse.json({ ...file, channels });
  } catch (err) {
    return adminError(err);
  }
}

type SaveBody = {
  channel: StageChannel;
  videos: StageVideo[];
  /** When true, saves as a fixed curated list (recommended). */
  asCurated?: boolean;
};

/** Save one channel's playlist to `data/stage-playlists.json`. */
export async function PUT(request: Request) {
  try {
    assertLocalAdminRequest(request);
    const body = (await request.json()) as SaveBody;
    if (!body.channel || !Array.isArray(body.videos)) {
      return NextResponse.json({ error: 'channel and videos required' }, { status: 400 });
    }

    const file = updateChannelVideos(body.channel, body.videos, {
      source: body.asCurated === false ? 'youtube-api' : 'curated',
    });
    clearStagePlaylistCache();
    return NextResponse.json({ ok: true, updatedAt: file.updatedAt });
  } catch (err) {
    return adminError(err);
  }
}

type FullSaveBody = StagePlaylistsFile;

/** Replace the entire playlists file (optional bulk save). */
export async function POST(request: Request) {
  try {
    assertLocalAdminRequest(request);
    const body = (await request.json()) as FullSaveBody;
    if (!body.channels || body.version !== 1) {
      return NextResponse.json({ error: 'Invalid playlists file' }, { status: 400 });
    }
    body.updatedAt = new Date().toISOString();
    writeStagePlaylistsFile(body);
    clearStagePlaylistCache();
    return NextResponse.json({ ok: true, updatedAt: body.updatedAt });
  } catch (err) {
    return adminError(err);
  }
}
