import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { getDb } from '@/lib/db';
import {
  creatorStagesItemListJsonLd,
  stagesIndexWebPageJsonLd,
  venueItemListJsonLd,
} from '@/lib/jsonLd';
import { SITE_NAME } from '@/lib/site';
import { buildPageMetadata } from '@/lib/siteMetadata';
import { listIndexableStagesForSeo } from '@/lib/stages/db';
import { creatorStageSeo } from '@/lib/stages/creatorSeo';
import { allStageSeoEntries } from '@/lib/venueSeo';

export const revalidate = 3600;

export const metadata = buildPageMetadata({
  title: 'Festival Stages & Live Sets',
  description:
    'Explore every WhichStage festival venue and creator stage — desert main stages, Las Vegas EDC, San Francisco concerts, jamband campgrounds, silent disco, and live watch parties. Free browser game with AI festies.',
  path: '/stages',
  keywords: [
    'festival stages',
    'live sets browser',
    'virtual festival venues',
    'creator stages',
    'AI festie stages',
    'WhichStage map',
  ],
});

export default async function StagesIndexPage() {
  const venues = allStageSeoEntries();
  const creatorStages = getDb() ? await listIndexableStagesForSeo().catch(() => []) : [];
  const creatorSeoEntries = creatorStages.map(stage => {
    const seo = creatorStageSeo(stage);
    return {
      name: seo.name,
      path: seo.path,
      description: seo.longDescription,
      metaDescription: seo.description,
    };
  });

  const graph = [
    stagesIndexWebPageJsonLd(),
    venueItemListJsonLd(),
    ...(creatorSeoEntries.length ? [creatorStagesItemListJsonLd(creatorSeoEntries)] : []),
  ];

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': graph,
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
          AI festival buddy that keeps vibing when you leave. No download.
        </p>

        <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, color: '#fff' }}>
          Festival venues
        </h2>
        <ul style={{ listStyle: 'none', margin: '0 0 40px', padding: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {venues.map(stage => (
            <li
              key={stage.slug}
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '20px 22px',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
                <Link href={stage.path} style={{ color: '#ffb347', textDecoration: 'none' }}>
                  {stage.title}
                </Link>
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: 'rgba(255,255,255,0.62)' }}>
                {stage.longDescription}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>
                {stage.keywords.join(' · ')}
              </p>
            </li>
          ))}
        </ul>

        {creatorSeoEntries.length > 0 && (
          <>
            <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, color: '#fff' }}>
              Creator stages
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {creatorSeoEntries.map(stage => (
                <li
                  key={stage.path}
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: '20px 22px',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
                    <Link href={stage.path} style={{ color: '#ffb347', textDecoration: 'none' }}>
                      {stage.name}
                    </Link>
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: 14, color: 'rgba(255,255,255,0.62)' }}>
                    {stage.metaDescription}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
