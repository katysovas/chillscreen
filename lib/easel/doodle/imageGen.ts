import { ierror, iwarn } from '@/lib/internalDebug';

const IMAGE_MODEL = 'black-forest-labs/flux.2-klein';
const IMAGE_TIMEOUT_MS = 90_000;

type ImageBlock = {
  type?: string;
  image_url?: { url?: string };
  url?: string;
};

function extractImageUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const choice = (data as { choices?: unknown[] }).choices?.[0];
  if (!choice || typeof choice !== 'object') return null;
  const message = (choice as { message?: Record<string, unknown> }).message;
  if (!message) return null;

  const images = message.images;
  if (Array.isArray(images)) {
    for (const img of images) {
      if (!img || typeof img !== 'object') continue;
      const block = img as ImageBlock;
      const url = block.image_url?.url ?? block.url;
      if (typeof url === 'string' && url.length > 0) return url;
    }
  }

  const content = message.content;
  if (Array.isArray(content)) {
    for (const block of content) {
      if (!block || typeof block !== 'object') continue;
      const b = block as ImageBlock;
      if (b.type === 'image_url' || b.type === 'output_image') {
        const url = b.image_url?.url ?? b.url;
        if (typeof url === 'string' && url.length > 0) return url;
      }
    }
  }

  if (typeof content === 'string' && content.startsWith('data:image/')) {
    return content;
  }

  return null;
}

async function urlToBuffer(url: string): Promise<Buffer | null> {
  if (url.startsWith('data:')) {
    const comma = url.indexOf(',');
    if (comma < 0) return null;
    const b64 = url.slice(comma + 1);
    return Buffer.from(b64, 'base64');
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Call OpenRouter image model — returns raw raster bytes. */
export async function generateDoodleRaster(
  prompt: string,
  opts?: { model?: string; apiKey?: string },
): Promise<Buffer | null> {
  const apiKey = opts?.apiKey ?? process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    iwarn('[doodle:imagegen] OPENROUTER_API_KEY missing');
    return null;
  }

  const model = opts?.model ?? IMAGE_MODEL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://whichstage.com',
        'X-Title': 'WhichStage',
      },
      body: JSON.stringify({
        model,
        modalities: ['image', 'text'],
        messages: [{ role: 'user', content: prompt }],
        image_config: { aspect_ratio: '1:1' },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      ierror('[doodle:imagegen] request failed', res.status, detail.slice(0, 300));
      return null;
    }

    const data = await res.json();
    const imageUrl = extractImageUrl(data);
    if (!imageUrl) {
      iwarn('[doodle:imagegen] no image in response', JSON.stringify(data).slice(0, 400));
      return null;
    }

    return urlToBuffer(imageUrl);
  } catch (err) {
    ierror('[doodle:imagegen] failed', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const DOODLE_IMAGE_MODEL = IMAGE_MODEL;
