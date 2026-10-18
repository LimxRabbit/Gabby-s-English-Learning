/**
 * 归一化 data/the-point-*.json -> src/generated/the-point-data.ts
 * 与主项目的 scripts/build-the-point-data.ts 保持同一套逻辑。
 *
 * 数据目录按顺序探测：
 *   1. THE_POINT_DATA_DIR 环境变量
 *   2. ./data（站点自带数据目录，与 CI 一致）
 *   3. ../data（主项目的数据目录，本地开发时的后备）
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const YEARS = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'] as const;

const siteRoot = process.cwd();

const CANDIDATE_DIRS = [
  process.env.THE_POINT_DATA_DIR,
  path.resolve(siteRoot, 'data'),
  path.resolve(siteRoot, '..', 'data'),
].filter((dir): dir is string => typeof dir === 'string' && dir.length > 0);

const DATA_DIR = CANDIDATE_DIRS.find((dir) => existsSync(path.join(dir, 'the-point-2026.json')));

if (!DATA_DIR) {
  if (existsSync(OUT_FILE)) {
    console.warn('未找到原始数据目录，跳过生成（使用已存在的 src/generated/the-point-data.ts）。');
    process.exit(0);
  }
  console.error(
    `找不到数据目录。请设置 THE_POINT_DATA_DIR 环境变量，或确保以下任一路径存在 the-point-2026.json：\n${CANDIDATE_DIRS.join('\n')}`,
  );
  process.exit(1);
}

const OUT_FILE = path.resolve(siteRoot, 'src', 'generated', 'the-point-data.ts');

interface RawProgram {
  date?: string;
  startTime?: string;
  endTime?: string;
  name?: string;
  epgId?: string | number;
  summary?: string;
  videoUrl?: string;
  videoUnavailable?: boolean;
  tags?: string[];
  startTimestamp?: number;
  endTimestamp?: number;
  apiUrl?: string;
}

interface RawFile {
  months?: { month?: string; programs?: RawProgram[] }[];
  programs?: RawProgram[];
}

interface NormalizedEpisode {
  slug: string;
  date: string;
  year: string;
  month: string;
  startTime: string;
  endTime: string;
  epgId: string;
  summary: string;
  tags: string[];
  videoUrl: string;
  playbackUrl: string;
  hasVideo: boolean;
  hasSummary: boolean;
  durationMinutes: number;
  id: string;
}

function readRaw(year: string): RawProgram[] {
  const file = path.join(DATA_DIR!, `the-point-${year}.json`);
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as RawFile;
  if (Array.isArray(parsed.months)) {
    return parsed.months.flatMap((m) => m.programs ?? []);
  }
  return parsed.programs ?? [];
}

function clean(value: string | undefined): string {
  if (!value) return '';
  return value
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .trim();
}

function normalizeTime(value: string | undefined, fallback: number): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(clean(value));
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  if (Number.isFinite(fallback)) {
    const d = new Date(fallback);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }
  return '00:00';
}

function buildPlaybackUrl(epgId: string, date: string, startTime: string): string {
  const start = new Date(`${date}T${startTime}:00Z`).getTime();
  const end = start + 30 * 60 * 1000;
  return `https://api.cgtn.com/website/api/live/channel/epg/playback?channelId=1&epgId=${encodeURIComponent(
    epgId,
  )}&startTime=${start}&endTime=${end}`;
}

function shortHash(input: string): string {
  return createHash('sha1').update(input).digest('hex').slice(0, 10);
}

function normalize(raw: RawProgram, seen: Set<string>): NormalizedEpisode | null {
  const date = clean(raw.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const epgId = raw.epgId === undefined ? '' : String(raw.epgId).trim();
  const dedupeKey = `${date}|${clean(raw.startTime)}|${epgId}`;
  if (seen.has(dedupeKey)) return null;
  seen.add(dedupeKey);

  const startTime = normalizeTime(raw.startTime, raw.startTimestamp ?? Number.NaN);
  const endTime = normalizeTime(raw.endTime, raw.endTimestamp ?? Number.NaN);
  const summary = clean(raw.summary);
  const tags = Array.isArray(raw.tags) ? [...new Set(raw.tags.map((t) => clean(t)).filter(Boolean))] : [];
  const videoUrl = raw.videoUnavailable === true ? '' : clean(raw.videoUrl);

  const startMs = Date.parse(`${date}T${startTime}:00Z`);
  const endMs = Date.parse(`${date}T${endTime}:00Z`);
  const durationMinutes =
    Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
      ? Math.round((endMs - startMs) / 60000)
      : 30;

  const id = shortHash(dedupeKey);

  return {
    slug: `${date}-${id}`,
    date,
    year: date.slice(0, 4),
    month: date.slice(0, 7),
    startTime,
    endTime,
    epgId,
    summary,
    tags,
    videoUrl,
    playbackUrl: buildPlaybackUrl(epgId, date, startTime),
    hasVideo: videoUrl.length > 0,
    hasSummary: summary.length > 0,
    durationMinutes,
    id,
  };
}

function main(): void {
  const seen = new Set<string>();
  const episodes: NormalizedEpisode[] = [];

  for (const year of YEARS) {
    const raw = readRaw(year);
    let added = 0;
    for (const item of raw) {
      const normalized = normalize(item, seen);
      if (normalized) {
        episodes.push(normalized);
        added += 1;
      }
    }
    console.log(`${year}: 原始 ${raw.length} → ${added}`);
  }

  episodes.sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date),
  );

  const stats = {
    total: episodes.length,
    firstDate: episodes[0]?.date ?? '',
    lastDate: episodes[episodes.length - 1]?.date ?? '',
    withVideo: episodes.filter((e) => e.hasVideo).length,
    withSummary: episodes.filter((e) => e.hasSummary).length,
  };

  const byYear = YEARS.map((year) => ({
    year,
    count: episodes.filter((e) => e.year === year).length,
  })).filter((y) => y.count > 0);

  const body = `// 此文件由 scripts/build-data.ts 自动生成，请勿手动修改。
export interface ThePointEpisode {
  slug: string;
  date: string;
  year: string;
  month: string;
  startTime: string;
  endTime: string;
  epgId: string;
  summary: string;
  tags: string[];
  videoUrl: string;
  playbackUrl: string;
  hasVideo: boolean;
  hasSummary: boolean;
  durationMinutes: number;
  id: string;
}

export const THE_POINT_STATS = ${JSON.stringify(stats, null, 2)} as const;

export const THE_POINT_YEARS = ${JSON.stringify(byYear, null, 2)} as const;

export const THE_POINT_EPISODES: ThePointEpisode[] = ${JSON.stringify(episodes)};
`;

  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, body, 'utf8');

  console.log(
    `\n共 ${stats.total} 集（${stats.firstDate} ~ ${stats.lastDate}），视频 ${stats.withVideo}，摘要 ${stats.withSummary}`,
  );
  console.log(`数据源: ${DATA_DIR}`);
  console.log(`输出: ${path.relative(siteRoot, OUT_FILE)}`);
}

main();