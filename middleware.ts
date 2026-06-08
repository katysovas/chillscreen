import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseVenueSlug } from '@/lib/venueSlugs';

/** App routes that are not venue deep links. */
const PASSTHROUGH = new Set(['privacy', 'support']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/audio/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/') return NextResponse.next();

  const segments = path.split('/').filter(Boolean);

  if (segments.length === 1) {
    const segment = segments[0]!;
    if (PASSTHROUGH.has(segment)) return NextResponse.next();
    if (parseVenueSlug(segment)) return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
