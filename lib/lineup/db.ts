import { getDb } from '@/lib/db';
import type { StageVideo } from '@/lib/stageVideos';
import {
  emptyLineupChannelState,
  type LineupChannelState,
  type StoredLineupSuggestion,
} from './types';

function normalizeSuggestion(row: {
  video: StageVideo;
  added_at: string | Date;
}): StoredLineupSuggestion | null {
  const video = row.video;
  if (!video?.id || !video.title?.trim()) return null;
  const addedAt = row.added_at instanceof Date
    ? row.added_at.getTime()
    : Date.parse(String(row.added_at));
  return {
    video,
    addedAt: Number.isFinite(addedAt) ? addedAt : Date.now(),
  };
}

export async function fetchLineupChannelState(
  roomId: string,
  channel: string,
): Promise<LineupChannelState> {
  const db = getDb();
  if (!db) return emptyLineupChannelState();

  const [voteRows, suggestionRows] = await Promise.all([
    db`
      SELECT voter_id, video_id
      FROM lineup_votes
      WHERE room_id = ${roomId} AND channel = ${channel}
    `,
    db`
      SELECT video_id, video, added_at
      FROM lineup_suggestions
      WHERE room_id = ${roomId} AND channel = ${channel}
      ORDER BY added_at ASC
    `,
  ]);

  const votes: Record<string, string> = {};
  for (const row of voteRows) {
    const voterId = String(row.voter_id ?? '').trim();
    const videoId = String(row.video_id ?? '').trim();
    if (voterId && videoId) votes[voterId] = videoId;
  }

  const suggestions: StoredLineupSuggestion[] = [];
  for (const row of suggestionRows) {
    const entry = normalizeSuggestion({
      video: row.video as StageVideo,
      added_at: row.added_at as string | Date,
    });
    if (entry) suggestions.push(entry);
  }

  return { votes, suggestions };
}

export async function upsertLineupVote(
  roomId: string,
  channel: string,
  voterId: string,
  videoId: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  await db`
    INSERT INTO lineup_votes (room_id, channel, voter_id, video_id, updated_at)
    VALUES (${roomId}, ${channel}, ${voterId}, ${videoId}, now())
    ON CONFLICT (room_id, channel, voter_id)
    DO UPDATE SET video_id = EXCLUDED.video_id, updated_at = now()
  `;
}

export async function upsertLineupSuggestion(
  roomId: string,
  channel: string,
  video: StageVideo,
  suggesterId: string | null,
): Promise<StoredLineupSuggestion> {
  const db = getDb();
  const entry: StoredLineupSuggestion = { video, addedAt: Date.now() };
  if (!db) return entry;

  await db`
    INSERT INTO lineup_suggestions (room_id, channel, video_id, video, suggester_id, added_at)
    VALUES (
      ${roomId},
      ${channel},
      ${video.id},
      ${JSON.stringify(video)}::jsonb,
      ${suggesterId},
      to_timestamp(${entry.addedAt / 1000})
    )
    ON CONFLICT (room_id, channel, video_id)
    DO UPDATE SET
      video = EXCLUDED.video,
      suggester_id = COALESCE(EXCLUDED.suggester_id, lineup_suggestions.suggester_id),
      added_at = lineup_suggestions.added_at
  `;

  return entry;
}
