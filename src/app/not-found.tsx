import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground">页面不存在，或该期节目已被移除。</p>
      <Button asChild>
        <Link href="/the-point">查看 The Point 档案</Link>
      </Button>
    </main>
  );
}