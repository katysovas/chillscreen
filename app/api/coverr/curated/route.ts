import curatedData from '@/data/curated.json';
import { CuratedCategory } from '@/lib/types';

const AUTH = { Authorization: `Bearer ${process.env.COVERR_API_KEY}` };

interface StoredCurated {
  videos: string[];
  audio: string[];
  categories: CuratedCategory[];
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

export const dynamic = 'force-dynamic';

export async function GET() {
  const curated = curatedData as unknown as StoredCurated;
  const categories = curated.categories ?? [];

  // Collect all unique video IDs across top-level and all categories
  const allVideoIds = Array.from(
    new Set([...curated.videos, ...categories.flatMap(c => c.videoIds)])
  );

  const [videoMap, audio] = await Promise.all([
    Promise.all(allVideoIds.map(id => fetchById(id, 'videos'))).then(results =>
      Object.fromEntries(allVideoIds.map((id, i) => [id, results[i]]).filter(([, v]) => v))
    ),
    Promise.all(curated.audio.map(id => fetchById(id, 'audios'))),
  ]);

  return Response.json({
    videos: curated.videos.map(id => videoMap[id]).filter(Boolean),
    audio: audio.filter(Boolean),
    categories: categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      emoji: cat.emoji,
      videos: cat.videoIds.map(id => videoMap[id]).filter(Boolean),
    })),
  });
}
