import { requireDb } from '@/lib/db';
import { STAGE_CONFIG, stageLifecycleTier } from '@/lib/stages/config';
import { parseStreamsJson, enrichStreamsChannelTitles } from '@/lib/stages/parseStream';
import { stagePresetById, normalizeStagePresetId, DEFAULT_STAGE_PRESET } from '@/lib/stages/presets';
import type {
  FeaturedStageSummary,
  StagePresetId,
  StageStream,
  UserStagePublic,
  UserStageRow,
} from '@/lib/stages/types';
import type { SkyPeriod } from '@/lib/skyTimeOfDay';

function parseSky(raw: unknown): SkyPeriod | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (s === 'night' || s === 'morning' || s === 'day' || s === 'evening') return s;
  return null;
}

function rowToPublic(row: UserStageRow, now = Date.now()): UserStagePublic {
  const takenDown = row.taken_down_at != null;
  const lastActiveAt = new Date(row.last_active_at).getTime();
  const tier = takenDown ? 'reclaimable' as const : stageLifecycleTier(lastActiveAt, now);
  return {
    slug: row.slug,
    displayName: row.display_name,
    description: row.description?.trim() || null,
    ownerId: row.owner_id,
    festieId: row.festie_id,
    preset: row.preset as StagePresetId,
    sky: parseSky(row.sky) ?? undefined,
    streams: parseStreamsJson(row.streams),
    nowPlayingIndex: Number(row.now_playing_index) || 0,
    shuffleOnStart: Boolean(row.shuffle_on_start),
    backdropUrl: row.backdrop_url?.trim() || null,
    createdAt: new Date(row.created_at).getTime(),
    lastActiveAt,
    tier,
    takenDown,
    featured: row.featured,
  };
}

function parseRow(raw: Record<string, unknown>): UserStageRow {
  return {
    slug: String(raw.slug),
    owner_id: String(raw.owner_id),
    festie_id: String(raw.festie_id),
    display_name: String(raw.display_name ?? raw.slug),
    description: raw.description != null ? String(raw.description) : null,
    preset: normalizeStagePresetId(String(raw.preset)) ?? DEFAULT_STAGE_PRESET,
    sky: raw.sky != null ? parseSky(raw.sky) : null,
    streams: parseStreamsJson(raw.streams),
    now_playing_index: Number(raw.now_playing_index) || 0,
    shuffle_on_start: Boolean(raw.shuffle_on_start),
    backdrop_url: raw.backdrop_url != null ? String(raw.backdrop_url) : null,
    featured: Boolean(raw.featured),
    created_at: raw.created_at instanceof Date ? raw.created_at : new Date(String(raw.created_at)),
    last_active_at: raw.last_active_at instanceof Date
      ? raw.last_active_at
      : new Date(String(raw.last_active_at)),
    taken_down_at: raw.taken_down_at != null
      ? (raw.taken_down_at instanceof Date
        ? raw.taken_down_at
        : new Date(String(raw.taken_down_at)))
      : null,
  };
}

export function toUserStagePublic(row: UserStageRow): UserStagePublic {
  return rowToPublic(row);
}

export async function isStageSlugTaken(slug: string): Promise<boolean> {
  const sql = requireDb();
  const rows = await sql`
    SELECT 1 FROM user_stages WHERE slug = ${slug} AND taken_down_at IS NULL LIMIT 1
  `;
  return rows.length > 0;
}

export async function getUserStageBySlug(slug: string): Promise<UserStageRow | null> {
  const sql = requireDb();
  const rows = await sql`
    SELECT slug, owner_id, festie_id, display_name, description, preset, sky, streams, now_playing_index,
           backdrop_url, featured, shuffle_on_start, created_at, last_active_at, taken_down_at
    FROM user_stages
    WHERE slug = ${slug}
    LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return parseRow(row);
}

export async function getUserStagePublicBySlug(slug: string): Promise<UserStagePublic | null> {
  const row = await getUserStageBySlug(slug);
  if (!row) return null;
  return rowToPublic(row);
}

export async function getUserStageByOwnerId(ownerId: string): Promise<UserStageRow | null> {
  const sql = requireDb();
  const rows = await sql`
    SELECT slug, owner_id, festie_id, display_name, description, preset, sky, streams, now_playing_index,
           backdrop_url, featured, shuffle_on_start, created_at, last_active_at, taken_down_at
    FROM user_stages
    WHERE owner_id = ${ownerId}::uuid AND taken_down_at IS NULL
    LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return parseRow(row);
}

export async function touchUserStageActive(slug: string): Promise<boolean> {
  const sql = requireDb();
  const rows = await sql`
    UPDATE user_stages
    SET last_active_at = now()
    WHERE slug = ${slug} AND taken_down_at IS NULL
      AND last_active_at < now() - interval '5 minutes'
    RETURNING slug
  `;
  return rows.length > 0;
}

export type CreateUserStageInput = {
  slug: string;
  displayName: string;
  description?: string | null;
  ownerId: string;
  festieId: string;
  preset: StagePresetId;
  sky?: SkyPeriod | null;
  streams: StageStream[];
  nowPlayingIndex?: number;
  backdropUrl?: string | null;
  shuffleOnStart?: boolean;
};

export async function insertUserStage(input: CreateUserStageInput): Promise<UserStageRow> {
  if (!stagePresetById(input.preset)) {
    throw new Error('Invalid stage preset');
  }
  const sql = requireDb();

  // Purge any soft-deleted row with the same slug so the slug can be reused.
  await sql`
    DELETE FROM user_stages
    WHERE taken_down_at IS NOT NULL AND slug = ${input.slug}
  `;

  const enrichedStreams = await enrichStreamsChannelTitles(input.streams);
  const streamsJson = JSON.stringify(enrichedStreams);
  const rows = await sql`
    INSERT INTO user_stages (
      slug, owner_id, festie_id, display_name, description, preset, sky, streams, now_playing_index, backdrop_url, shuffle_on_start
    ) VALUES (
      ${input.slug},
      ${input.ownerId}::uuid,
      ${input.festieId}::uuid,
      ${input.displayName},
      ${input.description ?? null},
      ${input.preset},
      ${input.sky ?? null},
      ${streamsJson}::jsonb,
      ${input.nowPlayingIndex ?? 0},
      ${input.backdropUrl ?? null},
      ${input.shuffleOnStart ?? false}
    )
    RETURNING slug, owner_id, festie_id, display_name, description, preset, sky, streams, now_playing_index,
              backdrop_url, featured, shuffle_on_start, created_at, last_active_at, taken_down_at
  `;
  return parseRow(rows[0] as Record<string, unknown>);
}

export type UpdateUserStagePatch = {
  streams?: StageStream[];
  nowPlayingIndex?: number;
  preset?: StagePresetId;
  sky?: SkyPeriod | null;
  backdropUrl?: string | null;
  shuffleOnStart?: boolean;
  description?: string | null;
};

export async function updateUserStage(
  slug: string,
  ownerId: string,
  patch: UpdateUserStagePatch,
  existingRow?: UserStageRow | null,
): Promise<UserStageRow | null> {
  const existing = existingRow ?? await getUserStageBySlug(slug);
  if (!existing || existing.owner_id !== ownerId || existing.taken_down_at) return null;

  if (patch.preset && !stagePresetById(patch.preset)) return null;

  const sql = requireDb();
  let streams = patch.streams ?? existing.streams;
  if (patch.streams) {
    streams = await enrichStreamsChannelTitles(streams);
  }
  const nowPlayingIndex = patch.nowPlayingIndex ?? existing.now_playing_index;
  const preset = patch.preset ?? existing.preset;
  const sky = patch.sky !== undefined ? patch.sky : existing.sky;
  const backdropUrl = patch.backdropUrl !== undefined
    ? patch.backdropUrl
    : existing.backdrop_url;
  const shuffleOnStart = patch.shuffleOnStart ?? existing.shuffle_on_start;
  const description = patch.description !== undefined
    ? patch.description
    : existing.description;

  const rows = await sql`
    UPDATE user_stages SET
      streams = ${JSON.stringify(streams)}::jsonb,
      now_playing_index = ${nowPlayingIndex},
      preset = ${preset},
      sky = ${sky},
      backdrop_url = ${backdropUrl},
      shuffle_on_start = ${shuffleOnStart},
      description = ${description},
      last_active_at = now()
    WHERE slug = ${slug} AND owner_id = ${ownerId}::uuid AND taken_down_at IS NULL
    RETURNING slug, owner_id, festie_id, display_name, description, preset, sky, streams, now_playing_index,
              backdrop_url, featured, shuffle_on_start, created_at, last_active_at, taken_down_at
  `;
  if (!rows.length) return null;
  return parseRow(rows[0] as Record<string, unknown>);
}

/** Owner or admin takedown — marks stage dead immediately. */
export async function takedownUserStage(slug: string): Promise<boolean> {
  const sql = requireDb();
  const rows = await sql`
    UPDATE user_stages
    SET taken_down_at = now()
    WHERE slug = ${slug} AND taken_down_at IS NULL
    RETURNING slug
  `;
  return rows.length > 0;
}

/** Reclaim dormant slugs — run via cron or on stage create. */
export async function reclaimStaleStageSlugs(now = Date.now()): Promise<number> {
  const sql = requireDb();
  const reclaimBefore = new Date(now - STAGE_CONFIG.RECLAIM_WINDOW_MS).toISOString();
  const rows = await sql`
    DELETE FROM user_stages
    WHERE taken_down_at IS NULL
      AND last_active_at < ${reclaimBefore}::timestamptz
    RETURNING slug
  `;
  return rows.length;
}

export async function isValidActiveStageSlug(slug: string): Promise<boolean> {
  const row = await getUserStageBySlug(slug);
  if (!row || row.taken_down_at) return false;
  const pub = rowToPublic(row);
  return pub.tier !== 'reclaimable';
}

/** Active creator stages — not taken down. */
export async function countActiveUserStages(): Promise<number> {
  const sql = requireDb();
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM user_stages
    WHERE taken_down_at IS NULL
  `;
  return Number((rows[0] as { count: number }).count ?? 0);
}

/** Featured creator stages for the Switch Stages picker — active only. */
export async function listFeaturedUserStages(now = Date.now()): Promise<FeaturedStageSummary[]> {
  const sql = requireDb();
  const rows = await sql`
    SELECT slug, owner_id, festie_id, display_name, description, preset, sky, streams, now_playing_index,
           backdrop_url, featured, shuffle_on_start, created_at, last_active_at, taken_down_at
    FROM user_stages
    WHERE featured = true AND taken_down_at IS NULL
    ORDER BY display_name ASC
  `;
  return rows
    .map(r => rowToPublic(parseRow(r as Record<string, unknown>), now))
    .filter(stage => stage.tier !== 'reclaimable')
    .map(stage => ({
      slug: stage.slug,
      displayName: stage.displayName,
      preset: stage.preset,
      description: stage.description ?? null,
      backdropUrl: stage.backdropUrl ?? null,
    }));
}

export type IndexableStageEntry = { slug: string; lastActiveAt: number };

/**
 * Active (non-dormant, non-taken-down) creator stages for the sitemap.
 * Mirrors the page's `noIndex` rule: only the `active` tier is crawlable.
 */
export async function listIndexableStageSlugs(now = Date.now()): Promise<IndexableStageEntry[]> {
  const sql = requireDb();
  const activeSince = new Date(now - STAGE_CONFIG.DORMANCY_WINDOW_MS).toISOString();
  const rows = await sql`
    SELECT slug, last_active_at
    FROM user_stages
    WHERE taken_down_at IS NULL
      AND last_active_at >= ${activeSince}::timestamptz
    ORDER BY last_active_at DESC
    LIMIT 5000
  `;
  return rows.map(r => {
    const row = r as { slug: string; last_active_at: unknown };
    return {
      slug: String(row.slug),
      lastActiveAt: new Date(String(row.last_active_at)).getTime(),
    };
  });
}

/** When shuffle is on and the room is empty, pick a random track for the first viewer. */
export async function maybeShuffleStageOnStart(
  slug: string,
): Promise<{ stage: UserStagePublic; shuffled: boolean } | null> {
  const row = await getUserStageBySlug(slug);
  if (!row || row.taken_down_at) return null;

  const streams = parseStreamsJson(row.streams);
  const pub = rowToPublic(row);
  if (!row.shuffle_on_start || streams.length <= 1) {
    return { stage: pub, shuffled: false };
  }

  const { fetchPartyRoomPlayerCount } = await import('@/lib/festie/stagePresenceCounts');
  const playerCount = await fetchPartyRoomPlayerCount(slug).catch(() => 1);
  if (playerCount > 1) {
    return { stage: pub, shuffled: false };
  }

  let newIndex = Math.floor(Math.random() * streams.length);
  if (newIndex === row.now_playing_index) {
    newIndex = (newIndex + 1) % streams.length;
  }

  const sql = requireDb();
  const rows = await sql`
    UPDATE user_stages SET
      now_playing_index = ${newIndex},
      last_active_at = now()
    WHERE slug = ${slug}
      AND taken_down_at IS NULL
      AND shuffle_on_start = true
    RETURNING slug, owner_id, festie_id, display_name, description, preset, sky, streams, now_playing_index,
              backdrop_url, featured, shuffle_on_start, created_at, last_active_at, taken_down_at
  `;
  if (!rows.length) return { stage: pub, shuffled: false };
  return { stage: rowToPublic(parseRow(rows[0] as Record<string, unknown>)), shuffled: true };
}
