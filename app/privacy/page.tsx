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

        <h2>What ChillScreen collects</h2>
        <p>
          ChillScreen is a browser-based game. We do not require an account and do
          not collect personal information through normal gameplay.
        </p>

        <h2>What ChillScreen does not collect</h2>
        <ul>
          <li>Account credentials or profile data.</li>
          <li>Chat messages sent to NPCs (stored only in your browser session for now).</li>
          <li>Analytics or advertising tracking cookies on this website.</li>
        </ul>

        <h2>Local storage</h2>
        <p>
          The game may use your browser&rsquo;s local storage for preferences such
          as audio mute state. This data stays on your device.
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
