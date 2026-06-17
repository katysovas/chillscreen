import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { allStageSeoEntries } from '@/lib/venueSeo';
import { getDb } from '@/lib/db';
import { listIndexableStageSlugs } from '@/lib/stages/db';
import { stagePathForSlug } from '@/lib/stages/runtime';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/stages`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/support`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const venuePages: MetadataRoute.Sitemap = allStageSeoEntries().map(stage => ({
    url: `${SITE_URL}${stage.path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  let creatorPages: MetadataRoute.Sitemap = [];
  if (getDb()) {
    try {
      const stages = await listIndexableStageSlugs();
      creatorPages = stages.map(stage => ({
        url: `${SITE_URL}${stagePathForSlug(stage.slug)}`,
        lastModified: new Date(stage.lastActiveAt),
        changeFrequency: 'daily',
        priority: 0.6,
      }));
    } catch {
      creatorPages = [];
    }
  }

  return [...staticPages, ...venuePages, ...creatorPages];
}
