import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { THE_POINT_STATS, THE_POINT_YEARS, formatDateCN, getLatestEpisodes } from '@/lib/the-point';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Point with Liu Xin 节目档案',
  description:
    'CGTN《The Point with Liu Xin》2020 年至今全部节目单与中文摘要归档，支持按年份浏览、关键词搜索与在线回放。',
  keywords: ['The Point with Liu Xin', '刘欣', 'CGTN', '节目单', '时事评论'],
};

const STAT_CARDS = [
  { label: '节目总数', value: THE_POINT_STATS.total },
  { label: '收录年份', value: THE_POINT_YEARS.length },
  { label: '可回放', value: THE_POINT_STATS.withVideo },
  { label: '含摘要', value: THE_POINT_STATS.withSummary },
] as const;

export default function ThePointIndexPage() {
  const latest = getLatestEpisodes(8);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10 sm:px-6">
      <header className="space-y-4">
        <p className="text-muted-foreground text-sm">CGTN · 深度访谈栏目</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">The Point with Liu Xin</h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          完整收录 {THE_POINT_STATS.firstDate} 至 {THE_POINT_STATS.lastDate} 共 {THE_POINT_STATS.total}{' '}
          期节目。选择年份浏览全部节目，或在年度页面内搜索摘要关键词。
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_CARDS.map((item) => (
          <Card key={item.label}>
            <CardContent className="space-y-1">
              <p className="text-muted-foreground text-xs">{item.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">按年份浏览</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THE_POINT_YEARS.map((item) => (
            <Link key={item.year} href={`/the-point/${item.year}`} className="group">
              <Card className="h-full transition-colors group-hover:bg-accent/50">
                <CardHeader>
                  <CardTitle className="flex items-baseline justify-between">
                    <span className="text-2xl tabular-nums">{item.year}</span>
                    <span className="text-muted-foreground text-sm font-normal tabular-nums">
                      {item.count} 期
                    </span>
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">最新更新</h2>
        <ul className="divide-border divide-y rounded-lg border">
          {latest.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/the-point/${item.year}/${item.slug}`}
                className="hover:bg-accent/50 flex flex-col gap-1 px-4 py-3 transition-colors"
              >
                <span className="text-sm font-medium">
                  {formatDateCN(item.date)}
                  <span className="text-muted-foreground ml-2 font-mono text-xs">{item.startTime}</span>
                </span>
                <span className="text-muted-foreground line-clamp-1 text-sm">
                  {item.summary || '本期暂无摘要。'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}