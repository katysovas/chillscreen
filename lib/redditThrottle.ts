/** Serialize outbound Reddit requests to avoid 429 rate limits. */

const MIN_GAP_MS = 2_500;
const MAX_RETRIES = 4;

let lastRequestAt = 0;
let chain: Promise<void> = Promise.resolve();

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function rateLimitWaitMs(res: Response, attempt: number): number {
  const reset = Number(res.headers.get('x-ratelimit-reset') ?? 0);
  if (Number.isFinite(reset) && reset > 0) {
    return Math.min(reset * 1000 + 300, 90_000);
  }
  return Math.min(4_000 * (attempt + 1), 30_000);
}

async function throttle(): Promise<void> {
  const now = Date.now();
  const waitMs = Math.max(0, lastRequestAt + MIN_GAP_MS - now);
  if (waitMs > 0) await wait(waitMs);
  lastRequestAt = Date.now();
}

/** Fetch with global spacing and automatic 429 retries. */
export async function throttledRedditFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  let lastRes: Response | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await chain;
    let release!: () => void;
    chain = new Promise<void>(resolve => { release = resolve; });

    try {
      await throttle();
      const res = await fetch(url, { ...init, cache: 'no-store' });
      lastRes = res;
      if (res.status !== 429) return res;
      if (attempt < MAX_RETRIES - 1) {
        await wait(rateLimitWaitMs(res, attempt));
      }
    } finally {
      release();
    }
  }

  return lastRes!;
}
