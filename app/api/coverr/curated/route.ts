import { head } from '@vercel/blob';
import curatedStatic from '@/data/curated.json';
import { CuratedCategory } from '@/lib/types';

const AUTH = { Authorization: `Bearer ${process.env.COVERR_API_KEY}` };

interface StoredCurated {
  videos: string[];
  audio: string[];
  categories: CuratedCategory[];
}

async function loadCurated(): Promise<StoredCurated> {
  try {
    const meta = await head('curated.json');
    const res = await fetch(meta.url, { next: { revalidate: 60 } });
    return res.json();
  } catch {
    return {
      videos: curatedStatic.videos,
      audio: curatedStatic.audio,
      categories: (curatedStatic as unknown as StoredCurated).categories ?? [],
    };
  }
}

async function fetchById(id: string, type: 'videos' | 'audios') {
  const url = `https://api.coverr.co/${type}/${id}${type === 'videos' ? '?urls=true' : ''}`;
  const res = await fetch(url, {
    headers: AUTH,
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET() {
  const curated = await loadCurated();

  // Collect all unique video IDs (top-level + all category videos)
  const allVideoIds = Array.from(
    new Set([
      ...curated.videos,
      ...(curated.categories ?? []).flatMap(c => c.videoIds),
    ])
  );

  const [videoMap, audio] = await Promise.all([
    Promise.all(allVideoIds.map(id => fetchById(id, 'videos'))).then(results =>
      Object.fromEntries(allVideoIds.map((id, i) => [id, results[i]]).filter(([, v]) => v))
    ),
    Promise.all(curated.audio.map(id => fetchById(id, 'audios'))),
  ]);

  const categories = (curated.categories ?? []).map(cat => ({
    id: cat.id,
    name: cat.name,
    emoji: cat.emoji,
    videos: cat.videoIds.map(id => videoMap[id]).filter(Boolean),
  }));

  return Response.json({
    videos: curated.videos.map(id => videoMap[id]).filter(Boolean),
    audio: audio.filter(Boolean),
    categories,
  });
}
