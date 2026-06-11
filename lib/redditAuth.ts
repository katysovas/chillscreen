/** Reddit OAuth2 client-credentials — read-only listing access. */

const USER_AGENT =
  process.env.REDDIT_USER_AGENT?.trim()
  ?? 'web:whichstage-seed-admin:v1.0 (by /u/whichstage)';

let cached: { token: string; expiresAt: number } | null = null;

export function redditUserAgent(): string {
  return USER_AGENT;
}

/** Returns bearer token when REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET are set. */
export async function getRedditAccessToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID?.trim();
  const clientSecret = process.env.REDDIT_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  if (cached && Date.now() < cached.expiresAt - 60_000) {
    return cached.token;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Reddit OAuth ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error('Reddit OAuth: missing access_token');

  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cached.token;
}

export function redditOAuthConfigured(): boolean {
  return Boolean(
    process.env.REDDIT_CLIENT_ID?.trim() && process.env.REDDIT_CLIENT_SECRET?.trim(),
  );
}
