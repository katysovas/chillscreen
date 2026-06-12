import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';

/** logo_dark.png — 818×138 horizontal wordmark */
const LOGO_WIDTH = 818;
const LOGO_HEIGHT = 138;
const DISPLAY_WIDTH = 960;

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'nodejs';

export default async function Image() {
  const logoPath = join(process.cwd(), 'public/images/logos/logo_dark.png');
  const logoData = await readFile(logoPath);
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;
  const displayHeight = Math.round((DISPLAY_WIDTH * LOGO_HEIGHT) / LOGO_WIDTH);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={DISPLAY_WIDTH} height={displayHeight} alt="" />
      </div>
    ),
    { ...size },
  );
}
