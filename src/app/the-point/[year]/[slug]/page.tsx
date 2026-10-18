import { ThePointPlayer } from '@/components/the-point/ThePointPlayer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  YEARS,
  formatDateCN,
  getEpisodeBySlug,
  getEpisodesByYear,
  getWeekday,
} from '@/lib/the-point';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams(): { year: string; slug: string }[] {
  return YEARS.flatMap((year) =>
    getEpisodesByYear(year).map((episode) => ({ year, slug: episode.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);
  if (!episode) {
    return { title: '未找到该期节目' };
  }
  const description =
    episode.summary.slice(0, 150) || `${formatDateCN(episode.date)} 的《The Point with Liu Xin》节目回放。`;
  return {
    title: `${formatDateCN(episode.date)} ${episode.startTime}`,
    description,
    openGraph: {
      title: `${formatDateCN(episode.date)} · The Point with Liu Xin`,
      description,
      type: 'video.other',
      locale: 'zh_CN',
    },
  };
}

export default async function ThePointEpisodePage({
  params,
}: {
  params: Promise<{ year: string; slug: string }>;
}) {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);
  if (!episode) {
    notFound();
  }

  const siblings = getEpisodesByYear(episode.year);
  const index = siblings.findIndex((item) => item.slug === episode.slug);
  const prev = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: `The Point with Liu Xin ${formatDateCN(episode.date)}`,
    description: episode.summary || `${formatDateCN(episode.date)} 的《The Point with Liu Xin》节目。`,
    uploadDate: `${episode.date}T${episode.startTime}:00+08:00`,
    duration: `PT${Math.max(1, episode.durationMinutes)}M`,
    ...(episode.hasVideo ? { contentUrl: episode.videoUrl } : {}),
    inLanguage: 'zh-CN',
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-muted-foreground mb-4 text-sm">
        <Link href="/the-point" className="hover:text-foreground underline underline-offset-4">
          The Point
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/the-point/${episode.year}`} className="hover:text-foreground underline underline-offset-4">
          {episode.year} 年
        </Link>
        <span className="mx-2">/</span>
        <span>{episode.date}</span>
      </nav>

      <article className="space-y-6">
        <header className="space-y-3">
          <p className="text-muted-foreground text-sm">The Point with Liu Xin</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {formatDateCN(episode.date)}
            <span className="text-muted-foreground ml-3 font-mono text-lg font-normal">
              {episode.startTime} – {episode.endTime}
            </span>
          </h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span>{getWeekday(episode.date)}</span>
            <span>{episode.durationMinutes} 分钟</span>
            {episode.epgId && <span className="font-mono text-xs">EPG {episode.epgId}</span>}
            {episode.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </header>

        {episode.hasVideo ? (
          <ThePointPlayer src={episode.videoUrl} title={`The Point ${episode.date}`} />
        ) : (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center text-sm">
              本期暂无官方回放视频。
            </CardContent>
          </Card>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">本期摘要</h2>
          {episode.summary ? (
            <p className="leading-loose">{episode.summary}</p>
          ) : (
            <p className="text-muted-foreground italic">本期暂无摘要数据。</p>
          )}
        </section>

        {episode.hasVideo && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">视频无法播放？</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              回放地址来自 CGTN 官方存档，部分老旧节目链接可能已过期。可在 CGTN 官网搜索
              <span className="mx-1 font-medium">The Point</span>
              定位本期节目，或使用下方回放接口地址手动获取。
            </p>
            <a
              href={episode.playbackUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary inline-block text-sm underline underline-offset-4"
            >
              打开 CGTN 回放接口
            </a>
          </section>
        )}

        <nav className="grid gap-3 border-t pt-6 sm:grid-cols-2">
          {prev ? (
            <Link href={`/the-point/${prev.year}/${prev.slug}`} className="group">
              <p className="text-muted-foreground text-xs">上一期</p>
              <p className="group-hover:underline group-hover:underline-offset-4">
                {prev.date} {prev.startTime}
              </p>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/the-point/${next.year}/${next.slug}`} className="group sm:text-right">
              <p className="text-muted-foreground text-xs">下一期</p>
              <p className="group-hover:underline group-hover:underline-offset-4">
                {next.date} {next.startTime}
              </p>
            </Link>
          )}
        </nav>

        <div className="flex justify-center border-t pt-6">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/the-point/${episode.year}`}>返回 {episode.year} 年列表</Link>
          </Button>
        </div>
      </article>
    </main>
  );
}