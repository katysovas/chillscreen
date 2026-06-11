import { NextResponse } from 'next/server';
import { AdminForbiddenError, assertLocalAdminRequest } from '@/lib/adminLocalhost';
import { redditOAuthConfigured } from '@/lib/redditAuth';
import {
  dailySubredditsForTarget,
  GENERAL_SUBREDDITS,
  type SeedPoolTarget,
} from '@/lib/seedAdmin';
import { fetchRedditTopics, fetchSubredditFeed } from '@/lib/redditFeed';

export const dynamic = 'force-dynamic';

function adminError(err: unknown) {
  if (err instanceof AdminForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error('[admin/reddit-feed]', err);
  return NextResponse.json(
    { error: err instanceof Error ? err.message : 'Server error' },
    { status: 500 },
  );
}

function parseTarget(searchParams: URLSearchParams): SeedPoolTarget | null {
  const scope = searchParams.get('scope');
  const kind = searchParams.get('kind') === 'fallback' ? 'fallback' : 'generated';
  if (scope === 'general') return { scope: 'general', kind };
  const slug = searchParams.get('slug')?.trim();
  if (scope === 'stage' && slug) return { scope: 'stage', slug, kind };
  return null;
}

/** Fetch Reddit hot posts — single sub or daily preset bundle. */
export async function GET(request: Request) {
  try {
    assertLocalAdminRequest(request);
    const { searchParams } = new URL(request.url);
    const sub = searchParams.get('sub')?.trim();
    const daily = searchParams.get('daily') === '1';

    if (daily) {
      const target = parseTarget(searchParams);
      if (!target) {
        return NextResponse.json({ error: 'scope and slug required for daily pull' }, { status: 400 });
      }
      const subs = dailySubredditsForTarget(target);
      const posts = await fetchRedditTopics(subs, 6);
      return NextResponse.json({ posts, subreddits: subs, oauth: redditOAuthConfigured() });
    }

    if (sub) {
      const posts = await fetchSubredditFeed(sub, 'hot', 20);
      return NextResponse.json({
        posts,
        subreddits: [sub.replace(/^r\//i, '')],
        oauth: redditOAuthConfigured(),
      });
    }

    const subsParam = searchParams.get('subs');
    const subs = subsParam
      ? subsParam.split(',').map(s => s.trim()).filter(Boolean)
      : GENERAL_SUBREDDITS.slice(0, 4);
    const posts = await fetchRedditTopics(subs, 8);
    return NextResponse.json({ posts, subreddits: subs, oauth: redditOAuthConfigured() });
  } catch (err) {
    return adminError(err);
  }
}
