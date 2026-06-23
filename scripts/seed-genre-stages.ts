/**
 * Seed 50 genre stages (5 categories × 10) under HuskyNights and refresh
 * data/featured-stages-chart.json with Featured + genre tabs.
 *
 * Usage:
 *   npm run seed:genre-stages
 *   npm run seed:genre-stages -- --dry-run
 *   npm run seed:genre-stages -- --chart-only
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import seedData from '../data/genre-stages-seed.json';
import { insertUserStage, isStageSlugTaken, getUserStageBySlug } from '../lib/stages/db';
import { parseStageStreamSource, parseStageStreamUrl } from '../lib/stages/parseStream';
import { parseYoutubeVideoId, fetchYoutubeOembed } from '../lib/youtubeApi';
import { validateStageSlugFormat } from '../lib/stages/slugValidation';
import { STAGE_WALLPAPERS, stageWallpaperSrc } from '../lib/stages/wallpapers';
import type { StageStream } from '../lib/stages/types';
import type { VenueRoute } from '../lib/venueSlugs';
import type { FeaturedChartEntry, FeaturedChartTab } from '../lib/stages/featuredStagesChart';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

try {
  for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && !process.env[key]) process.env[key] = value;
  }
} catch { /* optional */ }

const DRY_RUN = process.argv.includes('--dry-run');
const CHART_ONLY = process.argv.includes('--chart-only');
const OWNER_NAME = 'HuskyNights';
const STREAMS_PER_SOURCE = 8;
const LIVE_FALLBACK_DURATION_SEC = 3600;

type SeedStream = {
  label: string;
  url: string;
  type: 'channel' | 'playlist' | 'live_video';
};

type SeedStage = {
  slug: string;
  name: string;
  description: string;
  existing: boolean;
  venueRoute?: VenueRoute;
};

type SeedCategory = {
  id: string;
  name: string;
  streams: SeedStream[];
  stages: SeedStage[];
};

const VENUE_THUMBNAILS: Partial<Record<VenueRoute, string>> = {
  cinema: '/images/homepage/cinema.webp',
  'silent-disco': '/images/homepage/silentdisco.webp',
  edc: '/images/homepage/edc.webp',
  tentaroo: '/images/homepage/thefarm.webp',
  forest: '/images/homepage/forest.webp',
  'outside-hands': '/images/homepage/sf.webp',
  hula: '/images/homepage/hula.webp',
  headliner: '/images/homepage/forest.webp',
  coachella: '/images/homepage/thedesert.webp',
};

function pickRandomWallpaper() {
  const wp = STAGE_WALLPAPERS[Math.floor(Math.random() * STAGE_WALLPAPERS.length)]!;
  return stageWallpaperSrc(wp);
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

async function resolveLiveVideoStream(url: string, apiKey: string): Promise<StageStream | null> {
  const parsed = await parseStageStreamUrl(url, apiKey);
  if (parsed.ok) return parsed.stream;

  const videoId = parseYoutubeVideoId(url);
  if (!videoId) return null;

  try {
    const oembed = await fetchYoutubeOembed(videoId);
    if (!oembed.embeddable) return null;
    return {
      url,
      videoId,
      title: oembed.title?.trim() || videoId,
      channelTitle: oembed.channelTitle?.trim() || undefined,
      thumbnail: oembed.thumbnailUrl,
      durationSec: LIVE_FALLBACK_DURATION_SEC,
    };
  } catch {
    return null;
  }
}

async function resolvePoolStreams(
  pool: SeedStream[],
  apiKey: string,
): Promise<StageStream[]> {
  const byVideoId = new Map<string, StageStream>();

  for (const item of pool) {
    if (item.type === 'live_video') {
      const stream = await resolveLiveVideoStream(item.url, apiKey);
      if (stream) byVideoId.set(stream.videoId, stream);
      continue;
    }

    const mode = item.type === 'playlist' ? 'playlist' : 'channel';
    const result = await parseStageStreamSource(item.url, mode, {
      apiKey,
      maxToAdd: STREAMS_PER_SOURCE,
      existingVideoIds: [...byVideoId.keys()],
    });
    if (result.ok && 'streams' in result) {
      for (const stream of result.streams) {
        byVideoId.set(stream.videoId, stream);
      }
    } else {
      console.warn(`  ⚠ Could not resolve ${item.label}: ${'message' in result ? result.message : 'unknown'}`);
    }
  }

  return [...byVideoId.values()];
}

async function lookupOwner() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error('DATABASE_URL is not set');
  const sql = neon(url);
  const rows = await sql`
    SELECT f.user_id, f.id AS festie_id, f.name
    FROM festies f
    WHERE lower(trim(f.name)) = lower(trim(${OWNER_NAME}))
    LIMIT 1
  `;
  const row = rows[0] as { user_id: string; festie_id: string; name: string } | undefined;
  if (!row) throw new Error(`Festie "${OWNER_NAME}" not found`);
  return { ownerId: String(row.user_id), festieId: String(row.festie_id) };
}

function chartTarget(stage: SeedStage): FeaturedChartEntry['target'] {
  if (stage.existing && stage.venueRoute) {
    return { kind: 'venue', route: stage.venueRoute };
  }
  return { kind: 'creator', slug: stage.slug };
}

function buildCategoryTab(category: SeedCategory): FeaturedChartTab {
  return {
    id: category.id,
    label: category.name,
    entries: category.stages.map((stage, index) => {
      const entry: FeaturedChartEntry = {
        rank: index + 1,
        previousRank: index + 1,
        name: stage.name,
        subtitle: stage.description,
        target: chartTarget(stage),
      };
      if (stage.existing && stage.venueRoute) {
        const thumb = VENUE_THUMBNAILS[stage.venueRoute];
        if (thumb) entry.thumbnail = thumb;
      }
      return entry;
    }),
  };
}

function loadFeaturedTab(): FeaturedChartTab {
  const chartPath = resolve(root, 'data/featured-stages-chart.json');
  const current = JSON.parse(readFileSync(chartPath, 'utf8')) as { tabs: FeaturedChartTab[] };
  const featured = current.tabs.find(t => t.id === 'featured');
  if (!featured) throw new Error('featured tab missing from featured-stages-chart.json');
  return featured;
}

function writeChart(tabs: FeaturedChartTab[]) {
  const outPath = resolve(root, 'data/featured-stages-chart.json');
  writeFileSync(outPath, `${JSON.stringify({ tabs }, null, 2)}\n`);
  console.log(`\n✓ Wrote ${outPath} (${tabs.length} tabs)`);
}

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey && !CHART_ONLY) {
    throw new Error('YOUTUBE_API_KEY is required (set in .env.local)');
  }

  const categories = seedData.categories as SeedCategory[];
  const streamCache = new Map<string, StageStream[]>();

  if (!CHART_ONLY) {
    console.log(`\nResolving category stream pools…`);
    for (const category of categories) {
      console.log(`\n[${category.name}]`);
      const streams = await resolvePoolStreams(category.streams, apiKey!);
      streamCache.set(category.id, streams);
      console.log(`  → ${streams.length} embeddable stream(s)`);
      if (!streams.length) {
        throw new Error(`No streams resolved for category ${category.id}`);
      }
    }
  }

  let owner: { ownerId: string; festieId: string } | null = null;
  if (!CHART_ONLY) {
    owner = await lookupOwner();
    console.log(`\nOwner: ${OWNER_NAME} (${owner.ownerId})`);
  }

  let created = 0;
  let skipped = 0;

  if (!CHART_ONLY && owner) {
    console.log('\nCreating creator stages…');
    for (const category of categories) {
      const poolStreams = streamCache.get(category.id)!;
      for (const stage of category.stages) {
        if (stage.existing) {
          console.log(`  skip (built-in) ${stage.slug}`);
          skipped += 1;
          continue;
        }

        const slugErr = validateStageSlugFormat(stage.slug);
        if (slugErr) {
          console.warn(`  ✗ ${stage.slug}: invalid slug (${slugErr})`);
          skipped += 1;
          continue;
        }

        const existing = await getUserStageBySlug(stage.slug);
        if (existing && existing.owner_id === owner.ownerId && !existing.taken_down_at) {
          console.log(`  exists ${stage.slug}`);
          skipped += 1;
          continue;
        }
        if (existing && existing.owner_id !== owner.ownerId && !existing.taken_down_at) {
          console.warn(`  ✗ ${stage.slug}: slug taken by another owner`);
          skipped += 1;
          continue;
        }
        if (await isStageSlugTaken(stage.slug) && (!existing || existing.owner_id !== owner.ownerId)) {
          console.warn(`  ✗ ${stage.slug}: slug taken`);
          skipped += 1;
          continue;
        }

        const streams = shuffleInPlace([...poolStreams]).slice(0, Math.min(12, poolStreams.length));
        const backdropUrl = pickRandomWallpaper();

        if (DRY_RUN) {
          console.log(`  [dry-run] would create ${stage.slug} (${streams.length} streams, shuffle on)`);
          created += 1;
          continue;
        }

        await insertUserStage({
          slug: stage.slug,
          displayName: stage.name.slice(0, 20),
          description: stage.description,
          ownerId: owner.ownerId,
          festieId: owner.festieId,
          preset: 'cinema',
          streams,
          shuffleOnStart: true,
          backdropUrl,
          nowPlayingIndex: 0,
        });
        console.log(`  ✓ ${stage.slug}`);
        created += 1;
      }
    }
  }

  const genreTabs = categories.map(buildCategoryTab);
  const featuredTab = loadFeaturedTab();
  writeChart([featuredTab, ...genreTabs]);

  console.log(`\nDone. created=${created} skipped=${skipped}`);
  if (DRY_RUN) console.log('(dry run — no DB writes)');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
