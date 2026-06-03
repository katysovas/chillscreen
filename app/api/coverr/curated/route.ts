import { head } from '@vercel/blob';
import curatedStatic from '@/data/curated.json';

const AUTH = { Authorization: `Bearer ${process.env.COVERR_API_KEY}` };

async function loadCurated(): Promise<{ videos: string[]; audio: string[] }> {
  try {
    const meta = await head('curated.json');
    const res = await fetch(meta.url, { next: { revalidate: 60 } });
    return res.json();
  } catch {
    return { videos: curatedStatic.videos, audio: curatedStatic.audio };
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
  const [videos, audio] = await Promise.all([
    Promise.all(curated.videos.map(id => fetchById(id, 'videos'))),
    Promise.all(curated.audio.map(id => fetchById(id, 'audios'))),
  ]);
  return Response.json({
    videos: videos.filter(Boolean),
    audio: audio.filter(Boolean),
  });
}
