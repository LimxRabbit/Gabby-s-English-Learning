'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ThePointSubtitleCue } from '@/lib/the-point';
import { ListMusic, Video } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ThePointPlayerProps {
  src: string;
  title: string;
  cues?: ThePointSubtitleCue[];
  bilingual?: boolean;
}

type Mode = 'audio' | 'video';
type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

function formatClock(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ThePointPlayer({ src, title, cues = [], bilingual = false }: ThePointPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const [mode, setMode] = useState<Mode>('audio');
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [isNative, setIsNative] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showZh, setShowZh] = useState(true);

  const hasSubtitles = cues.length > 0;
  const hasBilingual = hasSubtitles && bilingual;
  const needsZhOnly = hasSubtitles && !bilingual;

  const activeIndex = useMemo(() => {
    if (cues.length === 0) return -1;
    let lo = 0;
    let hi = cues.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (currentTime >= cues[mid].s) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return found;
  }, [cues, currentTime]);

  useEffect(() => {
    if (status !== 'idle') return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let destroy: (() => void) | null = null;

    const setup = async (): Promise<void> => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        setIsNative(true);
        return;
      }
      setIsNative(false);
      setStatus('loading');
      try {
        const { default: Hls } = await import('hls.js');
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setStatus('error');
          return;
        }
        const instance = new Hls({ enableWorker: true, lowLatencyMode: true });
        destroy = () => instance.destroy();
        instance.loadSource(src);
        instance.attachMedia(video);
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    void setup();
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [src, status]);

  useEffect(() => {
    if (isNative && status === 'idle') setStatus('loading');
  }, [isNative, status]);

  // 播放时自动把当前句滚动到视野中央
  useEffect(() => {
    if (!playing || activeIndex < 0) return;
    const node = listRef.current?.children[activeIndex];
    node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeIndex, playing]);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => setStatus('error'));
    } else {
      video.pause();
    }
  }, []);

  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
  }, []);

  const activeCue = activeIndex >= 0 ? cues[activeIndex] : undefined;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="border-primary/30 bg-primary/10 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
        <ListMusic className="text-primary size-4 shrink-0" />
        {hasBilingual ? (
          <>
            <span className="font-medium">中英双语字幕</span>
            <span className="text-muted-foreground text-xs">
              {cues.length} 句 · 随播放自动滚动
            </span>
            <Badge
              variant={showZh ? 'default' : 'outline'}
              className="ml-auto cursor-pointer"
              onClick={() => setShowZh((v) => !v)}
            >
              中文 {showZh ? '开' : '关'}
            </Badge>
          </>
        ) : needsZhOnly ? (
          <>
            <span className="font-medium">英文字幕</span>
            <Badge variant="outline" className="text-xs">
              中文翻译制作中
            </Badge>
            <span className="text-muted-foreground ml-auto text-xs">{cues.length} 句 · 随播放自动滚动</span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground font-medium">本期暂无字幕</span>
            <span className="text-muted-foreground ml-auto text-xs">字幕正在整理中</span>
          </>
        )}
      </div>

      <div className="space-y-3">
        <video
          ref={videoRef}
          className={mode === 'video' ? 'aspect-video w-full rounded-xl bg-black' : 'hidden'}
          controls={mode === 'video'}
          playsInline
          preload="metadata"
          title={title}
          src={isNative ? src : undefined}
          onCanPlay={() => setStatus('ready')}
          onError={() => setStatus('error')}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime * 1000)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration * 1000)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        {mode === 'audio' && (
          <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
            <Button size="lg" className="shrink-0 rounded-full" onClick={toggle} disabled={status === 'error'}>
              {playing ? '暂停' : '播放'}
            </Button>
            <div className="min-w-0 flex-1">
              <div className="text-muted-foreground mb-1 font-mono text-xs tabular-nums">
                {formatClock(currentTime)} / {formatClock(duration || 0)}
              </div>
              <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
                <div className="bg-primary h-full transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => seekBy(-15)}>
                  −15s
                </Button>
                <Button size="sm" variant="ghost" onClick={() => seekBy(15)}>
                  +15s
                </Button>
                <Button size="sm" variant="ghost" onClick={() => seekBy(-60)}>
                  −1m
                </Button>
                <Button size="sm" variant="ghost" onClick={() => seekBy(60)}>
                  +1m
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => setMode('video')}
              title="切换到视频模式"
            >
              <Video className="size-4" />
              看画面
            </Button>
          </div>
        )}

        {mode === 'video' && (
          <Button size="sm" variant="outline" className="self-start" onClick={() => setMode('audio')}>
            <ListMusic className="size-4" />
            回到纯音频模式
          </Button>
        )}

        <p className="text-muted-foreground min-h-5 text-xs">
          {status === 'ready' || status === 'idle'
            ? ''
            : status === 'loading'
              ? '正在加载音频…'
              : '音频加载失败，源可能已失效。可尝试在 CGTN 官网搜索本期节目。'}
        </p>
      </div>

      {hasBilingual || needsZhOnly ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            逐句字幕
            {activeCue && (
              <span className="text-muted-foreground ml-2 font-mono text-xs font-normal">
                第 {activeIndex + 1} / {cues.length} 句
              </span>
            )}
          </h2>
          <ol ref={listRef} className="max-h-96 space-y-1 overflow-y-auto pr-1">
            {cues.map((cue, index) => {
              const isActive = index === activeIndex;
              const isPast = index < activeIndex;
              return (
                <li key={`${cue.s}-${index}`}>
                  <button
                    type="button"
                    onClick={() => {
                      const video = videoRef.current;
                      if (video) video.currentTime = cue.s / 1000;
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/15'
                        : isPast
                          ? 'border-transparent opacity-45 hover:opacity-80'
                          : 'border-transparent hover:bg-accent/60'
                    }`}
                  >
                    <span className="text-muted-foreground mr-2 font-mono text-xs tabular-nums">
                      {formatClock(cue.s)}
                    </span>
                    {cue.en && <span className="block text-sm leading-relaxed">{cue.en}</span>}
                    {showZh && cue.zh && (
                      <span className="text-primary/90 mt-0.5 block text-sm leading-relaxed">{cue.zh}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <section className="bg-muted/40 flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
          <ListMusic className="text-muted-foreground size-6" />
          <p className="text-sm font-medium">本期字幕暂未收录</p>
          <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
            节目音频可正常播放。字幕需要先转写并翻译，整理完成后会自动出现在这里。
          </p>
        </section>
      )}
    </div>
  );
}