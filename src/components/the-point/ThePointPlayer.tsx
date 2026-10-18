'use client';

import { useEffect, useRef, useState } from 'react';

interface ThePointPlayerProps {
  src: string;
  poster?: string;
  title: string;
}

type PlayerStatus = 'idle' | 'loading' | 'ready' | 'error';

export function ThePointPlayer({ src, poster, title }: ThePointPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [isNative, setIsNative] = useState(true);

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
    if (isNative && status === 'idle') {
      setStatus('loading');
    }
  }, [isNative, status]);

  return (
    <div className="space-y-2">
      <video
        ref={videoRef}
        className="aspect-video w-full rounded-xl bg-black"
        controls
        playsInline
        preload="metadata"
        poster={poster}
        title={title}
        src={isNative ? src : undefined}
        onCanPlay={() => setStatus('ready')}
        onError={() => setStatus('error')}
      />
      <p className="text-muted-foreground min-h-5 text-xs">
        {status === 'ready'
          ? ''
          : status === 'loading'
            ? '正在加载视频…'
            : status === 'error'
              ? '视频加载失败，视频源可能已失效。可尝试在 CGTN 官网搜索本期节目。'
              : ''}
      </p>
    </div>
  );
}