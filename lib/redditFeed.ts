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

async function fetchOAuthJson(
  sub: string,
  sort: 'hot' | 'top' | 'new',
  limit: number,
): Promise<RedditFeedPost[]> {
  const token = await getRedditAccessToken();
  if (!token) return [];

  const url = `https://oauth.reddit.com/r/${sub}/${sort}?limit=${limit}&raw_json=1`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': redditUserAgent(),
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Reddit OAuth ${res.status} for r/${sub}: ${detail.slice(0, 120)}`);
  }

  return postsFromListing(await res.json() as RedditListing, sub);
}

async function fetchPublicJson(
  sub: string,
  sort: 'hot' | 'top' | 'new',
  limit: number,
  host: 'www' | 'old',
): Promise<RedditFeedPost[]> {
  const url = `https://${host}.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1`;
  const res = await fetch(url, {
    headers: browserHeaders('application/json'),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Reddit ${res.status} for r/${sub}: ${detail.slice(0, 120)}`);
  }

  return postsFromListing(await res.json() as RedditListing, sub);
}

async function fetchRss(sub: string, limit: number): Promise<RedditFeedPost[]> {
  const url = `https://www.reddit.com/r/${sub}/hot.rss?limit=${limit}`;
  const res = await fetch(url, {
    headers: browserHeaders('application/atom+xml, application/xml, text/xml, */*'),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Reddit RSS ${res.status} for r/${sub}: ${detail.slice(0, 120)}`);
  }

  const xml = await res.text();
  if (!xml.includes('<entry>') && !xml.includes('<feed')) {
    throw new Error(`Reddit RSS for r/${sub} returned non-feed content`);
  }
  return parseRedditRss(xml, sub);
}

function redditSetupHint(): string {
  if (redditOAuthConfigured()) return '';
  return ' Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env.local (reddit.com/prefs/apps → web app).';
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
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'OAuth failed');
    }
  }

  for (const host of ['www', 'old'] as const) {
    try {
      const posts = await fetchPublicJson(sub, sort, capped, host);
      if (posts.length > 0) return posts;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `${host} JSON failed`);
    }
  }

  try {
    const posts = await fetchRss(sub, capped);
    if (posts.length > 0) return posts;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'RSS failed');
  }

  throw new Error(
    `Could not load r/${sub}.${redditSetupHint()} ${errors[0] ?? ''}`.trim(),
  );
}

const SUB_FETCH_DELAY_MS = 400;

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
