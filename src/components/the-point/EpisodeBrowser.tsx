'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ListMusic } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export interface EpisodeListItemView {
  slug: string;
  date: string;
  startTime: string;
  year: string;
  excerpt: string;
  tags: string[];
  hasVideo: boolean;
  hasSubtitle: boolean;
  isBilingual: boolean;
}

interface EpisodeBrowserProps {
  items: EpisodeListItemView[];
}

type SubtitleFilter = 'all' | 'bilingual' | 'any';

const SUBTITLE_FILTERS = [
  { key: 'all', label: '全部节目' },
  { key: 'bilingual', label: '中英双语字幕' },
  { key: 'any', label: '有字幕' },
] as const;

const PAGE_SIZE = 40;

export function EpisodeBrowser({ items }: EpisodeBrowserProps) {
  const [keyword, setKeyword] = useState('');
  const [tag, setTag] = useState<string>('全部');
  const [subFilter, setSubFilter] = useState<SubtitleFilter>('all');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const tags = useMemo(() => {
    const counter = new Map<string, number>();
    for (const item of items) {
      for (const value of item.tags) counter.set(value, (counter.get(value) ?? 0) + 1);
    }
    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([value]) => value);
  }, [items]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return items.filter((item) => {
      if (tag !== '全部' && !item.tags.includes(tag)) return false;
      if (subFilter === 'bilingual' && !item.isBilingual) return false;
      if (subFilter === 'any' && !item.hasSubtitle) return false;
      if (!q) return true;
      return `${item.date} ${item.excerpt} ${item.tags.join(' ')}`.toLowerCase().includes(q);
    });
  }, [items, keyword, tag, subFilter]);

  const visible = filtered.slice(0, limit);

  const reset = () => setLimit(PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Input
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            reset();
          }}
          placeholder="搜索摘要内容、日期或标签…"
          type="search"
        />
        <div className="flex flex-wrap gap-2">
          {['全部', ...tags].map((value) => (
            <Badge
              key={value}
              variant={tag === value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setTag(value);
                reset();
              }}
            >
              {value}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SUBTITLE_FILTERS.map((option) => (
            <Badge
              key={option.key}
              variant={subFilter === option.key ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setSubFilter(option.key);
                reset();
              }}
            >
              <ListMusic className="mr-1 size-3" />
              {option.label}
              {option.key !== 'all' && (
                <span className="ml-1 opacity-70">
                  {items.filter((i) =>
                    option.key === 'bilingual' ? i.isBilingual : i.hasSubtitle,
                  ).length}
                </span>
              )}
            </Badge>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          共 {filtered.length} 集{items.length !== filtered.length ? `（已从 ${items.length} 集中筛选）` : ''}
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">没有匹配的节目，换个条件试试。</p>
      ) : (
        <ul className="grid gap-3">
          {visible.map((item) => (
            <li key={item.slug}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
                  <div className="flex shrink-0 flex-col sm:w-40">
                    <time className="font-mono text-sm font-medium" dateTime={item.date}>
                      {item.date}
                    </time>
                    <span className="text-muted-foreground font-mono text-xs">{item.startTime}</span>
                    {item.isBilingual && (
                      <Badge variant="default" className="mt-1 w-fit text-xs">
                        <ListMusic className="size-3" />
                        双语字幕
                      </Badge>
                    )}
                    {!item.hasVideo && (
                      <span className="text-muted-foreground text-xs">无可用回放</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    {item.excerpt ? (
                      <p className="line-clamp-2 text-sm leading-relaxed">{item.excerpt}</p>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">本期暂无摘要。</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {item.hasSubtitle && !item.isBilingual && (
                        <Badge variant="outline" className="text-xs">
                          英文字幕
                        </Badge>
                      )}
                      {item.tags.map((value) => (
                        <Badge key={value} variant="secondary" className="text-xs">
                          {value}
                        </Badge>
                      ))}
                      <Link
                        href={`/the-point/${item.year}/${item.slug}`}
                        className="text-primary ml-auto text-sm underline underline-offset-4"
                      >
                        查看详情
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {visible.length < filtered.length && (
        <div className="flex justify-center">
          <button
            type="button"
            className="text-primary text-sm underline underline-offset-4"
            onClick={() => setLimit((value) => value + PAGE_SIZE)}
          >
            加载更多（剩余 {filtered.length - visible.length} 集）
          </button>
        </div>
      )}
    </div>
  );
}