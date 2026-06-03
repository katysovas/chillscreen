import curated from '@/data/curated.json';

const AUTH = { Authorization: `Bearer ${process.env.COVERR_API_KEY}` };

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
  const [videos, audio] = await Promise.all([
    Promise.all(curated.videos.map(id => fetchById(id, 'videos'))),
    Promise.all(curated.audio.map(id => fetchById(id, 'audios'))),
  ]);

  return Response.json({
    videos: videos.filter(Boolean),
    audio: audio.filter(Boolean),
  });
}
