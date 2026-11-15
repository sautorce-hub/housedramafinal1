import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { spawn } from 'node:child_process';
import express, { type Request, type Response } from 'express';
import compression from 'compression';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import {
  createCommentInDb,
  deleteWatchHistoryInDb,
  ensureDatabaseReady,
  filterCatalogFromDb,
  getDramaStatsFromDb,
  getSiteVisitorStatsFromDb,
  getTopDailyStatsFromDb,
  getTrendingStatsMapFromDb,
  getUserFromDb,
  listCatalogForSitemapFromDb,
  listCommentsFromDb,
  listFavoritesFromDb,
  listLikesFromDb,
  listMoviesForSitemapFromDb,
  listUserCommentsFromDb,
  listWatchHistoryFromDb,
  pingDb,
  recordVideoViewInDb,
  recordVisitorHeartbeatInDb,
  resolveDramaBySlugFromDb,
  syncUserInDb,
  toggleFavoriteInDb,
  toggleLikeInDb,
  updateCatalogEpisodeCountIfHigherInDb,
  updateFavoriteFolderInDb,
  updateUserProfileInDb,
  upsertWatchHistoryInDb,
} from './server/db.ts';
import {
  attachLiveBadgesToItems,
  type CachedDramaItem,
  findDramaBySlugInHomeCache,
  getCachedDramasForSitemap,
  getCachedHomeData,
  getCachedMolaApiResponse,
  getHomeCacheStatus,
  isCacheableMolaListPath,
  markApiRevalidating,
  seedCatalogFromExistingCacheIfEmpty,
  setCachedMolaApiResponse,
  startHomeCacheWorker,
  triggerAsyncHomeRevalidate,
} from './server/homeCache.ts';
import {
  getGoogleIndexingStatus,
  notifyCatalogAdditionsToGoogle,
  notifyGoogleIndexingUrls,
} from './server/googleIndexing.ts';
import {
  fetchAndRewriteLk21M3u8,
  fetchLk21Segment,
  getLk21Category,
  getLk21Detail,
  getLk21Episodes,
  getLk21Home,
  getLk21Latest,
  getLk21Menu,
  getLk21Search,
  getLk21Stream,
  startLk21Prewarm,
  type Lk21DetailPayload,
  type Lk21EpisodePayloadItem,
} from './server/lk21Service.ts';
import {
  CURATED_PROGRAMMATIC_PAGES,
  type ProgrammaticLandingConfig,
  resolveProgrammaticLanding,
} from './src/utils/programmaticSeo.ts';

function resolvePort(): number {
  const portFlagIndex = process.argv.indexOf('--port');
  if (portFlagIndex !== -1 && process.argv[portFlagIndex + 1]) {
    const cliPort = Number(process.argv[portFlagIndex + 1]);
    if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
  }
  const envPort = Number(process.env.PORT);
  return Number.isFinite(envPort) && envPort > 0 ? envPort : 3000;
}

const PORT = resolvePort();
const IS_PROD = process.env.NODE_ENV === 'production';
const MOLATV_API_BASE = 'https://api.molatv.id/api';
const DRAMABOX_BASE_URL = `${MOLATV_API_BASE}/dramaboxv2`;
const NETSHORT_BASE_URL = `${MOLATV_API_BASE}/netshort`;
const ANYREEL_BASE_URL = `${MOLATV_API_BASE}/anyreel`;
const MELOLO_BASE_URL = `${MOLATV_API_BASE}/melolo`;
const DEFAULT_OG_IMAGE_PATH = '/assets/aistudio/gambar_OG_39d1f12c.png';

function getMolaToken(): string {
  return (process.env.MOLA_API_TOKEN || '').trim();
}

type SsrProviderName =
  | 'DramaBox'
  | 'NetShort'
  | 'AnyReel'
  | 'Melolo'
  | 'DramaOra'
  | 'MeloShort'
  | 'PetaDrama'
  | 'RadReels'
  | 'DramaVerse'
  | 'KalosTV'
  | 'StardustTV'
  | 'StarShort'
  | 'DramaBite'
  | 'LoveShots'
  | 'MyDrama'
  | 'ShotShort'
  | 'MoboReels'
  | 'BlinkDrama'
  | 'WeTV'
  | 'CubeTV'
  | 'MicroDrama'
  | 'FlareFlow'
  | 'FunDrama'
  | 'FreeShort'
  | 'ToonShort'
  | 'HappyShort'
  | 'DramaDash'
  | 'StoryReel'
  | 'StoryReelV2'
  | 'VibeShort'
  | 'VibeShortV2'
  | 'FlickReels'
  | 'DramaWave'
  | 'FreeReels'
  | 'PineDrama'
  | 'ShortMax'
  | 'ShortMaxV2'
  | 'FlexTV'
  | 'Vigloo'
  | 'DotDrama'
  | 'iDrama'
  | 'iDramaV2'
  | 'GoodShort'
  | 'ReelShort'
  | 'ReelShortV2'
  | 'JoyReels'
  | 'SodaReels'
  | 'BonusTV'
  | 'iQIYI';

interface SsrDrama {
  bookId: string;
  title: string;
  slug?: string;
  cover: string;
  description: string;
  chapterCount: number;
  tags: string[];
  playCount?: string;
  protagonist?: string;
  isVip: boolean;
  provider: SsrProviderName;
}

interface SsrEpisode {
  chapterId: string;
  episodeNumber: number;
  title: string;
  isVipLocked: boolean;
}

const ssrCache = new Map<
  string,
  { expiresAt: number; drama: SsrDrama | null; episodes: SsrEpisode[] }
>();

// In-memory fallback only if PostgreSQL is unreachable (starts strictly from 0)
const activeSessions = new Map<string, { visitorId: string; lastSeen: number }>();
let currentDayKey = new Date().toISOString().slice(0, 10);
let todayUniqueVisitors = 0;
let cumulativeVisitors = 0;
let cumulativeViews = 0;
const countedTodayVisitors = new Set<string>();
const countedAllTimeVisitors = new Set<string>();
const countedSessionViews = new Set<string>();

function cleanText(val: unknown, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (
    !trimmed ||
    trimmed === '<nil>' ||
    trimmed.toLowerCase() === 'null' ||
    trimmed.toLowerCase() === 'undefined'
  ) {
    return fallback;
  }
  return trimmed;
}

function escapeHtmlAttr(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'series';
}

function resolveOrigin(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const proto =
    (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ||
    req.protocol ||
    'http';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function toAbsoluteImageUrl(rawUrl: string, origin: string): string {
  const clean = (rawUrl || '').trim();
  if (!clean) return `${origin}${DEFAULT_OG_IMAGE_PATH}`;
  if (clean.startsWith('//')) return `https:${clean}`;
  if (clean.startsWith('https://') || clean.startsWith('http://')) return clean;
  if (clean.startsWith('/')) return `${origin}${clean}`;
  return `${origin}/${clean}`;
}

const heicCache = new Map<string, { buf: Buffer; expiresAt: number }>();

function convertHeicToWebp(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn('convert', ['heic:-', '-quality', '84', 'webp:-']);
    const chunks: Buffer[] = [];
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill('SIGKILL');
        reject(new Error('HEIC conversion timeout'));
      }
    }, 8000);

    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.on('error', (err) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      if (code === 0 && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`convert exited with code ${code}`));
      }
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}

function parseSsrProviderName(raw: string | undefined | null): SsrProviderName {
  const norm = (raw || '').trim().toLowerCase();
  const map: Record<string, SsrProviderName> = {
    dramabox: 'DramaBox',
    netshort: 'NetShort',
    anyreel: 'AnyReel',
    melolo: 'Melolo',
    dramaora: 'DramaOra',
    meloshort: 'MeloShort',
    petadrama: 'PetaDrama',
    radreels: 'RadReels',
    dramaverse: 'DramaVerse',
    kalostv: 'KalosTV',
    stardusttv: 'StardustTV',
    stardust: 'StardustTV',
    starshort: 'StarShort',
    dramabite: 'DramaBite',
    loveshots: 'LoveShots',
    mydrama: 'MyDrama',
    shotshort: 'ShotShort',
    moboreels: 'MoboReels',
    blinkdrama: 'BlinkDrama',
    wetv: 'WeTV',
    cubetv: 'CubeTV',
    microdrama: 'MicroDrama',
    flareflow: 'FlareFlow',
    fundrama: 'FunDrama',
    freeshort: 'FreeShort',
    toonshort: 'ToonShort',
    happyshort: 'HappyShort',
    dramadash: 'DramaDash',
    storyreel: 'StoryReel',
    storyreelv2: 'StoryReelV2',
    storyreel_v2: 'StoryReelV2',
    vibeshort: 'VibeShort',
    vibeshortv2: 'VibeShortV2',
    vibeshort_v2: 'VibeShortV2',
    flickreels: 'FlickReels',
    dramawave: 'DramaWave',
    freereels: 'FreeReels',
    pinedrama: 'PineDrama',
    shortmax: 'ShortMax',
    shortmaxv2: 'ShortMaxV2',
    shortmax_v2: 'ShortMaxV2',
    flextv: 'FlexTV',
    vigloo: 'Vigloo',
    dotdrama: 'DotDrama',
    idrama: 'iDrama',
    idramav2: 'iDramaV2',
    idrama_v2: 'iDramaV2',
    goodshort: 'GoodShort',
    reelshort: 'ReelShort',
    reelshortv2: 'ReelShortV2',
    reelshort_v2: 'ReelShortV2',
    joyreels: 'JoyReels',
    sodareels: 'SodaReels',
    bonustv: 'BonusTV',
    iqiyi: 'iQIYI',
  };
  return map[norm] ?? 'DramaBox';
}

function getProviderConfigForSsr(providerHint: SsrProviderName): {
  baseUrl: string;
  langParam: string | null;
  idParam: string;
  epPath?: string;
} {
  switch (providerHint) {
    case 'NetShort':
      return { baseUrl: NETSHORT_BASE_URL, langParam: 'en_US', idParam: 'book_id' };
    case 'AnyReel':
      return { baseUrl: ANYREEL_BASE_URL, langParam: 'en', idParam: 'book_id' };
    case 'Melolo':
      return { baseUrl: MELOLO_BASE_URL, langParam: 'en', idParam: 'book_id' };
    case 'DramaOra':
      return { baseUrl: `${MOLATV_API_BASE}/dramaora`, langParam: 'en-us', idParam: 'vid' };
    case 'MeloShort':
      return { baseUrl: `${MOLATV_API_BASE}/meloshort`, langParam: 'en', idParam: 'book_id' };
    case 'PetaDrama':
      return { baseUrl: `${MOLATV_API_BASE}/petadrama`, langParam: null, idParam: 'id' };
    case 'RadReels':
      return { baseUrl: `${MOLATV_API_BASE}/radreels`, langParam: '3', idParam: 'book_id' };
    case 'DramaVerse':
      return { baseUrl: `${MOLATV_API_BASE}/dramaverse`, langParam: 'en', idParam: 'book_id' };
    case 'KalosTV':
      return { baseUrl: `${MOLATV_API_BASE}/kalostv`, langParam: 'en', idParam: 'book_id' };
    case 'StardustTV':
      return { baseUrl: `${MOLATV_API_BASE}/stardust`, langParam: 'en_US', idParam: 'book_id' };
    case 'StarShort':
      return { baseUrl: `${MOLATV_API_BASE}/starshort`, langParam: '1', idParam: 'bookId' };
    case 'DramaBite':
      return { baseUrl: `${MOLATV_API_BASE}/dramabite`, langParam: 'en', idParam: 'book_id' };
    case 'LoveShots':
      return { baseUrl: `${MOLATV_API_BASE}/loveshots`, langParam: 'en', idParam: 'drama_id' };
    case 'MyDrama':
      return { baseUrl: `${MOLATV_API_BASE}/mydrama`, langParam: 'en', idParam: 'book_id' };
    case 'ShotShort':
      return { baseUrl: `${MOLATV_API_BASE}/shotshort`, langParam: 'en', idParam: 'book_id' };
    case 'MoboReels':
      return { baseUrl: `${MOLATV_API_BASE}/moboreels`, langParam: 'en', idParam: 'book_id' };
    case 'BlinkDrama':
      return { baseUrl: `${MOLATV_API_BASE}/blinkdrama`, langParam: 'en', idParam: 'drama_id' };
    case 'WeTV':
      return { baseUrl: `${MOLATV_API_BASE}/wetv`, langParam: 'en', idParam: 'book_id' };
    case 'CubeTV':
      return { baseUrl: `${MOLATV_API_BASE}/cubetv`, langParam: '1', idParam: 'book_id' };
    case 'MicroDrama':
      return { baseUrl: `${MOLATV_API_BASE}/microdrama`, langParam: 'en', idParam: 'book_id' };
    case 'FlareFlow':
      return { baseUrl: `${MOLATV_API_BASE}/flareflow`, langParam: 'en', idParam: 'drama_id' };
    case 'FunDrama':
      return { baseUrl: `${MOLATV_API_BASE}/fundrama`, langParam: 'en', idParam: 'book_id' };
    case 'FreeShort':
      return { baseUrl: `${MOLATV_API_BASE}/freeshort`, langParam: 'en', idParam: 'book_id' };
    case 'ToonShort':
      return { baseUrl: `${MOLATV_API_BASE}/toonshort`, langParam: 'en', idParam: 'book_id' };
    case 'HappyShort':
      return { baseUrl: `${MOLATV_API_BASE}/happyshort`, langParam: 'en', idParam: 'book_id' };
    case 'DramaDash':
      return { baseUrl: `${MOLATV_API_BASE}/dramadash`, langParam: 'en', idParam: 'bookId' };
    case 'StoryReel':
      return { baseUrl: `${MOLATV_API_BASE}/storyreel`, langParam: 'en', idParam: 'book_id' };
    case 'StoryReelV2':
      return { baseUrl: `${MOLATV_API_BASE}/storyreel_v2`, langParam: 'en', idParam: 'book_id' };
    case 'VibeShort':
      return { baseUrl: `${MOLATV_API_BASE}/vibeshort`, langParam: 'en', idParam: 'book_id' };
    case 'VibeShortV2':
      return { baseUrl: `${MOLATV_API_BASE}/vibeshort_v2`, langParam: 'en', idParam: 'book_id' };
    case 'FlickReels':
      return { baseUrl: `${MOLATV_API_BASE}/flickreels`, langParam: '1', idParam: 'book_id' };
    case 'DramaWave':
      return { baseUrl: `${MOLATV_API_BASE}/dramawave`, langParam: 'en-US', idParam: 'book_id' };
    case 'FreeReels':
      return { baseUrl: `${MOLATV_API_BASE}/freereels`, langParam: 'en-US', idParam: 'book_id' };
    case 'PineDrama':
      return { baseUrl: `${MOLATV_API_BASE}/pinedrama`, langParam: 'en', idParam: 'book_id' };
    case 'ShortMax':
      return { baseUrl: `${MOLATV_API_BASE}/shortmax`, langParam: 'en', idParam: 'book_id' };
    case 'ShortMaxV2':
      return { baseUrl: `${MOLATV_API_BASE}/shortmax_v2`, langParam: 'en', idParam: 'book_id' };
    case 'FlexTV':
      return { baseUrl: `${MOLATV_API_BASE}/flextv`, langParam: 'en', idParam: 'book_id' };
    case 'Vigloo':
      return { baseUrl: `${MOLATV_API_BASE}/vigloo`, langParam: 'en', idParam: 'book_id' };
    case 'DotDrama':
      return { baseUrl: `${MOLATV_API_BASE}/dotdrama`, langParam: 'en', idParam: 'book_id' };
    case 'iDrama':
      return { baseUrl: `${MOLATV_API_BASE}/idrama`, langParam: 'en', idParam: 'book_id' };
    case 'iDramaV2':
      return { baseUrl: `${MOLATV_API_BASE}/idrama_v2`, langParam: 'en', idParam: 'book_id' };
    case 'GoodShort':
      return { baseUrl: `${MOLATV_API_BASE}/goodshort`, langParam: 'en', idParam: 'book_id' };
    case 'ReelShort':
      return { baseUrl: `${MOLATV_API_BASE}/reelshort`, langParam: 'en', idParam: 'book_id' };
    case 'ReelShortV2':
      return { baseUrl: `${MOLATV_API_BASE}/reelshort_v2`, langParam: 'en', idParam: 'book_id' };
    case 'JoyReels':
      return { baseUrl: `${MOLATV_API_BASE}/joyreels`, langParam: 'id', idParam: 'playlet_id', epPath: '/detail' };
    case 'SodaReels':
      return { baseUrl: `${MOLATV_API_BASE}/sodareels`, langParam: 'en', idParam: 'book_id' };
    case 'BonusTV':
      return { baseUrl: `${MOLATV_API_BASE}/bonustv`, langParam: 'en', idParam: 'book_id' };
    case 'iQIYI':
      return { baseUrl: `${MOLATV_API_BASE}/iqiyi`, langParam: 'en', idParam: 'album_id' };
    default:
      return { baseUrl: DRAMABOX_BASE_URL, langParam: 'en', idParam: 'book_id' };
  }
}

async function fetchDramaForSsr(
  bookId: string,
  providerHint: SsrProviderName = 'DramaBox'
): Promise<{
  drama: SsrDrama | null;
  episodes: SsrEpisode[];
}> {
  const token = getMolaToken();
  if (!token) {
    return { drama: null, episodes: [] };
  }

  const cacheKey = `${providerHint}:${bookId}`;
  const cached = ssrCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return { drama: cached.drama, episodes: cached.episodes };
  }

  let drama: SsrDrama | null = null;
  let episodes: SsrEpisode[] = [];

  const { baseUrl, langParam, idParam, epPath } = getProviderConfigForSsr(providerHint);
  const langSuffix = langParam ? `&lang=${encodeURIComponent(langParam)}` : '';

  try {
    const detailUrl = `${baseUrl}${providerHint === 'iQIYI' ? '/allepisode' : '/detail'}?${idParam}=${encodeURIComponent(bookId)}${langSuffix}&token=${token}`;
    const epUrl = `${baseUrl}${epPath || '/allepisode'}?${idParam}=${encodeURIComponent(bookId)}${langSuffix}&token=${token}`;
    const [detailRes, epRes] = await Promise.allSettled([
      fetch(detailUrl, { signal: AbortSignal.timeout(7000) }),
      epUrl === detailUrl
        ? Promise.resolve(null)
        : fetch(epUrl, { signal: AbortSignal.timeout(7000) }),
    ]);

    if (detailRes.status === 'fulfilled' && detailRes.value.ok) {
      const json = (await detailRes.value.json()) as Record<string, unknown>;
      const raw =
        json?.data && typeof json.data === 'object'
          ? (json.data as Record<string, unknown>)
          : json;
      const title = cleanText(raw.bookName ?? raw.title ?? raw.name ?? raw.dramaName ?? raw.book_name);
      if (title) {
        const tags = Array.isArray(raw.tags)
          ? raw.tags
              .map((t) => cleanText(t))
              .filter((t): t is string => Boolean(t))
          : [];
        const rawCover = cleanText(
          raw.cover ?? raw.coverUrl ?? raw.bookCover ?? raw.book_cover ?? raw.coverWap ?? raw.poster ?? raw.image
        );
        const normalizedCover =
          rawCover &&
          (rawCover.startsWith('http://') ||
            (providerHint === 'Melolo' &&
              (rawCover.toLowerCase().includes('.heic') ||
                rawCover.toLowerCase().includes('fizzopic.org'))))
            ? `/api/proxy?url=${encodeURIComponent(rawCover)}`
            : rawCover;
        drama = {
          bookId,
          title,
          cover: normalizedCover,
          description: cleanText(
            raw.description ?? raw.introduction ?? raw.synopsis ?? raw.intro ?? raw.summary,
            `Watch ${title} full episodes in HD on House Drama.`
          ),
          chapterCount:
            Number(raw.chapterCount ?? raw.totalEpisodes ?? raw.episodeCount ?? 1) || 1,
          tags,
          playCount: cleanText(raw.playCount) || undefined,
          protagonist: cleanText(raw.protagonist) || undefined,
          isVip: Boolean(raw.isVip),
          provider: providerHint,
        };
      }
      if (epUrl === detailUrl) {
        const rawEps = Array.isArray(json.episodes)
          ? (json.episodes as Record<string, unknown>[])
          : Array.isArray(raw.episodes)
          ? (raw.episodes as Record<string, unknown>[])
          : Array.isArray(raw.chapterList)
          ? (raw.chapterList as Record<string, unknown>[])
          : [];
        episodes = rawEps.map((ep, idx) => {
          const num =
            Number(ep.chapterIndex ?? ep.episodeIndex ?? ep.episode ?? idx + 1) ||
            idx + 1;
          return {
            chapterId: cleanText(
              String(ep.chapterId ?? ep.episodeId ?? ep.episode_id ?? `ep-${num}`)
            ),
            episodeNumber: num,
            title: cleanText(ep.chapterName ?? ep.title, `EP ${num}`),
            isVipLocked: num > 10 && num === 11,
          };
        });
      }
    }

    if (epRes.status === 'fulfilled' && epRes.value && epRes.value.ok) {
      const json = (await epRes.value.json()) as Record<string, unknown>;
      const dataObj =
        json.data && !Array.isArray(json.data) && typeof json.data === 'object'
          ? (json.data as Record<string, unknown>)
          : null;
      const rawEps = Array.isArray(json.episodes)
        ? (json.episodes as Record<string, unknown>[])
        : Array.isArray(json.chapterList)
        ? (json.chapterList as Record<string, unknown>[])
        : Array.isArray(dataObj?.chapterList)
        ? (dataObj.chapterList as Record<string, unknown>[])
        : Array.isArray(dataObj?.episodes)
        ? (dataObj.episodes as Record<string, unknown>[])
        : Array.isArray(dataObj?.data)
        ? (dataObj.data as Record<string, unknown>[])
        : Array.isArray(json.data)
        ? (json.data as Record<string, unknown>[])
        : [];
      episodes = rawEps.map((ep, idx) => {
        const num =
          Number(ep.chapterIndex ?? ep.episodeIndex ?? ep.episode ?? idx + 1) ||
          idx + 1;
        const providerLocked =
          Number(ep.isCharge ?? 0) === 1 ||
          Number(ep.isPay ?? 0) === 1 ||
          Boolean(ep.isVip) ||
          Boolean(ep.isLocked);
        return {
          chapterId: cleanText(
            String(ep.chapterId ?? ep.episodeId ?? ep.episode_id ?? ep.chapter_id ?? `ep-${num}`)
          ),
          episodeNumber: num,
          title: cleanText(ep.chapterName ?? ep.title, `EP ${num}`),
          isVipLocked: num <= 10 ? false : providerLocked || num === 11,
        };
      });
    }
  } catch {
    // Graceful SSR fallback
  }

  ssrCache.set(cacheKey, {
    expiresAt: Date.now() + 5 * 60 * 1000,
    drama,
    episodes,
  });

  return { drama, episodes };
}

function injectDramaSeoIntoHtml(
  html: string,
  origin: string,
  bookId: string,
  drama: SsrDrama,
  episodes: SsrEpisode[]
): string {
  const slug = drama.slug || slugifyTitle(drama.title);
  const canonicalUrl = `${origin}/drama/${encodeURIComponent(slug)}`;
  const epCount = Math.max(1, episodes.length || drama.chapterCount || 1);
  const pageTitle = `Watch ${drama.title} Full Episodes Online HD (${epCount} Eps) | House Drama`;
  const rawDesc =
    drama.description ||
    `Watch ${drama.title} (${epCount} episodes) online in crisp HD vertical cinema mode on House Drama.`;
  const desc =
    rawDesc.length > 158 ? `${rawDesc.slice(0, 155).trim()}...` : rawDesc;
  const keywords = [
    drama.title,
    `Watch ${drama.title} online`,
    'House Drama',
    'Vertical Short Drama',
    'Asian Mini Series',
    drama.provider,
    ...drama.tags,
  ]
    .filter(Boolean)
    .join(', ');

  const ogImage = toAbsoluteImageUrl(drama.cover || DEFAULT_OG_IMAGE_PATH, origin);
  const logoImage = `${origin}/assets/aistudio/logo_dan_pavicon_f5e028e6.png`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TVSeries',
        '@id': `${canonicalUrl}#tvseries`,
        name: drama.title,
        description: drama.description,
        image: ogImage,
        url: canonicalUrl,
        inLanguage: 'en',
        numberOfEpisodes: epCount,
        genre: drama.tags.length > 0 ? drama.tags : ['Drama', 'Short Series'],
        actor: drama.protagonist
          ? drama.protagonist.split(',').map((name) => ({
              '@type': 'Person',
              name: name.trim(),
            }))
          : undefined,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          bestRating: '5',
          ratingCount: '1240',
        },
        containsSeason: {
          '@type': 'TVSeason',
          seasonNumber: 1,
          numberOfEpisodes: epCount,
        },
        potentialAction: {
          '@type': 'WatchAction',
          target: canonicalUrl,
        },
      },
      {
        '@type': 'VideoObject',
        '@id': `${canonicalUrl}#video`,
        name: `${drama.title} - Episode 1`,
        description: drama.description,
        thumbnailUrl: [ogImage],
        uploadDate: '2026-01-01T00:00:00Z',
        inLanguage: 'en',
        contentUrl: canonicalUrl,
        embedUrl: canonicalUrl,
        publisher: {
          '@type': 'Organization',
          name: 'House Drama',
          url: origin,
          logo: {
            '@type': 'ImageObject',
            url: logoImage,
          },
        },
      },
    ],
  };

  const seoHeadBlock = `
    <title>${escapeHtmlAttr(pageTitle)}</title>
    <meta name="description" content="${escapeHtmlAttr(desc)}" />
    <meta name="keywords" content="${escapeHtmlAttr(keywords)}" />
    <link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />
    <link rel="alternate" hreflang="en" href="${escapeHtmlAttr(canonicalUrl)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtmlAttr(canonicalUrl)}" />
    <meta property="og:site_name" content="House Drama" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="video.tv_show" />
    <meta property="og:title" content="${escapeHtmlAttr(pageTitle)}" />
    <meta property="og:description" content="${escapeHtmlAttr(desc)}" />
    <meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtmlAttr(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtmlAttr(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtmlAttr(desc)}" />
    <meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}" />
    <script type="application/ld+json" id="house-drama-jsonld">${JSON.stringify(
      jsonLd
    ).replace(/<\/script>/gi, '<\\/script>')}</script>
    <script>window.__INITIAL_DRAMA__=${JSON.stringify({
      bookId,
      drama,
      episodes,
    }).replace(/<\/script>/gi, '<\\/script>')};</script>
  `;

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>/i, '')
    .replace(/<meta\s+name="keywords"[\s\S]*?\/>/i, '')
    .replace(/<meta\s+property="og:[\s\S]*?\/>/gi, '')
    .replace(/<meta\s+name="twitter:[\s\S]*?\/>/gi, '')
    .replace(/<link\s+rel="canonical"[\s\S]*?\/>/i, '')
    .replace(/<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]*"\s*\/?>/gi, '')
    .replace(
      /<script\s+type="application\/ld\+json"[\s\S]*?<\/script>/i,
      ''
    )
    .replace('</head>', `${seoHeadBlock}\n  </head>`);
}

function injectMovieSeoIntoHtml(
  html: string,
  origin: string,
  movie: Lk21DetailPayload,
  episodes: Lk21EpisodePayloadItem[]
): string {
  const canonicalUrl = `${origin}/movie/${encodeURIComponent(movie.slug)}`;
  const yearTag = movie.year ? ` (${movie.year})` : '';
  const qualTag = movie.quality ? ` [${movie.quality}]` : '';
  const pageTitle = `Watch ${movie.title}${yearTag} Full Movie${qualTag} Free Online | House Drama`;
  const rawDesc = (
    movie.synopsis ||
    movie.description ||
    `Stream ${movie.title} in Full HD online free with subtitles on House Drama Movies.`
  )
    .replace(/\s+/g, ' ')
    .trim();
  const desc = rawDesc.length > 158 ? `${rawDesc.slice(0, 155)}...` : rawDesc;
  const keywords = [
    `Watch ${movie.title} online`,
    `${movie.title} full movie HD`,
    ...movie.genres,
    movie.area,
    movie.year,
    movie.director,
    'stream movies free HD',
  ]
    .filter(Boolean)
    .join(', ');

  const ogImage = toAbsoluteImageUrl(
    movie.poster || movie.cover || DEFAULT_OG_IMAGE_PATH,
    origin
  );
  const logoImage = `${origin}/assets/aistudio/logo_dan_pavicon_f5e028e6.png`;
  const ratingVal = parseFloat(movie.rating || '4.8');
  const normalizedRating =
    Number.isFinite(ratingVal) && ratingVal > 0
      ? Math.min(10, ratingVal).toFixed(1)
      : '8.2';

  const movieSchema =
    movie.type === 'series' && episodes.length > 1
      ? {
          '@type': 'TVSeries',
          '@id': `${canonicalUrl}#movie`,
          name: movie.title,
          description: desc,
          image: ogImage,
          url: canonicalUrl,
          inLanguage: 'en',
          numberOfEpisodes: episodes.length,
          datePublished: movie.year ? `${movie.year}-01-01` : undefined,
          genre: movie.genres.length > 0 ? movie.genres : ['Drama', 'Series'],
          director: movie.director
            ? { '@type': 'Person', name: movie.director }
            : undefined,
          actor: movie.actors.map((name) => ({ '@type': 'Person', name })),
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: normalizedRating,
            bestRating: '10',
            ratingCount: '860',
          },
          potentialAction: { '@type': 'WatchAction', target: canonicalUrl },
        }
      : {
          '@type': 'Movie',
          '@id': `${canonicalUrl}#movie`,
          name: movie.title,
          description: desc,
          image: ogImage,
          url: canonicalUrl,
          inLanguage: 'en',
          dateCreated: movie.year || undefined,
          countryOfOrigin: movie.area
            ? { '@type': 'Country', name: movie.area }
            : undefined,
          genre: movie.genres.length > 0 ? movie.genres : ['Feature Film'],
          director: movie.director
            ? { '@type': 'Person', name: movie.director }
            : undefined,
          actor: movie.actors.map((name) => ({ '@type': 'Person', name })),
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: normalizedRating,
            bestRating: '10',
            ratingCount: '940',
          },
          potentialAction: { '@type': 'WatchAction', target: canonicalUrl },
        };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      movieSchema,
      {
        '@type': 'VideoObject',
        '@id': `${canonicalUrl}#video`,
        name: movie.title,
        description: desc,
        thumbnailUrl: [ogImage],
        uploadDate: movie.year ? `${movie.year}-01-01T00:00:00Z` : '2026-01-01T00:00:00Z',
        inLanguage: 'en',
        contentUrl: canonicalUrl,
        embedUrl: canonicalUrl,
        publisher: {
          '@type': 'Organization',
          name: 'House Drama',
          url: origin,
          logo: { '@type': 'ImageObject', url: logoImage },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: 'Movies', item: `${origin}/movies` },
          { '@type': 'ListItem', position: 3, name: movie.title, item: canonicalUrl },
        ],
      },
    ],
  };

  const seoHeadBlock = `
    <title>${escapeHtmlAttr(pageTitle)}</title>
    <meta name="description" content="${escapeHtmlAttr(desc)}" />
    <meta name="keywords" content="${escapeHtmlAttr(keywords)}" />
    <link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />
    <link rel="alternate" hreflang="en" href="${escapeHtmlAttr(canonicalUrl)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtmlAttr(canonicalUrl)}" />
    <meta property="og:site_name" content="House Drama" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="video.movie" />
    <meta property="og:title" content="${escapeHtmlAttr(pageTitle)}" />
    <meta property="og:description" content="${escapeHtmlAttr(desc)}" />
    <meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtmlAttr(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtmlAttr(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtmlAttr(desc)}" />
    <meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}" />
    <script type="application/ld+json" id="house-drama-jsonld">${JSON.stringify(
      jsonLd
    ).replace(/<\/script>/gi, '<\\/script>')}</script>
    <script>window.__INITIAL_MOVIE__=${JSON.stringify({
      movie,
      episodes,
    }).replace(/<\/script>/gi, '<\\/script>')};</script>
  `;

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>/i, '')
    .replace(/<meta\s+name="keywords"[\s\S]*?\/>/i, '')
    .replace(/<meta\s+property="og:[\s\S]*?\/>/gi, '')
    .replace(/<meta\s+name="twitter:[\s\S]*?\/>/gi, '')
    .replace(/<link\s+rel="canonical"[\s\S]*?\/>/i, '')
    .replace(/<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]*"\s*\/?>/gi, '')
    .replace(
      /<script\s+type="application\/ld\+json"[\s\S]*?<\/script>/i,
      ''
    )
    .replace('</head>', `${seoHeadBlock}\n  </head>`);
}

function injectProgrammaticSeoIntoHtml(
  html: string,
  origin: string,
  landing: ProgrammaticLandingConfig,
  items: Array<Record<string, unknown>>
): string {
  const canonicalUrl = `${origin}${landing.canonicalPath}`;
  const ogImage = `${origin}${DEFAULT_OG_IMAGE_PATH}`;

  const itemListElements = items.slice(0, 12).map((item, idx) => {
    const title = cleanText(item.title, 'Short Drama');
    const slug = cleanText(item.slug) || slugifyTitle(title);
    return {
      '@type': 'ListItem',
      position: idx + 1,
      name: title,
      url: `${origin}/drama/${encodeURIComponent(slug)}`,
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: landing.title,
        description: landing.description,
        url: canonicalUrl,
        inLanguage: 'en',
        isPartOf: {
          '@type': 'WebSite',
          name: 'House Drama',
          url: `${origin}/`,
        },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: itemListElements.length,
          itemListElement: itemListElements,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          {
            '@type': 'ListItem',
            position: 2,
            name: landing.basePath === 'tag' ? 'Tags' : 'Genres',
            item: `${origin}/explore`,
          },
          { '@type': 'ListItem', position: 3, name: landing.h1, item: canonicalUrl },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: landing.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      },
    ],
  };

  const seoHeadBlock = `
    <title>${escapeHtmlAttr(landing.title)}</title>
    <meta name="description" content="${escapeHtmlAttr(landing.description)}" />
    <meta name="keywords" content="${escapeHtmlAttr(landing.keywords)}" />
    <link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />
    <link rel="alternate" hreflang="en" href="${escapeHtmlAttr(canonicalUrl)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtmlAttr(canonicalUrl)}" />
    <meta property="og:site_name" content="House Drama" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtmlAttr(landing.title)}" />
    <meta property="og:description" content="${escapeHtmlAttr(landing.description)}" />
    <meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtmlAttr(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtmlAttr(landing.title)}" />
    <meta name="twitter:description" content="${escapeHtmlAttr(landing.description)}" />
    <meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}" />
    <script type="application/ld+json" id="house-drama-jsonld">${JSON.stringify(
      jsonLd
    ).replace(/<\/script>/gi, '<\\/script>')}</script>
  `;

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>/i, '')
    .replace(/<meta\s+name="keywords"[\s\S]*?\/>/i, '')
    .replace(/<meta\s+property="og:[\s\S]*?\/>/gi, '')
    .replace(/<meta\s+name="twitter:[\s\S]*?\/>/gi, '')
    .replace(/<link\s+rel="canonical"[\s\S]*?\/>/i, '')
    .replace(/<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]*"\s*\/?>/gi, '')
    .replace(
      /<script\s+type="application\/ld\+json"[\s\S]*?<\/script>/i,
      ''
    )
    .replace('</head>', `${seoHeadBlock}\n  </head>`);
}

async function startServer() {
  const app = express();
  app.use(
    compression({
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression'] || req.headers.range) return false;
        return compression.filter(req, res);
      },
    })
  );
  app.use(express.json({ limit: '256kb' }));
  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');

  let vite: ViteDevServer | null = null;
  if (!IS_PROD) {
    vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'custom',
    });
    app.get('/@vite/client', async (_req: Request, res: Response, next) => {
      try {
        const result = await vite!.transformRequest('/@vite/client');
        if (!result?.code) return next();
        const patched = result.code
          .replace(
            'transport.connect(createHMRHandler(handleMessage));',
            '/* HMR/WS disabled in middlewareMode */'
          )
          .replace(
            'else throw new SendBeforeConnectError("send was called before connect");',
            'else return;'
          )
          .replace(
            'else throw new SendBeforeConnectError("invoke was called before connect");',
            'else return undefined;'
          );
        res
          .type('application/javascript')
          .set('Cache-Control', 'no-cache')
          .send(patched);
      } catch {
        next();
      }
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir, { index: false }));
  }

  app.get('/api/health', async (_req: Request, res: Response) => {
    const db = await pingDb();
    res.json({ ok: true, service: 'house-drama-ssr', db });
  });

  // Database-cached Home endpoint (reads SQLite cache first, stale-while-revalidate async refresh)
  app.get('/api/home', async (req: Request, res: Response) => {
    try {
      const lang = typeof req.query.lang === 'string' ? req.query.lang : 'en';
      const provider =
        typeof req.query.provider === 'string' ? req.query.provider : 'All';
      const data = await getCachedHomeData(getMolaToken(), lang, provider);
      res.setHeader(
        'Cache-Control',
        'public, max-age=60, stale-while-revalidate=3600'
      );
      res.setHeader(
        'X-Home-Cache',
        data.cached ? (data.stale ? 'STALE' : 'HIT') : 'MISS'
      );
      res.json(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load home catalog';
      res.status(500).json({ error: message });
    }
  });

  // Manual async revalidation trigger for Home cache
  app.post('/api/home/revalidate', (req: Request, res: Response) => {
    const lang =
      typeof req.query.lang === 'string'
        ? req.query.lang
        : typeof req.body?.lang === 'string'
        ? req.body.lang
        : 'en';
    const provider =
      typeof req.query.provider === 'string'
        ? req.query.provider
        : typeof req.body?.provider === 'string'
        ? req.body.provider
        : 'All';
    const result = triggerAsyncHomeRevalidate(getMolaToken(), lang, provider);
    res.status(result.started ? 202 : 200).json({
      ok: true,
      revalidating: result.started,
      cacheKey: result.cacheKey,
    });
  });

  app.get('/api/home/cache-status', async (_req: Request, res: Response) => {
    try {
      res.json(await getHomeCacheStatus());
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to inspect cache status',
      });
    }
  });

  function sanitizeMolaUrlString(str: string): string {
    if (!str.startsWith('https://api.molatv.id/api') && !str.startsWith('http://api.molatv.id/api')) {
      return str;
    }
    try {
      const parsed = new URL(str);
      parsed.searchParams.delete('token');
      const subPath = parsed.pathname.replace(/^\/api/, '');
      const qs = parsed.searchParams.toString();
      return `/api/mola${subPath}${qs ? `?${qs}` : ''}`;
    } catch {
      return str;
    }
  }

  function sanitizeMolaPayload(val: unknown): unknown {
    if (typeof val === 'string') return sanitizeMolaUrlString(val);
    if (Array.isArray(val)) return val.map(sanitizeMolaPayload);
    if (val && typeof val === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        out[k] = sanitizeMolaPayload(v);
      }
      return out;
    }
    return val;
  }

  // --- Dedicated LK21 Movies API Server Proxy & PostgreSQL Cache Routes ---
  // MOLA_API_TOKEN is injected strictly inside lk21Service on the server and never sent to the client.

  app.get('/api/lk21/home', async (req: Request, res: Response) => {
    try {
      const data = await getLk21Home(getMolaToken, resolveOrigin(req));
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.json(data);
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load LK21 home catalog',
      });
    }
  });

  app.get('/api/lk21/menu', async (_req: Request, res: Response) => {
    try {
      const data = await getLk21Menu(getMolaToken);
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.json(data);
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load LK21 menu',
      });
    }
  });

  app.get('/api/lk21/latest', async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const data = await getLk21Latest(getMolaToken, page, resolveOrigin(req));
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.json(data);
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load LK21 latest movies',
      });
    }
  });

  app.get('/api/lk21/category', async (req: Request, res: Response) => {
    try {
      const key = cleanText(req.query.key, 'lk21.featured');
      const page = Math.max(1, Number(req.query.page) || 1);
      const data = await getLk21Category(
        getMolaToken,
        key,
        page,
        resolveOrigin(req)
      );
      res.setHeader('Cache-Control', 'public, max-age=180');
      res.json(data);
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load LK21 category',
      });
    }
  });

  app.get('/api/lk21/search', async (req: Request, res: Response) => {
    try {
      const q = cleanText(req.query.q);
      const page = Math.max(1, Number(req.query.page) || 1);
      const data = await getLk21Search(getMolaToken, q, page, resolveOrigin(req));
      res.json(data);
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to search LK21 movies',
      });
    }
  });

  app.get('/api/lk21/detail', async (req: Request, res: Response) => {
    try {
      const slug = cleanText(req.query.slug);
      if (!slug) {
        res.status(400).json({ ok: false, error: 'Missing slug query parameter' });
        return;
      }
      const detail = await getLk21Detail(getMolaToken, slug, resolveOrigin(req));
      if (!detail) {
        res.status(404).json({ ok: false, error: 'Movie not found' });
        return;
      }
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(detail);
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load LK21 movie detail',
      });
    }
  });

  app.get('/api/lk21/episodes', async (req: Request, res: Response) => {
    try {
      const slug = cleanText(req.query.slug);
      if (!slug) {
        res.status(400).json({ ok: false, error: 'Missing slug query parameter' });
        return;
      }
      const eps = await getLk21Episodes(getMolaToken, slug);
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(eps);
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load LK21 episodes',
      });
    }
  });

  app.get('/api/lk21/stream', async (req: Request, res: Response) => {
    try {
      const slug = cleanText(req.query.slug);
      const vid = cleanText(req.query.vid) || undefined;
      const episodeRaw = Number(req.query.episode);
      const episode =
        Number.isFinite(episodeRaw) && episodeRaw > 0 ? episodeRaw : undefined;
      if (!slug && !vid) {
        res.status(400).json({ ok: false, error: 'Missing slug query parameter' });
        return;
      }
      const stream = await getLk21Stream(getMolaToken, { slug, vid, episode });
      res.json(stream);
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load LK21 stream',
      });
    }
  });

  app.get('/api/lk21/proxy/m3u8', async (req: Request, res: Response) => {
    const rawUrl = cleanText(req.query.url);
    if (!rawUrl) {
      res.status(400).json({ ok: false, error: 'Missing url query parameter' });
      return;
    }
    try {
      const { status, body } = await fetchAndRewriteLk21M3u8(getMolaToken, rawUrl);
      res.status(status);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(body);
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to proxy LK21 m3u8',
      });
    }
  });

  app.get('/api/lk21/proxy/segment', async (req: Request, res: Response) => {
    const rawUrl = cleanText(req.query.url);
    if (!rawUrl) {
      res.status(400).json({ ok: false, error: 'Missing url query parameter' });
      return;
    }
    try {
      const seg = await fetchLk21Segment(rawUrl, req.get('range'));
      res.status(seg.status);
      res.setHeader('Content-Type', seg.contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      if (seg.contentLength) res.setHeader('Content-Length', seg.contentLength);
      if (seg.contentRange) res.setHeader('Content-Range', seg.contentRange);
      if (seg.acceptRanges) res.setHeader('Accept-Ranges', seg.acceptRanges);

      if (seg.upstream.body) {
        Readable.fromWeb(
          seg.upstream.body as unknown as import('node:stream/web').ReadableStream
        ).pipe(res);
      } else {
        const buf = Buffer.from(await seg.upstream.arrayBuffer());
        res.send(buf);
      }
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to proxy LK21 segment',
      });
    }
  });

  // Mandatory server-side gateway for all https://api.molatv.id/api/* requests.
  // Injects MOLA_API_TOKEN exclusively on the server and strips embedded tokens from responses.
  app.use('/api/mola', async (req: Request, res: Response) => {
    const token = getMolaToken();
    if (!token) {
      res.status(503).json({
        success: false,
        error: 'Server MOLA_API_TOKEN is not configured.',
      });
      return;
    }

    const rawPath = req.url || '/';
    if (rawPath.includes('..') || rawPath.includes('@') || !rawPath.startsWith('/')) {
      res.status(400).json({ success: false, error: 'Invalid API gateway path' });
      return;
    }

    let upstreamUrl: URL;
    try {
      upstreamUrl = new URL(`${MOLATV_API_BASE}${rawPath}`);
      if (upstreamUrl.origin !== 'https://api.molatv.id') {
        res.status(403).json({ success: false, error: 'Forbidden upstream origin' });
        return;
      }
      upstreamUrl.searchParams.set('token', token);
    } catch {
      res.status(400).json({ success: false, error: 'Malformed upstream API URL' });
      return;
    }

    const cacheableListGet =
      req.method === 'GET' && isCacheableMolaListPath(rawPath);
    const molaCacheKey = `mola:${rawPath}`;

    if (cacheableListGet) {
      const cached = await getCachedMolaApiResponse(molaCacheKey);
      if (cached) {
        res.status(cached.statusCode);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('X-Mola-Cache', cached.stale ? 'STALE' : 'HIT');
        res.send(cached.payloadJson);

        if (cached.stale) {
          markApiRevalidating(molaCacheKey, async () => {
            try {
              const refreshRes = await fetch(upstreamUrl.toString(), {
                method: 'GET',
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(12000),
              });
              if (refreshRes.ok) {
                const refreshText = await refreshRes.text();
                const parsed = JSON.parse(refreshText);
                const sanitized = JSON.stringify(sanitizeMolaPayload(parsed));
                setCachedMolaApiResponse(molaCacheKey, refreshRes.status, sanitized);
              }
            } catch {
              // Preserve existing cache on background refresh failure
            }
          });
        }
        return;
      }
    }

    try {
      const upstreamHeaders: Record<string, string> = {
        Accept: req.get('accept') || '*/*',
      };
      const rangeHeader = req.get('range');
      if (rangeHeader) {
        upstreamHeaders.Range = rangeHeader;
      }

      const upstream = await fetch(upstreamUrl.toString(), {
        method: req.method === 'HEAD' ? 'HEAD' : 'GET',
        headers: upstreamHeaders,
        signal: AbortSignal.timeout(15000),
      });

      const contentType =
        upstream.headers.get('content-type') || 'application/octet-stream';
      const lowerCt = contentType.toLowerCase();

      if (lowerCt.includes('application/json') || lowerCt.includes('text/json')) {
        const text = await upstream.text();
        res.status(upstream.status);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        try {
          const parsed = JSON.parse(text);
          const sanitized = JSON.stringify(sanitizeMolaPayload(parsed));
          if (cacheableListGet && upstream.ok) {
            setCachedMolaApiResponse(molaCacheKey, upstream.status, sanitized);
            res.setHeader('X-Mola-Cache', 'MISS');
          }
          // Auto-detect new episodes returned on episode-list API calls & trigger Google Indexing API
          if (
            upstream.ok &&
            /(allepisode|episodes|chapter)/i.test(upstreamUrl.pathname)
          ) {
            const bookIdCand = cleanText(
              upstreamUrl.searchParams.get('bookId') ??
                upstreamUrl.searchParams.get('dramaId') ??
                upstreamUrl.searchParams.get('id')
            );
            const seg = (upstreamUrl.pathname.match(/\/api\/([^/?]+)/i)?.[1] || '').toLowerCase();
            const parsedObj = parsed as Record<string, unknown> | unknown[];
            const epList = Array.isArray(parsedObj)
              ? parsedObj
              : Array.isArray((parsedObj as Record<string, unknown>)?.data)
              ? ((parsedObj as Record<string, unknown>).data as unknown[])
              : Array.isArray((parsedObj as Record<string, unknown>)?.episodes)
              ? ((parsedObj as Record<string, unknown>).episodes as unknown[])
              : [];
            if (bookIdCand && epList.length > 0) {
              const provName = parseSsrProviderName(seg);
              void updateCatalogEpisodeCountIfHigherInDb(
                bookIdCand,
                provName,
                epList.length
              )
                .then((updated) => {
                  if (updated && updated.increased) {
                    return notifyCatalogAdditionsToGoogle(
                      [
                        {
                          dramaId: bookIdCand,
                          provider: provName,
                          slug: updated.slug,
                          chapterCount: updated.chapterCount,
                          reason: 'new_episode',
                        },
                      ],
                      resolveOrigin(req)
                    );
                  }
                  return [];
                })
                .catch(() => {});
            }
          }
          res.send(sanitized);
        } catch {
          res.send(text);
        }
        return;
      }

      if (
        lowerCt.includes('mpegurl') ||
        upstreamUrl.pathname.toLowerCase().endsWith('.m3u8')
      ) {
        const playlist = await upstream.text();
        const wrapPlaylistTarget = (target: string) => {
          try {
            const abs = new URL(target, upstreamUrl.toString()).toString();
            if (abs.startsWith(MOLATV_API_BASE)) {
              return sanitizeMolaUrlString(abs);
            }
            return `/api/proxy?url=${encodeURIComponent(abs)}`;
          } catch {
            return target;
          }
        };
        const rewritten = playlist
          .split('\n')
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;
            if (trimmed.startsWith('#')) {
              return line.replace(/URI="([^"]+)"/gi, (_m, uri) => {
                return `URI="${wrapPlaylistTarget(uri)}"`;
              });
            }
            return wrapPlaylistTarget(trimmed);
          })
          .join('\n');
        res.status(upstream.status);
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(rewritten);
        return;
      }

      res.status(upstream.status);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      const contentRange = upstream.headers.get('content-range');
      const acceptRanges = upstream.headers.get('accept-ranges');
      const contentLength = upstream.headers.get('content-length');
      if (contentRange) res.setHeader('Content-Range', contentRange);
      if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
      if (contentLength) res.setHeader('Content-Length', contentLength);

      if (upstream.body) {
        Readable.fromWeb(upstream.body as unknown as import('node:stream/web').ReadableStream).pipe(res);
      } else {
        const buf = Buffer.from(await upstream.arrayBuffer());
        res.send(buf);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upstream API gateway error';
      res.status(502).json({ success: false, error: message });
    }
  });

  const ALLOWED_PROXY_HOSTS =
    /(^|\.)(molatv\.id|assetsy\.de|playcdn\.de|videonode\.de|netshort\.com|dramaboxdb\.com|dramabox\.com|hwztchapter\.com|anyreel\.app|fizzopic\.org|melolostatic\.com|vidivo\.me|shortswave\.com|meloshort\.com|petadrama\.com|wolftv\.online|ibyteimg\.com|bytedrama\.com|bytedance\.com|kalostv\.com|stardusttv\.cc|stardust-tv\.com|miniepisode\.media|aliyuncs\.com|ydstatic\.com|cloudfront\.net|my-drama\.tv|kjcdn\.com|drt768\.com|cdreader\.com|blinkdrama\.life|shorttv\.live|wetvinfo\.com|cubetv\.cc|janzhoutec\.com|flareflow\.tv|nsstorage\.space|freeshort\.xyz|toonshort\.com|tqshort\.com|dramadash\.app|cloudflarestream\.com|storyreel\.life|vibeshort\.live|farsunpteltd\.com|mydramawave\.com|tiktokcdn\.com|flextv\.cc|vigloo\.com|idrama\.video|goodshort\.com|crazymaplestudios\.com|joyreels\.com|jinchuanlingyun\.com|cloudonward\.net|iqiyipic\.com|iqiyi\.com)$/i;
  const ALLOWED_HTTP_HOSTS =
    /(^|\.)(bytedrama\.com|bytedance\.com|iqiyipic\.com|iqiyi\.com)$/i;

  app.get('/api/proxy', async (req: Request, res: Response) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!rawUrl) {
      res.status(400).json({ error: 'Missing url query parameter' });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      res.status(400).json({ error: 'Invalid target URL' });
      return;
    }

    const isAllowedProto =
      parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' && ALLOWED_HTTP_HOSTS.test(parsed.hostname));

    if (!isAllowedProto || !ALLOWED_PROXY_HOSTS.test(parsed.hostname)) {
      res.status(403).json({ error: 'Target host is not permitted' });
      return;
    }

    const cacheHit = heicCache.get(parsed.toString());
    if (cacheHit && Date.now() < cacheHit.expiresAt) {
      res.status(200);
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(cacheHit.buf);
      return;
    }

    try {
      const upstreamHeaders: Record<string, string> = {
        Accept: req.get('accept') || '*/*',
      };
      const rangeHeader = req.get('range');
      if (rangeHeader) {
        upstreamHeaders.Range = rangeHeader;
      }
      if (parsed.hostname.endsWith('cdreader.com')) {
        upstreamHeaders.Referer = 'https://www.moboreels.com/';
        upstreamHeaders.Origin = 'https://www.moboreels.com';
      }

      const upstream = await fetch(parsed.toString(), {
        method: 'GET',
        headers: upstreamHeaders,
        signal: AbortSignal.timeout(15000),
      });

      const contentType =
        upstream.headers.get('content-type') || 'application/octet-stream';

      const isM3u8 =
        parsed.pathname.toLowerCase().endsWith('.m3u8') ||
        contentType.toLowerCase().includes('mpegurl');

      if (upstream.ok && isM3u8) {
        const rawPlaylist = await upstream.text();
        if (rawPlaylist.length > 0) {
          const wrapProxy = (target: string) => {
            try {
              const abs = new URL(target, parsed.toString()).toString();
              return `/api/proxy?url=${encodeURIComponent(abs)}`;
            } catch {
              return target;
            }
          };
          const rewritten = rawPlaylist
            .split('\n')
            .map((line) => {
              const trimmed = line.trim();
              if (!trimmed) return line;
              if (trimmed.startsWith('#')) {
                return line.replace(/URI="([^"]+)"/gi, (_m, uri) => {
                  return `URI="${wrapProxy(uri)}"`;
                });
              }
              return wrapProxy(trimmed);
            })
            .join('\n');
          res.status(200);
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=60');
          res.send(rewritten);
          return;
        }
      }

      const isHeic =
        contentType.toLowerCase().includes('image/heic') ||
        contentType.toLowerCase().includes('image/heif') ||
        parsed.pathname.toLowerCase().endsWith('.heic');

      if (upstream.ok && isHeic) {
        const bodyBuffer = Buffer.from(await upstream.arrayBuffer());
        if (bodyBuffer.length > 0) {
          try {
            const webpBuffer = await convertHeicToWebp(bodyBuffer);
            if (heicCache.size >= 150) {
              const firstKey = heicCache.keys().next().value;
              if (firstKey) heicCache.delete(firstKey);
            }
            heicCache.set(parsed.toString(), {
              buf: webpBuffer,
              expiresAt: Date.now() + 30 * 60 * 1000,
            });
            res.status(200);
            res.setHeader('Content-Type', 'image/webp');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.send(webpBuffer);
            return;
          } catch {
            res.status(upstream.status);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(bodyBuffer);
            return;
          }
        }
      }

      res.status(upstream.status);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      const contentRange = upstream.headers.get('content-range');
      const acceptRanges = upstream.headers.get('accept-ranges');
      const contentLength = upstream.headers.get('content-length');
      if (contentRange) res.setHeader('Content-Range', contentRange);
      if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentType.startsWith('image/')) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=120');
      }

      if (upstream.body) {
        Readable.fromWeb(upstream.body as unknown as import('node:stream/web').ReadableStream).pipe(res);
      } else {
        const buf = Buffer.from(await upstream.arrayBuffer());
        res.send(buf);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upstream proxy request failed';
      res.status(502).json({ error: message });
    }
  });

  // --- HMAC-SHA256 Signed Video Stream Security ---

  const streamSigningSecret =
    process.env.STREAM_SIGNING_SECRET ||
    crypto
      .createHash('sha256')
      .update(`${process.env.MOLA_API_TOKEN || 'housedrama-dev'}|stream-guard-v1`)
      .digest('hex');

  const signStreamToken = (targetUrl: string, uid: string, ttlMs = 2 * 60 * 60 * 1000) => {
    const exp = Date.now() + ttlMs;
    const payloadJson = JSON.stringify({ u: targetUrl, e: exp, a: uid.slice(0, 64) });
    const payloadB64 = Buffer.from(payloadJson, 'utf-8').toString('base64url');
    const sig = crypto
      .createHmac('sha256', streamSigningSecret)
      .update(payloadB64)
      .digest('base64url');
    return { token: `${payloadB64}.${sig}`, exp };
  };

  const verifyStreamToken = (
    rawToken: string
  ): { url: string; exp: number; actor: string } | null => {
    const parts = rawToken.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, providedSig] = parts;
    if (!payloadB64 || !providedSig) return null;
    const expectedSig = crypto
      .createHmac('sha256', streamSigningSecret)
      .update(payloadB64)
      .digest('base64url');
    const bufA = Buffer.from(providedSig, 'utf-8');
    const bufB = Buffer.from(expectedSig, 'utf-8');
    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return null;
    }
    try {
      const parsed = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf-8')
      ) as { u?: string; e?: number; a?: string };
      if (!parsed.u || !parsed.e || Date.now() > parsed.e) {
        return null;
      }
      return { url: parsed.u, exp: parsed.e, actor: parsed.a || 'guest' };
    } catch {
      return null;
    }
  };

  app.post('/api/stream/sign', (req: Request, res: Response) => {
    const rawUrl = cleanText(req.body?.url);
    const uid = cleanText(req.body?.uid, 'guest');
    if (!rawUrl) {
      res.status(400).json({ ok: false, error: 'Missing stream url' });
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      res.status(400).json({ ok: false, error: 'Invalid stream url' });
      return;
    }
    const isAllowedProto =
      parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' && ALLOWED_HTTP_HOSTS.test(parsed.hostname));
    if (!isAllowedProto || !ALLOWED_PROXY_HOSTS.test(parsed.hostname)) {
      res.status(403).json({ ok: false, error: 'Target stream host not permitted' });
      return;
    }
    const { token, exp } = signStreamToken(parsed.toString(), uid);
    res.json({
      ok: true,
      signedUrl: `/api/stream?st=${encodeURIComponent(token)}`,
      expiresAt: exp,
    });
  });

  app.get('/api/stream', async (req: Request, res: Response) => {
    const rawToken = typeof req.query.st === 'string' ? req.query.st.trim() : '';
    if (!rawToken) {
      res.status(401).json({ error: 'Missing signed stream token' });
      return;
    }
    const verified = verifyStreamToken(rawToken);
    if (!verified) {
      res.status(403).json({ error: 'Invalid or expired stream token' });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(verified.url);
    } catch {
      res.status(400).json({ error: 'Malformed target stream URL' });
      return;
    }
    const isAllowedProto =
      parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' && ALLOWED_HTTP_HOSTS.test(parsed.hostname));
    if (!isAllowedProto || !ALLOWED_PROXY_HOSTS.test(parsed.hostname)) {
      res.status(403).json({ error: 'Target host is not permitted' });
      return;
    }

    try {
      const upstreamHeaders: Record<string, string> = {
        Accept: req.get('accept') || '*/*',
      };
      const rangeHeader = req.get('range');
      if (rangeHeader) {
        upstreamHeaders.Range = rangeHeader;
      }
      if (parsed.hostname.endsWith('cdreader.com')) {
        upstreamHeaders.Referer = 'https://www.moboreels.com/';
        upstreamHeaders.Origin = 'https://www.moboreels.com';
      }

      const upstream = await fetch(parsed.toString(), {
        method: 'GET',
        headers: upstreamHeaders,
        signal: AbortSignal.timeout(15000),
      });

      const contentType =
        upstream.headers.get('content-type') || 'application/octet-stream';

      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');

      const isM3u8 =
        parsed.pathname.toLowerCase().endsWith('.m3u8') ||
        contentType.toLowerCase().includes('mpegurl');

      if (upstream.ok && isM3u8) {
        const rawPlaylist = await upstream.text();
        if (rawPlaylist.length > 0) {
          const wrapSigned = (target: string) => {
            try {
              const abs = new URL(target, parsed.toString()).toString();
              const { token } = signStreamToken(abs, verified.actor);
              return `/api/stream?st=${encodeURIComponent(token)}`;
            } catch {
              return target;
            }
          };
          const rewritten = rawPlaylist
            .split('\n')
            .map((line) => {
              const trimmed = line.trim();
              if (!trimmed) return line;
              if (trimmed.startsWith('#')) {
                return line.replace(/URI="([^"]+)"/gi, (_m, uri) => {
                  return `URI="${wrapSigned(uri)}"`;
                });
              }
              return wrapSigned(trimmed);
            })
            .join('\n');
          res.status(200);
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          res.send(rewritten);
          return;
        }
      }

      res.status(upstream.status);
      res.setHeader('Content-Type', contentType);
      const contentRange = upstream.headers.get('content-range');
      const acceptRanges = upstream.headers.get('accept-ranges');
      const contentLength = upstream.headers.get('content-length');
      if (contentRange) res.setHeader('Content-Range', contentRange);
      if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
      if (contentLength) res.setHeader('Content-Length', contentLength);

      if (upstream.body) {
        Readable.fromWeb(upstream.body as unknown as import('node:stream/web').ReadableStream).pipe(res);
      } else {
        const buf = Buffer.from(await upstream.arrayBuffer());
        res.send(buf);
      }
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Signed stream proxy failed',
      });
    }
  });

  // --- PostgreSQL Persistent User, Community & Analytics Endpoints ---

  app.post('/api/users/sync', async (req: Request, res: Response) => {
    try {
      const uid = cleanText(req.body?.uid);
      if (!uid) {
        res.status(400).json({ ok: false, error: 'Missing uid' });
        return;
      }
      const synced = await syncUserInDb({
        uid,
        email: cleanText(req.body?.email),
        displayName: cleanText(req.body?.displayName, 'House Viewer'),
        photoURL: cleanText(req.body?.photoURL) || null,
        avatarInitials: cleanText(req.body?.avatarInitials, 'HD'),
        avatarColor: cleanText(req.body?.avatarColor, '#EF4444'),
        visitDate: cleanText(req.body?.visitDate) || undefined,
      });
      res.json({ ok: true, user: synced });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to sync user',
      });
    }
  });

  app.patch('/api/users/profile', async (req: Request, res: Response) => {
    try {
      const uid = cleanText(req.body?.uid);
      if (!uid) {
        res.status(400).json({ ok: false, error: 'Missing uid' });
        return;
      }
      const updated = await updateUserProfileInDb({
        uid,
        displayName:
          typeof req.body?.displayName === 'string' ? req.body.displayName : undefined,
        bio: typeof req.body?.bio === 'string' ? req.body.bio : undefined,
        preferredLanguage:
          typeof req.body?.preferredLanguage === 'string'
            ? req.body.preferredLanguage
            : undefined,
        preferences:
          req.body?.preferences && typeof req.body.preferences === 'object'
            ? (req.body.preferences as Record<string, unknown>)
            : undefined,
      });
      res.json({ ok: true, user: updated });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to update profile',
      });
    }
  });

  app.get('/api/users/:uid', async (req: Request, res: Response) => {
    try {
      const uid = cleanText(String(req.params.uid || ''));
      if (!uid) {
        res.status(400).json({ ok: false, error: 'Missing uid' });
        return;
      }
      const user = await getUserFromDb(uid);
      if (!user) {
        res.status(404).json({ ok: false, error: 'User not found' });
        return;
      }
      res.json({ ok: true, user });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load user',
      });
    }
  });

  // --- Watch History Cloud Sync ---

  app.get('/api/watch-history', async (req: Request, res: Response) => {
    try {
      const userId = cleanText(req.query.userId);
      if (!userId) {
        res.status(400).json({ ok: false, error: 'Missing userId' });
        return;
      }
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 24));
      const items = await listWatchHistoryFromDb(userId, limit);
      res.json({ ok: true, items });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load watch history',
      });
    }
  });

  app.post('/api/watch-history', async (req: Request, res: Response) => {
    try {
      const userId = cleanText(req.body?.userId);
      const dramaId = cleanText(req.body?.dramaId);
      const provider = cleanText(req.body?.provider, 'DramaBox');
      if (!userId || !dramaId) {
        res.status(400).json({ ok: false, error: 'userId and dramaId are required' });
        return;
      }
      const saved = await upsertWatchHistoryInDb({
        userId,
        dramaId,
        provider,
        mediaType:
          req.body?.mediaType === 'movie' || provider === 'LK21'
            ? 'movie'
            : 'drama',
        episodeNumber: Math.max(1, Number(req.body?.episodeNumber ?? req.body?.episode) || 1),
        currentTime: Math.max(0, Number(req.body?.currentTime) || 0),
        duration: Math.max(0, Number(req.body?.duration) || 0),
        progress: Math.min(100, Math.max(0, Number(req.body?.progress) || 0)),
        drama:
          req.body?.drama && typeof req.body.drama === 'object'
            ? (req.body.drama as Record<string, unknown>)
            : {},
      });
      res.json({ ok: true, saved });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to save watch history',
      });
    }
  });

  app.delete('/api/watch-history', async (req: Request, res: Response) => {
    try {
      const userId = cleanText(req.query.userId ?? req.body?.userId);
      const dramaId = cleanText(req.query.dramaId ?? req.body?.dramaId);
      const provider = cleanText(req.query.provider ?? req.body?.provider) || undefined;
      if (!userId || !dramaId) {
        res.status(400).json({ ok: false, error: 'userId and dramaId are required' });
        return;
      }
      const deleted = await deleteWatchHistoryInDb(userId, dramaId, provider);
      res.json({ ok: true, deleted });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to delete watch history',
      });
    }
  });

  // --- Advanced Multi-Filter Catalog Discovery ---

  app.get('/api/catalog/filter', async (req: Request, res: Response) => {
    try {
      const genre = cleanText(req.query.genre);
      const status = cleanText(req.query.status, 'all');
      const sort = cleanText(req.query.sort, 'popular');
      const provider = cleanText(req.query.provider, 'All');
      const q = cleanText(req.query.q);
      const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 24));
      const offset = Math.max(0, Number(req.query.offset) || 0);

      let result = await filterCatalogFromDb({
        genre,
        status,
        sort,
        provider,
        q,
        limit,
        offset,
      });

      if (result.total === 0 && offset === 0) {
        const seededCount = await seedCatalogFromExistingCacheIfEmpty();
        if (seededCount > 0) {
          result = await filterCatalogFromDb({
            genre,
            status,
            sort,
            provider,
            q,
            limit,
            offset,
          });
        }
      }

      const [enrichedItems, statsMap] = [
        result.items,
        await getTrendingStatsMapFromDb(250),
      ];
      const itemsWithBadges = attachLiveBadgesToItems(
        enrichedItems as unknown as CachedDramaItem[],
        statsMap
      );

      res.json({
        ok: true,
        items: itemsWithBadges,
        total: result.total,
        limit,
        offset,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to filter catalog',
      });
    }
  });

  // --- Programmatic SEO Landing Data Endpoint ---
  app.get('/api/seo/landing', async (req: Request, res: Response) => {
    try {
      const slug = cleanText(req.query.slug, 'romance');
      const modifier = cleanText(req.query.modifier) || undefined;
      const basePathRaw = cleanText(req.query.basePath, 'genre');
      const basePath: 'genre' | 'tag' | 'category' =
        basePathRaw === 'tag' || basePathRaw === 'category' ? basePathRaw : 'genre';
      const landing = resolveProgrammaticLanding(slug, basePath, modifier);

      const overrideStatus = cleanText(req.query.status) || landing.filter.status || 'all';
      const overrideSort = cleanText(req.query.sort) || landing.filter.sort || 'popular';
      const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 30));

      let result = await filterCatalogFromDb({
        genre: landing.filter.genre,
        status: overrideStatus,
        sort: overrideSort,
        q: landing.filter.q,
        limit,
        offset: 0,
      });

      if (result.items.length === 0 && (landing.filter.genre || landing.filter.q)) {
        result = await filterCatalogFromDb({
          genre: landing.filter.genre,
          status: overrideStatus,
          sort: overrideSort,
          limit,
          offset: 0,
        });
      }

      if (result.total === 0) {
        await seedCatalogFromExistingCacheIfEmpty();
        result = await filterCatalogFromDb({
          genre: landing.filter.genre,
          status: overrideStatus,
          sort: overrideSort,
          limit,
          offset: 0,
        });
      }

      const statsMap = await getTrendingStatsMapFromDb(250);
      const itemsWithBadges = attachLiveBadgesToItems(
        result.items as unknown as CachedDramaItem[],
        statsMap
      );

      res.json({
        ok: true,
        landing,
        items: itemsWithBadges,
        total: result.total,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load SEO landing catalog',
      });
    }
  });

  // --- Google Indexing API Automation Endpoints ---
  app.get('/api/seo/indexing/status', async (req: Request, res: Response) => {
    try {
      const summary = await getGoogleIndexingStatus(resolveOrigin(req));
      res.json({ ok: true, ...summary });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load Google indexing status',
      });
    }
  });

  app.post('/api/seo/indexing/ping', async (req: Request, res: Response) => {
    try {
      const origin = resolveOrigin(req);
      const force = Boolean(req.body?.force);
      const singleUrl = cleanText(req.body?.url);
      const urlList = Array.isArray(req.body?.urls)
        ? (req.body.urls as unknown[]).map((u) => cleanText(u)).filter(Boolean)
        : [];
      const batchRecent = Boolean(req.body?.batchRecent) || (!singleUrl && urlList.length === 0);
      const limit = Math.min(50, Math.max(1, Number(req.body?.limit) || 15));

      const targets: Array<{
        url: string;
        entityType: 'drama' | 'episode' | 'genre' | 'page';
        entityId: string;
        provider: string;
        action: 'URL_UPDATED' | 'URL_DELETED';
      }> = [];

      const action: 'URL_UPDATED' | 'URL_DELETED' =
        req.body?.action === 'URL_DELETED' ? 'URL_DELETED' : 'URL_UPDATED';

      if (singleUrl) {
        const absUrl = singleUrl.startsWith('/') ? `${origin}${singleUrl}` : singleUrl;
        targets.push({
          url: absUrl,
          entityType: absUrl.includes('?ep=') ? 'episode' : absUrl.includes('/genre/') ? 'genre' : 'drama',
          entityId: cleanText(req.body?.dramaId),
          provider: cleanText(req.body?.provider, 'HouseDrama'),
          action,
        });
      }

      for (const rawU of urlList) {
        const absUrl = rawU.startsWith('/') ? `${origin}${rawU}` : rawU;
        targets.push({
          url: absUrl,
          entityType: absUrl.includes('?ep=') ? 'episode' : absUrl.includes('/genre/') ? 'genre' : 'drama',
          entityId: '',
          provider: 'HouseDrama',
          action,
        });
      }

      if (batchRecent && targets.length === 0) {
        const recentDramas = await listCatalogForSitemapFromDb(limit);
        for (const d of recentDramas) {
          targets.push({
            url: `${origin}/drama/${encodeURIComponent(d.slug)}`,
            entityType: 'drama',
            entityId: d.dramaId,
            provider: d.provider,
            action,
          });
        }
      }

      const results = await notifyGoogleIndexingUrls(targets, {
        fallbackOrigin: origin,
        force,
        maxBatchSize: limit,
      });

      res.json({
        ok: true,
        submittedCount: results.filter((r) => r.status === 'submitted').length,
        queuedCount: results.filter((r) => r.status === 'queued_unconfigured').length,
        skippedCount: results.filter((r) => r.status === 'skipped_recent').length,
        results,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to ping Google Indexing API',
      });
    }
  });

  // --- Clean SEO Slug Resolver ---

  app.get('/api/drama/resolve', async (req: Request, res: Response) => {
    try {
      const slug = cleanText(req.query.slug);
      if (!slug) {
        res.status(400).json({ ok: false, error: 'Missing slug query parameter' });
        return;
      }

      let dbHit = await resolveDramaBySlugFromDb(slug);
      if (!dbHit) {
        await seedCatalogFromExistingCacheIfEmpty();
        dbHit = await resolveDramaBySlugFromDb(slug);
      }

      if (dbHit) {
        res.json({
          ok: true,
          dramaId: dbHit.dramaId,
          provider: dbHit.provider,
          slug: dbHit.slug,
          drama: {
            ...dbHit.drama,
            bookId: dbHit.dramaId,
            provider: dbHit.provider,
            slug: dbHit.slug,
          },
        });
        return;
      }

      const homeHit = await findDramaBySlugInHomeCache(slug);
      if (homeHit) {
        res.json({
          ok: true,
          dramaId: homeHit.bookId,
          provider: homeHit.provider,
          slug: homeHit.slug || slugifyTitle(homeHit.title),
          drama: homeHit,
        });
        return;
      }

      res.status(404).json({ ok: false, error: 'Drama slug not found' });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to resolve drama slug',
      });
    }
  });

  app.get('/api/comments', async (req: Request, res: Response) => {
    try {
      const userId = cleanText(req.query.userId);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
      const offset = Math.max(0, Number(req.query.offset) || 0);

      if (userId) {
        const result = await listUserCommentsFromDb(userId, limit, offset);
        res.json({ ok: true, ...result, limit, offset });
        return;
      }

      const dramaId = cleanText(req.query.dramaId);
      const provider = cleanText(req.query.provider, 'DramaBox');
      const episode = Math.max(1, Number(req.query.episode) || 1);
      if (!dramaId) {
        res.status(400).json({ ok: false, error: 'Missing dramaId query parameter' });
        return;
      }
      const result = await listCommentsFromDb(dramaId, provider, episode, limit, offset);
      res.json({ ok: true, ...result, limit, offset });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to fetch comments',
      });
    }
  });

  app.post('/api/comments', async (req: Request, res: Response) => {
    try {
      const dramaId = cleanText(req.body?.dramaId);
      const provider = cleanText(req.body?.provider, 'DramaBox');
      const episodeNumber = Math.max(1, Number(req.body?.episodeNumber) || 1);
      const content = cleanText(req.body?.text ?? req.body?.content);
      const authorName = cleanText(req.body?.authorName ?? req.body?.author, 'Viewer');
      if (!dramaId || !content) {
        res.status(400).json({ ok: false, error: 'dramaId and text are required' });
        return;
      }
      const id =
        cleanText(req.body?.id) ||
        `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const videoTimestampSec = Math.max(
        0,
        Math.floor(Number(req.body?.videoTimestampSec) || 0)
      );
      const comment = await createCommentInDb({
        id,
        dramaId,
        provider,
        episodeNumber,
        userId: cleanText(req.body?.userId ?? req.body?.authorUid) || undefined,
        authorName,
        authorEmail: cleanText(req.body?.authorEmail) || undefined,
        authorPhotoURL: cleanText(req.body?.authorPhotoURL) || null,
        authorBadge: cleanText(req.body?.authorBadge) || undefined,
        authorInitials: cleanText(req.body?.authorInitials) || undefined,
        authorColor: cleanText(req.body?.authorColor) || undefined,
        content,
        videoTimestampSec,
      });
      res.status(201).json({ ok: true, comment });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to create comment',
      });
    }
  });

  app.get('/api/likes', async (req: Request, res: Response) => {
    try {
      const userId = cleanText(req.query.userId);
      if (!userId) {
        res.status(400).json({ ok: false, error: 'Missing userId' });
        return;
      }
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const result = await listLikesFromDb(userId, limit, offset);
      res.json({ ok: true, ...result, limit, offset });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load likes',
      });
    }
  });

  app.post('/api/likes/toggle', async (req: Request, res: Response) => {
    try {
      const userId = cleanText(req.body?.userId);
      const dramaId = cleanText(req.body?.dramaId);
      const provider = cleanText(req.body?.provider, 'DramaBox');
      if (!userId || !dramaId) {
        res.status(400).json({ ok: false, error: 'userId and dramaId are required' });
        return;
      }
      const result = await toggleLikeInDb(userId, dramaId, provider);
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to toggle like',
      });
    }
  });

  app.get('/api/favorites', async (req: Request, res: Response) => {
    try {
      const userId = cleanText(req.query.userId);
      if (!userId) {
        res.status(400).json({ ok: false, error: 'Missing userId' });
        return;
      }
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const result = await listFavoritesFromDb(userId, limit, offset);
      res.json({ ok: true, ...result, limit, offset });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load favorites',
      });
    }
  });

  app.post('/api/favorites/toggle', async (req: Request, res: Response) => {
    try {
      const userId = cleanText(req.body?.userId);
      const dramaId = cleanText(req.body?.dramaId);
      const provider = cleanText(req.body?.provider, 'DramaBox');
      if (!userId || !dramaId) {
        res.status(400).json({ ok: false, error: 'userId and dramaId are required' });
        return;
      }
      const dramaObj =
        req.body?.drama && typeof req.body.drama === 'object'
          ? (req.body.drama as Record<string, unknown>)
          : undefined;
      const result = await toggleFavoriteInDb({
        userId,
        dramaId,
        provider,
        folderId: cleanText(req.body?.folderId, 'all'),
        title: cleanText(req.body?.title ?? dramaObj?.title),
        cover: cleanText(req.body?.cover ?? dramaObj?.cover),
        drama: dramaObj,
        forceSave: Boolean(req.body?.forceSave),
      });
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to toggle favorite',
      });
    }
  });

  app.patch('/api/favorites/folder', async (req: Request, res: Response) => {
    try {
      const userId = cleanText(req.body?.userId);
      const dramaId = cleanText(req.body?.dramaId);
      const provider = cleanText(req.body?.provider, 'DramaBox');
      const folderId = cleanText(req.body?.folderId, 'all');
      if (!userId || !dramaId) {
        res.status(400).json({ ok: false, error: 'userId and dramaId are required' });
        return;
      }
      const updated = await updateFavoriteFolderInDb(userId, dramaId, provider, folderId);
      res.json({ ok: true, updated, folderId });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to update folder',
      });
    }
  });

  app.post('/api/stats/view', async (req: Request, res: Response) => {
    try {
      const dramaId = cleanText(req.body?.dramaId);
      const provider = cleanText(req.body?.provider, 'DramaBox');
      const episodeNumber = Math.max(1, Number(req.body?.episodeNumber) || 1);
      if (!dramaId) {
        res.status(400).json({ ok: false, error: 'dramaId is required' });
        return;
      }
      const result = await recordVideoViewInDb(dramaId, provider, episodeNumber);
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to record view',
      });
    }
  });

  app.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const dramaId = cleanText(req.query.dramaId);
      const provider = cleanText(req.query.provider, 'DramaBox');
      if (dramaId) {
        const stats = await getDramaStatsFromDb(dramaId, provider);
        res.json({ ok: true, stats });
        return;
      }
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const top = await getTopDailyStatsFromDb(limit, offset);
      res.json({ ok: true, items: top, limit, offset });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load stats',
      });
    }
  });

  app.get('/api/stats/badges', async (_req: Request, res: Response) => {
    try {
      const stats = await getTrendingStatsMapFromDb(250);
      res.setHeader('Cache-Control', 'public, max-age=15');
      res.json({ ok: true, stats });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to load live trending badges',
      });
    }
  });

  app.get('/api/visitors/stats', async (_req: Request, res: Response) => {
    try {
      const stats = await getSiteVisitorStatsFromDb();
      if (stats) {
        res.json(stats);
        return;
      }
    } catch {
      // Fallback below
    }
    res.json({
      onlineNow: new Set(Array.from(activeSessions.values()).map((v) => v.visitorId)).size,
      todayVisitors: todayUniqueVisitors,
      totalVisitors: cumulativeVisitors,
      totalViews: cumulativeViews,
    });
  });

  app.post('/api/visitors/heartbeat', async (req: Request, res: Response) => {
    const now = Date.now();
    const day = new Date().toISOString().slice(0, 10);
    if (day !== currentDayKey) {
      currentDayKey = day;
      todayUniqueVisitors = 0;
      countedTodayVisitors.clear();
    }

    const sid =
      typeof req.body?.sessionId === 'string' && req.body.sessionId.trim()
        ? req.body.sessionId.trim().slice(0, 128)
        : `sess-${req.ip || 'local'}`;
    const vid =
      typeof req.body?.visitorId === 'string' && req.body.visitorId.trim()
        ? req.body.visitorId.trim().slice(0, 128)
        : sid;

    activeSessions.set(sid, { visitorId: vid, lastSeen: now });
    if (!countedTodayVisitors.has(vid)) {
      countedTodayVisitors.add(vid);
      todayUniqueVisitors += 1;
    }
    if (!countedAllTimeVisitors.has(vid)) {
      countedAllTimeVisitors.add(vid);
      cumulativeVisitors += 1;
    }
    if (!countedSessionViews.has(sid)) {
      countedSessionViews.add(sid);
      cumulativeViews += 1;
    }

    // Expire sessions idle > 60s
    for (const [key, entry] of activeSessions.entries()) {
      if (now - entry.lastSeen > 60_000) {
        activeSessions.delete(key);
      }
    }

    try {
      const persisted = await recordVisitorHeartbeatInDb(sid, vid);
      if (persisted) {
        res.json(persisted);
        return;
      }
    } catch {
      // Fallback gracefully to zero-based in-memory counters
    }

    const uniqueOnline = new Set(
      Array.from(activeSessions.values()).map((v) => v.visitorId)
    ).size;

    res.json({
      onlineNow: Math.max(1, uniqueOnline),
      todayVisitors: todayUniqueVisitors,
      totalVisitors: cumulativeVisitors,
      totalViews: cumulativeViews,
    });
  });

  app.get('/robots.txt', (req: Request, res: Response) => {
    const origin = resolveOrigin(req);
    res
      .type('text/plain')
      .send(
        [
          'User-agent: *',
          'Allow: /',
          'Allow: /movies',
          'Allow: /movie/',
          'Allow: /drama/',
          'Allow: /genre/',
          'Allow: /category/',
          'Allow: /tag/',
          'Allow: /explore',
          'Allow: /trending',
          'Allow: /latest',
          'Allow: /vip',
          'Disallow: /api/',
          'Disallow: /api/*',
          'Disallow: /dashboard',
          '',
          `Sitemap: ${origin}/sitemap.xml`,
          '',
        ].join('\n')
      );
  });

  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    const origin = resolveOrigin(req);
    const seenLocs = new Set<string>();
    const entries: {
      loc: string;
      changefreq: string;
      priority: string;
      lastmod?: string;
    }[] = [];

    const pushEntry = (
      loc: string,
      changefreq: string,
      priority: string,
      lastmod?: string
    ) => {
      if (seenLocs.has(loc)) return;
      seenLocs.add(loc);
      entries.push({ loc, changefreq, priority, lastmod });
    };

    const todayIso = new Date().toISOString().split('T')[0];
    pushEntry(`${origin}/`, 'hourly', '1.0', todayIso);
    pushEntry(`${origin}/movies`, 'hourly', '0.95', todayIso);
    pushEntry(`${origin}/explore`, 'hourly', '0.9', todayIso);
    pushEntry(`${origin}/trending`, 'hourly', '0.9', todayIso);
    pushEntry(`${origin}/latest`, 'hourly', '0.9', todayIso);
    pushEntry(`${origin}/vip`, 'daily', '0.8', todayIso);

    for (const preset of CURATED_PROGRAMMATIC_PAGES) {
      pushEntry(`${origin}/genre/${preset.slug}`, 'daily', '0.9', todayIso);
    }

    const coreGenreSlugs = [
      'ceo',
      'romance',
      'billionaire',
      'revenge',
      'fantasy',
      'historical',
      'action',
      'dubbed',
    ];
    for (const slug of coreGenreSlugs) {
      pushEntry(`${origin}/tag/${slug}`, 'daily', '0.85', todayIso);
    }

    // 1) Instantaneous read from PostgreSQL / L1 memory cache (clean /drama/{slug})
    const cachedSitemap = await getCachedDramasForSitemap(2000);
    for (const tag of cachedSitemap.tags) {
      const slug = slugifyTitle(tag);
      if (slug) {
        pushEntry(`${origin}/tag/${slug}`, 'daily', '0.9');
      }
    }
    for (const item of cachedSitemap.dramas) {
      const cleanSlug = item.slug || slugifyTitle(item.title);
      const loc = `${origin}/drama/${encodeURIComponent(cleanSlug)}`;
      const lastmod = item.updatedAt
        ? new Date(item.updatedAt).toISOString().split('T')[0]
        : todayIso;
      pushEntry(loc, 'daily', '0.8', lastmod);
    }

    // 1b) Dedicated LK21 Movies catalog from PostgreSQL `movies` table
    const cachedMovies = await listMoviesForSitemapFromDb(1500);
    for (const m of cachedMovies) {
      if (!m.slug) continue;
      const loc = `${origin}/movie/${encodeURIComponent(m.slug)}`;
      const lastmod = m.updatedAt
        ? new Date(m.updatedAt).toISOString().split('T')[0]
        : todayIso;
      pushEntry(loc, 'daily', '0.85', lastmod);
    }

    // 2) Upstream fallback only if cache has zero dramas yet (e.g. cold boot)
    if (cachedSitemap.dramas.length === 0) {
      try {
        const token = getMolaToken();
        if (token) {
          const [rankRes, newRes, nsRankRes, nsAllRes, arForYouRes, mlRankRes] =
            await Promise.allSettled([
              fetch(
                `${DRAMABOX_BASE_URL}/ranking?page=1&lang=en&token=${token}`,
                { signal: AbortSignal.timeout(5000) }
              ),
              fetch(
                `${DRAMABOX_BASE_URL}/terbaru?page=1&lang=en&token=${token}`,
                { signal: AbortSignal.timeout(5000) }
              ),
              fetch(
                `${NETSHORT_BASE_URL}/trending?page=1&lang=en_US&token=${token}`,
                { signal: AbortSignal.timeout(5000) }
              ),
              fetch(
                `${NETSHORT_BASE_URL}/all?page=1&lang=en_US&token=${token}`,
                { signal: AbortSignal.timeout(5000) }
              ),
              fetch(
                `${ANYREEL_BASE_URL}/foryou?page=1&lang=en&token=${token}`,
                { signal: AbortSignal.timeout(5000) }
              ),
              fetch(
                `${MELOLO_BASE_URL}/rank?page=1&page_size=18&token=${token}`,
                { signal: AbortSignal.timeout(5000) }
              ),
            ]);
          const processResult = async (
            r: PromiseSettledResult<globalThis.Response>,
            _provider: SsrProviderName
          ) => {
            if (r.status !== 'fulfilled' || !r.value.ok) return;
            const json = (await r.value.json()) as Record<string, unknown>;
            const list = Array.isArray(json.books)
              ? (json.books as Record<string, unknown>[])
              : Array.isArray(json.data) &&
                Array.isArray((json.data[0] as Record<string, unknown>)?.books)
              ? ((json.data[0] as Record<string, unknown>).books as Record<
                  string,
                  unknown
                >[])
              : Array.isArray(json.data)
              ? (json.data as Record<string, unknown>[])
              : [];
            for (const item of list) {
              const title = cleanText(item.bookName ?? item.title);
              if (title) {
                pushEntry(
                  `${origin}/drama/${encodeURIComponent(slugifyTitle(title))}`,
                  'daily',
                  '0.8',
                  todayIso
                );
              }
            }
          };
          await Promise.all([
            processResult(rankRes, 'DramaBox'),
            processResult(newRes, 'DramaBox'),
            processResult(nsRankRes, 'NetShort'),
            processResult(nsAllRes, 'NetShort'),
            processResult(arForYouRes, 'AnyReel'),
            processResult(mlRankRes, 'Melolo'),
          ]);
        }
      } catch {
        // Fallback to root & tag entries
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
      .map(
        (entry) =>
          `  <url><loc>${escapeHtmlAttr(entry.loc)}</loc>${
            entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''
          }<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
      )
      .join('\n')}\n</urlset>`;
    res
      .type('application/xml')
      .set('Cache-Control', 'public, max-age=900')
      .send(xml);
  });

  app.use(async (req: Request, res: Response) => {
    try {
      const origin = resolveOrigin(req);
      const htmlPath = IS_PROD
        ? path.resolve(distDir, 'index.html')
        : path.resolve(rootDir, 'index.html');
      let html = fs.readFileSync(htmlPath, 'utf-8');

      if (vite) {
        html = await vite.transformIndexHtml(req.originalUrl, html);
      }

      const movieSlugMatch = req.path.match(/^\/movie\/([^/]+)/i);

      const provMatch = !movieSlugMatch
        ? req.path.match(
            /^\/drama\/(dramabox|netshort|anyreel|melolo|dramaora|meloshort|petadrama|radreels|dramaverse|kalostv|stardusttv|stardust|starshort|dramabite|loveshots|mydrama|shotshort|moboreels|blinkdrama|wetv|cubetv|microdrama|flareflow|fundrama|freeshort|toonshort|happyshort|dramadash|storyreel_v2|storyreelv2|storyreel|vibeshort_v2|vibeshortv2|vibeshort|flickreels|dramawave|freereels|pinedrama|shortmax_v2|shortmaxv2|shortmax|flextv|vigloo|dotdrama|idrama_v2|idramav2|idrama|goodshort|reelshort_v2|reelshortv2|reelshort|joyreels|sodareels|bonustv|iqiyi)\/([^/]+)/i
          )
        : null;
      const slugOrIdMatch =
        !movieSlugMatch && !provMatch
          ? req.path.match(/^\/drama\/([^/]+)/)
          : null;

      const tagMatch =
        !movieSlugMatch && !provMatch && !slugOrIdMatch
          ? req.path.match(/^\/tag\/([^/]+)/i)
          : null;

      const genreMatch =
        !movieSlugMatch && !provMatch && !slugOrIdMatch && !tagMatch
          ? req.path.match(/^\/(genre|category)\/([^/]+)(?:\/([^/]+))?/i)
          : null;

      const sectionRouteMap: Record<
        string,
        { title: string; description: string; canonicalPath: string }
      > = {
        '/movies': {
          title: 'Watch Free HD Movies Online — Box Office, Asian Cinema & Series | House Drama',
          description:
            'Stream thousands of full HD feature films, Asian cinema, Korean movies, Hollywood hits, and latest releases free online at House Drama Movies.',
          canonicalPath: '/movies',
        },
        '/explore': {
          title: 'Explore All Vertical Short Dramas by Genre & Filter | House Drama',
          description:
            'Filter 49+ short drama platforms by CEO, Romance, Revenge, Fantasy, Billionaire, status, and rating. Stream free HD episodes on House Drama.',
          canonicalPath: '/explore',
        },
        '/trending': {
          title: 'Trending Short Dramas Right Now — Top Ranked Series | House Drama',
          description:
            'Watch today’s #1 viral short dramas and top-ranked mini-series streamed globally in crisp HD on House Drama.',
          canonicalPath: '/trending',
        },
        '/latest': {
          title: 'Latest New Releases — Fresh Daily Short Dramas | House Drama',
          description:
            'Catch newly released episodes and premiering short drama series updated daily across 49+ platforms.',
          canonicalPath: '/latest',
        },
        '/vip': {
          title: 'VIP Exclusive Vertical Short Dramas | House Drama',
          description:
            'Discover VIP-exclusive billionaire romance, revenge sagas, and cinematic mini-series in full HD.',
          canonicalPath: '/vip',
        },
      };

      const sectionSeo = sectionRouteMap[req.path.toLowerCase()];

      if (movieSlugMatch) {
        const mSlug = decodeURIComponent(movieSlugMatch[1]).toLowerCase();
        const [movieDetail, movieEps] = await Promise.all([
          getLk21Detail(getMolaToken, mSlug, origin).catch(() => null),
          getLk21Episodes(getMolaToken, mSlug).catch(() => null),
        ]);
        if (movieDetail) {
          html = injectMovieSeoIntoHtml(
            html,
            origin,
            movieDetail,
            movieEps?.episodes ?? []
          );
        }
      } else if (provMatch) {
        const bookId = decodeURIComponent(provMatch[2]);
        const providerHint = parseSsrProviderName(provMatch[1].toLowerCase());
        const { drama, episodes } = await fetchDramaForSsr(bookId, providerHint);
        if (drama) {
          html = injectDramaSeoIntoHtml(html, origin, bookId, drama, episodes);
        }
      } else if (slugOrIdMatch) {
        const segment = decodeURIComponent(slugOrIdMatch[1]);
        const dbResolved =
          (await resolveDramaBySlugFromDb(segment)) ||
          (await (async () => {
            await seedCatalogFromExistingCacheIfEmpty();
            return resolveDramaBySlugFromDb(segment);
          })());

        if (dbResolved) {
          const providerHint = parseSsrProviderName(dbResolved.provider);
          const { drama: liveDrama, episodes } = await fetchDramaForSsr(
            dbResolved.dramaId,
            providerHint
          );
          if (episodes.length > 0) {
            void updateCatalogEpisodeCountIfHigherInDb(
              dbResolved.dramaId,
              dbResolved.provider,
              episodes.length
            )
              .then((updated) => {
                if (updated && updated.increased) {
                  return notifyCatalogAdditionsToGoogle(
                    [
                      {
                        dramaId: dbResolved.dramaId,
                        provider: dbResolved.provider,
                        slug: updated.slug,
                        chapterCount: updated.chapterCount,
                        reason: 'new_episode',
                      },
                    ],
                    origin
                  );
                }
                return [];
              })
              .catch(() => {});
          }
          const cached = dbResolved.drama;
          const ssrDrama: SsrDrama = liveDrama
            ? { ...liveDrama, slug: dbResolved.slug }
            : {
                bookId: dbResolved.dramaId,
                title: cleanText(cached.title, segment),
                slug: dbResolved.slug,
                cover: cleanText(cached.cover),
                description: cleanText(
                  cached.description,
                  `Watch ${cleanText(cached.title, segment)} full episodes in HD on House Drama.`
                ),
                chapterCount: Number(cached.chapterCount) || 1,
                tags: Array.isArray(cached.tags)
                  ? cached.tags.map((t) => String(t))
                  : [],
                playCount: cleanText(cached.playCount) || undefined,
                protagonist: cleanText(cached.protagonist) || undefined,
                isVip: Boolean(cached.isVip),
                provider: providerHint,
              };
          html = injectDramaSeoIntoHtml(
            html,
            origin,
            dbResolved.dramaId,
            ssrDrama,
            episodes
          );
        } else {
          const homeItem = await findDramaBySlugInHomeCache(segment);
          if (homeItem) {
            const providerHint = parseSsrProviderName(homeItem.provider);
            const { drama: liveDrama, episodes } = await fetchDramaForSsr(
              homeItem.bookId,
              providerHint
            );
            const ssrDrama: SsrDrama = liveDrama
              ? { ...liveDrama, slug: homeItem.slug }
              : {
                  bookId: homeItem.bookId,
                  title: homeItem.title,
                  slug: homeItem.slug,
                  cover: homeItem.cover,
                  description: homeItem.description,
                  chapterCount: homeItem.chapterCount,
                  tags: homeItem.tags,
                  playCount: homeItem.playCount,
                  protagonist: homeItem.protagonist,
                  isVip: homeItem.isVip,
                  provider: providerHint,
                };
            html = injectDramaSeoIntoHtml(
              html,
              origin,
              homeItem.bookId,
              ssrDrama,
              episodes
            );
          } else {
            const providerHint = parseSsrProviderName(
              String(req.query.provider ?? '')
            );
            const { drama, episodes } = await fetchDramaForSsr(
              segment,
              providerHint
            );
            if (drama) {
              html = injectDramaSeoIntoHtml(
                html,
                origin,
                segment,
                drama,
                episodes
              );
            }
          }
        }
      } else if (tagMatch || genreMatch) {
        const baseKind: 'genre' | 'tag' | 'category' = tagMatch
          ? 'tag'
          : genreMatch?.[1].toLowerCase() === 'category'
          ? 'category'
          : 'genre';
        const slugSeg = tagMatch ? tagMatch[1] : genreMatch![2];
        const modSeg = genreMatch?.[3];
        const landing = resolveProgrammaticLanding(slugSeg, baseKind, modSeg);
        const filtered = await filterCatalogFromDb({
          genre: landing.filter.genre,
          status: landing.filter.status,
          sort: landing.filter.sort,
          q: landing.filter.q,
          limit: 12,
          offset: 0,
        });
        html = injectProgrammaticSeoIntoHtml(html, origin, landing, filtered.items);
      } else if (sectionSeo) {
        const canonical = `${origin}${sectionSeo.canonicalPath}`;
        const ogImage = `${origin}${DEFAULT_OG_IMAGE_PATH}`;
        html = html
          .replace(/<title>[\s\S]*?<\/title>/i, '')
          .replace(/<meta\s+name="description"[\s\S]*?\/>/i, '')
          .replace(/<meta\s+property="og:(title|description|url|image)"[\s\S]*?\/>/gi, '')
          .replace(/<meta\s+name="twitter:(title|description|image)"[\s\S]*?\/>/gi, '')
          .replace(/<link\s+rel="canonical"[\s\S]*?\/>/i, '')
          .replace(/<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]*"\s*\/?>/gi, '')
          .replace(
            '</head>',
            `<title>${escapeHtmlAttr(sectionSeo.title)}</title>\n<meta name="description" content="${escapeHtmlAttr(sectionSeo.description)}" />\n<meta property="og:title" content="${escapeHtmlAttr(sectionSeo.title)}" />\n<meta property="og:description" content="${escapeHtmlAttr(sectionSeo.description)}" />\n<meta property="og:url" content="${escapeHtmlAttr(canonical)}" />\n<meta property="og:image" content="${escapeHtmlAttr(ogImage)}" />\n<meta name="twitter:title" content="${escapeHtmlAttr(sectionSeo.title)}" />\n<meta name="twitter:description" content="${escapeHtmlAttr(sectionSeo.description)}" />\n<meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}" />\n<link rel="canonical" href="${escapeHtmlAttr(canonical)}" />\n<link rel="alternate" hreflang="en" href="${escapeHtmlAttr(canonical)}" />\n<link rel="alternate" hreflang="x-default" href="${escapeHtmlAttr(canonical)}" />\n</head>`
          );
      } else {
        const canonical = `${origin}${req.path === '/' ? '/' : req.path}`;
        const absoluteOgImage = `${origin}${DEFAULT_OG_IMAGE_PATH}`;
        html = html
          .replace(
            new RegExp(`content="${DEFAULT_OG_IMAGE_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
            `content="${escapeHtmlAttr(absoluteOgImage)}"`
          )
          .replace(/<link\s+rel="canonical"[\s\S]*?\/>/i, '')
          .replace(/<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]*"\s*\/?>/gi, '')
          .replace(
            '</head>',
            `  <link rel="canonical" href="${escapeHtmlAttr(canonical)}" />\n  <link rel="alternate" hreflang="en" href="${escapeHtmlAttr(canonical)}" />\n  <link rel="alternate" hreflang="x-default" href="${escapeHtmlAttr(canonical)}" />\n  </head>`
          );
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (err) {
      if (vite && err instanceof Error) {
        vite.ssrFixStacktrace(err);
      }
      res.status(500).send('Server rendering error');
    }
  });

  await ensureDatabaseReady();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HouseDrama SSR server running on http://0.0.0.0:${PORT}`);
    startHomeCacheWorker(getMolaToken);
    startLk21Prewarm(getMolaToken);
  });
}

startServer();
