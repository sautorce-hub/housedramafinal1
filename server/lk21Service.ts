import {
  findMovieEpisodeByVidOrSlugFromDb,
  getLk21CacheFromDb,
  getMovieBySlugFromDb,
  getMovieEpisodesFromDb,
  getTrendingStatsMapFromDb,
  setLk21CacheInDb,
  upsertMovieEpisodesInDb,
  upsertMoviesBatchInDb,
  type LiveDramaBadgeStat,
  type MovieUpsertInput,
} from './db.ts';
import { notifyMovieAdditionsToGoogle } from './googleIndexing.ts';

const LK21_UPSTREAM_BASE = 'https://api.molatv.id/api/lk21';

const HOME_TTL_MS = 45 * 60 * 1000;
const MENU_TTL_MS = 4 * 60 * 60 * 1000;
const LIST_TTL_MS = 30 * 60 * 1000;
const SEARCH_TTL_MS = 10 * 60 * 1000;
const DETAIL_TTL_MS = 60 * 60 * 1000;
const EPISODES_TTL_MS = 45 * 60 * 1000;
const STREAM_TTL_MS = 20 * 60 * 1000;

export interface Lk21MovieCard {
  id: string;
  slug: string;
  app: 'lk21';
  title: string;
  cover: string;
  coverHz: string;
  coverVt: string;
  rating: string;
  quality: string;
  badge: string;
  subtitle: string;
  description: string;
  genre: string[];
  updateInfo: string;
  type: 'movie' | 'series';
  is_movie: boolean;
  dailyViews?: number;
  totalViews?: number;
  trendBadge?: 'HOT' | 'TRENDING';
}

export interface Lk21HomePayload {
  ok: boolean;
  totalMovies: number;
  updated: number;
  rows: Array<{
    key: string;
    label: string;
    items: Lk21MovieCard[];
  }>;
  cached?: boolean;
  stale?: boolean;
  source?: string;
}

export interface Lk21MenuPayload {
  ok: boolean;
  types: Array<{ key: string; label: string }>;
  genres: Array<{ slug: string; name: string }>;
  countries: Array<{ slug: string; name: string }>;
  years: Array<{ slug: string; name: string }>;
}

export interface Lk21ListPayload {
  ok: boolean;
  label?: string;
  key?: string;
  q?: string;
  page: number;
  count: number;
  hasMore: boolean;
  items: Lk21MovieCard[];
}

export interface Lk21DetailPayload {
  ok: boolean;
  id: string;
  slug: string;
  app: 'lk21';
  title: string;
  cover: string;
  coverHz: string;
  poster: string;
  synopsis: string;
  description: string;
  actors: string[];
  director: string;
  year: string;
  area: string;
  genres: string[];
  rating: string;
  quality: string;
  type: 'movie' | 'series';
  updateInfo: string;
  providers: Array<{ name: string; url: string }>;
  recommendations: Lk21MovieCard[];
}

export interface Lk21EpisodePayloadItem {
  id: string;
  vid: string;
  title: string;
  episode: string;
  manEpisode: string;
  order: number;
}

export interface Lk21EpisodesPayload {
  ok: boolean;
  app: 'lk21';
  id: string;
  slug: string;
  title: string;
  count: number;
  episodes: Lk21EpisodePayloadItem[];
}

export interface Lk21StreamPayload {
  ok: boolean;
  type: 'hls' | 'mp4';
  url: string;
  streamUrl: string;
  isHls: boolean;
  title: string;
  poster: string;
  subtitles: Array<{
    id: string;
    label: string;
    lang: string;
    url?: string;
    source: 'api';
  }>;
  episodeNumber: number;
  slug: string;
  vid: string;
}

const memoryLk21Cache = new Map<
  string,
  { payload: unknown; updatedAt: number; expiresAt: number }
>();
const inFlightLk21 = new Map<string, Promise<unknown>>();

function cleanStr(val: unknown, fallback = ''): string {
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

function stripTokensFromString(input: string): string {
  if (!input) return input;
  return input
    .replace(/([?&])token=[^&]*/gi, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?');
}

function sanitizeImageUrl(raw: unknown): string {
  const url = cleanStr(raw);
  if (!url) return '';
  if (url.startsWith('/api/proxy')) return url;
  if (url.startsWith('http://')) {
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function normalizeLk21Card(raw: Record<string, unknown>): Lk21MovieCard | null {
  const slug = cleanStr(raw.slug ?? raw.id).toLowerCase();
  const title = cleanStr(raw.title ?? raw.name);
  if (!slug || !title) return null;

  const cover = sanitizeImageUrl(raw.cover ?? raw.coverVt ?? raw.poster);
  const coverHz = sanitizeImageUrl(raw.coverHz ?? raw.cover ?? raw.poster);
  const coverVt = sanitizeImageUrl(raw.coverVt ?? raw.cover ?? raw.poster);

  const genreRaw = Array.isArray(raw.genre)
    ? raw.genre
    : Array.isArray(raw.genres)
    ? raw.genres
    : [];
  const genre = genreRaw.map((g) => cleanStr(g)).filter(Boolean);

  const rawType = cleanStr(raw.type, 'movie').toLowerCase();
  const isMovie =
    raw.is_movie !== undefined
      ? Boolean(raw.is_movie)
      : rawType !== 'series';

  return {
    id: cleanStr(raw.id, slug),
    slug,
    app: 'lk21',
    title,
    cover,
    coverHz: coverHz || cover,
    coverVt: coverVt || cover,
    rating: cleanStr(raw.rating),
    quality: cleanStr(raw.quality, 'HD'),
    badge: cleanStr(raw.badge),
    subtitle: cleanStr(raw.subtitle),
    description: cleanStr(
      raw.description ?? raw.synopsis,
      `Stream ${title} in Full HD on House Drama Movies.`
    ),
    genre,
    updateInfo: cleanStr(raw.updateInfo),
    type: isMovie ? 'movie' : 'series',
    is_movie: isMovie,
  };
}

function toMovieUpsert(card: Lk21MovieCard, popularityScore = 1000): MovieUpsertInput {
  const ratingNum = parseFloat(card.rating || '0');
  const score = Math.max(
    popularityScore,
    Number.isFinite(ratingNum) ? Math.round(ratingNum * 1000) : 1000
  );
  return {
    slug: card.slug,
    movieId: card.id || card.slug,
    title: card.title,
    cover: card.cover,
    coverHz: card.coverHz,
    poster: card.coverVt || card.cover,
    synopsis: card.description,
    genres: card.genre,
    rating: card.rating,
    quality: card.quality,
    badge: card.badge,
    movieType: card.type,
    updateInfo: card.updateInfo,
    movieJson: card as unknown as Record<string, unknown>,
    popularityScore: score,
  };
}

async function readCache<T>(cacheKey: string): Promise<{
  payload: T;
  updatedAt: number;
  expiresAt: number;
  stale: boolean;
} | null> {
  const now = Date.now();
  const mem = memoryLk21Cache.get(cacheKey);
  if (mem) {
    return {
      payload: mem.payload as T,
      updatedAt: mem.updatedAt,
      expiresAt: mem.expiresAt,
      stale: now > mem.expiresAt,
    };
  }
  const db = await getLk21CacheFromDb(cacheKey);
  if (db) {
    memoryLk21Cache.set(cacheKey, {
      payload: db.payload,
      updatedAt: db.updatedAt,
      expiresAt: db.expiresAt,
    });
    return {
      payload: db.payload as T,
      updatedAt: db.updatedAt,
      expiresAt: db.expiresAt,
      stale: now > db.expiresAt,
    };
  }
  return null;
}

async function writeCache(
  cacheKey: string,
  endpoint: string,
  payload: unknown,
  ttlMs: number
): Promise<void> {
  const now = Date.now();
  const expiresAt = now + ttlMs;
  if (memoryLk21Cache.size > 350) {
    const first = memoryLk21Cache.keys().next().value;
    if (first) memoryLk21Cache.delete(first);
  }
  memoryLk21Cache.set(cacheKey, { payload, updatedAt: now, expiresAt });
  await setLk21CacheInDb(cacheKey, endpoint, payload, ttlMs);
}

async function persistDiscoveredMovies(
  cards: Lk21MovieCard[],
  fallbackOrigin?: string
): Promise<void> {
  if (!cards || cards.length === 0) return;
  const dedup = new Map<string, MovieUpsertInput>();
  cards.forEach((c, idx) => {
    if (!c.slug || dedup.has(c.slug)) return;
    dedup.set(c.slug, toMovieUpsert(c, Math.max(500, 5000 - idx * 25)));
  });
  const inserted = await upsertMoviesBatchInDb(Array.from(dedup.values()));
  if (inserted.length > 0) {
    void notifyMovieAdditionsToGoogle(inserted, fallbackOrigin).catch(() => {});
  }
}

function attachStatsToMovies(
  items: Lk21MovieCard[],
  statsMap: Record<string, LiveDramaBadgeStat>
): Lk21MovieCard[] {
  return items.map((item) => {
    const stat = statsMap[`LK21:${item.slug}`] || statsMap[`LK21:${item.id}`];
    if (!stat) return item;
    return {
      ...item,
      dailyViews: stat.dailyViews,
      totalViews: stat.totalViews,
      trendBadge: stat.trendBadge,
    };
  });
}

async function fetchUpstreamLk21Json(
  token: string,
  endpoint: string,
  params?: Record<string, string | number>
): Promise<Record<string, unknown>> {
  const url = new URL(`${LK21_UPSTREAM_BASE}${endpoint}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && String(v) !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    throw new Error(`LK21 upstream error HTTP ${res.status}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

function runDeduplicated<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlightLk21.get(key);
  if (existing) return existing as Promise<T>;
  const p = fn().finally(() => {
    inFlightLk21.delete(key);
  });
  inFlightLk21.set(key, p);
  return p;
}

export async function getLk21Home(
  getToken: () => string,
  fallbackOrigin?: string
): Promise<Lk21HomePayload> {
  const cacheKey = 'lk21:home';
  const cached = await readCache<Lk21HomePayload>(cacheKey);

  const refresh = async (): Promise<Lk21HomePayload> => {
    const token = getToken();
    if (!token) throw new Error('Server MOLA_API_TOKEN is not configured');
    const raw = await fetchUpstreamLk21Json(token, '/home');
    const rawRows = Array.isArray(raw.rows) ? (raw.rows as Record<string, unknown>[]) : [];
    const rows: Lk21HomePayload['rows'] = [];
    const allCards: Lk21MovieCard[] = [];

    for (const r of rawRows) {
      const key = cleanStr(r.key);
      const label = cleanStr(r.label, key);
      const itemsRaw = Array.isArray(r.items)
        ? (r.items as Record<string, unknown>[])
        : [];
      const items = itemsRaw
        .map((it) => normalizeLk21Card(it))
        .filter((it): it is Lk21MovieCard => Boolean(it));
      if (key && items.length > 0) {
        rows.push({ key, label, items });
        allCards.push(...items);
      }
    }

    const payload: Lk21HomePayload = {
      ok: true,
      totalMovies: Number(raw.totalMovies) || allCards.length,
      updated: Date.now(),
      rows,
      source: 'live-refresh',
    };

    if (rows.length > 0) {
      await writeCache(cacheKey, 'home', payload, HOME_TTL_MS);
      void persistDiscoveredMovies(allCards, fallbackOrigin).catch(() => {});
    }
    return payload;
  };

  if (cached && cached.payload && Array.isArray(cached.payload.rows)) {
    if (cached.stale) {
      void runDeduplicated(cacheKey, refresh).catch(() => {});
    }
    const statsMap = await getTrendingStatsMapFromDb(250).catch(() => ({}));
    return {
      ...cached.payload,
      rows: cached.payload.rows.map((r) => ({
        ...r,
        items: attachStatsToMovies(r.items, statsMap),
      })),
      cached: true,
      stale: cached.stale,
      source: 'database-cache',
    };
  }

  const fresh = await runDeduplicated(cacheKey, refresh);
  const statsMap = await getTrendingStatsMapFromDb(250).catch(() => ({}));
  return {
    ...fresh,
    rows: fresh.rows.map((r) => ({
      ...r,
      items: attachStatsToMovies(r.items, statsMap),
    })),
  };
}

export async function getLk21Menu(getToken: () => string): Promise<Lk21MenuPayload> {
  const cacheKey = 'lk21:menu';
  const cached = await readCache<Lk21MenuPayload>(cacheKey);

  const refresh = async (): Promise<Lk21MenuPayload> => {
    const token = getToken();
    if (!token) throw new Error('Server MOLA_API_TOKEN is not configured');
    const raw = await fetchUpstreamLk21Json(token, '/menu');
    const payload: Lk21MenuPayload = {
      ok: true,
      types: Array.isArray(raw.types)
        ? (raw.types as Array<{ key: string; label: string }>)
        : [],
      genres: Array.isArray(raw.genres)
        ? (raw.genres as Array<{ slug: string; name: string }>)
        : [],
      countries: Array.isArray(raw.countries)
        ? (raw.countries as Array<{ slug: string; name: string }>)
        : [],
      years: Array.isArray(raw.years)
        ? (raw.years as Array<{ slug: string; name: string }>)
        : [],
    };
    await writeCache(cacheKey, 'menu', payload, MENU_TTL_MS);
    return payload;
  };

  if (cached && cached.payload) {
    if (cached.stale) {
      void runDeduplicated(cacheKey, refresh).catch(() => {});
    }
    return cached.payload;
  }

  return runDeduplicated(cacheKey, refresh);
}

export async function getLk21Latest(
  getToken: () => string,
  page = 1,
  fallbackOrigin?: string
): Promise<Lk21ListPayload> {
  const safePage = Math.max(1, Math.floor(page || 1));
  const cacheKey = `lk21:latest:${safePage}`;
  const cached = await readCache<Lk21ListPayload>(cacheKey);

  const refresh = async (): Promise<Lk21ListPayload> => {
    const token = getToken();
    if (!token) throw new Error('Server MOLA_API_TOKEN is not configured');
    const raw = await fetchUpstreamLk21Json(token, '/latest', { page: safePage });
    const itemsRaw = Array.isArray(raw.items)
      ? (raw.items as Record<string, unknown>[])
      : [];
    const items = itemsRaw
      .map((it) => normalizeLk21Card(it))
      .filter((it): it is Lk21MovieCard => Boolean(it));
    const payload: Lk21ListPayload = {
      ok: true,
      label: cleanStr(raw.label, 'Latest Movies & Series'),
      page: safePage,
      count: items.length,
      hasMore: items.length >= 12,
      items,
    };
    if (items.length > 0) {
      await writeCache(cacheKey, 'latest', payload, LIST_TTL_MS);
      void persistDiscoveredMovies(items, fallbackOrigin).catch(() => {});
    }
    return payload;
  };

  if (cached && cached.payload && Array.isArray(cached.payload.items)) {
    if (cached.stale) {
      void runDeduplicated(cacheKey, refresh).catch(() => {});
    }
    const statsMap = await getTrendingStatsMapFromDb(250).catch(() => ({}));
    return {
      ...cached.payload,
      items: attachStatsToMovies(cached.payload.items, statsMap),
    };
  }

  const fresh = await runDeduplicated(cacheKey, refresh);
  const statsMap = await getTrendingStatsMapFromDb(250).catch(() => ({}));
  return {
    ...fresh,
    items: attachStatsToMovies(fresh.items, statsMap),
  };
}

export async function getLk21Category(
  getToken: () => string,
  key: string,
  page = 1,
  fallbackOrigin?: string
): Promise<Lk21ListPayload> {
  const cleanKey = cleanStr(key, 'lk21.featured');
  const safePage = Math.max(1, Math.floor(page || 1));
  const cacheKey = `lk21:category:${cleanKey}:${safePage}`;
  const cached = await readCache<Lk21ListPayload>(cacheKey);

  const refresh = async (): Promise<Lk21ListPayload> => {
    const token = getToken();
    if (!token) throw new Error('Server MOLA_API_TOKEN is not configured');
    const raw = await fetchUpstreamLk21Json(token, '/category', {
      key: cleanKey,
      page: safePage,
    });
    const itemsRaw = Array.isArray(raw.items)
      ? (raw.items as Record<string, unknown>[])
      : [];
    const items = itemsRaw
      .map((it) => normalizeLk21Card(it))
      .filter((it): it is Lk21MovieCard => Boolean(it));
    const payload: Lk21ListPayload = {
      ok: true,
      label: cleanStr(raw.label, cleanKey),
      key: cleanKey,
      page: safePage,
      count: items.length,
      hasMore: items.length >= 12,
      items,
    };
    if (items.length > 0) {
      await writeCache(cacheKey, 'category', payload, LIST_TTL_MS);
      void persistDiscoveredMovies(items, fallbackOrigin).catch(() => {});
    }
    return payload;
  };

  if (cached && cached.payload && Array.isArray(cached.payload.items)) {
    if (cached.stale) {
      void runDeduplicated(cacheKey, refresh).catch(() => {});
    }
    const statsMap = await getTrendingStatsMapFromDb(250).catch(() => ({}));
    return {
      ...cached.payload,
      items: attachStatsToMovies(cached.payload.items, statsMap),
    };
  }

  const fresh = await runDeduplicated(cacheKey, refresh);
  const statsMap = await getTrendingStatsMapFromDb(250).catch(() => ({}));
  return {
    ...fresh,
    items: attachStatsToMovies(fresh.items, statsMap),
  };
}

export async function getLk21Search(
  getToken: () => string,
  q: string,
  page = 1,
  fallbackOrigin?: string
): Promise<Lk21ListPayload> {
  const cleanQ = cleanStr(q);
  const safePage = Math.max(1, Math.floor(page || 1));
  if (!cleanQ) {
    return { ok: true, q: '', page: safePage, count: 0, hasMore: false, items: [] };
  }

  const cacheKey = `lk21:search:${cleanQ.toLowerCase()}:${safePage}`;
  const cached = await readCache<Lk21ListPayload>(cacheKey);

  const refresh = async (): Promise<Lk21ListPayload> => {
    const token = getToken();
    if (!token) throw new Error('Server MOLA_API_TOKEN is not configured');
    const raw = await fetchUpstreamLk21Json(token, '/search', {
      q: cleanQ,
      page: safePage,
    });
    const itemsRaw = Array.isArray(raw.items)
      ? (raw.items as Record<string, unknown>[])
      : [];
    const items = itemsRaw
      .map((it) => normalizeLk21Card(it))
      .filter((it): it is Lk21MovieCard => Boolean(it));
    const payload: Lk21ListPayload = {
      ok: true,
      q: cleanQ,
      page: safePage,
      count: items.length,
      hasMore: items.length >= 12,
      items,
    };
    await writeCache(cacheKey, 'search', payload, SEARCH_TTL_MS);
    if (items.length > 0) {
      void persistDiscoveredMovies(items, fallbackOrigin).catch(() => {});
    }
    return payload;
  };

  if (cached && !cached.stale && cached.payload) {
    return cached.payload;
  }

  return runDeduplicated(cacheKey, refresh);
}

export async function getLk21Detail(
  getToken: () => string,
  slug: string,
  fallbackOrigin?: string
): Promise<Lk21DetailPayload | null> {
  const cleanSlug = cleanStr(slug).toLowerCase();
  if (!cleanSlug) return null;

  const cacheKey = `lk21:detail:${cleanSlug}`;
  const cached = await readCache<Lk21DetailPayload>(cacheKey);

  const refresh = async (): Promise<Lk21DetailPayload | null> => {
    const token = getToken();
    if (!token) throw new Error('Server MOLA_API_TOKEN is not configured');
    const raw = await fetchUpstreamLk21Json(token, '/detail', { slug: cleanSlug });
    const title = cleanStr(raw.title);
    if (!title) return null;

    const genresRaw = Array.isArray(raw.genres)
      ? raw.genres
      : Array.isArray(raw.genre)
      ? raw.genre
      : [];
    const genres = genresRaw.map((g) => cleanStr(g)).filter(Boolean);

    const actors = Array.isArray(raw.actors)
      ? raw.actors.map((a) => cleanStr(a)).filter(Boolean)
      : [];

    const recsRaw = Array.isArray(raw.recommendations)
      ? (raw.recommendations as Record<string, unknown>[])
      : [];
    const recommendations = recsRaw
      .map((r) => normalizeLk21Card(r))
      .filter((r): r is Lk21MovieCard => Boolean(r));

    const providers = Array.isArray(raw.providers)
      ? (raw.providers as Array<Record<string, unknown>>)
          .map((p) => ({
            name: cleanStr(p.name),
            url: stripTokensFromString(cleanStr(p.url)),
          }))
          .filter((p) => Boolean(p.name))
      : [];

    const cover = sanitizeImageUrl(raw.cover ?? raw.poster);
    const poster = sanitizeImageUrl(raw.poster ?? raw.cover);
    const coverHz = sanitizeImageUrl(raw.coverHz ?? raw.poster ?? raw.cover);
    const rawType = cleanStr(raw.type, 'movie').toLowerCase();
    const detail: Lk21DetailPayload = {
      ok: true,
      id: cleanStr(raw.id, cleanSlug),
      slug: cleanStr(raw.slug, cleanSlug).toLowerCase(),
      app: 'lk21',
      title,
      cover,
      coverHz: coverHz || cover,
      poster: poster || cover,
      synopsis: cleanStr(
        raw.synopsis ?? raw.description,
        `Watch ${title} in Full HD on House Drama Movies.`
      ),
      description: cleanStr(
        raw.description ?? raw.synopsis,
        `Watch ${title} in Full HD on House Drama Movies.`
      ),
      actors,
      director: cleanStr(raw.director),
      year: cleanStr(raw.year),
      area: cleanStr(raw.area),
      genres,
      rating: cleanStr(raw.rating),
      quality: cleanStr(raw.quality, 'HD'),
      type: rawType === 'series' ? 'series' : 'movie',
      updateInfo: cleanStr(raw.updateInfo),
      providers,
      recommendations,
    };

    await writeCache(cacheKey, 'detail', detail, DETAIL_TTL_MS);

    const inserted = await upsertMoviesBatchInDb([
      {
        slug: detail.slug,
        movieId: detail.id,
        title: detail.title,
        cover: detail.cover,
        coverHz: detail.coverHz,
        poster: detail.poster,
        synopsis: detail.synopsis,
        year: detail.year,
        area: detail.area,
        director: detail.director,
        actors: detail.actors,
        genres: detail.genres,
        rating: detail.rating,
        quality: detail.quality,
        movieType: detail.type,
        updateInfo: detail.updateInfo,
        providers: detail.providers,
        recommendations: detail.recommendations as unknown as Array<
          Record<string, unknown>
        >,
        movieJson: detail as unknown as Record<string, unknown>,
        popularityScore: 5500,
      },
      ...detail.recommendations.map((r, i) => toMovieUpsert(r, 2000 - i * 20)),
    ]);

    if (inserted.length > 0) {
      void notifyMovieAdditionsToGoogle(inserted, fallbackOrigin).catch(() => {});
    }

    return detail;
  };

  if (cached && cached.payload && cached.payload.title) {
    if (cached.stale) {
      void runDeduplicated(cacheKey, refresh).catch(() => {});
    }
    return cached.payload;
  }

  // Fallback check on rich `movies` row before hitting upstream
  const dbMovie = await getMovieBySlugFromDb(cleanSlug);
  if (dbMovie && dbMovie.synopsis && (dbMovie.actors.length > 0 || dbMovie.director)) {
    const isFresh = Date.now() - dbMovie.updatedAt < DETAIL_TTL_MS;
    if (!isFresh) {
      void runDeduplicated(cacheKey, refresh).catch(() => {});
    }
    const recs = (dbMovie.recommendations || [])
      .map((r) => normalizeLk21Card(r))
      .filter((r): r is Lk21MovieCard => Boolean(r));
    return {
      ok: true,
      id: dbMovie.movieId,
      slug: dbMovie.slug,
      app: 'lk21',
      title: dbMovie.title,
      cover: dbMovie.cover,
      coverHz: dbMovie.coverHz || dbMovie.cover,
      poster: dbMovie.poster || dbMovie.cover,
      synopsis: dbMovie.synopsis,
      description: dbMovie.synopsis,
      actors: dbMovie.actors,
      director: dbMovie.director,
      year: dbMovie.year,
      area: dbMovie.area,
      genres: dbMovie.genres,
      rating: dbMovie.rating,
      quality: dbMovie.quality || 'HD',
      type: dbMovie.movieType === 'series' ? 'series' : 'movie',
      updateInfo: dbMovie.updateInfo,
      providers: dbMovie.providers,
      recommendations: recs,
    };
  }

  return runDeduplicated(cacheKey, refresh);
}

export async function getLk21Episodes(
  getToken: () => string,
  slug: string
): Promise<Lk21EpisodesPayload> {
  const cleanSlug = cleanStr(slug).toLowerCase();
  if (!cleanSlug) {
    return { ok: true, app: 'lk21', id: '', slug: '', title: '', count: 0, episodes: [] };
  }

  const cacheKey = `lk21:episodes:${cleanSlug}`;
  const cached = await readCache<Lk21EpisodesPayload>(cacheKey);

  const refresh = async (): Promise<Lk21EpisodesPayload> => {
    const token = getToken();
    if (!token) throw new Error('Server MOLA_API_TOKEN is not configured');
    const raw = await fetchUpstreamLk21Json(token, '/episodes', { slug: cleanSlug });
    const epsRaw = Array.isArray(raw.episodes)
      ? (raw.episodes as Record<string, unknown>[])
      : [];
    const episodes: Lk21EpisodePayloadItem[] = epsRaw.map((ep, idx) => {
      const order = Number(ep.order) || idx + 1;
      const vid = cleanStr(ep.vid ?? ep.id, cleanSlug);
      return {
        id: cleanStr(ep.id, vid),
        vid,
        title: cleanStr(ep.title, cleanStr(raw.title, cleanSlug)),
        episode: cleanStr(ep.episode, `EP ${order}`),
        manEpisode: cleanStr(ep.manEpisode, cleanStr(ep.episode, `EP ${order}`)),
        order,
      };
    });

    const payload: Lk21EpisodesPayload = {
      ok: true,
      app: 'lk21',
      id: cleanStr(raw.id, cleanSlug),
      slug: cleanStr(raw.slug, cleanSlug).toLowerCase(),
      title: cleanStr(raw.title, cleanSlug),
      count: episodes.length,
      episodes,
    };

    if (episodes.length > 0) {
      await writeCache(cacheKey, 'episodes', payload, EPISODES_TTL_MS);
      await upsertMovieEpisodesInDb(
        episodes.map((ep) => ({
          slug: cleanSlug,
          episodeNumber: ep.order,
          vid: ep.vid,
          title: ep.title,
          episodeLabel: ep.manEpisode || ep.episode,
          episodeJson: ep as unknown as Record<string, unknown>,
        }))
      );
    }

    return payload;
  };

  if (cached && cached.payload && cached.payload.episodes.length > 0) {
    if (cached.stale) {
      void runDeduplicated(cacheKey, refresh).catch(() => {});
    }
    return cached.payload;
  }

  const dbEps = await getMovieEpisodesFromDb(cleanSlug);
  if (dbEps.length > 0) {
    const isStale = Date.now() - dbEps[0].updatedAt > EPISODES_TTL_MS;
    if (isStale) {
      void runDeduplicated(cacheKey, refresh).catch(() => {});
    }
    return {
      ok: true,
      app: 'lk21',
      id: cleanSlug,
      slug: cleanSlug,
      title: dbEps[0].title || cleanSlug,
      count: dbEps.length,
      episodes: dbEps.map((e) => ({
        id: e.vid || cleanSlug,
        vid: e.vid || cleanSlug,
        title: e.title,
        episode: e.episodeLabel || `EP ${e.episodeNumber}`,
        manEpisode: e.episodeLabel || `EP ${e.episodeNumber}`,
        order: e.episodeNumber,
      })),
    };
  }

  return runDeduplicated(cacheKey, refresh);
}

export async function getLk21Stream(
  getToken: () => string,
  opts: { slug: string; vid?: string; episode?: number }
): Promise<Lk21StreamPayload> {
  const cleanSlug = cleanStr(opts.slug).toLowerCase();
  const requestedEp = opts.episode ? Math.max(1, Math.floor(opts.episode)) : 1;
  let targetVid = cleanStr(opts.vid).toLowerCase();
  let resolvedEpNumber = requestedEp;

  // If no explicit vid provided and episode > 1 (or stored episodes exist), resolve episode's vid from DB or episodes API
  if (!targetVid && cleanSlug) {
    const dbEps = await getMovieEpisodesFromDb(cleanSlug);
    if (dbEps.length > 0) {
      const match =
        dbEps.find((e) => e.episodeNumber === requestedEp) || dbEps[0];
      if (match) {
        targetVid = (match.vid || cleanSlug).toLowerCase();
        resolvedEpNumber = match.episodeNumber;
      }
    } else if (requestedEp > 1) {
      const fetchedEps = await getLk21Episodes(getToken, cleanSlug).catch(() => null);
      const match = fetchedEps?.episodes.find((e) => e.order === requestedEp);
      if (match) {
        targetVid = (match.vid || match.id || cleanSlug).toLowerCase();
        resolvedEpNumber = match.order;
      }
    }
  }

  const upstreamSlug = targetVid || cleanSlug;
  const cacheKey = `lk21:stream:${upstreamSlug}`;
  const cached = await readCache<Lk21StreamPayload>(cacheKey);
  if (cached && !cached.stale && cached.payload?.streamUrl) {
    return {
      ...cached.payload,
      episodeNumber: resolvedEpNumber,
      slug: cleanSlug || upstreamSlug,
      vid: upstreamSlug,
    };
  }

  // Also check DB episode cached stream URL if fresh
  const dbEp = await findMovieEpisodeByVidOrSlugFromDb(upstreamSlug);
  if (
    dbEp &&
    dbEp.streamUrl &&
    Date.now() - dbEp.updatedAt < STREAM_TTL_MS
  ) {
    return {
      ok: true,
      type: dbEp.streamType === 'mp4' ? 'mp4' : 'hls',
      url: dbEp.streamUrl,
      streamUrl: dbEp.streamUrl,
      isHls: dbEp.streamType !== 'mp4',
      title: dbEp.title || cleanSlug,
      poster: '',
      subtitles: [],
      episodeNumber: dbEp.episodeNumber || resolvedEpNumber,
      slug: dbEp.slug || cleanSlug,
      vid: upstreamSlug,
    };
  }

  return runDeduplicated(cacheKey, async () => {
    const token = getToken();
    if (!token) throw new Error('Server MOLA_API_TOKEN is not configured');

    const raw = await fetchUpstreamLk21Json(token, '/stream', {
      slug: upstreamSlug,
    });

    const rawUrl = cleanStr(raw.rawUrl);
    const upstreamStreamUrl = cleanStr(raw.streamUrl ?? raw.url);
    let finalStreamUrl = '';

    // Always route HLS manifests through our backend proxy without upstream tokens
    if (rawUrl && rawUrl.toLowerCase().includes('.m3u8')) {
      finalStreamUrl = `/api/lk21/proxy/m3u8?url=${encodeURIComponent(rawUrl)}`;
    } else if (upstreamStreamUrl.startsWith('/api/lk21/proxy/')) {
      finalStreamUrl = stripTokensFromString(upstreamStreamUrl);
    } else if (rawUrl) {
      finalStreamUrl = `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
    } else if (upstreamStreamUrl) {
      finalStreamUrl = stripTokensFromString(upstreamStreamUrl);
    }

    if (!finalStreamUrl) {
      throw new Error('LK21 stream URL unavailable for this title');
    }

    const rawType = cleanStr(raw.type, 'hls').toLowerCase();
    const isHls =
      rawType === 'hls' ||
      finalStreamUrl.includes('/proxy/m3u8') ||
      finalStreamUrl.toLowerCase().includes('.m3u8');

    const subtitlesRaw = Array.isArray(raw.subtitles)
      ? (raw.subtitles as Array<Record<string, unknown>>)
      : [];
    const subtitles = subtitlesRaw
      .map((s, idx) => {
        const subUrl = cleanStr(s.url ?? s.src);
        if (!subUrl) return null;
        return {
          id: cleanStr(s.id, `lk21-sub-${idx}`),
          label: cleanStr(s.label ?? s.lang, `Subtitle ${idx + 1}`),
          lang: cleanStr(s.lang, 'en'),
          url: subUrl.startsWith('http')
            ? `/api/proxy?url=${encodeURIComponent(subUrl)}`
            : subUrl,
          source: 'api' as const,
        };
      })
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    const payload: Lk21StreamPayload = {
      ok: true,
      type: isHls ? 'hls' : 'mp4',
      url: finalStreamUrl,
      streamUrl: finalStreamUrl,
      isHls,
      title: cleanStr(raw.title, cleanSlug),
      poster: sanitizeImageUrl(raw.poster),
      subtitles,
      episodeNumber: resolvedEpNumber,
      slug: cleanSlug || upstreamSlug,
      vid: upstreamSlug,
    };

    await writeCache(cacheKey, 'stream', payload, STREAM_TTL_MS);
    await upsertMovieEpisodesInDb([
      {
        slug: cleanSlug || dbEp?.slug || upstreamSlug,
        episodeNumber: resolvedEpNumber,
        vid: upstreamSlug,
        title: payload.title,
        episodeLabel: `EP ${resolvedEpNumber}`,
        streamUrl: finalStreamUrl,
        rawUrl,
        streamType: isHls ? 'hls' : 'mp4',
        subtitles: subtitles as unknown as Array<Record<string, unknown>>,
      },
    ]);

    return payload;
  });
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '0.0.0.0' ||
    h === '::1' ||
    h.startsWith('10.') ||
    h.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(h) ||
    h.endsWith('.local') ||
    h.endsWith('.internal')
  );
}

export async function fetchAndRewriteLk21M3u8(
  getToken: () => string,
  targetUrl: string
): Promise<{ status: number; body: string }> {
  const parsed = new URL(targetUrl);
  if (
    (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
    isPrivateOrLocalHostname(parsed.hostname)
  ) {
    throw new Error('Disallowed m3u8 origin');
  }

  const token = getToken();
  // Always ask upstream LK21 m3u8 proxy (so relative CDN segment headers/cookies are handled properly by upstream) OR direct playcdn
  const fetchUrl = parsed.hostname === 'api.molatv.id'
    ? parsed.toString()
    : `${LK21_UPSTREAM_BASE}/proxy/m3u8?url=${encodeURIComponent(parsed.toString())}`;

  const upstream = await fetch(fetchUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.apple.mpegurl, text/plain, */*',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!upstream.ok) {
    // Fallback direct fetch if upstream proxy returned non-OK
    if (fetchUrl !== parsed.toString()) {
      const direct = await fetch(parsed.toString(), {
        method: 'GET',
        headers: { Accept: 'application/vnd.apple.mpegurl, text/plain, */*' },
        signal: AbortSignal.timeout(15000),
      });
      if (direct.ok) {
        const directText = await direct.text();
        return {
          status: direct.status,
          body: rewriteM3u8ManifestLines(directText, parsed.toString()),
        };
      }
    }
    throw new Error(`Upstream manifest error HTTP ${upstream.status}`);
  }

  const rawText = await upstream.text();
  return {
    status: upstream.status,
    body: rewriteM3u8ManifestLines(rawText, parsed.toString()),
  };
}

function rewriteM3u8ManifestLines(playlist: string, baseUrl: string): string {
  const rewriteLineTarget = (target: string): string => {
    const trimmed = target.trim();
    if (!trimmed) return target;
    try {
      // Upstream rewrites segments to `/api/lk21/proxy/segment?url=...` or child m3u8 to `/api/lk21/proxy/m3u8?url=...`
      if (trimmed.startsWith('/api/lk21/proxy/')) {
        return stripTokensFromString(trimmed);
      }
      const abs = new URL(trimmed, baseUrl).toString();
      const lower = abs.toLowerCase();
      if (lower.includes('.m3u8') || abs.includes('/proxy/m3u8')) {
        const innerUrl = new URL(abs).searchParams.get('url') || abs;
        return `/api/lk21/proxy/m3u8?url=${encodeURIComponent(innerUrl)}`;
      }
      const innerSeg = new URL(abs).searchParams.get('url') || abs;
      return `/api/lk21/proxy/segment?url=${encodeURIComponent(innerSeg)}`;
    } catch {
      return target;
    }
  };

  return playlist
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/gi, (_m, uri) => {
          return `URI="${rewriteLineTarget(uri)}"`;
        });
      }
      return rewriteLineTarget(trimmed);
    })
    .join('\n');
}

export async function fetchLk21Segment(
  targetUrl: string,
  rangeHeader?: string
): Promise<{
  status: number;
  contentType: string;
  contentLength: string | null;
  contentRange: string | null;
  acceptRanges: string | null;
  upstream: globalThis.Response;
}> {
  const parsed = new URL(targetUrl);
  if (
    (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
    isPrivateOrLocalHostname(parsed.hostname)
  ) {
    throw new Error('Disallowed segment origin');
  }

  const headers: Record<string, string> = {
    Accept: '*/*',
  };
  if (rangeHeader) {
    headers.Range = rangeHeader;
  }

  const upstream = await fetch(parsed.toString(), {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(20000),
  });

  let ct = upstream.headers.get('content-type') || 'video/mp2t';
  // Rotating LK21 segment CDNs serve MPEG-TS wrapped as `image/x-pict`; normalize to video/mp2t for browser/HLS playback
  if (
    ct.toLowerCase().includes('image/') ||
    ct.toLowerCase().includes('octet-stream') ||
    parsed.pathname.toLowerCase().endsWith('.pict') ||
    parsed.pathname.toLowerCase().endsWith('.ts')
  ) {
    ct = 'video/mp2t';
  }

  return {
    status: upstream.status,
    contentType: ct,
    contentLength: upstream.headers.get('content-length'),
    contentRange: upstream.headers.get('content-range'),
    acceptRanges: upstream.headers.get('accept-ranges'),
    upstream,
  };
}

export function startLk21Prewarm(getToken: () => string): void {
  const timer = setTimeout(() => {
    const token = getToken();
    if (!token) return;
    void Promise.allSettled([
      getLk21Home(getToken),
      getLk21Menu(getToken),
      getLk21Latest(getToken, 1),
    ]);
  }, 2200);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
}
