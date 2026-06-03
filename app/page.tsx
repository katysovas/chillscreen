import Image from 'next/image';
import Link from 'next/link';

const PREVIEW_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&fit=crop&auto=format',
    alt: 'misty mountain',
  },
  {
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&fit=crop&auto=format',
    alt: 'forest path',
  },
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&fit=crop&auto=format',
    alt: 'calm lake',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50 to-violet-100">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
          🌿 Free Slack app
        </div>

        <h1 className="max-w-2xl text-5xl font-black tracking-tight text-slate-800 sm:text-6xl">
          A calm corner inside Slack
        </h1>

        <p className="max-w-md text-lg leading-relaxed text-slate-600">
          ChillScreen gives you a curated set of peaceful wallpapers right in
          your Slack Home tab. Pick a scene. Step away from the noise.
        </p>

        <a
          href={process.env.NEXT_PUBLIC_SLACK_INSTALL_URL ?? '#'}
          className="mt-2 inline-flex items-center gap-3 rounded-xl bg-emerald-700 px-7 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-emerald-800 active:scale-95"
        >
          <SlackIcon />
          Add to Slack
        </a>

        <p className="text-sm text-slate-400">
          Free · No credit card · Works in any workspace
        </p>
      </section>

      {/* Preview grid */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PREVIEW_IMAGES.map((img) => (
            <div
              key={img.url}
              className="relative aspect-video overflow-hidden rounded-2xl shadow-lg"
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                className="object-cover transition duration-700 hover:scale-105"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          6 curated scenes — more coming soon
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-2xl px-6 pb-20 text-center">
        <h2 className="mb-8 text-2xl font-bold text-slate-800">
          How it works
        </h2>
        <ol className="space-y-5 text-left">
          {[
            ['Install ChillScreen', 'Click "Add to Slack" and approve the install.'],
            ['Open the app', 'Click ChillScreen under Apps in your Slack sidebar.'],
            ['Pick your scene', 'Tap "✓ Set as main" under any image you love.'],
            ['Breathe', 'Your choice is saved — Slack shows it every time you open the tab.'],
          ].map(([step, desc], i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-800">{step}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-slate-600 transition">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="/support" className="hover:text-slate-600 transition">
            Support
          </Link>
          <span>·</span>
          <span>© {new Date().getFullYear()} ChillScreen</span>
        </div>
      </footer>
    </main>
  );
}

function SlackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 122.8 122.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z"
        fill="#E01E5A"
      />
      <path
        d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z"
        fill="#36C5F0"
      />
      <path
        d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z"
        fill="#2EB67D"
      />
      <path
        d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z"
        fill="#ECB22E"
      />
    </svg>
  );
}
