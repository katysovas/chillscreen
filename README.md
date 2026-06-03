# ChillScreen 🌿

A Slack app whose Home tab shows a curated set of calming wallpapers. Click into the app, pick your scene, and Slack persists your choice — no database required in Phase 1.

## What it is

- **Slack Home tab app** — the only surface a Slack app fully controls (~700 px wide content area).
- **6 curated Unsplash landscapes** — hardcoded URLs, no runtime API calls.
- **Stateless** — Slack stores the published view. Image selection survives app restarts without a DB.
- **Next.js + Tailwind** — marketing site / OAuth pages only; Home tab is pure Block Kit JSON.

## Project structure

```
/app
  /api/slack
    /events/route.ts        # app_home_opened event handler
    /interactions/route.ts  # "Set as main" button handler
    /oauth/route.ts         # Phase 2 — multi-workspace install
  /error/page.tsx           # OAuth error page
  /privacy/page.tsx         # Privacy policy (required for App Directory)
  /success/page.tsx         # Post-install success page
  /support/page.tsx         # Support page
  /page.tsx                 # Landing page
  /layout.tsx
  /globals.css
/lib
  images.ts                 # WALLPAPERS constant + Wallpaper type
  slack.ts                  # WebClient, verifySlackSignature, publishHome
  views.ts                  # buildHomeView(selectedIndex)
```

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Create the Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**.
2. **App Home** → enable **Home Tab**.
3. **Event Subscriptions** → enable → set Request URL to `https://<your-domain>/api/slack/events` → subscribe to bot event `app_home_opened`.
4. **Interactivity & Shortcuts** → enable → set Request URL to `https://<your-domain>/api/slack/interactions`.
5. **OAuth & Permissions** → install to workspace → copy **Bot User OAuth Token**.
6. **Basic Information** → copy **Signing Secret**.

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in at minimum:

```
SLACK_SIGNING_SECRET=<from Basic Information>
SLACK_BOT_TOKEN=xoxb-<from OAuth & Permissions>
```

### 4. Run locally (with ngrok for Slack webhooks)

```bash
npm run dev
# in another terminal:
ngrok http 3000
```

Point both Slack Request URLs at the ngrok HTTPS URL.

### 5. Deploy to Vercel

```bash
npx vercel
```

Set `SLACK_SIGNING_SECRET` and `SLACK_BOT_TOKEN` as environment variables in the Vercel dashboard, then update the Slack Request URLs to your production domain.

## How the no-DB state persistence works

Slack stores the exact Block Kit JSON you publish via `views.publish`. When a user re-opens the Home tab, Slack renders that stored view — no server roundtrip needed.

The only rule: **don't overwrite their view on every `app_home_opened`**. The event payload includes `event.view` if one has been published before. The events handler checks for this:

```ts
if (!body.event.view) {
  await publishHome(body.event.user, 0); // first open only
}
```

Clicking "✓ Set as main" always overwrites with the new selection.

## Phase 2 — multi-workspace

When distributing via the App Directory, each workspace produces a unique bot token from the OAuth flow. You'll need to:

1. Persist `(team_id, bot_token)` in Neon (schema in `app/api/slack/oauth/route.ts`).
2. Update `publishHome` to look up the token per workspace instead of reading `SLACK_BOT_TOKEN`.
3. Set `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `DATABASE_URL`, and `NEXT_PUBLIC_SLACK_INSTALL_URL`.

The image selection logic is unchanged.

## Attribution

Images sourced from [Unsplash](https://unsplash.com). Photographer credits are displayed inline in the Home tab view as required by Unsplash guidelines.

## License

MIT
