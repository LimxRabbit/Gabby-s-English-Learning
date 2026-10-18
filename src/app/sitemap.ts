import { THE_POINT_EPISODES, THE_POINT_YEARS } from '@/lib/the-point';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: '/the-point', changeFrequency: 'weekly', priority: 1 },
    ...THE_POINT_YEARS.map((item) => ({
      url: `/the-point/${item.year}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];

  const episodeEntries: MetadataRoute.Sitemap = THE_POINT_EPISODES.map((episode) => ({
    url: `/the-point/${episode.year}/${episode.slug}`,
    lastModified: new Date(`${episode.date}T00:00:00Z`),
    changeFrequency: 'yearly' as const,
    priority: episode.hasSummary ? 0.6 : 0.3,
  }));

  return [...staticEntries, ...episodeEntries];
}