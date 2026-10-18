import {
  THE_POINT_EPISODES,
  THE_POINT_STATS,
  THE_POINT_YEARS,
  type ThePointEpisode,
} from '@/generated/the-point-data';

export type { ThePointEpisode };

export { THE_POINT_EPISODES, THE_POINT_STATS, THE_POINT_YEARS };

export const EPISODE_BY_SLUG: ReadonlyMap<string, ThePointEpisode> = new Map(
  THE_POINT_EPISODES.map((episode) => [episode.slug, episode]),
);

export const YEARS: readonly string[] = THE_POINT_YEARS.map((item) => item.year);

const EPISODES_BY_YEAR: ReadonlyMap<string, ThePointEpisode[]> = (() => {
  const map = new Map<string, ThePointEpisode[]>();
  for (const episode of THE_POINT_EPISODES) {
    const bucket = map.get(episode.year);
    if (bucket) {
      bucket.push(episode);
    } else {
      map.set(episode.year, [episode]);
    }
  }
  return map;
})();

export function getEpisodesByYear(year: string): ThePointEpisode[] {
  return EPISODES_BY_YEAR.get(year) ?? [];
}

export function getEpisodeBySlug(slug: string): ThePointEpisode | undefined {
  return EPISODE_BY_SLUG.get(slug);
}

export function getLatestEpisodes(limit: number): ThePointEpisode[] {
  return THE_POINT_EPISODES.slice(Math.max(0, THE_POINT_EPISODES.length - limit)).reverse();
}

export function formatDateCN(date: string): string {
  const [year, month, day] = date.split('-');
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;

export function getWeekday(date: string): string {
  const ms = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(ms)) return '';
  return WEEKDAYS[new Date(ms).getUTCDay()] ?? '';
}

export interface EpisodeListItem {
  slug: string;
  date: string;
  startTime: string;
  year: string;
  excerpt: string;
  tags: string[];
  hasVideo: boolean;
}

export function toListItem(episode: ThePointEpisode, excerptLength = 90): EpisodeListItem {
  return {
    slug: episode.slug,
    date: episode.date,
    startTime: episode.startTime,
    year: episode.year,
    excerpt:
      episode.summary.length > excerptLength ? `${episode.summary.slice(0, excerptLength)}…` : episode.summary,
    tags: episode.tags,
    hasVideo: episode.hasVideo,
  };
}