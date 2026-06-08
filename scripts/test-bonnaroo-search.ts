import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchYoutubeSearchVideos } from '../lib/youtubeApi';
import { clearStagePlaylistCache, resolveStagePlaylists } from '../lib/resolveStagePlaylists';
import { STAGE_CHANNEL_CONFIG, STAGE_PLAYLISTS } from '../lib/stageVideos';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key?.trim() && rest.length && !process.env[key.trim()]) {
    process.env[key.trim()] = rest.join('=').trim();
  }
}

const FALLBACK_IDS = new Set(
  (STAGE_CHANNEL_CONFIG['which-stage'].source === 'youtube-api'
    ? STAGE_CHANNEL_CONFIG['which-stage'].fallbackVideos ?? []
    : []
  ).map(v => v.id),
);

async function main() {
  const key = process.env.YOUTUBE_API_KEY;
  console.log('YOUTUBE_API_KEY present:', Boolean(key && key.length > 8));

  const cfg = STAGE_CHANNEL_CONFIG['which-stage'];
  if (cfg.source !== 'youtube-api') throw new Error('which-stage not youtube-api');

  console.log('Query:', cfg.searchQuery);
  console.log('Exclude patterns:', cfg.excludeTitlePatterns);

  try {
    const raw = await fetchYoutubeSearchVideos(
      cfg.searchQuery,
      key!,
      cfg.maxResults ?? 20,
      cfg.excludeTitlePatterns,
    );
    console.log('\n=== fetchYoutubeSearchVideos ===');
    console.log('Returned:', raw.length, 'videos');
    if (raw.length === 0) {
      console.log('(empty — resolver keeps fallbacks)');
    }
    raw.slice(0, 10).forEach((v, i) => {
      console.log(`${i + 1}. ${v.id} | ${v.title.slice(0, 72)} | ${v.durationSec ?? 'no dur'}`);
    });
  } catch (err) {
    console.error('\nfetchYoutubeSearchVideos FAILED:', err);
  }

  // Raw search without filters
  try {
    const unfiltered = await fetchYoutubeSearchVideos(cfg.searchQuery, key!, 10);
    console.log('\n=== Same query WITHOUT exclude filters ===');
    console.log('Returned:', unfiltered.length);
    unfiltered.slice(0, 5).forEach((v, i) => {
      console.log(`${i + 1}. ${v.id} | ${v.title.slice(0, 72)}`);
    });
  } catch (err) {
    console.error('Unfiltered search FAILED:', err);
  }

  clearStagePlaylistCache();
  const playlists = await resolveStagePlaylists(key);
  const ws = playlists['which-stage'];
  const fallbackOnly = ws.length > 0 && ws.every(v => FALLBACK_IDS.has(v.id));

  console.log('\n=== resolveStagePlaylists(which-stage) ===');
  console.log('Count:', ws.length);
  console.log('Using fallbacks only?', fallbackOnly);
  ws.slice(0, 10).forEach((v, i) => {
    console.log(`${i + 1}. ${v.id} | ${v.title.slice(0, 72)}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
