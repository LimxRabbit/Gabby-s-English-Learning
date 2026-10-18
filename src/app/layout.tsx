import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
const siteUrl = rawBaseUrl && /^https?:\/\//.test(rawBaseUrl) ? rawBaseUrl : undefined;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: 'The Point with Liu Xin 节目档案',
    template: '%s | The Point with Liu Xin',
  },
  description:
    'CGTN《The Point with Liu Xin》2020 年至今全部节目单与中文摘要归档，支持按年份浏览、关键词搜索与在线回放。',
  keywords: ['The Point with Liu Xin', '刘欣', 'CGTN', '节目单', '时事评论'],
  ...(siteUrl ? { alternates: { canonical: '/' } } : {}),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'The Point with Liu Xin',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <header className="border-border/60 bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
            <span className="text-sm font-semibold tracking-tight">The Point with Liu Xin</span>
            <nav className="text-muted-foreground flex items-center gap-4 text-sm">
              <Link href="/the-point" className="transition-colors hover:text-foreground">
                档案
              </Link>
              <a
                href="https://www.cgtn.com/europe"
                target="_blank"
                rel="noreferrer noopener"
                className="transition-colors hover:text-foreground"
              >
                CGTN
              </a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="text-muted-foreground mt-auto border-t py-6 text-center text-xs">
          节目摘要与回放均来自 CGTN 官方节目单，仅供个人学习与检索使用。
        </footer>
      </body>
    </html>
  );
}