import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { stagesIndexWebPageJsonLd, venueItemListJsonLd } from '@/lib/jsonLd';
import { SITE_NAME } from '@/lib/site';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { allStageSeoEntries } from '@/lib/venueSeo';

export const metadata = buildPageMetadata({
  title: 'Festival Stages & Live Sets',
  description:
    'Explore every WhichStage festival venue — desert main stages, Las Vegas EDC, San Francisco concerts, Seattle, The Farm, The Forest, Silent Disco, and Chill Cinema. Free browser game with live sets and AI festies.',
  path: '/stages',
  keywords: [
    'festival stages',
    'live sets browser',
    'virtual festival venues',
    'AI festie stages',
    'WhichStage map',
  ],
});

export default function StagesIndexPage() {
  const stages = allStageSeoEntries();

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [stagesIndexWebPageJsonLd(), venueItemListJsonLd()],
        }}
      />
      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '48px 24px 64px',
          fontFamily: 'system-ui, sans-serif',
          color: 'rgba(255,255,255,0.88)',
          lineHeight: 1.55,
        }}
      >
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
            {SITE_NAME}
          </Link>
        </p>
        <h1 style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 700, color: '#fff' }}>
          Festival stages & live sets
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 15, color: 'rgba(255,255,255,0.58)' }}>
          Pick a stage, walk the grounds, watch synchronized live sets with other players, and create an
          AI festival buddy that keeps vibing when you leave. Every venue is free in your browser — no
          download.
        </p>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {stages.map(stage => (
            <li
              key={stage.slug}
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '20px 22px',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
                <Link href={stage.path} style={{ color: '#ffb347', textDecoration: 'none' }}>
                  {stage.title}
                </Link>
              </h2>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: 'rgba(255,255,255,0.62)' }}>
                {stage.longDescription}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>
                {stage.keywords.join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
