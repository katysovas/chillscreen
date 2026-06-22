import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminAuthenticatedAsync, isAdminEnabled } from '@/lib/adminAuthCore';
import {
  isValidStageSlugFormat,
  normalizeStageSlug,
  RESERVED_STAGE_SLUGS,
} from '@/lib/stages/slugValidation';
import { parseVenueSlug } from '@/lib/venueSlugs';

/** App routes that are not venue deep links. */
const PASSTHROUGH = new Set(['privacy', 'support', 'admin', 'create', 'stages']);

/** Legacy venue slugs → canonical paths. */
const LEGACY_VENUE_REDIRECTS: Record<string, string> = {
  coachella: 'thedesert',
  couchella: 'thedesert',
  edc: 'lasvegas',
  'electric-daze': 'lasvegas',
  tentaroo: 'thefarm',
  bonnaroo: 'thefarm',
  'the-farm': 'thefarm',
  'outside-hands': 'sanfrancisco',
  'outside-lands': 'sanfrancisco',
  'seattle-concerts': 'seattle',
  bumbershoot: 'seattle',
  'chill-cinema': 'cinema',
  deepspace: 'space',
  'deep-space': 'space',
  'the-forest': 'forest',
  theforest: 'forest',
  silentdisco: 'silent-disco',
  silent_disco: 'silent-disco',
  hulaween: 'hula',
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/admin/')) {
    if (pathname === '/api/admin/login') return NextResponse.next();
    if (!isAdminEnabled()) {
      return NextResponse.json({ error: 'Admin is not configured' }, { status: 403 });
    }
    if (!(await isAdminAuthenticatedAsync(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/doodles/') ||
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/audio/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/opengraph-image'
  ) {
    return NextResponse.next();
  }

  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/') return NextResponse.next();

  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'admin') {
    if (segments[1] === 'login') return NextResponse.next();
    if (!isAdminEnabled()) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (!(await isAdminAuthenticatedAsync(request))) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (segments.length === 1) {
    const segment = segments[0]!;
    if (PASSTHROUGH.has(segment)) return NextResponse.next();
    const canonical = LEGACY_VENUE_REDIRECTS[segment];
    if (canonical) {
      const url = request.nextUrl.clone();
      url.pathname = `/${canonical}`;
      return NextResponse.redirect(url, 308);
    }
    if (parseVenueSlug(segment)) return NextResponse.next();
  }

  if (segments.length === 2 && segments[0] === 'watch') {
    if (segments[1]!.toLowerCase() === 'hulaween') {
      const url = request.nextUrl.clone();
      url.pathname = '/hula';
      return NextResponse.redirect(url, 308);
    }
    const norm = normalizeStageSlug(segments[1]!);
    if (!RESERVED_STAGE_SLUGS.has(norm) && isValidStageSlugFormat(norm)) {
      return NextResponse.next();
    }
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
