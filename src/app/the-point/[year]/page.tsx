import { EpisodeBrowser } from '@/components/the-point/EpisodeBrowser';
import { YEARS, getEpisodesByYear, toListItem } from '@/lib/the-point';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams(): { year: string }[] {
  return YEARS.map((year) => ({ year }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  const episodes = getEpisodesByYear(year);
  if (episodes.length === 0) {
    return { title: `${year} 年` };
  }
  return {
    title: `${year} 年节目列表`,
    description: `《The Point with Liu Xin》${year} 年共 ${episodes.length} 期节目摘要与回放，涵盖 ${episodes[0].date} 至 ${episodes[episodes.length - 1].date}。`,
  };
}

export default async function ThePointYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const episodes = getEpisodesByYear(year);
  if (episodes.length === 0) {
    notFound();
  }

  const items = episodes.map((episode) => toListItem(episode));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <nav className="text-muted-foreground mb-4 text-sm">
        <Link href="/the-point" className="hover:text-foreground underline underline-offset-4">
          The Point
        </Link>
        <span className="mx-2">/</span>
        <span>{year}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{year} 年节目</h1>
        <p className="text-muted-foreground text-sm">
          共 {episodes.length} 期 · {episodes[0].date} 至 {episodes[episodes.length - 1].date} · 支持关键词与标签筛选
        </p>
      </header>

      <div className="mt-8">
        <EpisodeBrowser items={items} />
      </div>
    </main>
  );
}