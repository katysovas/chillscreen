import type { Metadata } from 'next';
import {
  FAVICON_PATH,
  LOGO_PATH,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_URL,
  TWITTER_HANDLE,
} from '@/lib/site';

type PageMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = '/',
  noIndex = false,
}: PageMetadataOptions = {}): Metadata {
  const canonical = path.startsWith('/') ? path : `/${path}`;
  const pageTitle = title ?? SITE_NAME;
  const fullTitle = title && title !== SITE_NAME ? `${title} | ${SITE_NAME}` : SITE_NAME;

  return {
    metadataBase: new URL(SITE_URL),
    title: title ? { absolute: fullTitle } : { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
    description,
    keywords: SITE_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: 'games',
    appleWebApp: {
      capable: true,
      title: SITE_NAME,
      statusBarStyle: 'black-translucent',
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [{ url: FAVICON_PATH, type: 'image/png' }],
      shortcut: FAVICON_PATH,
      apple: FAVICON_PATH,
    },
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonical,
      siteName: SITE_NAME,
      title: pageTitle,
      description,
      images: [
        {
          url: `${SITE_URL}${LOGO_PATH}`,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} logo`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: pageTitle,
      description,
      images: [`${SITE_URL}${LOGO_PATH}`],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    other: {
      'theme-color': '#000000',
    },
  };
}

export const rootMetadata: Metadata = buildPageMetadata();
