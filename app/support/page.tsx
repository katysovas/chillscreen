import Link from 'next/link';

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-violet-100 px-6 py-16">
      <div className="mx-auto max-w-xl text-center">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-emerald-700 hover:underline"
        >
          ← Back to ChillScreen
        </Link>

        <div className="mt-8 rounded-2xl bg-white/70 p-10 shadow-sm backdrop-blur">
          <div className="mb-4 text-5xl">🌿</div>
          <h1 className="mb-3 text-3xl font-black text-slate-800">Support</h1>
          <p className="mb-6 text-slate-600">
            Having trouble with ChillScreen, or just want to say hello? We&rsquo;d
            love to hear from you.
          </p>

          <a
            href="mailto:support@chillscreen.app"
            className="inline-flex items-center rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white transition hover:bg-emerald-800"
          >
            Email support
          </a>

          <div className="mt-8 space-y-4 text-left text-sm text-slate-500">
            <h2 className="font-semibold text-slate-700">Common questions</h2>

            <details className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer font-medium text-slate-700">
                My Home tab is blank after install.
              </summary>
              <p className="mt-2">
                Close and re-open the ChillScreen app in your sidebar. The first
                view is published when the tab is opened for the first time.
              </p>
            </details>

            <details className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer font-medium text-slate-700">
                My scene selection isn&rsquo;t saving.
              </summary>
              <p className="mt-2">
                Make sure the app is properly installed and the bot token is
                valid. If the problem persists, try uninstalling and reinstalling
                the app.
              </p>
            </details>

            <details className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer font-medium text-slate-700">
                Can I suggest a new wallpaper?
              </summary>
              <p className="mt-2">
                Yes! Email us a link to an Unsplash photo and we&rsquo;ll consider
                adding it to the next curated set.
              </p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
