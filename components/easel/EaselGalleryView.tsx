'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isGoldenDoodle } from '@/lib/easel/doodle/golden';

type GalleryItem = {
  npc: string;
  topic: string;
  drawing_id: string;
  spritePath: string | null;
  completed_at: string | null;
  status: 'painting' | 'done' | 'hidden';
};

type Props = {
  stageSlug: string;
  venueLabel: string;
  venuePath: string;
};

export function EaselGalleryView({ stageSlug, venueLabel, venuePath }: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/easel/gallery?stage=${encodeURIComponent(stageSlug)}`)
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: GalleryItem[] }) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [stageSlug]);

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0f1012',
      color: '#f4f2ee',
      padding: '2rem 1.25rem 4rem',
      fontFamily: 'system-ui, sans-serif',
    }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <p style={{ margin: '0 0 0.5rem', opacity: 0.7, fontSize: 14 }}>
          <Link href={venuePath} style={{ color: '#9ecbff', textDecoration: 'none' }}>
            ← Back to {venueLabel}
          </Link>
        </p>
        <h1 style={{ margin: '0 0 0.35rem', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>
          Easel gallery
        </h1>
        <p style={{ margin: '0 0 2rem', opacity: 0.72, maxWidth: 520 }}>
          Recent street easel doodles painted by festies on this stage.
        </p>

        {loading && <p style={{ opacity: 0.6 }}>Loading gallery…</p>}

        {!loading && items.length === 0 && (
          <p style={{ opacity: 0.6 }}>No finished doodles yet — visit the stage and catch a painter at work.</p>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 16,
        }}
        >
          {items.map(item => {
            const npcName = item.npc.split('-').pop() ?? item.npc;
            const golden = isGoldenDoodle(item.drawing_id);
            return (
              <figure
                key={`${item.drawing_id}-${item.completed_at ?? 'live'}`}
                style={{
                  margin: 0,
                  padding: 12,
                  borderRadius: 12,
                  background: '#1a1c20',
                  border: golden ? '2px solid #ffd700' : '1px solid #2a2d33',
                  boxShadow: golden ? '0 0 18px #ffd70044' : undefined,
                }}
              >
                <div style={{
                  aspectRatio: '1',
                  background: '#fdfcf8',
                  borderRadius: 8,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                >
                  {item.spritePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.spritePath}
                      alt={item.topic}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        imageRendering: 'pixelated',
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 12, color: '#888', padding: 8, textAlign: 'center' }}>
                      stroke sketch
                    </span>
                  )}
                </div>
                <figcaption style={{ marginTop: 10, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{npcName}</div>
                  <div style={{ opacity: 0.75 }}>{item.topic}</div>
                  {golden && (
                    <div style={{ color: '#ffd700', fontSize: 11, marginTop: 4 }}>golden doodle</div>
                  )}
                  {item.status === 'painting' && (
                    <div style={{ color: '#9ecbff', fontSize: 11, marginTop: 4 }}>in progress</div>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </main>
  );
}
