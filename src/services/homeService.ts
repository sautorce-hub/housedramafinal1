import type { HomeCatalogResponse, LanguageCode, ProviderId } from '../types/drama';

const HOME_CLIENT_TTL_MS = 10 * 60 * 1000;
const SESSION_PREFIX = 'house_drama_home_cache_v1_';

const memoryHomeCache = new Map<
  string,
  { expiresAt: number; data: HomeCatalogResponse }
>();

function cacheKey(lang: LanguageCode, provider: ProviderId): string {
  return `${lang}:${provider}`;
}

export function getPeekCachedHomeCatalog(
  lang: LanguageCode,
  provider: ProviderId
): HomeCatalogResponse | null {
  const key = cacheKey(lang, provider);
  const mem = memoryHomeCache.get(key);
  if (mem && Date.now() < mem.expiresAt) {
    return mem.data;
  }
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${key}`);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        expiresAt: number;
        data: HomeCatalogResponse;
      };
      if (parsed?.data && Date.now() < parsed.expiresAt) {
        memoryHomeCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

export async function fetchHomeCatalog(
  lang: LanguageCode,
  provider: ProviderId = 'All',
  forceBypassClientCache = false
): Promise<HomeCatalogResponse> {
  const key = cacheKey(lang, provider);
  if (!forceBypassClientCache) {
    const cached = getPeekCachedHomeCatalog(lang, provider);
    if (cached) return cached;
  }

  const params = new URLSearchParams({
    lang,
    provider,
  });

  const res = await fetch(`/api/home?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Home catalog HTTP ${res.status}`);
  }

  const data = (await res.json()) as HomeCatalogResponse;
  const hasItems =
    data.heroSpotlights.length > 0 ||
    data.trendingTop.length > 0 ||
    data.hotReleases.length > 0 ||
    data.catalogGrid.length > 0;

  if (hasItems) {
    const entry = {
      expiresAt: Date.now() + HOME_CLIENT_TTL_MS,
      data,
    };
    memoryHomeCache.set(key, entry);
    try {
      sessionStorage.setItem(`${SESSION_PREFIX}${key}`, JSON.stringify(entry));
    } catch {
      // Ignore quota errors
    }
  }

  return data;
}
