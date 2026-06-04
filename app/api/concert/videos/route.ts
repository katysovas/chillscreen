import { searchConcertVideos } from '@/lib/youtube';

export async function GET() {
  try {
    const videos = await searchConcertVideos();
    return Response.json({ videos });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load videos';
    return Response.json({ videos: [], error: message }, { status: 503 });
  }
}
