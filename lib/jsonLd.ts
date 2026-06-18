import {
  CONTACT,
  LOGO_PATH,
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from '@/lib/site';
import { LANDING_PAGE_DESCRIPTION, LANDING_PAGE_TITLE } from '@/lib/landingSeo';
import { allStageSeoEntries, venueSeoForRoute } from '@/lib/venueSeo';
import type { VenueRoute } from '@/lib/venueRoutes';
import { parseVenueSlug, venueSlugForRoute, VENUE_SLUGS } from '@/lib/venueRoutes';
import { creatorStageSeo } from '@/lib/stages/creatorSeo';
import { nowPlayingStream } from '@/lib/stages/runtime';
import type { UserStagePublic } from '@/lib/stages/types';

function absoluteUrl(path: string): string {
  return path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: 'en-US',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(LOGO_PATH),
    email: CONTACT.support,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: CONTACT.support,
        availableLanguage: 'English',
      },
    ],
  };
}

export function webApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${SITE_URL}/#app`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web browser',
    browserRequirements: 'Requires JavaScript. Modern browser recommended.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Join the AI Festival — create a festie that stays at the stage',
      'Walk through cities, campgrounds, and glowing forests',
      'Watch synchronized live festival and DJ sets',
      'Silent disco headphone raves and outdoor cinema',
      'Chat with NPCs and other players',
      'Multiplayer browser presence — no download',
    ],
    screenshot: absoluteUrl(OG_IMAGE_PATH),
  };
}

export function videoGameJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    '@id': `${SITE_URL}/#videogame`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_TAGLINE,
    gamePlatform: 'Web browser',
    genre: 'Casual game',
    playMode: 'MultiPlayer',
    applicationCategory: 'Game',
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webPageJsonLd({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}) {
  const url = absoluteUrl(path);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    inLanguage: 'en-US',
  };
}

/** Discoverable venue deep links for the home page. */
export function venueItemListJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${SITE_NAME} festival stages`,
    description:
      'Browse live festival stages across desert, city, farm, forest, and silent disco venues in the browser.',
    numberOfItems: VENUE_SLUGS.length,
    itemListElement: allStageSeoEntries().map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.title,
      url: absoluteUrl(entry.path),
      description: entry.longDescription,
    })),
  };
}

/** Per-stage rich result — music venue + tourist attraction for deep links. */
export function festivalStageJsonLd(route: VenueRoute) {
  const seo = venueSeoForRoute(route);
  const path = `/${venueSlugForRoute(route)}`;
  const url = absoluteUrl(path);

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    '@id': `${url}#stage`,
    name: `${seo.title} on ${SITE_NAME}`,
    description: seo.longDescription,
    url,
    isAccessibleForFree: true,
    touristType: 'Festival and live music fans',
    keywords: seo.keywords.join(', '),
    additionalType: 'https://schema.org/MusicVenue',
    containedInPlace: {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      name: SITE_NAME,
    },
  };
}

/** Per creator-stage rich result — music venue + now-playing video. */
export function creatorStageJsonLd(stage: UserStagePublic) {
  const seo = creatorStageSeo(stage);
  const url = absoluteUrl(seo.path);
  const stream = nowPlayingStream(stage);

  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    '@id': `${url}#stage`,
    name: `${seo.name} on ${SITE_NAME}`,
    description: seo.longDescription,
    url,
    isAccessibleForFree: true,
    touristType: 'Festival and live music fans',
    keywords: seo.keywords.join(', '),
    additionalType: 'https://schema.org/MusicVenue',
    containedInPlace: {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      name: SITE_NAME,
    },
  };

  if (stream?.title) {
    node.subjectOf = {
      '@type': 'VideoObject',
      name: stream.title,
      description: stream.channelTitle
        ? `${stream.title} by ${stream.channelTitle}, now playing on ${seo.name}.`
        : `${stream.title}, now playing on ${seo.name}.`,
      thumbnailUrl: stream.thumbnail || undefined,
      embedUrl: stream.url || undefined,
      uploadDate: new Date(stage.createdAt).toISOString(),
      ...(stream.channelTitle
        ? { creator: { '@type': 'Organization', name: stream.channelTitle } }
        : {}),
    };
  }

  return node;
}

/** Full structured-data graph for a creator stage page. */
export function creatorStageGraphJsonLd(stage: UserStagePublic) {
  const seo = creatorStageSeo(stage);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      webPageJsonLd({
        path: seo.path,
        title: `${seo.name} — ${SITE_NAME}`,
        description: seo.description,
      }),
      breadcrumbJsonLd([
        { name: SITE_NAME, path: '/' },
        { name: 'Stages', path: '/stages' },
        { name: seo.name, path: seo.path },
      ]),
      creatorStageJsonLd(stage),
    ],
  };
}

export function stagesIndexWebPageJsonLd() {
  return webPageJsonLd({
    path: '/stages',
    title: 'Festival Stages & Live Sets',
    description:
      'Directory of WhichStage festival venues and creator stages — desert main stages, city concerts, campground rigs, forest lasers, silent disco, and live watch parties.',
  });
}

export function creatorStagesItemListJsonLd(
  stages: Array<{ name: string; path: string; description: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${SITE_NAME} creator stages`,
    description:
      'User-created live stream stages with synchronized playback, multiplayer chat, and AI festies.',
    numberOfItems: stages.length,
    itemListElement: stages.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      url: absoluteUrl(entry.path),
      description: entry.description,
    })),
  };
}

type FaqEntry = { readonly q: string; readonly a: string };

export function faqPageJsonLd(items: readonly FaqEntry[]) {
  const url = absoluteUrl('/');
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    url,
    inLanguage: 'en-US',
    isPartOf: { '@id': `${url}#webpage` },
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

export function homePageJsonLd() {
  return webPageJsonLd({
    path: '/',
    title: LANDING_PAGE_TITLE,
    description: LANDING_PAGE_DESCRIPTION,
  });
}

export function homePageGraphJsonLd(faq: readonly FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [homePageJsonLd(), faqPageJsonLd(faq), venueItemListJsonLd()],
  };
}

/** Default graph for the home page and shared layout. */
export function defaultSiteGraphJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationJsonLd(),
      webSiteJsonLd(),
      webApplicationJsonLd(),
      videoGameJsonLd(),
    ],
  };
}
