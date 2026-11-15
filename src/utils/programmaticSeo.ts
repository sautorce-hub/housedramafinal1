export interface ProgrammaticFaqItem {
  q: string;
  a: string;
}

export interface ProgrammaticLandingConfig {
  slug: string;
  basePath: 'genre' | 'tag' | 'category';
  canonicalPath: string;
  routeKindLabel: string;
  h1: string;
  title: string;
  description: string;
  keywords: string;
  intro: string;
  filter: {
    genre?: string;
    status?: 'all' | 'Ongoing' | 'Completed';
    sort?: 'popular' | 'rating' | 'newest';
    q?: string;
  };
  searchFallbackQuery: string;
  relatedSlugs: Array<{ path: string; label: string }>;
  faqs: ProgrammaticFaqItem[];
}

export interface CuratedLandingPreset {
  slug: string;
  label: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  genre?: string;
  status?: 'all' | 'Ongoing' | 'Completed';
  sort?: 'popular' | 'rating' | 'newest';
  q?: string;
  searchFallbackQuery: string;
  keywords: string[];
}

export const CURATED_PROGRAMMATIC_PAGES: CuratedLandingPreset[] = [
  {
    slug: 'ceo',
    label: 'CEO Dramas',
    h1: 'Best CEO Vertical Short Dramas Online in HD',
    title: 'Watch Best CEO Short Dramas Online HD | House Drama',
    description:
      'Stream trending CEO vertical short dramas, secret boss romances, and office power-couple mini-series free in crisp HD on House Drama.',
    intro:
      'Discover binge-worthy CEO short dramas featuring dominant tech moguls, contract marriages, hidden identities, and unforgettable boardroom twists across 49+ global platforms.',
    genre: 'CEO',
    sort: 'popular',
    searchFallbackQuery: 'CEO',
    keywords: ['CEO short drama', 'watch CEO series online', 'dominating boss romance', 'vertical CEO drama'],
  },
  {
    slug: 'romance',
    label: 'Romance',
    h1: 'Top Romance Vertical Short Dramas & Love Stories',
    title: 'Watch Top Romance Short Dramas Online HD | House Drama',
    description:
      'Binge sweet romance vertical short dramas, second-chance love stories, and flash marriage series free in full HD on House Drama.',
    intro:
      'Explore heartwarming first loves, whirlwind flash marriages, and passionate reunion mini-series crafted in crisp 9:16 vertical cinema quality with English subtitles.',
    genre: 'Romance',
    sort: 'popular',
    searchFallbackQuery: 'Romance',
    keywords: ['romance short drama', 'watch love stories online', 'Asian romance mini series', 'sweet vertical drama'],
  },
  {
    slug: 'billionaire',
    label: 'Billionaire',
    h1: 'Trending Billionaire Short Dramas & Secret Heir Series',
    title: 'Watch Billionaire Short Dramas Online HD | House Drama',
    description:
      'Stream viral billionaire vertical short dramas, undercover tycoon sagas, and luxury heiress twists free in HD on House Drama.',
    intro:
      'Watch underdog heroes reveal secret multi-billion empires and humble brides marry into the world’s wealthiest families—updated daily with fast episode streaming.',
    genre: 'Billionaire',
    sort: 'popular',
    searchFallbackQuery: 'Billionaire',
    keywords: ['billionaire short drama', 'secret billionaire series', 'tycoon romance drama', 'wealthy heir mini series'],
  },
  {
    slug: 'revenge',
    label: 'Revenge',
    h1: 'Best Revenge & Rebirth Short Dramas Online',
    title: 'Watch Revenge & Rebirth Short Dramas HD | House Drama',
    description:
      'Stream high-stakes revenge short dramas, betrayal payback arcs, and rebirth time-loop thrillers free in HD on House Drama.',
    intro:
      'Experience gripping payback plots, reborn heiresses reclaiming their destiny, and poetic justice delivered minute-by-minute in sharp HD vertical episodes.',
    genre: 'Revenge',
    sort: 'popular',
    searchFallbackQuery: 'Revenge',
    keywords: ['revenge short drama', 'rebirth drama series', 'betrayal payback drama', 'watch revenge mini series'],
  },
  {
    slug: 'fantasy',
    label: 'Fantasy',
    h1: 'Fantasy, Cultivation & Supernatural Short Dramas',
    title: 'Watch Fantasy & Cultivation Short Dramas HD | House Drama',
    description:
      'Explore fantasy vertical short dramas featuring immortal cultivation, dragon gods, time travel, and magical realms in HD.',
    intro:
      'Step into worlds of immortal masters, hidden dragon kings, mythical systems, and supernatural romance with seamless multi-provider HD playback.',
    genre: 'Fantasy',
    sort: 'popular',
    searchFallbackQuery: 'Fantasy',
    keywords: ['fantasy short drama', 'immortal cultivation series', 'dragon king drama', 'supernatural vertical drama'],
  },
  {
    slug: 'historical',
    label: 'Historical',
    h1: 'Historical Palace & Royal Dynasty Short Dramas',
    title: 'Watch Historical Palace Short Dramas HD | House Drama',
    description:
      'Watch royal palace intrigue, emperor romance, and ancient dynasty costume short dramas free in crisp HD on House Drama.',
    intro:
      'Immerse yourself in royal court rivalries, noble generals, and forbidden palace love stories rendered with rich period costumes and dramatic cliffhangers.',
    genre: 'Historical',
    sort: 'popular',
    searchFallbackQuery: 'Historical',
    keywords: ['historical short drama', 'palace intrigue series', 'ancient costume mini drama', 'empress romance'],
  },
  {
    slug: 'action',
    label: 'Action',
    h1: 'Action, Martial Arts & Undercover Agent Short Dramas',
    title: 'Watch Action & Martial Arts Short Dramas HD | House Drama',
    description:
      'Stream high-octane martial arts, special forces hero, and undercover bodyguard vertical short dramas in HD on House Drama.',
    intro:
      'High-impact choreography, fearless lone warriors, and covert protectors defending those they love across explosive short-form episodes.',
    genre: 'Action',
    sort: 'popular',
    searchFallbackQuery: 'Action',
    keywords: ['action short drama', 'martial arts mini series', 'undercover hero drama', 'bodyguard short drama'],
  },
  {
    slug: 'dubbed',
    label: 'Dubbed Series',
    h1: 'English & Multi-Language Dubbed Short Dramas',
    title: 'Watch Dubbed Vertical Short Dramas Online HD | House Drama',
    description:
      'Stream dubbed vertical short dramas with clear voiceovers and synchronized subtitles across top Asian platforms on House Drama.',
    intro:
      'Prefer hands-free bingeing? Browse full-season dubbed short dramas ready for instant vertical playback without missing a single line of dialogue.',
    genre: 'Dubbed',
    sort: 'popular',
    searchFallbackQuery: 'Dubbed',
    keywords: ['dubbed short drama', 'English dubbed mini series', 'voiceover vertical drama'],
  },
  {
    slug: 'ceo-romance',
    label: 'CEO Romance',
    h1: 'Best CEO Romance Short Dramas & Contract Marriage Hits',
    title: 'Best CEO Romance Short Dramas Online HD | House Drama',
    description:
      'Binge top-rated CEO romance vertical short dramas, cold boss falls first tropes, and secret office love stories in HD.',
    intro:
      'From icy billionaires falling head-over-heels to whirlwind contract marriages turned real love, stream the most popular CEO romance short dramas in one curated hub.',
    genre: 'CEO',
    q: 'Romance',
    sort: 'popular',
    searchFallbackQuery: 'CEO Romance',
    keywords: ['CEO romance drama', 'cold boss love story', 'contract marriage short drama'],
  },
  {
    slug: 'billionaire-revenge',
    label: 'Billionaire Revenge',
    h1: 'Billionaire Revenge & Hidden Identity Payback Dramas',
    title: 'Watch Billionaire Revenge Short Dramas HD | House Drama',
    description:
      'Stream explosive billionaire revenge short dramas where underestimated heirs expose traitors and reclaim their empire in HD.',
    intro:
      'Nothing beats the moment a disguised tycoon drops the mask. Explore top billionaire revenge mini-series packed with high-society karma and fast-paced cliffhangers.',
    genre: 'Revenge',
    q: 'Billionaire',
    sort: 'popular',
    searchFallbackQuery: 'Billionaire Revenge',
    keywords: ['billionaire revenge drama', 'hidden identity tycoon', 'payback short series'],
  },
  {
    slug: 'hidden-identity-ceo',
    label: 'Hidden Identity CEO',
    h1: 'Hidden Identity CEO & Undercover Tycoon Short Dramas',
    title: 'Hidden Identity CEO Short Dramas Online HD | House Drama',
    description:
      'Watch undercover billionaire and hidden identity CEO vertical short dramas free in HD with instant episode streaming.',
    intro:
      'Disguised as delivery drivers, interns, or humble spouses—discover fan-favorite hidden identity CEO dramas that deliver unforgettable reveal scenes.',
    genre: 'CEO',
    q: 'Secret',
    sort: 'popular',
    searchFallbackQuery: 'Secret CEO',
    keywords: ['hidden identity CEO', 'undercover billionaire drama', 'secret boss short series'],
  },
  {
    slug: 'flash-marriage-romance',
    label: 'Flash Marriage Romance',
    h1: 'Flash Marriage & Instant Husband Romance Short Dramas',
    title: 'Flash Marriage Romance Short Dramas HD | House Drama',
    description:
      'Stream trending flash marriage vertical short dramas where strangers wed overnight and discover unexpected love and wealth.',
    intro:
      'Spontaneous courthouse weddings, secret billionaire grooms, and heartwarming slow-burn affection—binge complete flash marriage short dramas in HD.',
    genre: 'Romance',
    q: 'Marriage',
    sort: 'popular',
    searchFallbackQuery: 'Marriage',
    keywords: ['flash marriage drama', 'contract wife romance', 'secret husband short drama'],
  },
  {
    slug: 'completed-ceo-romance',
    label: 'Completed CEO Romance',
    h1: 'Completed CEO Romance Short Dramas (Full Seasons)',
    title: 'Completed CEO Romance Short Dramas Full Episodes | House Drama',
    description:
      'Watch completed CEO romance short dramas from Episode 1 to the finale with zero waiting on House Drama.',
    intro:
      'Binge finished CEO romance seasons start-to-finish without cliffhanger delays. Every series here includes full completed episode arcs ready to stream.',
    genre: 'CEO',
    status: 'Completed',
    sort: 'rating',
    searchFallbackQuery: 'CEO',
    keywords: ['completed CEO drama', 'finished romance mini series', 'binge full short drama'],
  },
  {
    slug: 'completed-short-dramas',
    label: 'Completed Full Series',
    h1: 'Completed Vertical Short Dramas — Watch Full Seasons Free',
    title: 'Completed Short Dramas — Full Seasons HD | House Drama',
    description:
      'Watch 100% completed vertical short drama series from premiere to finale in crisp HD across 49+ platforms.',
    intro:
      'Skip the wait for weekly updates. Browse full-length completed short drama seasons sorted by top viewer ratings and ready for marathon streaming.',
    status: 'Completed',
    sort: 'popular',
    searchFallbackQuery: 'Complete',
    keywords: ['completed short dramas', 'full season vertical series', 'watch finished mini drama'],
  },
  {
    slug: 'top-rated-romance',
    label: 'Top Rated Romance',
    h1: 'Highest Rated Romance Short Dramas of 2026',
    title: 'Top Rated Romance Short Dramas Online HD | House Drama',
    description:
      'Explore the highest-rated romance short dramas loved by global viewers—handpicked emotional hits streaming in HD.',
    intro:
      'Curated by viewer ratings and repeat replays, these top-rated romance short dramas deliver unforgettable chemistry, sharp pacing, and high production value.',
    genre: 'Romance',
    sort: 'rating',
    searchFallbackQuery: 'Love',
    keywords: ['top rated romance drama', 'best love mini series', 'highest rated short drama'],
  },
  {
    slug: 'rebirth-revenge',
    label: 'Rebirth & Time-Loop',
    h1: 'Rebirth & Second-Chance Revenge Short Dramas',
    title: 'Rebirth & Second-Chance Revenge Short Dramas HD | House Drama',
    description:
      'Watch reborn heiress and second-chance time-travel revenge short dramas where heroes rewrite fate in HD.',
    intro:
      'Sent back in time after a tragic betrayal, watch fierce protagonists outsmart schemers, protect loved ones, and rise to the top.',
    genre: 'Revenge',
    q: 'Rebirth',
    sort: 'popular',
    searchFallbackQuery: 'Rebirth',
    keywords: ['rebirth short drama', 'reborn heiress revenge', 'time travel payback series'],
  },
  {
    slug: 'royal-palace-drama',
    label: 'Royal Palace & Empress',
    h1: 'Royal Palace, Empress & Court Intrigue Short Dramas',
    title: 'Royal Palace & Empress Short Dramas HD | House Drama',
    description:
      'Stream imperial palace intrigue, strong empress comebacks, and royal romance vertical short dramas in HD.',
    intro:
      'Enter opulent imperial courts filled with strategic alliances, forbidden royal love, and dramatic throne room reversals.',
    genre: 'Historical',
    q: 'Royal',
    sort: 'popular',
    searchFallbackQuery: 'Queen',
    keywords: ['royal palace drama', 'empress short drama', 'imperial court mini series'],
  },
  {
    slug: 'best-vertical-short-dramas',
    label: 'Best Vertical Dramas',
    h1: 'Best Vertical Short Dramas & Viral Mini-Series Worldwide',
    title: 'Best Vertical Short Dramas Worldwide HD | House Drama',
    description:
      'Discover the most-watched vertical 9:16 short dramas trending globally across DramaBox, NetShort, ReelShort, and 45+ platforms.',
    intro:
      'Your global gateway to the top vertical micro-dramas taking over mobile screens—ranked by real-time views, completion rates, and audience ratings.',
    sort: 'popular',
    searchFallbackQuery: 'Love',
    keywords: ['best vertical dramas', 'viral short dramas', 'micro drama streaming', 'top mini series'],
  },
];

const CURATED_MAP = new Map<string, CuratedLandingPreset>(
  CURATED_PROGRAMMATIC_PAGES.map((p) => [p.slug, p])
);

const KNOWN_GENRES = [
  'CEO',
  'Romance',
  'Billionaire',
  'Revenge',
  'Fantasy',
  'Historical',
  'Action',
  'Dubbed',
  'Comedy',
  'Thriller',
  'Mystery',
  'Family',
  'Campus',
  'Medical',
];

function toTitleCase(input: string): string {
  return input
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function cleanSlugSegment(raw: string): string {
  return decodeURIComponent(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildDynamicFaqs(topicTitle: string): ProgrammaticFaqItem[] {
  return [
    {
      q: `Where can I watch ${topicTitle} online in HD?`,
      a: `You can stream ${topicTitle} directly on House Drama in crisp 9:16 vertical theater or wide cinema mode across 49+ connected short-drama platforms with instant episode switching.`,
    },
    {
      q: `Are ${topicTitle} updated with English subtitles?`,
      a: `Yes. House Drama supports multi-language subtitles (including English, Indonesian, Mandarin, and Vietnamese) and automatically loads available subtitle tracks whenever provided by the source stream.`,
    },
    {
      q: `Can I filter ${topicTitle} by completed seasons or top ratings?`,
      a: `Yes. Use the status and sort toggles at the top of this page to filter between Completed full-season binges, Ongoing releases, Most Popular hits, and Highest Rated series.`,
    },
  ];
}

export function resolveProgrammaticLanding(
  rawSlug: string,
  basePath: 'genre' | 'tag' | 'category' = 'genre',
  rawModifier?: string
): ProgrammaticLandingConfig {
  const s1 = cleanSlugSegment(rawSlug) || 'romance';
  const s2 = rawModifier ? cleanSlugSegment(rawModifier) : '';
  const combinedSlug = s2 ? `${s1}-${s2}` : s1;
  const canonicalPath = s2 ? `/${basePath}/${s1}/${s2}` : `/${basePath}/${s1}`;

  const exactPreset = CURATED_MAP.get(combinedSlug) || (!s2 ? CURATED_MAP.get(s1) : undefined);

  const related = CURATED_PROGRAMMATIC_PAGES.filter(
    (p) => p.slug !== (exactPreset?.slug || combinedSlug)
  )
    .slice(0, 8)
    .map((p) => ({
      path: `/genre/${p.slug}`,
      label: p.label,
    }));

  if (exactPreset) {
    return {
      slug: combinedSlug,
      basePath,
      canonicalPath,
      routeKindLabel:
        basePath === 'tag'
          ? 'Curated Tag Collection'
          : basePath === 'category'
          ? 'Curated Category'
          : 'Curated Genre Guide',
      h1: exactPreset.h1,
      title: exactPreset.title,
      description: exactPreset.description,
      keywords: [
        ...exactPreset.keywords,
        'House Drama',
        'Vertical Short Drama',
        'Watch Online HD',
      ].join(', '),
      intro: exactPreset.intro,
      filter: {
        genre: exactPreset.genre,
        status: exactPreset.status || 'all',
        sort: exactPreset.sort || 'popular',
        q: exactPreset.q,
      },
      searchFallbackQuery: exactPreset.searchFallbackQuery,
      relatedSlugs: related,
      faqs: buildDynamicFaqs(exactPreset.label),
    };
  }

  // Dynamic programmatic parsing for arbitrary /genre/:genre/:modifier or /tag/:slug
  const tokens = combinedSlug.split('-').filter(Boolean);
  let status: 'all' | 'Ongoing' | 'Completed' = 'all';
  let sort: 'popular' | 'rating' | 'newest' = 'popular';
  let matchedGenre: string | undefined;
  const extraQueryTokens: string[] = [];

  for (const tok of tokens) {
    if (tok === 'completed' || tok === 'complete' || tok === 'finished' || tok === 'full') {
      status = 'Completed';
      continue;
    }
    if (tok === 'ongoing' || tok === 'updating') {
      status = 'Ongoing';
      continue;
    }
    if (tok === 'top' || tok === 'rated' || tok === 'best' || tok === 'highest') {
      sort = 'rating';
      continue;
    }
    if (tok === 'new' || tok === 'newest' || tok === 'latest' || tok === 'recent') {
      sort = 'newest';
      continue;
    }
    if (tok === 'popular' || tok === 'trending' || tok === 'hot' || tok === 'series' || tok === 'dramas' || tok === 'drama' || tok === 'short') {
      continue;
    }
    const gMatch = KNOWN_GENRES.find((g) => g.toLowerCase() === tok);
    if (gMatch && !matchedGenre) {
      matchedGenre = gMatch;
    } else {
      extraQueryTokens.push(tok);
    }
  }

  const readableLabel = toTitleCase(combinedSlug.replace(/-/g, ' '));
  const primarySubject =
    matchedGenre || (extraQueryTokens.length > 0 ? toTitleCase(extraQueryTokens.join(' ')) : readableLabel);
  const queryTerm = extraQueryTokens.length > 0 ? toTitleCase(extraQueryTokens.join(' ')) : undefined;

  const titleCandidate = `Watch ${readableLabel} Short Dramas HD | House Drama`;
  const title =
    titleCandidate.length > 65
      ? `${readableLabel} Short Dramas HD | House Drama`
      : titleCandidate;
  const rawDesc = `Stream top ${readableLabel.toLowerCase()} vertical short dramas and binge-worthy Asian mini-series free in full HD across 49+ platforms on House Drama.`;
  const description =
    rawDesc.length > 158 ? `${rawDesc.slice(0, 155).trim()}...` : rawDesc;

  return {
    slug: combinedSlug,
    basePath,
    canonicalPath,
    routeKindLabel:
      basePath === 'tag'
        ? 'Curated Tag Collection'
        : basePath === 'category'
        ? 'Curated Category'
        : 'Programmatic Genre Hub',
    h1: `${readableLabel} Vertical Short Dramas & Mini-Series`,
    title,
    description,
    keywords: [
      `${readableLabel} short drama`,
      `Watch ${readableLabel} online`,
      `${primarySubject} mini series`,
      'House Drama',
      'Vertical Drama HD',
    ].join(', '),
    intro: `Browse our curated ${readableLabel} catalog featuring crisp vertical HD playback, episode-by-episode cloud progress sync, and live popularity rankings across top global streaming providers.`,
    filter: {
      genre: matchedGenre,
      status,
      sort,
      q: matchedGenre ? queryTerm : queryTerm || readableLabel,
    },
    searchFallbackQuery: queryTerm || matchedGenre || readableLabel,
    relatedSlugs: related,
    faqs: buildDynamicFaqs(`${readableLabel} Short Dramas`),
  };
}
