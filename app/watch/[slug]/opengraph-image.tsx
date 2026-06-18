import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import { getDb } from '@/lib/db';
import { getUserStagePublicBySlug } from '@/lib/stages/db';
import { creatorStageSceneLabel } from '@/lib/stages/creatorSeo';
import { nowPlayingStream } from '@/lib/stages/runtime';

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'nodejs';

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;

  let stageName = SITE_NAME;
  let scene = 'Live festival stage';
  let subtitle: string | null = null;

  if (getDb()) {
    const stage = await getUserStagePublicBySlug(slug.toLowerCase()).catch(() => null);
    if (stage && !stage.takenDown && stage.tier !== 'reclaimable') {
      stageName = stage.displayName?.trim() || stage.slug;
      scene = `Live ${creatorStageSceneLabel(stage)} stage`;
      const stream = nowPlayingStream(stage);
      const title = stream?.title?.trim();
      if (title) {
        const channel = stream?.channelTitle?.trim();
        subtitle = channel ? `Now playing: ${title} · ${channel}` : `Now playing: ${title}`;
      } else {
        subtitle = stage.description?.trim() || null;
      }
    }
  }

  const logoPath = join(process.cwd(), 'public/images/logos/logo_social.png');
  const logoData = await readFile(logoPath).catch(() => null);
  const logoSrc = logoData ? `data:image/png;base64,${logoData.toString('base64')}` : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '72px',
          background:
            'radial-gradient(1200px 600px at 80% -10%, #2a1a4a 0%, #0a0a0a 60%), #0a0a0a',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 30,
            letterSpacing: 2,
            color: '#c8b6ff',
            textTransform: 'uppercase',
          }}
        >
          {scene}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: stageName.length > 14 ? 96 : 128,
              fontWeight: 800,
              lineHeight: 1.02,
              maxWidth: 1056,
            }}
          >
            {stageName}
          </div>
          {subtitle ? (
            <div
              style={{
                display: 'flex',
                marginTop: 28,
                fontSize: 36,
                color: '#d4d4d8',
                maxWidth: 1056,
              }}
            >
              {subtitle.length > 70 ? `${subtitle.slice(0, 69)}…` : subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} height={56} alt="" />
          ) : (
            <div style={{ display: 'flex', fontSize: 40, fontWeight: 700 }}>{SITE_NAME}</div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
