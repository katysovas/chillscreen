import {
  CONTACT,
  LOGO_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from '@/lib/site';

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
      'Walk through festival cities',
      'Watch synchronized live stages',
      'Chat with NPCs',
      'Multiplayer presence',
    ],
    screenshot: absoluteUrl(LOGO_PATH),
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
