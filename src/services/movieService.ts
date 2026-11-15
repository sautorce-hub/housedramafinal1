import type {
  DramaItem,
  EpisodeItem,
  Lk21HomeResponse,
  Lk21ListResponse,
  Lk21MenuResponse,
  MovieDetail,
  MovieEpisodeItem,
  MovieItem,
  StreamSource,
} from '../types/drama';

interface CacheEntry<T> {
  expiresAt: number;
  promise: Promise<T>;
}

const memCache = new Map<string, CacheEntry<unknown>>();
const HOME_TTL = 10 * 60 * 1000;
const MENU_TTL = 60 * 60 * 1000;
const LIST_TTL = 10 * 60 * 1000;
const DETAIL_TTL = 20 * 60 * 1000;
const STREAM_TTL = 12 * 60 * 1000;

function fetchCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = memCache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() < hit.expiresAt) {
    return hit.promise;
  }
  const promise = loader().catch((err) => {
    memCache.delete(key);
    throw err;
  });
  memCache.set(key, { expiresAt: Date.now() + ttlMs, promise });
  return promise;
}

async function getJson<T>(url: string, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const rawText = await res.text();
    let parsed: unknown = null;
    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = null;
      }
    }
    if (!res.ok) {
      const errObj =
        parsed && typeof parsed === 'object'
          ? (parsed as { error?: string; message?: string })
          : null;
      throw new Error(
        errObj?.error || errObj?.message || `Movie service error (${res.status})`
      );
    }
    if (parsed === null) {
      throw new Error('Invalid JSON response from movie service');
    }
    return parsed as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Movie service request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeMovieItemSafe(raw: Partial<MovieItem> | null | undefined): MovieItem {
  const slug = String(raw?.slug || raw?.id || '').trim();
  const id = String(raw?.id || slug).trim();
  const title = String(raw?.title || 'Untitled Movie').trim();
  const cover = String(raw?.cover || raw?.coverVt || raw?.coverHz || '').trim();
  return {
    id,
    slug,
    app: 'lk21',
    title,
    cover,
    coverHz: String(raw?.coverHz || cover).trim(),
    coverVt: String(raw?.coverVt || cover).trim(),
    rating: String(raw?.rating || '').trim(),
    quality: String(raw?.quality || 'HD').trim(),
    badge: String(raw?.badge || raw?.quality || '').trim(),
    subtitle: String(raw?.subtitle || '').trim(),
    description: String(raw?.description || '').trim(),
    genre: Array.isArray(raw?.genre) ? raw.genre.filter(Boolean) : [],
    updateInfo: String(raw?.updateInfo || '').trim(),
    type: raw?.type === 'series' ? 'series' : 'movie',
    is_movie: raw?.type === 'series' ? false : true,
    dailyViews: typeof raw?.dailyViews === 'number' ? raw.dailyViews : undefined,
    totalViews: typeof raw?.totalViews === 'number' ? raw.totalViews : undefined,
    trendBadge: raw?.trendBadge,
  };
}

export function fetchLk21Home(): Promise<Lk21HomeResponse> {
  return fetchCached('lk21:home', HOME_TTL, async () => {
    const data = await getJson<Lk21HomeResponse>('/api/lk21/home');
    return {
      ...data,
      ok: Boolean(data?.ok ?? true),
      totalMovies: Number(data?.totalMovies) || 0,
      updated: Number(data?.updated) || Date.now(),
      rows: Array.isArray(data?.rows)
        ? data.rows.map((row) => ({
            key: String(row?.key || 'movies'),
            label: String(row?.label || 'Movies'),
            items: Array.isArray(row?.items)
              ? row.items.filter(Boolean).map(normalizeMovieItemSafe)
              : [],
          }))
        : [],
    };
  });
}

export function fetchLk21Menu(): Promise<Lk21MenuResponse> {
  return fetchCached('lk21:menu', MENU_TTL, async () => {
    const data = await getJson<Lk21MenuResponse>('/api/lk21/menu');
    return {
      ok: Boolean(data?.ok ?? true),
      types: Array.isArray(data?.types) ? data.types : [],
      genres: Array.isArray(data?.genres) ? data.genres : [],
      countries: Array.isArray(data?.countries) ? data.countries : [],
      years: Array.isArray(data?.years) ? data.years : [],
    };
  });
}

export function fetchLk21Latest(page = 1): Promise<Lk21ListResponse> {
  return fetchCached(`lk21:latest:${page}`, LIST_TTL, async () => {
    const data = await getJson<Lk21ListResponse>(
      `/api/lk21/latest?page=${encodeURIComponent(String(page))}`
    );
    const items = Array.isArray(data?.items)
      ? data.items.filter(Boolean).map(normalizeMovieItemSafe)
      : [];
    return {
      ok: Boolean(data?.ok ?? true),
      label: data?.label,
      key: data?.key,
      page: Number(data?.page) || page,
      count: Number(data?.count) || items.length,
      hasMore: Boolean(data?.hasMore),
      items,
    };
  });
}

export function fetchLk21Category(
  key: string,
  page = 1
): Promise<Lk21ListResponse> {
  return fetchCached(`lk21:category:${key}:${page}`, LIST_TTL, async () => {
    const data = await getJson<Lk21ListResponse>(
      `/api/lk21/category?key=${encodeURIComponent(key)}&page=${encodeURIComponent(String(page))}`
    );
    const items = Array.isArray(data?.items)
      ? data.items.filter(Boolean).map(normalizeMovieItemSafe)
      : [];
    return {
      ok: Boolean(data?.ok ?? true),
      label: data?.label,
      key: data?.key ?? key,
      page: Number(data?.page) || page,
      count: Number(data?.count) || items.length,
      hasMore: Boolean(data?.hasMore),
      items,
    };
  });
}

export async function searchLk21Movies(
  q: string,
  page = 1
): Promise<Lk21ListResponse> {
  const trimmed = q.trim();
  if (!trimmed) {
    return {
      ok: true,
      q: '',
      page,
      count: 0,
      hasMore: false,
      items: [],
    };
  }
  const data = await getJson<Lk21ListResponse>(
    `/api/lk21/search?q=${encodeURIComponent(trimmed)}&page=${encodeURIComponent(String(page))}`
  );
  const items = Array.isArray(data?.items)
    ? data.items.filter(Boolean).map(normalizeMovieItemSafe)
    : [];
  return {
    ok: Boolean(data?.ok ?? true),
    q: data?.q ?? trimmed,
    page: Number(data?.page) || page,
    count: Number(data?.count) || items.length,
    hasMore: Boolean(data?.hasMore),
    items,
  };
}

export function fetchLk21Detail(slug: string): Promise<MovieDetail> {
  const clean = slug.trim().toLowerCase();
  return fetchCached(`lk21:detail:${clean}`, DETAIL_TTL, async () => {
    const data = await getJson<MovieDetail>(
      `/api/lk21/detail?slug=${encodeURIComponent(clean)}`
    );
    const cover = String(data?.cover || data?.poster || data?.coverHz || '').trim();
    return {
      ...data,
      ok: Boolean(data?.ok ?? true),
      id: String(data?.id || data?.slug || clean).trim(),
      slug: String(data?.slug || clean).trim(),
      app: 'lk21',
      title: String(data?.title || 'Untitled Movie').trim(),
      cover,
      coverHz: String(data?.coverHz || cover).trim(),
      poster: String(data?.poster || cover).trim(),
      synopsis: String(data?.synopsis || data?.description || '').trim(),
      description: String(data?.description || data?.synopsis || '').trim(),
      actors: Array.isArray(data?.actors) ? data.actors.filter(Boolean) : [],
      director: String(data?.director || '').trim(),
      year: String(data?.year || '').trim(),
      area: String(data?.area || '').trim(),
      genres: Array.isArray(data?.genres) ? data.genres.filter(Boolean) : [],
      rating: String(data?.rating || '').trim(),
      quality: String(data?.quality || 'HD').trim(),
      type: data?.type === 'series' ? 'series' : 'movie',
      updateInfo: String(data?.updateInfo || '').trim(),
      providers: Array.isArray(data?.providers) ? data.providers : [],
      recommendations: Array.isArray(data?.recommendations)
        ? data.recommendations.filter(Boolean).map(normalizeMovieItemSafe)
        : [],
    };
  });
}

export function fetchLk21Episodes(slug: string): Promise<{
  ok: boolean;
  slug: string;
  title: string;
  count: number;
  episodes: MovieEpisodeItem[];
}> {
  const clean = slug.trim().toLowerCase();
  return fetchCached(`lk21:episodes:${clean}`, DETAIL_TTL, async () => {
    const data = await getJson<{
      ok?: boolean;
      slug?: string;
      title?: string;
      count?: number;
      episodes?: MovieEpisodeItem[];
    }>(`/api/lk21/episodes?slug=${encodeURIComponent(clean)}`);
    const episodes = Array.isArray(data?.episodes) ? data.episodes : [];
    return {
      ok: Boolean(data?.ok ?? true),
      slug: String(data?.slug || clean),
      title: String(data?.title || clean),
      count: Number(data?.count) || episodes.length,
      episodes,
    };
  });
}

export async function fetchLk21Stream(
  slug: string,
  episode = 1,
  vid?: string
): Promise<StreamSource> {
  const clean = slug.trim().toLowerCase();
  const key = `lk21:stream:${clean}:${vid || episode}`;
  return fetchCached(key, STREAM_TTL, async () => {
    const params = new URLSearchParams({
      slug: clean,
      episode: String(Math.max(1, episode)),
    });
    if (vid) params.set('vid', vid);

    const data = await getJson<{
      ok: boolean;
      type: string;
      url: string;
      streamUrl: string;
      isHls: boolean;
      title: string;
      poster: string;
      subtitles?: Array<{
        id: string;
        label: string;
        lang: string;
        url?: string;
        source: 'api';
      }>;
      episodeNumber?: number;
      vid?: string;
    }>(`/api/lk21/stream?${params.toString()}`);

    const url = data.streamUrl || data.url || '';
    if (!url) {
      throw new Error('Movie stream URL unavailable for this title.');
    }
    return {
      bookId: clean,
      provider: 'LK21',
      episodeNumber: data.episodeNumber || episode,
      chapterId: data.vid || vid || clean,
      streamUrl: url,
      isHls:
        Boolean(data.isHls) ||
        url.includes('/proxy/m3u8') ||
        url.toLowerCase().includes('.m3u8'),
      qualities: [{ quality: 'HD', url }],
      subtitles: Array.isArray(data.subtitles) ? data.subtitles : [],
    };
  });
}

export async function fetchLk21EpisodesAsEpisodeItems(
  slug: string
): Promise<EpisodeItem[]> {
  const res = await fetchLk21Episodes(slug);
  if (!res?.episodes || res.episodes.length === 0) {
    return [
      {
        chapterId: slug,
        episodeNumber: 1,
        title: res?.title || 'Full Movie',
        isVipLocked: false,
        eid: slug,
      },
    ];
  }
  return res.episodes.map((ep, idx) => ({
    chapterId: ep.id || ep.vid || `${slug}-ep-${idx + 1}`,
    episodeNumber: ep.order || idx + 1,
    title: ep.manEpisode || ep.episode || ep.title || `EP ${idx + 1}`,
    isVipLocked: false,
    eid: ep.vid || ep.id || slug,
  }));
}

export function movieToDramaItem(
  m: MovieItem | MovieDetail,
  episodeCount = 1
): DramaItem {
  const isDetail = 'synopsis' in m;
  const ratingNum = parseFloat(m.rating || '0');
  const normalizedRating =
    Number.isFinite(ratingNum) && ratingNum > 0
      ? Number(Math.min(5, ratingNum > 5 ? ratingNum / 2 : ratingNum).toFixed(1))
      : 4.8;
  const safeSlug = String(m.slug || m.id || '').trim();
  const safeTitle = String(m.title || 'Untitled Movie').trim();
  const safeCover = String(
    (isDetail ? m.poster || m.cover : m.coverVt || m.cover) || m.coverHz || ''
  ).trim();
  const safeActors = isDetail && Array.isArray(m.actors) ? m.actors : [];
  const safeGenres = isDetail
    ? Array.isArray(m.genres)
      ? m.genres
      : []
    : Array.isArray(m.genre)
    ? m.genre
    : [];

  return {
    bookId: safeSlug,
    slug: safeSlug,
    title: safeTitle,
    cover: safeCover,
    coverHz: String(m.coverHz || m.cover || safeCover).trim(),
    description:
      (isDetail ? m.synopsis : m.description) ||
      `Watch ${safeTitle} in Full HD on House Drama Movies.`,
    chapterCount: Math.max(1, episodeCount),
    tags: safeGenres,
    corner: m.quality || (!isDetail ? m.badge : '') || 'HD',
    protagonist: safeActors.length > 0 ? safeActors.slice(0, 4).join(', ') : undefined,
    director: isDetail ? m.director : undefined,
    actors: isDetail ? safeActors : undefined,
    year: isDetail ? m.year : undefined,
    area: isDetail ? m.area : undefined,
    quality: m.quality || 'HD',
    isVip: false,
    provider: 'LK21',
    mediaType: 'movie',
    status: m.type === 'series' ? 'Ongoing' : 'Completed',
    rating: normalizedRating,
    dailyViews: !isDetail ? m.dailyViews : undefined,
    totalViews: !isDetail ? m.totalViews : undefined,
    trendBadge: !isDetail ? m.trendBadge : undefined,
  };
}
