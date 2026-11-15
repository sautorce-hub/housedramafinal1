import type {
  DramaItem,
  EpisodeItem,
  LanguageCode,
  MediaProviderName,
  NavTab,
} from '../types/drama';
import type { ProgrammaticLandingConfig } from './programmaticSeo';

export const DEFAULT_OG_IMAGE_PATH = '/assets/aistudio/gambar_OG_39d1f12c.png';

export function slugifyDramaTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'series';
}

export function getDramaPath(
  bookId: string,
  title?: string,
  provider: MediaProviderName = 'DramaBox',
  slug?: string
): string {
  const cleanSlug =
    (slug || '').trim() ||
    (title ? slugifyDramaTitle(title) : encodeURIComponent(bookId));
  if (provider === 'LK21') {
    return `/movie/${encodeURIComponent(cleanSlug)}`;
  }
  return `/drama/${encodeURIComponent(cleanSlug)}`;
}

export function toAbsoluteOgImage(
  rawImage: string | undefined,
  originUrl: string
): string {
  const cleanOrigin = originUrl.replace(/\/$/, '');
  const trimmed = (rawImage || '').trim();
  if (!trimmed) return `${cleanOrigin}${DEFAULT_OG_IMAGE_PATH}`;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) return `${cleanOrigin}${trimmed}`;
  return `${cleanOrigin}/${trimmed}`;
}

export function formatPlaybackClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function buildDramaSeoMetadata(
  drama: DramaItem,
  originUrl: string,
  lang: LanguageCode = 'en'
) {
  const cleanOrigin = originUrl.replace(/\/$/, '');
  const path = getDramaPath(drama.bookId, drama.title, drama.provider, drama.slug);
  const canonicalUrl = `${cleanOrigin}${path}`;
  const epCount = Math.max(1, drama.chapterCount || 1);
  const title =
    lang === 'id'
      ? `Nonton ${drama.title} Sub Indo Full Episode - House Drama`
      : lang === 'cn'
      ? `在线观看 ${drama.title} 全集高清 - House Drama`
      : lang === 'vi'
      ? `Xem Phim ${drama.title} Trọn Bộ HD - House Drama`
      : `Watch ${drama.title} Full Episodes Online HD (${epCount} Eps) | House Drama`;
  const rawDesc =
    drama.description ||
    `Watch ${drama.title} (${epCount} episodes) online in crisp HD vertical cinema mode on House Drama.`;
  const description =
    rawDesc.length > 158 ? `${rawDesc.slice(0, 155).trim()}...` : rawDesc;
  const keywords = [
    drama.title,
    `Watch ${drama.title} online`,
    'House Drama',
    'Vertical short drama',
    'Asian mini series',
    drama.provider,
    ...drama.tags,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    title,
    description,
    keywords,
    canonicalUrl,
    image: toAbsoluteOgImage(drama.cover, cleanOrigin),
  };
}

export function buildDramaJsonLd(
  drama: DramaItem,
  episodes: EpisodeItem[],
  originUrl: string,
  episodeNumber = 1
) {
  const cleanOrigin = originUrl.replace(/\/$/, '');
  const dramaUrl = `${cleanOrigin}${getDramaPath(
    drama.bookId,
    drama.title,
    drama.provider,
    drama.slug
  )}`;
  const episodeCount = episodes.length || drama.chapterCount || 1;
  const coverImage = toAbsoluteOgImage(drama.cover, cleanOrigin);
  const logoImage = `${cleanOrigin}/assets/aistudio/logo_dan_pavicon_f5e028e6.png`;
  const epWatchUrl = episodeNumber > 1 ? `${dramaUrl}?ep=${episodeNumber}` : dramaUrl;

  const isMovie = drama.mediaType === 'movie' || drama.provider === 'LK21';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': isMovie ? 'Movie' : 'TVSeries',
        '@id': `${dramaUrl}#${isMovie ? 'movie' : 'tvseries'}`,
        name: drama.title,
        description: drama.description,
        image: coverImage,
        url: dramaUrl,
        inLanguage: 'en',
        numberOfEpisodes: episodeCount,
        genre: drama.tags.length > 0 ? drama.tags : ['Drama', 'Short Series'],
        actor: drama.protagonist
          ? drama.protagonist.split(',').map((name) => ({
              '@type': 'Person',
              name: name.trim(),
            }))
          : undefined,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(drama.rating || 4.9),
          bestRating: '5',
          ratingCount: '1240',
        },
        containsSeason: {
          '@type': 'TVSeason',
          seasonNumber: 1,
          numberOfEpisodes: episodeCount,
        },
        potentialAction: {
          '@type': 'WatchAction',
          target: epWatchUrl,
        },
      },
      {
        '@type': 'VideoObject',
        '@id': `${epWatchUrl}#video`,
        name: `${drama.title} - Episode ${episodeNumber}`,
        description: drama.description,
        thumbnailUrl: [coverImage],
        uploadDate: '2026-01-01T00:00:00Z',
        inLanguage: 'en',
        contentUrl: epWatchUrl,
        embedUrl: epWatchUrl,
        publisher: {
          '@type': 'Organization',
          name: 'House Drama',
          url: cleanOrigin,
          logo: {
            '@type': 'ImageObject',
            url: logoImage,
          },
        },
      },
    ],
  };
}

function upsertMetaTag(
  selectorAttr: 'name' | 'property',
  attrValue: string,
  content: string
) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${selectorAttr}="${attrValue}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(selectorAttr, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertHreflangLinks(href: string) {
  const langs = ['en', 'x-default'] as const;
  for (const lang of langs) {
    let el = document.head.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${lang}"]`
    );
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', 'alternate');
      el.setAttribute('hreflang', lang);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }
}

function upsertJsonLdScript(data: Record<string, unknown>) {
  let script = document.head.querySelector<HTMLScriptElement>(
    'script#house-drama-jsonld[type="application/ld+json"], script#coffee-drama-jsonld[type="application/ld+json"]'
  );
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'house-drama-jsonld';
    document.head.appendChild(script);
  }
  script.id = 'house-drama-jsonld';
  script.textContent = JSON.stringify(data);
}

export function syncHomeDocumentSeo() {
  const origin = window.location.origin;
  const ogImage = `${origin}${DEFAULT_OG_IMAGE_PATH}`;
  const title =
    'House Drama — Watch HD Vertical Short Dramas & Asian Series Online';
  const description =
    'Stream trending HD vertical short dramas, billionaire romance, revenge sagas, and Asian mini-series free across 49+ top platforms on House Drama.';
  document.title = title;
  upsertMetaTag('name', 'description', description);
  upsertMetaTag('property', 'og:site_name', 'House Drama');
  upsertMetaTag('property', 'og:locale', 'en_US');
  upsertMetaTag('property', 'og:title', title);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:url', `${origin}/`);
  upsertMetaTag('property', 'og:image', ogImage);
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', description);
  upsertMetaTag('name', 'twitter:image', ogImage);
  upsertCanonicalLink(`${origin}/`);
  upsertHreflangLinks(`${origin}/`);
  upsertJsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'House Drama',
    inLanguage: 'en',
    url: `${origin}/`,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
}

export function syncSectionDocumentSeo(section: NavTab) {
  if (section === 'home') {
    syncHomeDocumentSeo();
    return;
  }
  const origin = window.location.origin;
  const ogImage = `${origin}${DEFAULT_OG_IMAGE_PATH}`;
  const metaMap: Record<
    Exclude<NavTab, 'home'>,
    { path: string; title: string; description: string }
  > = {
    movies: {
      path: '/movies',
      title: 'Watch Free HD Movies Online — Box Office, Asian Cinema & Series | House Drama',
      description:
        'Stream thousands of full HD feature films, Asian cinema, Korean movies, Hollywood hits, and latest releases free online at House Drama Movies.',
    },
    explore: {
      path: '/explore',
      title: 'Explore All Vertical Short Dramas by Genre & Filter | House Drama',
      description:
        'Filter 49+ short drama platforms by CEO, Romance, Revenge, Fantasy, Billionaire, completion status, and rating on House Drama.',
    },
    ranking: {
      path: '/trending',
      title: 'Trending Short Dramas Right Now — Top Ranked Series | House Drama',
      description:
        'Watch today’s #1 viral short dramas and top-ranked mini-series streamed globally in crisp HD on House Drama.',
    },
    terbaru: {
      path: '/latest',
      title: 'Latest New Releases — Fresh Daily Short Dramas | House Drama',
      description:
        'Catch newly released episodes and premiering short drama series updated daily across 49+ platforms.',
    },
    vip: {
      path: '/vip',
      title: 'VIP Exclusive Vertical Short Dramas | House Drama',
      description:
        'Discover VIP-exclusive billionaire romance, revenge sagas, and cinematic mini-series in full HD.',
    },
    anime: {
      path: '/explore',
      title: 'Anime & Donghua Short Series | House Drama',
      description: 'Stream top animated short series and donghua episodes in HD on House Drama.',
    },
    dubbing: {
      path: '/explore',
      title: 'Dubbed Short Drama Series | House Drama',
      description: 'Watch multi-language dubbed vertical short dramas in crisp HD.',
    },
    mylist: {
      path: '/watchlist',
      title: 'My Movie Watchlist & Saved Films | House Drama',
      description: 'Manage your saved feature films, movie folders, watching status, and completed movies.',
    },
    dashboard: {
      path: '/dashboard',
      title: 'My Account Dashboard, History & Watchlist | House Drama',
      description: 'Manage your profile, cloud-synced watch history, personal watchlist, and comments on House Drama.',
    },
  };
  const cfg = metaMap[section];
  const canonicalUrl = `${origin}${cfg.path}`;
  document.title = cfg.title;
  upsertMetaTag('name', 'description', cfg.description);
  upsertMetaTag('property', 'og:site_name', 'House Drama');
  upsertMetaTag('property', 'og:locale', 'en_US');
  upsertMetaTag('property', 'og:title', cfg.title);
  upsertMetaTag('property', 'og:description', cfg.description);
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:image', ogImage);
  upsertMetaTag('name', 'twitter:title', cfg.title);
  upsertMetaTag('name', 'twitter:description', cfg.description);
  upsertMetaTag('name', 'twitter:image', ogImage);
  upsertCanonicalLink(canonicalUrl);
  upsertHreflangLinks(canonicalUrl);
}

export function syncTagDocumentSeo(tag: string, lang: LanguageCode = 'en') {
  const origin = window.location.origin;
  const ogImage = `${origin}${DEFAULT_OG_IMAGE_PATH}`;
  const slug = slugifyDramaTitle(tag);
  const canonicalUrl = `${origin}/tag/${slug}`;
  const title =
    lang === 'id'
      ? `Nonton Drama Pendek ${tag} Sub Indo - House Drama`
      : lang === 'cn'
      ? `${tag} 热门短剧合集 - House Drama`
      : lang === 'vi'
      ? `Xem Phim Ngắn ${tag} HD - House Drama`
      : `Watch ${tag} Vertical Short Dramas Online HD | House Drama`;
  const description = `Stream top trending ${tag} vertical short dramas and binge-worthy mini-series across 49+ platforms free in HD on House Drama.`;
  document.title = title;
  upsertMetaTag('name', 'description', description);
  upsertMetaTag('property', 'og:site_name', 'House Drama');
  upsertMetaTag('property', 'og:locale', 'en_US');
  upsertMetaTag('property', 'og:title', title);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:image', ogImage);
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', description);
  upsertMetaTag('name', 'twitter:image', ogImage);
  upsertCanonicalLink(canonicalUrl);
  upsertHreflangLinks(canonicalUrl);
}

export function syncProgrammaticLandingSeo(
  landing: ProgrammaticLandingConfig,
  items: DramaItem[] = []
) {
  const origin = window.location.origin;
  const ogImage = `${origin}${DEFAULT_OG_IMAGE_PATH}`;
  const canonicalUrl = `${origin}${landing.canonicalPath}`;
  document.title = landing.title;
  upsertMetaTag('name', 'description', landing.description);
  upsertMetaTag('name', 'keywords', landing.keywords);
  upsertMetaTag('property', 'og:site_name', 'House Drama');
  upsertMetaTag('property', 'og:locale', 'en_US');
  upsertMetaTag('property', 'og:title', landing.title);
  upsertMetaTag('property', 'og:description', landing.description);
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:image', ogImage);
  upsertMetaTag('name', 'twitter:title', landing.title);
  upsertMetaTag('name', 'twitter:description', landing.description);
  upsertMetaTag('name', 'twitter:image', ogImage);
  upsertCanonicalLink(canonicalUrl);
  upsertHreflangLinks(canonicalUrl);
  upsertJsonLdScript({
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
          numberOfItems: Math.min(12, items.length),
          itemListElement: items.slice(0, 12).map((d, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: d.title,
            url: `${origin}${getDramaPath(d.bookId, d.title, d.provider, d.slug)}`,
          })),
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
  });
}

export function syncDramaDocumentSeo(
  drama: DramaItem,
  episodes: EpisodeItem[],
  lang: LanguageCode = 'en'
) {
  const origin = window.location.origin;
  const meta = buildDramaSeoMetadata(drama, origin, lang);
  document.title = meta.title;
  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'keywords', meta.keywords);
  upsertMetaTag('property', 'og:site_name', 'House Drama');
  upsertMetaTag('property', 'og:locale', 'en_US');
  upsertMetaTag('property', 'og:title', meta.title);
  upsertMetaTag('property', 'og:description', meta.description);
  upsertMetaTag('property', 'og:type', 'video.tv_show');
  upsertMetaTag('property', 'og:url', meta.canonicalUrl);
  upsertMetaTag('property', 'og:image', meta.image);
  upsertMetaTag('name', 'twitter:image', meta.image);
  upsertMetaTag('name', 'twitter:title', meta.title);
  upsertMetaTag('name', 'twitter:description', meta.description);
  upsertCanonicalLink(meta.canonicalUrl);
  upsertHreflangLinks(meta.canonicalUrl);
  upsertJsonLdScript(buildDramaJsonLd(drama, episodes, origin, 1));
}

export function syncEpisodePlayerSeo(
  drama: DramaItem,
  episodeNumber: number,
  episodes: EpisodeItem[] = []
) {
  const origin = window.location.origin;
  const path = getDramaPath(drama.bookId, drama.title, drama.provider, drama.slug);
  const canonicalUrl = `${origin}${path}`;
  const watchUrl = episodeNumber > 1 ? `${canonicalUrl}?ep=${episodeNumber}` : canonicalUrl;
  const title = `Watch ${drama.title} Episode ${episodeNumber} Online HD | House Drama`;
  const rawDesc =
    drama.description ||
    `Stream ${drama.title} Episode ${episodeNumber} in crisp HD vertical theater mode on House Drama.`;
  const description =
    rawDesc.length > 158 ? `${rawDesc.slice(0, 155).trim()}...` : rawDesc;
  const ogImage = toAbsoluteOgImage(drama.cover, origin);

  document.title = title;
  upsertMetaTag('name', 'description', description);
  upsertMetaTag('property', 'og:site_name', 'House Drama');
  upsertMetaTag('property', 'og:locale', 'en_US');
  upsertMetaTag('property', 'og:title', title);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:type', 'video.episode');
  upsertMetaTag('property', 'og:url', watchUrl);
  upsertMetaTag('property', 'og:image', ogImage);
  upsertMetaTag('name', 'twitter:image', ogImage);
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', description);
  upsertCanonicalLink(canonicalUrl);
  upsertHreflangLinks(canonicalUrl);
  upsertJsonLdScript(buildDramaJsonLd(drama, episodes, origin, episodeNumber));
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSitemapXml(
  items: DramaItem[],
  originUrl: string
): string {
  const base = originUrl.replace(/\/$/, '');
  const seen = new Set<string>([`${base}/`]);
  const entries: { loc: string; changefreq: string; priority: string }[] = [
    { loc: `${base}/`, changefreq: 'hourly', priority: '1.0' },
  ];

  for (const item of items) {
    const loc = `${base}${getDramaPath(
      item.bookId,
      item.title,
      item.provider,
      item.slug
    )}`;
    if (!seen.has(loc)) {
      seen.add(loc);
      entries.push({ loc, changefreq: 'daily', priority: '0.8' });
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(
      (entry) =>
        `  <url><loc>${escapeXml(entry.loc)}</loc><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
    )
    .join('\n')}\n</urlset>`;
}
