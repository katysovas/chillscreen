export const runtime = 'nodejs';

/**
 * Phase 2 — Multi-workspace OAuth handler.
 *
 * Flow:
 *  1. User clicks "Add to Slack" → redirected to Slack OAuth consent screen.
 *  2. Slack redirects back here with a `code` query param.
 *  3. Exchange `code` for a bot token via oauth.v2.access.
 *  4. Persist (team_id, bot_token) in Neon.
 *  5. Redirect user to /success.
 *
 * Required env vars (Phase 2):
 *   SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, DATABASE_URL
 *
 * Neon schema:
 *   create table installations (
 *     team_id      text primary key,
 *     bot_token    text not null,
 *     installed_at timestamptz default now()
 *   );
 */

import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    const reason = error ?? 'missing_code';
    return Response.redirect(new URL(`/error?reason=${reason}`, req.url));
  }

  // TODO (Phase 2): exchange code, persist token, redirect to /success
  // const result = await exchangeCodeForToken(code);
  // await upsertInstallation(result.team.id, result.access_token);

  return Response.redirect(new URL('/success', req.url));
}
