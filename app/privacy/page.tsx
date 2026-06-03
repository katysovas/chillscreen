import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-violet-100 px-6 py-16">
      <article className="prose prose-slate mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-emerald-700 no-underline hover:underline"
        >
          ← Back to ChillScreen
        </Link>

        <h1 className="text-3xl font-black text-slate-800">Privacy Policy</h1>
        <p className="text-slate-500">Last updated: June 2025</p>

        <h2>What data ChillScreen collects</h2>
        <p>
          ChillScreen collects the minimum data required to function:
        </p>
        <ul>
          <li>
            <strong>Slack User ID</strong> — used only to publish your Home tab
            view back to you via the Slack API. It is never stored persistently
            in a database (Phase 1).
          </li>
          <li>
            <strong>Slack Workspace / Team ID &amp; Bot Token</strong> — stored
            only when you install ChillScreen into a workspace (Phase 2
            multi-workspace). Used solely to call <code>views.publish</code> on
            your behalf.
          </li>
        </ul>

        <h2>What ChillScreen does not collect</h2>
        <ul>
          <li>Message content, channel names, or any workspace activity.</li>
          <li>Personal information beyond what Slack provides in webhook payloads.</li>
          <li>Analytics or tracking cookies on this website.</li>
        </ul>

        <h2>How your data is used</h2>
        <p>
          Your User ID is used in a single API call to Slack
          (<code>views.publish</code>) to render your selected wallpaper in your
          Home tab. No data is sold, shared, or used for advertising.
        </p>

        <h2>Data retention</h2>
        <p>
          Phase 1 (single workspace): no database — nothing is stored beyond the
          active request.
          <br />
          Phase 2 (multi-workspace): workspace tokens are stored until you
          uninstall the app from your workspace.
        </p>

        <h2>Uninstalling</h2>
        <p>
          Uninstalling ChillScreen from your Slack workspace revokes the bot
          token. Any stored installation record will be deleted within 30 days.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? Reach us at{' '}
          <a href="mailto:privacy@chillscreen.com">privacy@chillscreen.com</a>.
        </p>
      </article>
    </main>
  );
}
