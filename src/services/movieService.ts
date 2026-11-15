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

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    let msg = `Movie service error (${res.status})`;
    try {
      const errBody = (await res.json()) as { error?: string };
      if (errBody?.error) msg = errBody.error;
    } catch {
      // Ignore parse error
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export function fetchLk21Home(): Promise<Lk21HomeResponse> {
  return fetchCached('lk21:home', HOME_TTL, () =>
    getJson<Lk21HomeResponse>('/api/lk21/home')
  );
}

export function fetchLk21Menu(): Promise<Lk21MenuResponse> {
  return fetchCached('lk21:menu', MENU_TTL, () =>
    getJson<Lk21MenuResponse>('/api/lk21/menu')
  );
}

export function fetchLk21Latest(page = 1): Promise<Lk21ListResponse> {
  return fetchCached(`lk21:latest:${page}`, LIST_TTL, () =>
    getJson<Lk21ListResponse>(`/api/lk21/latest?page=${encodeURIComponent(String(page))}`)
  );
}

export function fetchLk21Category(
  key: string,
  page = 1
): Promise<Lk21ListResponse> {
  return fetchCached(`lk21:category:${key}:${page}`, LIST_TTL, () =>
    getJson<Lk21ListResponse>(
      `/api/lk21/category?key=${encodeURIComponent(key)}&page=${encodeURIComponent(String(page))}`
    )
  );
}

export function searchLk21Movies(
  q: string,
  page = 1
): Promise<Lk21ListResponse> {
  const trimmed = q.trim();
  if (!trimmed) {
    return Promise.resolve({
      ok: true,
      q: '',
      page,
      count: 0,
      hasMore: false,
      items: [],
    });
  }
  return getJson<Lk21ListResponse>(
    `/api/lk21/search?q=${encodeURIComponent(trimmed)}&page=${encodeURIComponent(String(page))}`
  );
}

export function fetchLk21Detail(slug: string): Promise<MovieDetail> {
  const clean = slug.trim().toLowerCase();
  return fetchCached(`lk21:detail:${clean}`, DETAIL_TTL, () =>
    getJson<MovieDetail>(`/api/lk21/detail?slug=${encodeURIComponent(clean)}`)
  );
}

export function fetchLk21Episodes(slug: string): Promise<{
  ok: boolean;
  slug: string;
  title: string;
  count: number;
  episodes: MovieEpisodeItem[];
}> {
  const clean = slug.trim().toLowerCase();
  return fetchCached(`lk21:episodes:${clean}`, DETAIL_TTL, () =>
    getJson(`/api/lk21/episodes?slug=${encodeURIComponent(clean)}`)
  );
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

    const url = data.streamUrl || data.url;
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
      subtitles: data.subtitles ?? [],
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

  return {
    bookId: m.slug,
    slug: m.slug,
    title: m.title,
    cover: (isDetail ? m.poster || m.cover : m.coverVt || m.cover) || m.coverHz,
    coverHz: m.coverHz || m.cover,
    description:
      (isDetail ? m.synopsis : m.description) ||
      `Watch ${m.title} in Full HD on House Drama Movies.`,
    chapterCount: Math.max(1, episodeCount),
    tags: isDetail ? m.genres : m.genre || [],
    corner: m.quality || (!isDetail ? m.badge : '') || 'HD',
    protagonist: isDetail ? m.actors.slice(0, 4).join(', ') : undefined,
    director: isDetail ? m.director : undefined,
    actors: isDetail ? m.actors : undefined,
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
