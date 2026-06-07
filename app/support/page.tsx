import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd, webPageJsonLd } from '@/lib/jsonLd';
import { buildPageMetadata } from '@/lib/siteMetadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Support',
  description:
    'Get help with WhichStage — controls, NPC chat, audio troubleshooting, and contact support.',
  path: '/support',
});

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-violet-100 px-6 py-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            webPageJsonLd({
              path: '/support',
              title: 'Support',
              description:
                'Get help with WhichStage — controls, NPC chat, audio troubleshooting, and contact support.',
            }),
            breadcrumbJsonLd([
              { name: 'WhichStage', path: '/' },
              { name: 'Support', path: '/support' },
            ]),
          ],
        }}
      />
      <div className="mx-auto max-w-xl text-center">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-emerald-700 hover:underline"
        >
          ← Back to WhichStage
        </Link>

        <div className="mt-8 rounded-2xl bg-white/70 p-10 shadow-sm backdrop-blur">
          <div className="mb-4 text-5xl">🌿</div>
          <h1 className="mb-3 text-3xl font-black text-slate-800">Support</h1>
          <p className="mb-6 text-slate-600">
            Having trouble with WhichStage, or just want to say hello? We&rsquo;d
            love to hear from you.
          </p>

          <a
            href="mailto:support@whichstage.com"
            className="inline-flex items-center rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white transition hover:bg-emerald-800"
          >
            Email support
          </a>

          <div className="mt-8 space-y-4 text-left text-sm text-slate-500">
            <h2 className="font-semibold text-slate-700">Common questions</h2>

            <details className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer font-medium text-slate-700">
                How do I move and jump?
              </summary>
              <p className="mt-2">
                Use ← → or A / D to walk. Press ↑, W, or Space to jump. On mobile,
                use the on-screen controls at the bottom.
              </p>
            </details>

            <details className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer font-medium text-slate-700">
                How do I talk to characters?
              </summary>
              <p className="mt-2">
                Walk up to an NPC until you connect, then press Enter to open the
                chat bubble. Press ↑ to say goodbye and walk away.
              </p>
            </details>

            <details className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer font-medium text-slate-700">
                Audio isn&rsquo;t playing.
              </summary>
              <p className="mt-2">
                Some browsers block autoplay until you interact with the page. Tap
                or press any key once, then use the mute button next to the arrow
                controls if needed.
              </p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
