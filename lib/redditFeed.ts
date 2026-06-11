/** Reddit topic feeds for seed admin — OAuth preferred, RSS fallback. */

import { getRedditAccessToken, redditOAuthConfigured, redditUserAgent } from '@/lib/redditAuth';

export type RedditFeedPost = {
  id: string;
  title: string;
  subreddit: string;
  score: number;
  permalink: string;
  url: string;
  createdUtc: number;
  numComments: number;
};

type RedditListing = {
  data?: {
    children?: { data?: Record<string, unknown> }[];
  };
};

const FETCH_INIT = { cache: 'no-store' as const };

function normalizeSubreddit(sub: string): string {
  return sub.trim().replace(/^r\//i, '').replace(/[^\w]/g, '');
}

function browserHeaders(accept: string): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: accept,
    'Accept-Language': 'en-US,en;q=0.9',
  };
}

function postsFromListing(json: RedditListing, sub: string): RedditFeedPost[] {
  const children = json.data?.children ?? [];
  return children
    .map(child => child.data)
    .filter((d): d is Record<string, unknown> => Boolean(d))
    .filter(d => d.stickied !== true && d.over_18 !== true && d.removed_by_category == null)
    .map(d => ({
      id: String(d.id ?? ''),
      title: String(d.title ?? '').trim(),
      subreddit: String(d.subreddit ?? sub),
      score: Number(d.score ?? 0),
      permalink: `https://www.reddit.com${String(d.permalink ?? '')}`,
      url: String(d.url ?? ''),
      createdUtc: Number(d.created_utc ?? 0),
      numComments: Number(d.num_comments ?? 0),
    }))
    .filter(p => p.id && p.title.length > 8);
}

function parseRedditRss(xml: string, sub: string): RedditFeedPost[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const posts: RedditFeedPost[] = [];

  for (const entry of entries) {
    const titleRaw = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '';
    const title = titleRaw
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    const link = entry.match(/<link[^>]+href="([^"]+)"/)?.[1] ?? '';
    const idMatch = entry.match(/<id>([^<]+)<\/id>/)?.[1] ?? link;
    const id = idMatch.split('/').pop()?.replace(/^t3_/, '') ?? idMatch;
    if (!title || title.length < 8) continue;
    posts.push({
      id,
      title,
      subreddit: sub,
      score: 0,
      permalink: link.startsWith('http') ? link : `https://www.reddit.com${link}`,
      url: link,
      createdUtc: 0,
      numComments: 0,
    });
  }

  return posts;
}

function rateLimitWaitMs(res: Response): number {
  const reset = Number(res.headers.get('x-ratelimit-reset') ?? 0);
  if (Number.isFinite(reset) && reset > 0) return Math.min(reset * 1000 + 500, 60_000);
  return 5_000;
}

async function fetchOAuthJson(
  sub: string,
  sort: 'hot' | 'top' | 'new',
  limit: number,
): Promise<RedditFeedPost[]> {
  const token = await getRedditAccessToken();
  if (!token) return [];

  const url = `https://oauth.reddit.com/r/${sub}/${sort}?limit=${limit}&raw_json=1`;
  const res = await fetch(url, {
    ...FETCH_INIT,
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': redditUserAgent(),
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OAuth API ${res.status} for r/${sub}: ${detail.slice(0, 120)}`);
  }

  return postsFromListing(await res.json() as RedditListing, sub);
}

async function fetchRss(
  sub: string,
  limit: number,
  host: 'www' | 'old',
): Promise<RedditFeedPost[]> {
  const url = `https://${host}.reddit.com/r/${sub}/hot.rss?limit=${limit}`;
  let res = await fetch(url, {
    ...FETCH_INIT,
    headers: browserHeaders('application/atom+xml, application/xml, text/xml, */*'),
  });

  if (res.status === 429) {
    await delay(rateLimitWaitMs(res));
    res = await fetch(url, {
      ...FETCH_INIT,
      headers: browserHeaders('application/atom+xml, application/xml, text/xml, */*'),
    });
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`RSS ${res.status} (${host}) for r/${sub}: ${detail.slice(0, 80) || 'empty body'}`);
  }

  const xml = await res.text();
  if (!xml.includes('<entry>') && !xml.includes('<feed')) {
    throw new Error(`RSS (${host}) for r/${sub} returned non-feed content`);
  }
  return parseRedditRss(xml, sub);
}

function redditSetupHint(): string {
  if (redditOAuthConfigured()) {
    return ' OAuth is configured but failed — check REDDIT_CLIENT_ID/SECRET and restart `npm run dev`.';
  }
  return (
    ' Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to .env.local '
    + '(reddit.com/prefs/apps → script or web app), then restart `npm run dev`.'
  );
}

export async function fetchSubredditFeed(
  subreddit: string,
  sort: 'hot' | 'top' | 'new' = 'hot',
  limit = 15,
): Promise<RedditFeedPost[]> {
  const sub = normalizeSubreddit(subreddit);
  if (!sub) throw new Error('Invalid subreddit');
  const capped = Math.min(limit, 50);
  const errors: string[] = [];

  if (redditOAuthConfigured()) {
    try {
      const posts = await fetchOAuthJson(sub, sort, capped);
      if (posts.length > 0) return posts;
      errors.push('OAuth returned no posts');
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'OAuth failed');
    }
  }

  // Anonymous JSON is blocked (403); try RSS first to avoid burning rate limits.
  for (const host of ['www', 'old'] as const) {
    try {
      const posts = await fetchRss(sub, capped, host);
      if (posts.length > 0) return posts;
      errors.push(`RSS (${host}) returned no posts`);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `RSS (${host}) failed`);
    }
  }

  const detail = errors.length > 0 ? errors.join(' · ') : 'no methods tried';
  throw new Error(`Could not load r/${sub}.${redditSetupHint()} ${detail}`.trim());
}

const SUB_FETCH_DELAY_MS = 1200;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Fetch hot posts from several subs — dedupe by title, throttle requests. */
export async function fetchRedditTopics(
  subreddits: string[],
  perSub = 8,
): Promise<RedditFeedPost[]> {
  const seen = new Set<string>();
  const out: RedditFeedPost[] = [];
  const failures: string[] = [];

  for (let i = 0; i < subreddits.length; i++) {
    if (i > 0) await delay(SUB_FETCH_DELAY_MS);
    const sub = subreddits[i]!;
    try {
      const posts = await fetchSubredditFeed(sub, 'hot', perSub);
      for (const post of posts) {
        const key = post.title.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(post);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`r/${sub}: ${msg}`);
      console.warn('[reddit-feed] skip', sub, msg);
    }
  }

  if (out.length === 0 && failures.length > 0) {
    throw new Error(failures.join(' · '));
  }

  return out.sort((a, b) => b.score - a.score);
}
