import React, {
  Suspense,
  lazy,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Bookmark,
  Flame,
  Clock,
  Loader2,
  AlertCircle,
  RotateCcw,
  Home,
  Search,
  Crown,
  Film,
  Sparkles,
  Layers,
  FolderPlus,
  Trash2,
  User,
  CheckCircle2,
  Bell,
  Tag,
  X,
  Compass,
  ChevronRight,
  Clapperboard,
  Lock,
} from 'lucide-react';
import {
  ACTIVE_PROVIDER_NAMES,
  ALL_PROVIDER_ADAPTERS,
  anyReelProvider,
  blinkDramaProvider,
  cubeTvProvider,
  dramaBoxProvider,
  dramaOraProvider,
  dramaWaveProvider,
  flareFlowProvider,
  flickReelsProvider,
  freeReelsProvider,
  freeShortProvider,
  goodShortProvider,
  happyShortProvider,
  iqiyiProvider,
  joyReelsProvider,
  loveShotsProvider,
  meloShortProvider,
  meloloProvider,
  moboReelsProvider,
  netShortProvider,
  petaDramaProvider,
  PROVIDER_FILTERS,
  shotShortProvider,
  syncAllProvidersLanguage,
  toonShortProvider,
  viglooProvider,
} from './services/dramaProviders';
import {
  fetchHomeCatalog,
  getPeekCachedHomeCatalog,
} from './services/homeService';
import {
  fetchLk21Detail,
  fetchLk21EpisodesAsEpisodeItems,
  movieToDramaItem,
} from './services/movieService';
import { useDramaContext } from './context/DramaContext';
import {
  getDramaPath,
  slugifyDramaTitle,
  syncDramaDocumentSeo,
  syncHomeDocumentSeo,
  syncSectionDocumentSeo,
} from './utils/seo';
import { buildPickedForYouRecommendations } from './utils/recommendations';
import type {
  DramaItem,
  EpisodeItem,
  HomeCatalogResponse,
  LanguageCode,
  MediaProviderName,
  NavTab,
  ProviderId,
  ProviderName,
  WatchStatusFilter,
} from './types/drama';
import { Navbar, DesktopSidebar } from './components/Navbar';
import { HeroSpotlight } from './components/HeroSpotlight';
import { CarouselRow } from './components/CarouselRow';
import { DramaCard } from './components/DramaCard';
import { LazySection } from './components/LazySection';
import { CarouselSkeleton } from './components/SkeletonCard';
import { PWAInstallButton } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';

const ExploreView = lazy(() => import('./components/ExploreView'));
const MoviesView = lazy(() =>
  import('./components/MoviesView').then((m) => ({
    default: m.MoviesView,
  }))
);
const ProviderEndpointSection = lazy(
  () => import('./components/ProviderEndpointSection')
);
const SeoLandingPage = lazy(() =>
  import('./components/SeoLandingPage').then((m) => ({
    default: m.SeoLandingPage,
  }))
);
const DramaDetailPage = lazy(() =>
  import('./components/DramaDetailPage').then((m) => ({
    default: m.DramaDetailPage,
  }))
);
const CinemaVideoPlayer = lazy(() =>
  import('./components/CinemaVideoPlayer').then((m) => ({
    default: m.CinemaVideoPlayer,
  }))
);
const MovieVideoPlayer = lazy(() =>
  import('./components/MovieVideoPlayer').then((m) => ({
    default: m.MovieVideoPlayer,
  }))
);
const SearchModal = lazy(() =>
  import('./components/SearchModal').then((m) => ({
    default: m.SearchModal,
  }))
);
const ProviderHubModal = lazy(() =>
  import('./components/ProviderHubModal').then((m) => ({
    default: m.ProviderHubModal,
  }))
);
const AuthProfileModal = lazy(() =>
  import('./components/AuthProfileModal').then((m) => ({
    default: m.AuthProfileModal,
  }))
);
const HelpCenterModal = lazy(() =>
  import('./components/HelpCenterModal').then((m) => ({
    default: m.HelpCenterModal,
  }))
);
const UserDashboard = lazy(() =>
  import('./components/UserDashboard').then((m) => ({
    default: m.UserDashboard,
  }))
);

interface FeedState {
  items: DramaItem[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

interface InitialSsrPayload {
  bookId?: string;
  drama?: DramaItem | null;
  episodes?: EpisodeItem[];
}

declare global {
  interface Window {
    __INITIAL_DRAMA__?: InitialSsrPayload;
  }
}

const INITIAL_FEED: FeedState = {
  items: [],
  page: 1,
  hasMore: false,
  loading: true,
  loadingMore: false,
  error: null,
};

const IDLE_FEED: FeedState = {
  items: [],
  page: 1,
  hasMore: false,
  loading: false,
  loadingMore: false,
  error: null,
};

type ExtraProviderName = Exclude<
  ProviderName,
  'DramaBox' | 'NetShort' | 'AnyReel' | 'Melolo'
>;

const EXTRA_PROVIDER_NAMES: ExtraProviderName[] = [
  'DramaOra',
  'MeloShort',
  'PetaDrama',
  'RadReels',
  'DramaVerse',
  'KalosTV',
  'StardustTV',
  'StarShort',
  'DramaBite',
  'LoveShots',
  'MyDrama',
  'ShotShort',
  'MoboReels',
  'BlinkDrama',
  'WeTV',
  'CubeTV',
  'MicroDrama',
  'FlareFlow',
  'FunDrama',
  'FreeShort',
  'ToonShort',
  'HappyShort',
  'DramaDash',
  'StoryReel',
  'StoryReelV2',
  'VibeShort',
  'VibeShortV2',
  'FlickReels',
  'DramaWave',
  'FreeReels',
  'PineDrama',
  'ShortMax',
  'ShortMaxV2',
  'FlexTV',
  'Vigloo',
  'DotDrama',
  'iDrama',
  'iDramaV2',
  'GoodShort',
  'ReelShort',
  'ReelShortV2',
  'JoyReels',
  'SodaReels',
  'BonusTV',
  'iQIYI',
];

interface ExtraProviderFeedBundle {
  main: FeedState;
  rank: FeedState;
  newest: FeedState;
  vip: FeedState;
  anime?: FeedState;
  dubbing?: FeedState;
  special?: FeedState;
  fullLoaded: boolean;
}

function createInitialExtraFeeds(): Record<
  ExtraProviderName,
  ExtraProviderFeedBundle
> {
  const out = {} as Record<ExtraProviderName, ExtraProviderFeedBundle>;
  for (const name of EXTRA_PROVIDER_NAMES) {
    out[name] = {
      main: { ...INITIAL_FEED },
      rank: { ...IDLE_FEED },
      newest: { ...IDLE_FEED },
      vip: { ...IDLE_FEED },
      anime:
        name === 'MoboReels' ||
        name === 'FreeReels' ||
        name === 'GoodShort' ||
        name === 'iQIYI'
          ? { ...IDLE_FEED }
          : undefined,
      dubbing:
        name === 'FreeReels' || name === 'GoodShort'
          ? { ...IDLE_FEED }
          : undefined,
      special: { ...IDLE_FEED },
      fullLoaded: false,
    };
  }
  return out;
}

function isExtraProvider(p: ProviderId): p is ExtraProviderName {
  return (EXTRA_PROVIDER_NAMES as string[]).includes(p);
}

function parseProviderName(raw: string | null | undefined): ProviderName | undefined {
  if (!raw) return undefined;
  const norm = raw.trim().toLowerCase();
  if (norm === 'stardust') return 'StardustTV';
  if (norm === 'storyreel_v2') return 'StoryReelV2';
  if (norm === 'vibeshort_v2') return 'VibeShortV2';
  if (norm === 'shortmax_v2') return 'ShortMaxV2';
  if (norm === 'idrama_v2') return 'iDramaV2';
  if (norm === 'reelshort_v2') return 'ReelShortV2';
  return ACTIVE_PROVIDER_NAMES.find((p) => p.toLowerCase() === norm);
}

function parseTabFromLocation(): NavTab {
  if (typeof window === 'undefined') return 'home';
  const p = window.location.pathname.toLowerCase();
  if (p === '/movies' || p.startsWith('/movies/') || p.startsWith('/movie/')) {
    return 'movies';
  }
  if (p === '/explore') return 'explore';
  if (p === '/trending') return 'ranking';
  if (p === '/latest') return 'terbaru';
  if (p === '/vip') return 'vip';
  if (p === '/watchlist') return 'mylist';
  if (p === '/dashboard') return 'dashboard';
  return 'home';
}

function getTabPath(tab: NavTab): string {
  switch (tab) {
    case 'movies':
      return '/movies';
    case 'explore':
    case 'anime':
    case 'dubbing':
      return '/explore';
    case 'ranking':
      return '/trending';
    case 'terbaru':
      return '/latest';
    case 'vip':
      return '/vip';
    case 'mylist':
      return '/watchlist';
    case 'dashboard':
      return '/dashboard';
    default:
      return '/';
  }
}

function parseDramaRouteFromLocation(): {
  bookId: string;
  slugHint?: string;
  providerHint?: MediaProviderName;
  drama: DramaItem | null;
  episodes: EpisodeItem[];
} | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const rawProvParam = params.get('provider');
  const pHint: MediaProviderName | undefined =
    rawProvParam?.trim().toUpperCase() === 'LK21'
      ? 'LK21'
      : parseProviderName(rawProvParam);

  const queryDramaId = params.get('drama');
  if (queryDramaId) {
    return {
      bookId: queryDramaId,
      providerHint: pHint ?? 'DramaBox',
      drama: null,
      episodes: [],
    };
  }

  // Match /movie/{slug}
  const movieMatch = window.location.pathname.match(/^\/movie\/([^/]+)/i);
  if (movieMatch) {
    const slug = decodeURIComponent(movieMatch[1]).toLowerCase();
    const ssr = window.__INITIAL_DRAMA__;
    if (
      ssr &&
      (ssr.bookId === slug ||
        ssr.drama?.slug === slug ||
        ssr.drama?.provider === 'LK21')
    ) {
      return {
        bookId: ssr.bookId || ssr.drama?.bookId || slug,
        slugHint: slug,
        providerHint: 'LK21',
        drama: ssr.drama ?? null,
        episodes: Array.isArray(ssr.episodes) ? ssr.episodes : [],
      };
    }
    return {
      bookId: slug,
      slugHint: slug,
      providerHint: 'LK21',
      drama: null,
      episodes: [],
    };
  }

  // Match /drama/{provider}/{bookId}/{slug} or clean /drama/{slug}
  const providerMatch = window.location.pathname.match(
    /^\/drama\/(dramabox|netshort|anyreel|melolo|dramaora|meloshort|petadrama|radreels|dramaverse|kalostv|stardusttv|stardust|starshort|dramabite|loveshots|mydrama|shotshort|moboreels|blinkdrama|wetv|cubetv|microdrama|flareflow|fundrama|freeshort|toonshort|happyshort|dramadash|storyreel_v2|storyreelv2|storyreel|vibeshort_v2|vibeshortv2|vibeshort|flickreels|dramawave|freereels|pinedrama|shortmax_v2|shortmaxv2|shortmax|flextv|vigloo|dotdrama|idrama_v2|idramav2|idrama|goodshort|reelshort_v2|reelshortv2|reelshort|joyreels|sodareels|bonustv|iqiyi)\/([^/]+)/i
  );
  if (providerMatch) {
    const prov: ProviderName = parseProviderName(providerMatch[1]) ?? 'DramaBox';
    const bookId = decodeURIComponent(providerMatch[2]);
    const ssr = window.__INITIAL_DRAMA__;
    if (ssr && ssr.bookId === bookId) {
      return {
        bookId,
        providerHint: ssr.drama?.provider ?? prov,
        drama: ssr.drama ?? null,
        episodes: Array.isArray(ssr.episodes) ? ssr.episodes : [],
      };
    }
    return { bookId, providerHint: prov, drama: null, episodes: [] };
  }

  const slugOrIdMatch = window.location.pathname.match(/^\/drama\/([^/]+)/);
  if (!slugOrIdMatch) return null;
  const segment = decodeURIComponent(slugOrIdMatch[1]);
  const ssr = window.__INITIAL_DRAMA__;
  if (
    ssr &&
    (ssr.bookId === segment ||
      ssr.drama?.slug === segment ||
      (ssr.drama?.title && slugifyDramaTitle(ssr.drama.title) === segment))
  ) {
    return {
      bookId: ssr.bookId || ssr.drama?.bookId || segment,
      providerHint: ssr.drama?.provider ?? pHint,
      drama: ssr.drama ?? null,
      episodes: Array.isArray(ssr.episodes) ? ssr.episodes : [],
    };
  }
  return {
    bookId: segment,
    slugHint: segment,
    providerHint: pHint,
    drama: null,
    episodes: [],
  };
}

interface SeoLandingRouteState {
  basePath: 'genre' | 'tag' | 'category';
  slug: string;
  modifier?: string;
}

function parseSeoLandingFromPath(pathname: string): SeoLandingRouteState | null {
  const match = pathname.match(/^\/(genre|category|tag)\/([^/]+)(?:\/([^/]+))?/i);
  if (!match) return null;
  const basePath = match[1].toLowerCase() as 'genre' | 'tag' | 'category';
  const slug = decodeURIComponent(match[2]).trim().toLowerCase();
  const modifier = match[3] ? decodeURIComponent(match[3]).trim().toLowerCase() : undefined;
  if (!slug) return null;
  return { basePath, slug, modifier };
}

function parseSeoLandingFromLocation(): SeoLandingRouteState | null {
  if (typeof window === 'undefined') return null;
  return parseSeoLandingFromPath(window.location.pathname);
}

function interleaveManyFeeds(...lists: DramaItem[][]): DramaItem[] {
  const merged: DramaItem[] = [];
  const seen = new Set<string>();
  const maxLen = Math.max(...lists.map((l) => l.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      const candidate = list[i];
      if (candidate) {
        const key = `${candidate.provider}:${candidate.bookId}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(candidate);
        }
      }
    }
  }
  return merged;
}

export default function App() {
  const {
    language,
    t,
    user,
    authModalOpen,
    openAuthModal,
    closeAuthModal,
    setLanguageState,
    myListItems,
    dramaWatchlistItems,
    movieWatchlistItems,
    myListIds,
    likedDramaIds,
    completedDramaIds,
    toggleMyList,
    toggleDramaCompleted,
    getDramaWatchStatus,
    watchlistFolders,
    createWatchlistFolder,
    deleteWatchlistFolder,
    assignDramaToFolder,
    getDramaFolderId,
    watchHistory,
    recordWatchProgress,
    removeHistoryItem,
    getResumePoint,
    showPushPrompt,
    dismissPushPrompt,
    requestPushPermission,
    toasts,
    pushToast,
    dismissToast,
  } = useDramaContext();

  const [activeTab, setActiveTab] = useState<NavTab>(() => parseTabFromLocation());
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('All');
  const [languageLoading, setLanguageLoading] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      window.location.pathname.toLowerCase() === '/search'
  );
  const [providerHubOpen, setProviderHubOpen] = useState(false);
  const [dashboardSubTab, setDashboardSubTab] = useState<
    'profile' | 'watchlist' | 'history' | 'comments'
  >('profile');
  const [dashboardWatchlistCategory, setDashboardWatchlistCategory] = useState<
    'movie' | 'drama'
  >('movie');
  const [watchlistCategory, setWatchlistCategory] = useState<'drama' | 'movie'>(
    'drama'
  );

  // Programmatic SEO Landing Route State (/genre/*, /category/*, /tag/*)
  const [activeSeoLanding, setActiveSeoLanding] =
    useState<SeoLandingRouteState | null>(() => parseSeoLandingFromLocation());

  // Watchlist Folder & Watch Status State
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [watchStatusFilter, setWatchStatusFilter] =
    useState<WatchStatusFilter>('all');
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Semantic /drama/{slug} and /movie/{slug} Route State
  const [activeDramaRoute, setActiveDramaRoute] = useState<{
    bookId: string;
    slugHint?: string;
    providerHint?: MediaProviderName;
    drama: DramaItem | null;
    episodes: EpisodeItem[];
  } | null>(() => parseDramaRouteFromLocation());
  const [moviesPool, setMoviesPool] = useState<DramaItem[]>([]);

  // Database-cached Home Catalog (Zero-latency SQLite backend cache)
  const [homeCatalog, setHomeCatalog] = useState<HomeCatalogResponse | null>(
    () => getPeekCachedHomeCatalog(language, 'All')
  );
  const [homeLoading, setHomeLoading] = useState<boolean>(
    () => !getPeekCachedHomeCatalog(language, 'All')
  );
  const [homeError, setHomeError] = useState<string | null>(null);
  const exploreHydratedKeyRef = useRef<string | null>(null);

  // DramaBox Live Feeds (Hydrated on demand for Explore & Category Tabs)
  const [dbRankingFeed, setDbRankingFeed] = useState<FeedState>(IDLE_FEED);
  const [dbForYouFeed, setDbForYouFeed] = useState<FeedState>(IDLE_FEED);
  const [dbNewFeed, setDbNewFeed] = useState<FeedState>(IDLE_FEED);
  const [dbVipFeed, setDbVipFeed] = useState<FeedState>(IDLE_FEED);
  const [dbDubbingFeed, setDbDubbingFeed] = useState<FeedState>(IDLE_FEED);

  // NetShort Live Feeds
  const [nsTrendingFeed, setNsTrendingFeed] = useState<FeedState>(IDLE_FEED);
  const [nsForYouFeed, setNsForYouFeed] = useState<FeedState>(IDLE_FEED);
  const [nsAllFeed, setNsAllFeed] = useState<FeedState>(IDLE_FEED);
  const [nsAnimeFeed, setNsAnimeFeed] = useState<FeedState>(IDLE_FEED);

  // AnyReel Live Feeds
  const [arForYouFeed, setArForYouFeed] = useState<FeedState>(IDLE_FEED);
  const [arAsianFeed, setArAsianFeed] = useState<FeedState>(IDLE_FEED);

  // Melolo Live Feeds
  const [mlRankFeed, setMlRankFeed] = useState<FeedState>(IDLE_FEED);
  const [mlForYouFeed, setMlForYouFeed] = useState<FeedState>(IDLE_FEED);
  const [mlNewFeed, setMlNewFeed] = useState<FeedState>(IDLE_FEED);
  const [mlAnimeFeed, setMlAnimeFeed] = useState<FeedState>(IDLE_FEED);

  // Additional Providers Feeds Map
  const [extraFeeds, setExtraFeeds] = useState<
    Record<ExtraProviderName, ExtraProviderFeedBundle>
  >(() => createInitialExtraFeeds());

  // Video Player State
  const [playerState, setPlayerState] = useState<{
    drama: DramaItem;
    episode: number;
    initialTime: number;
    episodes: EpisodeItem[];
  } | null>(null);
  const [mobileAvatarBroken, setMobileAvatarBroken] = useState(false);

  useEffect(() => {
    setMobileAvatarBroken(false);
  }, [user?.photoURL]);

  const loadSingleFeed = useCallback(
    async (
      fetcher: (page: number) => Promise<{
        items: DramaItem[];
        hasMore: boolean;
        page: number;
      }>,
      setter: React.Dispatch<React.SetStateAction<FeedState>>,
      page = 1,
      append = false
    ) => {
      setter((prev) => ({
        ...prev,
        loading: !append,
        loadingMore: append,
        error: null,
      }));
      try {
        const res = await fetcher(page);
        setter((prev) => {
          if (!append) {
            return {
              items: res.items,
              page: res.page,
              hasMore: res.hasMore,
              loading: false,
              loadingMore: false,
              error: null,
            };
          }
          const existingKeys = new Set(
            prev.items.map((d) => `${d.provider}:${d.bookId}`)
          );
          const merged = [
            ...prev.items,
            ...res.items.filter(
              (d) => !existingKeys.has(`${d.provider}:${d.bookId}`)
            ),
          ];
          return {
            items: merged,
            page: res.page,
            hasMore: res.hasMore,
            loading: false,
            loadingMore: false,
            error: null,
          };
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Failed to connect to API.';
        setter((prev) => ({
          ...prev,
          loading: false,
          loadingMore: false,
          error: msg,
        }));
      }
    },
    []
  );

  const loadExtraFeedSlot = useCallback(
    async (
      provider: ExtraProviderName,
      slot: 'main' | 'rank' | 'newest' | 'vip' | 'anime' | 'dubbing' | 'special',
      fetcher: (page: number) => Promise<{
        items: DramaItem[];
        hasMore: boolean;
        page: number;
      }>,
      page = 1,
      append = false
    ) => {
      setExtraFeeds((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          [slot]: {
            ...(prev[provider][slot] ?? IDLE_FEED),
            loading: !append,
            loadingMore: append,
            error: null,
          },
        },
      }));
      try {
        const res = await fetcher(page);
        setExtraFeeds((prev) => {
          const cur = prev[provider][slot] ?? IDLE_FEED;
          if (!append) {
            return {
              ...prev,
              [provider]: {
                ...prev[provider],
                [slot]: {
                  items: res.items,
                  page: res.page,
                  hasMore: res.hasMore,
                  loading: false,
                  loadingMore: false,
                  error: null,
                },
              },
            };
          }
          const existingKeys = new Set(
            cur.items.map((d) => `${d.provider}:${d.bookId}`)
          );
          return {
            ...prev,
            [provider]: {
              ...prev[provider],
              [slot]: {
                items: [
                  ...cur.items,
                  ...res.items.filter(
                    (d) => !existingKeys.has(`${d.provider}:${d.bookId}`)
                  ),
                ],
                page: res.page,
                hasMore: res.hasMore,
                loading: false,
                loadingMore: false,
                error: null,
              },
            },
          };
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Failed to connect to API.';
        setExtraFeeds((prev) => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            [slot]: {
              ...(prev[provider][slot] ?? IDLE_FEED),
              loading: false,
              loadingMore: false,
              error: msg,
            },
          },
        }));
      }
    },
    []
  );

  const ensureExtraProviderFullLoaded = useCallback(
    async (provider: ExtraProviderName, force = false) => {
      const adapter = ALL_PROVIDER_ADAPTERS[provider];
      setExtraFeeds((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          fullLoaded: true,
        },
      }));

      const tasks: Promise<void>[] = [
        loadExtraFeedSlot(provider, 'main', (p) => adapter.fetchForYou(p), 1, false),
        loadExtraFeedSlot(provider, 'rank', (p) => adapter.fetchRanking(p), 1, false),
        loadExtraFeedSlot(
          provider,
          'newest',
          (p) => adapter.fetchNewReleases(p),
          1,
          false
        ),
        loadExtraFeedSlot(provider, 'vip', (p) => adapter.fetchVip(p), 1, false),
      ];

      if (provider === 'MoboReels') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'anime',
            (p) => moboReelsProvider.fetchAnimasi(p),
            1,
            false
          )
        );
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => moboReelsProvider.fetchAsia(p),
            1,
            false
          )
        );
      } else if (provider === 'DramaOra') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => dramaOraProvider.fetchCategoryDramas(57819, p),
            1,
            false
          )
        );
      } else if (provider === 'MeloShort') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            () => meloShortProvider.fetchRecommend(1),
            1,
            false
          )
        );
      } else if (provider === 'PetaDrama') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => petaDramaProvider.fetchCategoryDramas(57819, p, 20),
            1,
            false
          )
        );
      } else if (provider === 'LoveShots') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => loveShotsProvider.fetchRankings(p),
            1,
            false
          )
        );
      } else if (provider === 'ShotShort') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => shotShortProvider.fetchAllDrama(p, 1),
            1,
            false
          )
        );
      } else if (provider === 'BlinkDrama') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => blinkDramaProvider.fetchAllDrama(p, 0),
            1,
            false
          )
        );
      } else if (provider === 'CubeTV') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => cubeTvProvider.fetchHot(p),
            1,
            false
          )
        );
      } else if (provider === 'FlareFlow') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => flareFlowProvider.fetchAllDrama(p),
            1,
            false
          )
        );
      } else if (provider === 'FreeShort') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => freeShortProvider.fetchHot(p),
            1,
            false
          )
        );
      } else if (provider === 'ToonShort') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => toonShortProvider.fetchPopular(p),
            1,
            false
          )
        );
      } else if (provider === 'HappyShort') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => happyShortProvider.fetchTrending(p),
            1,
            false
          )
        );
      } else if (provider === 'FlickReels') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => flickReelsProvider.fetchAllDrama(p),
            1,
            false
          )
        );
      } else if (provider === 'DramaWave') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => dramaWaveProvider.fetchExclusive(p),
            1,
            false
          )
        );
      } else if (provider === 'FreeReels') {
        if (freeReelsProvider.fetchAnime) {
          const fn = freeReelsProvider.fetchAnime;
          tasks.push(loadExtraFeedSlot(provider, 'anime', (p) => fn(p), 1, false));
        }
        if (freeReelsProvider.fetchDubbing) {
          const fn = freeReelsProvider.fetchDubbing;
          tasks.push(loadExtraFeedSlot(provider, 'dubbing', (p) => fn(p), 1, false));
        }
      } else if (provider === 'Vigloo') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => viglooProvider.fetchBrowse(p, 'POPULAR'),
            1,
            false
          )
        );
      } else if (provider === 'GoodShort') {
        if (goodShortProvider.fetchAnime) {
          const fn = goodShortProvider.fetchAnime;
          tasks.push(loadExtraFeedSlot(provider, 'anime', (p) => fn(p), 1, false));
        }
        if (goodShortProvider.fetchDubbing) {
          const fn = goodShortProvider.fetchDubbing;
          tasks.push(loadExtraFeedSlot(provider, 'dubbing', (p) => fn(p), 1, false));
        }
      } else if (provider === 'JoyReels') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => joyReelsProvider.fetchAsia(p),
            1,
            false
          )
        );
      } else if (provider === 'iQIYI') {
        tasks.push(
          loadExtraFeedSlot(
            provider,
            'special',
            (p) => iqiyiProvider.fetchKdrama(p),
            1,
            false
          )
        );
        if (iqiyiProvider.fetchAnime) {
          const fn = iqiyiProvider.fetchAnime;
          tasks.push(loadExtraFeedSlot(provider, 'anime', (p) => fn(p), 1, false));
        }
      }

      if (force) {
        await Promise.allSettled(tasks);
      } else {
        await Promise.allSettled(tasks);
      }
    },
    [loadExtraFeedSlot]
  );

  const loadHomeFromCache = useCallback(
    async (
      langToLoad: LanguageCode,
      providerToLoad: ProviderId,
      forceBypassClient = false
    ) => {
      const peek = forceBypassClient
        ? null
        : getPeekCachedHomeCatalog(langToLoad, providerToLoad);
      if (peek) {
        setHomeCatalog(peek);
        setHomeLoading(false);
        setHomeError(null);
        return;
      }
      setHomeLoading(true);
      setHomeError(null);
      try {
        const res = await fetchHomeCatalog(
          langToLoad,
          providerToLoad,
          forceBypassClient
        );
        setHomeCatalog(res);
      } catch (err) {
        setHomeError(
          err instanceof Error ? err.message : 'Failed to load cached catalog'
        );
      } finally {
        setHomeLoading(false);
      }
    },
    []
  );

  // Initial Home load uses single cached backend endpoint (/api/home) instead of 65 live calls
  useEffect(() => {
    void loadHomeFromCache(language, selectedProvider);
  }, [language, selectedProvider, loadHomeFromCache]);

  const loadExtraProvidersBatch = useCallback(
    async (providers: ProviderName[]) => {
      const extraTargets = providers.filter((p): p is ExtraProviderName =>
        isExtraProvider(p)
      );
      if (extraTargets.length === 0) return;
      await Promise.allSettled(
        extraTargets.map((name) =>
          loadExtraFeedSlot(
            name,
            'main',
            (p) => ALL_PROVIDER_ADAPTERS[name].fetchForYou(p),
            1,
            false
          )
        )
      );
    },
    [loadExtraFeedSlot]
  );

  const fetchAllFeeds = useCallback(
    async (langToApply?: LanguageCode) => {
      const targetLang = langToApply ?? language;
      exploreHydratedKeyRef.current = targetLang;
      if (langToApply) {
        await syncAllProvidersLanguage(langToApply);
      }
      setExtraFeeds(createInitialExtraFeeds());
      await Promise.all([
        loadSingleFeed(dramaBoxProvider.fetchRanking, setDbRankingFeed, 1, false),
        loadSingleFeed(dramaBoxProvider.fetchForYou, setDbForYouFeed, 1, false),
        loadSingleFeed(
          dramaBoxProvider.fetchNewReleases,
          setDbNewFeed,
          1,
          false
        ),
        loadSingleFeed(dramaBoxProvider.fetchVip, setDbVipFeed, 1, false),
        ...(dramaBoxProvider.fetchDubbing
          ? [
              loadSingleFeed(
                dramaBoxProvider.fetchDubbing,
                setDbDubbingFeed,
                1,
                false
              ),
            ]
          : []),
        loadSingleFeed(
          netShortProvider.fetchRanking,
          setNsTrendingFeed,
          1,
          false
        ),
        loadSingleFeed(netShortProvider.fetchForYou, setNsForYouFeed, 1, false),
        loadSingleFeed(
          netShortProvider.fetchNewReleases,
          setNsAllFeed,
          1,
          false
        ),
        ...(netShortProvider.fetchAnime
          ? [loadSingleFeed(netShortProvider.fetchAnime, setNsAnimeFeed, 1, false)]
          : []),
        loadSingleFeed(anyReelProvider.fetchForYou, setArForYouFeed, 1, false),
        loadSingleFeed(anyReelProvider.fetchRanking, setArAsianFeed, 1, false),
        loadSingleFeed(meloloProvider.fetchRanking, setMlRankFeed, 1, false),
        loadSingleFeed(meloloProvider.fetchForYou, setMlForYouFeed, 1, false),
        loadSingleFeed(meloloProvider.fetchNewReleases, setMlNewFeed, 1, false),
        ...(meloloProvider.fetchAnime
          ? [loadSingleFeed(meloloProvider.fetchAnime, setMlAnimeFeed, 1, false)]
          : []),
      ]);

      // Progressive Explore hydration: load only the first 6 extra providers upfront
      await Promise.allSettled([
        ...EXTRA_PROVIDER_NAMES.slice(0, 6).map((name) =>
          loadExtraFeedSlot(
            name,
            'main',
            (p) => ALL_PROVIDER_ADAPTERS[name].fetchForYou(p),
            1,
            false
          )
        ),
        loadExtraFeedSlot(
          'MoboReels',
          'anime',
          (p) => moboReelsProvider.fetchAnimasi(p),
          1,
          false
        ),
        ...(iqiyiProvider.fetchAnime
          ? [
              loadExtraFeedSlot(
                'iQIYI',
                'anime',
                (p) => iqiyiProvider.fetchAnime!(p),
                1,
                false
              ),
            ]
          : []),
        ...(freeReelsProvider.fetchAnime
          ? [
              loadExtraFeedSlot(
                'FreeReels',
                'anime',
                (p) => freeReelsProvider.fetchAnime!(p),
                1,
                false
              ),
            ]
          : []),
        ...(freeReelsProvider.fetchDubbing
          ? [
              loadExtraFeedSlot(
                'FreeReels',
                'dubbing',
                (p) => freeReelsProvider.fetchDubbing!(p),
                1,
                false
              ),
            ]
          : []),
        ...(goodShortProvider.fetchAnime
          ? [
              loadExtraFeedSlot(
                'GoodShort',
                'anime',
                (p) => goodShortProvider.fetchAnime!(p),
                1,
                false
              ),
            ]
          : []),
        ...(goodShortProvider.fetchDubbing
          ? [
              loadExtraFeedSlot(
                'GoodShort',
                'dubbing',
                (p) => goodShortProvider.fetchDubbing!(p),
                1,
                false
              ),
            ]
          : []),
      ]);
    },
    [language, loadSingleFeed, loadExtraFeedSlot]
  );

  // Lazy-hydrate Explore & Category tabs only when the user actually navigates off Home
  useEffect(() => {
    const needsExploreFeeds =
      activeTab === 'explore' ||
      activeTab === 'ranking' ||
      activeTab === 'terbaru' ||
      activeTab === 'vip' ||
      activeTab === 'anime' ||
      activeTab === 'dubbing';
    if (needsExploreFeeds && exploreHydratedKeyRef.current !== language) {
      void fetchAllFeeds(language);
    }
  }, [activeTab, language, fetchAllFeeds]);

  // Auto-load full feeds when user switches into any of the additional providers inside Explore/Category
  useEffect(() => {
    if (activeTab !== 'home' && isExtraProvider(selectedProvider)) {
      const bundle = extraFeeds[selectedProvider];
      if (!bundle.fullLoaded) {
        void ensureExtraProviderFullLoaded(selectedProvider);
      }
    }
  }, [activeTab, selectedProvider, extraFeeds, ensureExtraProviderFullLoaded]);

  // Deep-link ?drama=...&provider=...&ep=... auto-launch playback (including LK21 movies)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const dramaId = params.get('drama');
    const epParam = Number(params.get('ep'));
    const rawProv = params.get('provider');
    if (!dramaId) return;

    if (rawProv?.trim().toUpperCase() === 'LK21') {
      Promise.allSettled([
        fetchLk21Detail(dramaId),
        fetchLk21EpisodesAsEpisodeItems(dramaId),
      ]).then(([detRes, epsRes]) => {
        const eps = epsRes.status === 'fulfilled' ? epsRes.value : [];
        const movie: DramaItem =
          detRes.status === 'fulfilled' && detRes.value
            ? movieToDramaItem(detRes.value, eps.length || 1)
            : {
                bookId: dramaId,
                slug: dramaId,
                title: 'Featured Movie',
                cover: '',
                description: '',
                chapterCount: eps.length || 1,
                tags: [],
                isVip: false,
                provider: 'LK21',
                mediaType: 'movie',
              };
        if (Number.isFinite(epParam) && epParam >= 1) {
          setPlayerState({
            drama: movie,
            episode: epParam,
            initialTime: 0,
            episodes: eps,
          });
        }
      });
      return;
    }

    const prov: ProviderName = parseProviderName(rawProv) ?? 'DramaBox';
    const adapter = ALL_PROVIDER_ADAPTERS[prov] ?? dramaBoxProvider;
    Promise.allSettled([
      adapter.fetchDetail(dramaId),
      adapter.fetchAllEpisodes(dramaId),
    ]).then(([detRes, epsRes]) => {
      const drama =
        detRes.status === 'fulfilled' && detRes.value
          ? detRes.value
          : {
              bookId: dramaId,
              title: 'Featured Drama',
              cover: '',
              description: '',
              chapterCount:
                epsRes.status === 'fulfilled' ? epsRes.value.length || 1 : 1,
              tags: [],
              isVip: false,
              provider: prov,
            };
      const eps = epsRes.status === 'fulfilled' ? epsRes.value : [];
      if (Number.isFinite(epParam) && epParam >= 1) {
        setPlayerState({
          drama,
          episode: epParam,
          initialTime: 0,
          episodes: eps,
        });
      }
    });
  }, []);

  // Initial & Section SEO Sync + Browser Back/Forward sync
  useEffect(() => {
    if (!activeDramaRoute && !activeSeoLanding) {
      syncSectionDocumentSeo(activeTab);
    }
  }, [activeDramaRoute, activeSeoLanding, activeTab]);

  useEffect(() => {
    const onPopState = () => {
      const isSearchPath =
        window.location.pathname.toLowerCase() === '/search';
      const parsed = parseDramaRouteFromLocation();
      const parsedLanding = parseSeoLandingFromLocation();
      const parsedTab = parseTabFromLocation();
      setSearchModalOpen(isSearchPath);
      setActiveDramaRoute(parsed);
      setActiveSeoLanding(parsed ? null : parsedLanding);
      if (!parsed && !parsedLanding) {
        setActiveTab(parsedTab);
        syncSectionDocumentSeo(parsedTab);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavigateTab = useCallback((tab: NavTab) => {
    setSearchModalOpen(false);
    setProviderHubOpen(false);
    setActiveDramaRoute(null);
    setActiveSeoLanding(null);
    setActiveTab(tab);
    const nextPath = getTabPath(tab);
    if (window.location.pathname !== nextPath || window.location.search) {
      window.history.pushState({ tab }, '', nextPath);
    }
    syncSectionDocumentSeo(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenSearch = useCallback(() => {
    setProviderHubOpen(false);
    closeAuthModal();
    setSearchModalOpen(true);
    if (window.location.pathname.toLowerCase() !== '/search') {
      window.history.pushState({ search: true }, '', '/search');
    }
  }, [closeAuthModal]);

  const handleCloseSearch = useCallback(() => {
    setSearchModalOpen(false);
    if (window.location.pathname.toLowerCase() === '/search') {
      const targetPath = getTabPath(activeTab);
      window.history.replaceState({ tab: activeTab }, '', targetPath);
      syncSectionDocumentSeo(activeTab);
    }
  }, [activeTab]);

  const handleOpenProviderHub = useCallback(() => {
    setSearchModalOpen(false);
    closeAuthModal();
    if (window.location.pathname.toLowerCase() === '/search') {
      window.history.replaceState({ tab: activeTab }, '', getTabPath(activeTab));
    }
    setProviderHubOpen(true);
  }, [activeTab, closeAuthModal]);

  const handleOpenLoginMenu = useCallback(() => {
    setSearchModalOpen(false);
    setProviderHubOpen(false);
    if (window.location.pathname.toLowerCase() === '/search') {
      window.history.replaceState({ tab: activeTab }, '', getTabPath(activeTab));
    }
    openAuthModal();
  }, [activeTab, openAuthModal]);

  const openSeoLandingPath = useCallback((rawPath: string) => {
    const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    const parsed = parseSeoLandingFromPath(normalized);
    if (!parsed) return;
    if (window.location.pathname !== normalized) {
      window.history.pushState({ seoLanding: parsed }, '', normalized);
    }
    setSearchModalOpen(false);
    setProviderHubOpen(false);
    setActiveDramaRoute(null);
    setActiveTab('home');
    setActiveSeoLanding(parsed);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onNavigateEvent = (evt: Event) => {
      const detail = (
        evt as CustomEvent<{
          tab?: NavTab;
          subTab?: 'profile' | 'watchlist' | 'history' | 'comments';
          watchlistCategory?: 'movie' | 'drama';
        }>
      ).detail;
      if (detail?.tab) {
        if (detail.tab === 'dashboard') {
          setDashboardSubTab(detail.subTab ?? 'profile');
          if (detail.watchlistCategory) {
            setDashboardWatchlistCategory(detail.watchlistCategory);
          }
        }
        if (detail.tab === 'mylist' && detail.watchlistCategory) {
          setWatchlistCategory(detail.watchlistCategory);
        }
        handleNavigateTab(detail.tab);
      }
    };
    const onNavigatePathEvent = (evt: Event) => {
      const detail = (evt as CustomEvent<{ path?: string }>).detail;
      if (detail?.path) {
        openSeoLandingPath(detail.path);
      }
    };
    window.addEventListener('hd:navigate', onNavigateEvent);
    window.addEventListener('hd:navigate-path', onNavigatePathEvent);
    return () => {
      window.removeEventListener('hd:navigate', onNavigateEvent);
      window.removeEventListener('hd:navigate-path', onNavigatePathEvent);
    };
  }, [handleNavigateTab, openSeoLandingPath]);

  const openDramaRoute = useCallback((drama: DramaItem) => {
    const path = getDramaPath(
      drama.bookId,
      drama.title,
      drama.provider,
      drama.slug
    );
    if (window.location.pathname !== path) {
      window.history.pushState(
        { bookId: drama.bookId, provider: drama.provider },
        '',
        path
      );
    }
    setActiveSeoLanding(null);
    setActiveDramaRoute({
      bookId: drama.bookId,
      providerHint: drama.provider,
      drama,
      episodes: [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const closeDramaRoute = useCallback(() => {
    const targetPath = getTabPath(activeTab);
    if (window.location.pathname !== targetPath || window.location.search) {
      window.history.pushState({}, '', targetPath);
    }
    setActiveDramaRoute(null);
    setActiveSeoLanding(null);
    syncSectionDocumentSeo(activeTab);
  }, [activeTab]);

  const openTagRoute = useCallback(
    (tag: string) => {
      const clean = tag.trim();
      if (!clean) return;
      const slug = slugifyDramaTitle(clean);
      openSeoLandingPath(`/tag/${slug}`);
    },
    [openSeoLandingPath]
  );

  const closeSeoLandingRoute = useCallback(() => {
    setActiveSeoLanding(null);
    if (/^\/(genre|category|tag)\//i.test(window.location.pathname)) {
      window.history.pushState({}, '', '/');
    }
    syncHomeDocumentSeo();
  }, []);

  const handleChangeLanguage = async (nextLang: LanguageCode) => {
    if (nextLang === language) return;
    setLanguageState(nextLang);
    setLanguageLoading(true);
    try {
      await loadHomeFromCache(nextLang, selectedProvider, true);
      if (activeTab !== 'home') {
        await fetchAllFeeds(nextLang);
      }
      const label =
        nextLang === 'en'
          ? 'English'
          : nextLang === 'id'
          ? 'Bahasa Indonesia'
          : nextLang === 'vi'
          ? 'Tiếng Việt'
          : '中文';
      pushToast(`Language synced to ${label}`, 'gold');
    } catch {
      pushToast('Language switch failed — retrying feeds', 'error');
    } finally {
      setLanguageLoading(false);
    }
  };

  const handlePlayEpisode = useCallback(
    (
      drama: DramaItem,
      episode = 1,
      episodesList: EpisodeItem[] = [],
      startAtSeconds?: number
    ) => {
      const resume = getResumePoint(drama.bookId, drama.provider);
      const resolvedTime =
        typeof startAtSeconds === 'number'
          ? startAtSeconds
          : resume && resume.episode === episode
          ? resume.currentTime
          : 0;

      recordWatchProgress(drama, episode, resolvedTime);
      setPlayerState({
        drama,
        episode,
        initialTime: resolvedTime,
        episodes: episodesList,
      });
    },
    [getResumePoint, recordWatchProgress]
  );

  // Deduplicated catalog pool (from SQLite Home cache + any loaded Explore feeds)
  const allLoadedDramas = useMemo(() => {
    const homeItems = homeCatalog
      ? [
          ...homeCatalog.heroSpotlights,
          ...homeCatalog.trendingTop,
          ...homeCatalog.hotReleases,
          ...homeCatalog.catalogGrid,
        ]
      : [];
    const extraItems = EXTRA_PROVIDER_NAMES.flatMap((name) => {
      const b = extraFeeds[name];
      return [
        ...b.main.items,
        ...b.rank.items,
        ...b.newest.items,
        ...b.vip.items,
        ...(b.anime?.items ?? []),
        ...(b.dubbing?.items ?? []),
        ...(b.special?.items ?? []),
      ];
    });
    const combined = [
      ...homeItems,
      ...dbRankingFeed.items,
      ...nsTrendingFeed.items,
      ...arAsianFeed.items,
      ...mlRankFeed.items,
      ...dbForYouFeed.items,
      ...nsForYouFeed.items,
      ...arForYouFeed.items,
      ...mlForYouFeed.items,
      ...dbNewFeed.items,
      ...nsAllFeed.items,
      ...mlNewFeed.items,
      ...dbVipFeed.items,
      ...dbDubbingFeed.items,
      ...nsAnimeFeed.items,
      ...mlAnimeFeed.items,
      ...extraItems,
    ];
    const seen = new Set<string>();
    const out: DramaItem[] = [];
    for (const d of combined) {
      const key = `${d.provider}:${d.bookId}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(d);
      }
    }
    return out;
  }, [
    homeCatalog,
    dbRankingFeed.items,
    nsTrendingFeed.items,
    arAsianFeed.items,
    mlRankFeed.items,
    dbForYouFeed.items,
    nsForYouFeed.items,
    arForYouFeed.items,
    mlForYouFeed.items,
    dbNewFeed.items,
    nsAllFeed.items,
    mlNewFeed.items,
    dbVipFeed.items,
    dbDubbingFeed.items,
    nsAnimeFeed.items,
    mlAnimeFeed.items,
    extraFeeds,
  ]);

  // Resolve clean /drama/{slug} and /movie/{slug} client-side if not hydrated via SSR
  useEffect(() => {
    const slugHint = activeDramaRoute?.slugHint;
    if (!slugHint || activeDramaRoute?.drama) return;

    if (activeDramaRoute?.providerHint === 'LK21') {
      let cancelled = false;
      Promise.allSettled([
        fetchLk21Detail(slugHint),
        fetchLk21EpisodesAsEpisodeItems(slugHint),
      ])
        .then(([detRes, epsRes]) => {
          if (cancelled) return;
          const eps = epsRes.status === 'fulfilled' ? epsRes.value : [];
          if (detRes.status === 'fulfilled' && detRes.value) {
            setActiveDramaRoute({
              bookId: detRes.value.slug || slugHint,
              providerHint: 'LK21',
              drama: movieToDramaItem(detRes.value, eps.length || 1),
              episodes: eps,
            });
          } else {
            setActiveDramaRoute((prev) =>
              prev ? { ...prev, slugHint: undefined } : null
            );
          }
        })
        .catch(() => {
          if (!cancelled) {
            setActiveDramaRoute((prev) =>
              prev ? { ...prev, slugHint: undefined } : null
            );
          }
        });
      return () => {
        cancelled = true;
      };
    }

    const localMatch = allLoadedDramas.find(
      (d) =>
        (d.slug || slugifyDramaTitle(d.title)) === slugHint ||
        d.bookId === slugHint
    );
    if (localMatch) {
      setActiveDramaRoute({
        bookId: localMatch.bookId,
        providerHint: localMatch.provider,
        drama: localMatch,
        episodes: [],
      });
      return;
    }

    let cancelled = false;
    fetch(`/api/drama/resolve?slug=${encodeURIComponent(slugHint)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            ok?: boolean;
            dramaId?: string;
            provider?: string;
            drama?: DramaItem;
          } | null
        ) => {
          if (cancelled) return;
          if (data?.ok && data.dramaId) {
            setActiveDramaRoute({
              bookId: data.dramaId,
              providerHint: parseProviderName(data.provider) ?? 'DramaBox',
              drama: data.drama ?? null,
              episodes: [],
            });
          } else {
            setActiveDramaRoute((prev) =>
              prev ? { ...prev, slugHint: undefined } : null
            );
          }
        }
      )
      .catch(() => {
        if (!cancelled) {
          setActiveDramaRoute((prev) =>
            prev ? { ...prev, slugHint: undefined } : null
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeDramaRoute?.slugHint,
    activeDramaRoute?.drama,
    activeDramaRoute?.providerHint,
    allLoadedDramas,
  ]);

  const trendingSearchPool = useMemo(() => {
    if (homeCatalog && homeCatalog.trendingTop.length > 0) {
      return homeCatalog.trendingTop.slice(0, 10);
    }
    return interleaveManyFeeds(
      dbRankingFeed.items,
      nsTrendingFeed.items,
      arAsianFeed.items,
      mlRankFeed.items
    ).slice(0, 10);
  }, [
    homeCatalog,
    dbRankingFeed.items,
    nsTrendingFeed.items,
    arAsianFeed.items,
    mlRankFeed.items,
  ]);

  // Provider Live Counts for Provider Hub Modal
  const providerCounts = useMemo(() => {
    const dbKeys = new Set(
      [
        ...dbRankingFeed.items,
        ...dbForYouFeed.items,
        ...dbNewFeed.items,
        ...dbVipFeed.items,
        ...dbDubbingFeed.items,
      ].map((d) => d.bookId)
    );
    const nsKeys = new Set(
      [
        ...nsTrendingFeed.items,
        ...nsForYouFeed.items,
        ...nsAllFeed.items,
        ...nsAnimeFeed.items,
      ].map((d) => d.bookId)
    );
    const arKeys = new Set(
      [...arForYouFeed.items, ...arAsianFeed.items].map((d) => d.bookId)
    );
    const mlKeys = new Set(
      [
        ...mlRankFeed.items,
        ...mlForYouFeed.items,
        ...mlNewFeed.items,
        ...mlAnimeFeed.items,
      ].map((d) => d.bookId)
    );

    const cachedCounts = homeCatalog?.providerCounts ?? {};

    const out = {
      all:
        dbKeys.size + nsKeys.size + arKeys.size + mlKeys.size ||
        cachedCounts.all ||
        0,
      DramaBox: dbKeys.size || cachedCounts.DramaBox || 0,
      NetShort: nsKeys.size || cachedCounts.NetShort || 0,
      AnyReel: arKeys.size || cachedCounts.AnyReel || 0,
      Melolo: mlKeys.size || cachedCounts.Melolo || 0,
    } as { all: number } & Record<ProviderName, number>;

    for (const name of EXTRA_PROVIDER_NAMES) {
      const b = extraFeeds[name];
      const keys = new Set(
        [
          ...b.main.items,
          ...b.rank.items,
          ...b.newest.items,
          ...b.vip.items,
          ...(b.anime?.items ?? []),
          ...(b.dubbing?.items ?? []),
          ...(b.special?.items ?? []),
        ].map((d) => d.bookId)
      );
      const count = keys.size || cachedCounts[name] || 0;
      out[name] = count;
      if (keys.size > 0) out.all += keys.size;
    }

    return out;
  }, [
    homeCatalog,
    dbRankingFeed.items,
    dbForYouFeed.items,
    dbNewFeed.items,
    dbVipFeed.items,
    dbDubbingFeed.items,
    nsTrendingFeed.items,
    nsForYouFeed.items,
    nsAllFeed.items,
    nsAnimeFeed.items,
    arForYouFeed.items,
    arAsianFeed.items,
    mlRankFeed.items,
    mlForYouFeed.items,
    mlNewFeed.items,
    mlAnimeFeed.items,
    extraFeeds,
  ]);

  // Hero Spotlight served directly from cached Home payload (with Explore fallback)
  const heroSpotlights = useMemo(() => {
    if (homeCatalog && homeCatalog.heroSpotlights.length > 0) {
      return homeCatalog.heroSpotlights;
    }
    if (selectedProvider === 'NetShort') {
      return nsForYouFeed.items.length > 0
        ? nsForYouFeed.items.slice(0, 5)
        : nsTrendingFeed.items.slice(0, 5);
    }
    if (selectedProvider === 'AnyReel') {
      return arForYouFeed.items.length > 0
        ? arForYouFeed.items.slice(0, 5)
        : arAsianFeed.items.slice(0, 5);
    }
    if (selectedProvider === 'Melolo') {
      return mlRankFeed.items.length > 0
        ? mlRankFeed.items.slice(0, 5)
        : mlForYouFeed.items.slice(0, 5);
    }
    if (selectedProvider === 'DramaBox') {
      return dbRankingFeed.items.length > 0
        ? dbRankingFeed.items.slice(0, 5)
        : dbForYouFeed.items.slice(0, 5);
    }
    if (isExtraProvider(selectedProvider)) {
      const b = extraFeeds[selectedProvider];
      const list = b.rank.items.length > 0 ? b.rank.items : b.main.items;
      return list.slice(0, 5);
    }
    return interleaveManyFeeds(
      dbRankingFeed.items.slice(0, 2),
      nsForYouFeed.items.slice(0, 2),
      arForYouFeed.items.slice(0, 2),
      mlRankFeed.items.slice(0, 2)
    ).slice(0, 8);
  }, [
    homeCatalog,
    selectedProvider,
    dbRankingFeed.items,
    dbForYouFeed.items,
    nsForYouFeed.items,
    nsTrendingFeed.items,
    arForYouFeed.items,
    arAsianFeed.items,
    mlRankFeed.items,
    mlForYouFeed.items,
    extraFeeds,
  ]);

  const heroLoading = homeLoading && heroSpotlights.length === 0;

  // Real Watch History for Continue Watching Row
  const continueWatchingData = useMemo(() => {
    const items = watchHistory.map((h) => h.drama);
    const map: Record<
      string,
      { episode: number; currentTime: number; progress: number }
    > = {};
    for (const h of watchHistory) {
      map[`${h.provider}:${h.bookId}`] = {
        episode: h.episode,
        currentTime: h.currentTime,
        progress: h.progress,
      };
    }
    return { items, map };
  }, [watchHistory]);

  // Personalized Behavioral Recommendations ("Picked For You")
  const pickedForYouData = useMemo(() => {
    const pool =
      homeCatalog && allLoadedDramas.length > 0
        ? allLoadedDramas
        : [
            ...(homeCatalog?.catalogGrid ?? []),
            ...(homeCatalog?.hotReleases ?? []),
            ...(homeCatalog?.trendingTop ?? []),
          ];
    return buildPickedForYouRecommendations({
      catalog: pool,
      watchHistory,
      likedDramaIds,
      myListItems,
      completedDramaIds,
      limit: 14,
    });
  }, [
    homeCatalog,
    allLoadedDramas,
    watchHistory,
    likedDramaIds,
    myListItems,
    completedDramaIds,
  ]);

  // Unified Recommended Feed respecting Provider Filter
  const recommendedItems = useMemo(() => {
    if (selectedProvider === 'DramaBox') return dbForYouFeed.items;
    if (selectedProvider === 'NetShort') return nsForYouFeed.items;
    if (selectedProvider === 'AnyReel') return arForYouFeed.items;
    if (selectedProvider === 'Melolo') return mlForYouFeed.items;
    if (isExtraProvider(selectedProvider)) {
      return extraFeeds[selectedProvider].main.items;
    }
    return interleaveManyFeeds(
      dbForYouFeed.items,
      nsForYouFeed.items,
      arForYouFeed.items,
      mlForYouFeed.items,
      ...EXTRA_PROVIDER_NAMES.map((n) => extraFeeds[n].main.items)
    );
  }, [
    selectedProvider,
    dbForYouFeed.items,
    nsForYouFeed.items,
    arForYouFeed.items,
    mlForYouFeed.items,
    extraFeeds,
  ]);

  // Unified New Releases respecting Provider Filter
  const newReleaseItems = useMemo(() => {
    if (selectedProvider === 'DramaBox') return dbNewFeed.items;
    if (selectedProvider === 'NetShort') return nsAllFeed.items;
    if (selectedProvider === 'AnyReel') return arAsianFeed.items;
    if (selectedProvider === 'Melolo') return mlNewFeed.items;
    if (isExtraProvider(selectedProvider)) {
      const b = extraFeeds[selectedProvider];
      return b.newest.items.length > 0 ? b.newest.items : b.main.items;
    }
    return interleaveManyFeeds(
      dbNewFeed.items,
      nsAllFeed.items,
      arAsianFeed.items,
      mlNewFeed.items,
      ...EXTRA_PROVIDER_NAMES.map((n) =>
        extraFeeds[n].newest.items.length > 0
          ? extraFeeds[n].newest.items
          : extraFeeds[n].main.items
      )
    );
  }, [
    selectedProvider,
    dbNewFeed.items,
    nsAllFeed.items,
    arAsianFeed.items,
    mlNewFeed.items,
    extraFeeds,
  ]);

  // Unified Anime Feed respecting Provider Filter (NetShort + Melolo + MoboReels + FreeReels + GoodShort + iQIYI)
  const combinedAnimeItems = useMemo(() => {
    const moboAnime = extraFeeds.MoboReels.anime?.items ?? [];
    const freeReelsAnime = extraFeeds.FreeReels.anime?.items ?? [];
    const goodShortAnime = extraFeeds.GoodShort.anime?.items ?? [];
    const iqiyiAnime = extraFeeds.iQIYI.anime?.items ?? [];
    if (selectedProvider === 'Melolo') return mlAnimeFeed.items;
    if (selectedProvider === 'NetShort') return nsAnimeFeed.items;
    if (selectedProvider === 'MoboReels') return moboAnime;
    if (selectedProvider === 'FreeReels') return freeReelsAnime;
    if (selectedProvider === 'GoodShort') return goodShortAnime;
    if (selectedProvider === 'iQIYI') return iqiyiAnime;
    return interleaveManyFeeds(
      nsAnimeFeed.items,
      mlAnimeFeed.items,
      iqiyiAnime,
      moboAnime,
      freeReelsAnime,
      goodShortAnime
    );
  }, [selectedProvider, nsAnimeFeed.items, mlAnimeFeed.items, extraFeeds]);

  // Unified Dubbed Feed respecting Provider Filter (DramaBox + FreeReels + GoodShort)
  const combinedDubbingItems = useMemo(() => {
    const freeReelsDub = extraFeeds.FreeReels.dubbing?.items ?? [];
    const goodShortDub = extraFeeds.GoodShort.dubbing?.items ?? [];
    if (selectedProvider === 'DramaBox') return dbDubbingFeed.items;
    if (selectedProvider === 'FreeReels') return freeReelsDub;
    if (selectedProvider === 'GoodShort') return goodShortDub;
    return interleaveManyFeeds(dbDubbingFeed.items, freeReelsDub, goodShortDub);
  }, [selectedProvider, dbDubbingFeed.items, extraFeeds]);

  const activeCategoryWatchlistItems = useMemo(
    () => (watchlistCategory === 'movie' ? movieWatchlistItems : dramaWatchlistItems),
    [watchlistCategory, movieWatchlistItems, dramaWatchlistItems]
  );

  // Watchlist filtered by selected category, folder & watch status
  const folderScopedWatchlist = useMemo(() => {
    if (activeFolderId === 'all') return activeCategoryWatchlistItems;
    return activeCategoryWatchlistItems.filter(
      (d) => getDramaFolderId(d.bookId, d.provider) === activeFolderId
    );
  }, [activeCategoryWatchlistItems, activeFolderId, getDramaFolderId]);

  const watchStatusCounts = useMemo(() => {
    let watching = 0;
    let plan = 0;
    let completed = 0;
    for (const d of folderScopedWatchlist) {
      const st = getDramaWatchStatus(d);
      if (st === 'watching') watching++;
      else if (st === 'completed') completed++;
      else plan++;
    }
    return {
      all: folderScopedWatchlist.length,
      watching,
      plan,
      completed,
    };
  }, [folderScopedWatchlist, getDramaWatchStatus]);

  const filteredWatchlistItems = useMemo(() => {
    if (watchStatusFilter === 'all') return folderScopedWatchlist;
    return folderScopedWatchlist.filter(
      (d) => getDramaWatchStatus(d) === watchStatusFilter
    );
  }, [folderScopedWatchlist, watchStatusFilter, getDramaWatchStatus]);

  const activeGridInfo = useMemo(() => {
    const selectedExtra = isExtraProvider(selectedProvider)
      ? selectedProvider
      : null;

    switch (activeTab) {
      case 'ranking': {
        if (selectedExtra) {
          const b = extraFeeds[selectedExtra];
          const feed = b.rank.items.length > 0 ? b.rank : b.main;
          const adapter = ALL_PROVIDER_ADAPTERS[selectedExtra];
          return {
            title: `${adapter.label} · ${t.sections.trendingNow}`,
            items: feed.items,
            loading: b.rank.loading || b.main.loading,
            loadingMore: feed.loadingMore,
            error: feed.error,
            hasMore: feed.hasMore,
            badgeStyle: 'none' as const,
            ranked: true,
            onLoadMore: () =>
              loadExtraFeedSlot(
                selectedExtra,
                b.rank.items.length > 0 ? 'rank' : 'main',
                (p) =>
                  b.rank.items.length > 0
                    ? adapter.fetchRanking(p)
                    : adapter.fetchForYou(p),
                feed.page + 1,
                true
              ),
            onRetry: () => ensureExtraProviderFullLoaded(selectedExtra, true),
          };
        }

        return {
          title: t.sections.trendingNow,
          items:
            selectedProvider === 'NetShort'
              ? nsTrendingFeed.items
              : selectedProvider === 'AnyReel'
              ? arAsianFeed.items
              : selectedProvider === 'Melolo'
              ? mlRankFeed.items
              : selectedProvider === 'DramaBox'
              ? dbRankingFeed.items
              : interleaveManyFeeds(
                  dbRankingFeed.items,
                  nsTrendingFeed.items,
                  arAsianFeed.items,
                  mlRankFeed.items,
                  ...EXTRA_PROVIDER_NAMES.map((n) =>
                    extraFeeds[n].rank.items.length > 0
                      ? extraFeeds[n].rank.items
                      : extraFeeds[n].main.items
                  )
                ),
          loading:
            dbRankingFeed.loading &&
            nsTrendingFeed.loading &&
            arAsianFeed.loading &&
            mlRankFeed.loading,
          loadingMore:
            dbRankingFeed.loadingMore ||
            nsTrendingFeed.loadingMore ||
            arAsianFeed.loadingMore ||
            mlRankFeed.loadingMore,
          error:
            dbRankingFeed.error &&
            nsTrendingFeed.error &&
            arAsianFeed.error &&
            mlRankFeed.error,
          hasMore:
            (selectedProvider === 'All' || selectedProvider === 'DramaBox'
              ? dbRankingFeed.hasMore
              : false) ||
            (selectedProvider === 'All' || selectedProvider === 'NetShort'
              ? nsTrendingFeed.hasMore
              : false) ||
            (selectedProvider === 'All' || selectedProvider === 'AnyReel'
              ? arAsianFeed.hasMore
              : false) ||
            (selectedProvider === 'All' || selectedProvider === 'Melolo'
              ? mlRankFeed.hasMore
              : false),
          badgeStyle: 'none' as const,
          ranked: true,
          onLoadMore: () => {
            if (selectedProvider === 'All' || selectedProvider === 'DramaBox') {
              loadSingleFeed(
                dramaBoxProvider.fetchRanking,
                setDbRankingFeed,
                dbRankingFeed.page + 1,
                true
              );
            }
            if (selectedProvider === 'All' || selectedProvider === 'NetShort') {
              loadSingleFeed(
                netShortProvider.fetchRanking,
                setNsTrendingFeed,
                nsTrendingFeed.page + 1,
                true
              );
            }
            if (selectedProvider === 'All' || selectedProvider === 'AnyReel') {
              loadSingleFeed(
                anyReelProvider.fetchRanking,
                setArAsianFeed,
                arAsianFeed.page + 1,
                true
              );
            }
            if (selectedProvider === 'All' || selectedProvider === 'Melolo') {
              loadSingleFeed(
                meloloProvider.fetchRanking,
                setMlRankFeed,
                mlRankFeed.page + 1,
                true
              );
            }
          },
          onRetry: () => fetchAllFeeds(),
        };
      }
      case 'terbaru': {
        if (selectedExtra) {
          const b = extraFeeds[selectedExtra];
          const feed = b.newest.items.length > 0 ? b.newest : b.main;
          const adapter = ALL_PROVIDER_ADAPTERS[selectedExtra];
          return {
            title: `${adapter.label} · ${t.sections.newReleases}`,
            items: feed.items,
            loading: b.newest.loading || b.main.loading,
            loadingMore: feed.loadingMore,
            error: feed.error,
            hasMore: feed.hasMore,
            badgeStyle: 'NEW' as const,
            ranked: false,
            onLoadMore: () =>
              loadExtraFeedSlot(
                selectedExtra,
                b.newest.items.length > 0 ? 'newest' : 'main',
                (p) =>
                  b.newest.items.length > 0
                    ? adapter.fetchNewReleases(p)
                    : adapter.fetchForYou(p),
                feed.page + 1,
                true
              ),
            onRetry: () => ensureExtraProviderFullLoaded(selectedExtra, true),
          };
        }

        return {
          title: t.sections.newReleases,
          items: newReleaseItems,
          loading:
            dbNewFeed.loading &&
            nsAllFeed.loading &&
            arAsianFeed.loading &&
            mlNewFeed.loading,
          loadingMore:
            dbNewFeed.loadingMore ||
            nsAllFeed.loadingMore ||
            arAsianFeed.loadingMore ||
            mlNewFeed.loadingMore,
          error:
            dbNewFeed.error &&
            nsAllFeed.error &&
            arAsianFeed.error &&
            mlNewFeed.error,
          hasMore:
            (selectedProvider === 'All' || selectedProvider === 'DramaBox'
              ? dbNewFeed.hasMore
              : false) ||
            (selectedProvider === 'All' || selectedProvider === 'NetShort'
              ? nsAllFeed.hasMore
              : false) ||
            (selectedProvider === 'All' || selectedProvider === 'AnyReel'
              ? arAsianFeed.hasMore
              : false) ||
            (selectedProvider === 'All' || selectedProvider === 'Melolo'
              ? mlNewFeed.hasMore
              : false),
          badgeStyle: 'NEW' as const,
          ranked: false,
          onLoadMore: () => {
            if (selectedProvider === 'All' || selectedProvider === 'DramaBox') {
              loadSingleFeed(
                dramaBoxProvider.fetchNewReleases,
                setDbNewFeed,
                dbNewFeed.page + 1,
                true
              );
            }
            if (selectedProvider === 'All' || selectedProvider === 'NetShort') {
              loadSingleFeed(
                netShortProvider.fetchNewReleases,
                setNsAllFeed,
                nsAllFeed.page + 1,
                true
              );
            }
            if (selectedProvider === 'All' || selectedProvider === 'AnyReel') {
              loadSingleFeed(
                anyReelProvider.fetchNewReleases,
                setArAsianFeed,
                arAsianFeed.page + 1,
                true
              );
            }
            if (selectedProvider === 'All' || selectedProvider === 'Melolo') {
              loadSingleFeed(
                meloloProvider.fetchNewReleases,
                setMlNewFeed,
                mlNewFeed.page + 1,
                true
              );
            }
          },
          onRetry: () => fetchAllFeeds(),
        };
      }
      case 'vip': {
        if (selectedExtra) {
          const b = extraFeeds[selectedExtra];
          const feed = b.vip.items.length > 0 ? b.vip : b.main;
          const adapter = ALL_PROVIDER_ADAPTERS[selectedExtra];
          return {
            title: `${adapter.label} · ${t.sections.vipExclusives}`,
            items: feed.items,
            loading: b.vip.loading || b.main.loading,
            loadingMore: feed.loadingMore,
            error: feed.error,
            hasMore: feed.hasMore,
            badgeStyle: 'VIP' as const,
            ranked: false,
            onLoadMore: () =>
              loadExtraFeedSlot(
                selectedExtra,
                'vip',
                (p) => adapter.fetchVip(p),
                feed.page + 1,
                true
              ),
            onRetry: () => ensureExtraProviderFullLoaded(selectedExtra, true),
          };
        }

        return {
          title: t.sections.vipExclusives,
          items:
            selectedProvider === 'NetShort'
              ? nsTrendingFeed.items
              : selectedProvider === 'AnyReel'
              ? arForYouFeed.items
              : selectedProvider === 'Melolo'
              ? mlRankFeed.items
              : dbVipFeed.items,
          loading: dbVipFeed.loading,
          loadingMore: dbVipFeed.loadingMore,
          error: dbVipFeed.error,
          hasMore: dbVipFeed.hasMore,
          badgeStyle: 'VIP' as const,
          ranked: false,
          onLoadMore: () =>
            loadSingleFeed(
              dramaBoxProvider.fetchVip,
              setDbVipFeed,
              dbVipFeed.page + 1,
              true
            ),
          onRetry: () =>
            loadSingleFeed(dramaBoxProvider.fetchVip, setDbVipFeed, 1, false),
        };
      }
      case 'anime': {
        const moboAnimeFeed = extraFeeds.MoboReels.anime ?? IDLE_FEED;
        const frAnimeFeed = extraFeeds.FreeReels.anime ?? IDLE_FEED;
        const gsAnimeFeed = extraFeeds.GoodShort.anime ?? IDLE_FEED;
        const iqAnimeFeed = extraFeeds.iQIYI.anime ?? IDLE_FEED;
        return {
          title: t.sections.animeDonghua,
          items:
            combinedAnimeItems.length > 0 ? combinedAnimeItems : nsAllFeed.items,
          loading:
            nsAnimeFeed.loading &&
            mlAnimeFeed.loading &&
            moboAnimeFeed.loading &&
            frAnimeFeed.loading &&
            gsAnimeFeed.loading &&
            iqAnimeFeed.loading,
          loadingMore:
            nsAnimeFeed.loadingMore ||
            mlAnimeFeed.loadingMore ||
            moboAnimeFeed.loadingMore ||
            frAnimeFeed.loadingMore ||
            gsAnimeFeed.loadingMore ||
            iqAnimeFeed.loadingMore,
          error:
            nsAnimeFeed.error &&
            mlAnimeFeed.error &&
            moboAnimeFeed.error &&
            frAnimeFeed.error &&
            gsAnimeFeed.error &&
            iqAnimeFeed.error,
          hasMore:
            nsAnimeFeed.hasMore ||
            mlAnimeFeed.hasMore ||
            moboAnimeFeed.hasMore ||
            frAnimeFeed.hasMore ||
            gsAnimeFeed.hasMore ||
            iqAnimeFeed.hasMore,
          badgeStyle: 'ANIME' as const,
          ranked: false,
          onLoadMore: () => {
            if (
              netShortProvider.fetchAnime &&
              (selectedProvider === 'All' || selectedProvider === 'NetShort')
            ) {
              loadSingleFeed(
                netShortProvider.fetchAnime,
                setNsAnimeFeed,
                nsAnimeFeed.page + 1,
                true
              );
            }
            if (
              meloloProvider.fetchAnime &&
              (selectedProvider === 'All' || selectedProvider === 'Melolo')
            ) {
              loadSingleFeed(
                meloloProvider.fetchAnime,
                setMlAnimeFeed,
                mlAnimeFeed.page + 1,
                true
              );
            }
            if (
              selectedProvider === 'All' ||
              selectedProvider === 'MoboReels'
            ) {
              loadExtraFeedSlot(
                'MoboReels',
                'anime',
                (p) => moboReelsProvider.fetchAnimasi(p),
                moboAnimeFeed.page + 1,
                true
              );
            }
            if (
              freeReelsProvider.fetchAnime &&
              (selectedProvider === 'All' || selectedProvider === 'FreeReels')
            ) {
              const fn = freeReelsProvider.fetchAnime;
              loadExtraFeedSlot(
                'FreeReels',
                'anime',
                (p) => fn(p),
                frAnimeFeed.page + 1,
                true
              );
            }
            if (
              goodShortProvider.fetchAnime &&
              (selectedProvider === 'All' || selectedProvider === 'GoodShort')
            ) {
              const fn = goodShortProvider.fetchAnime;
              loadExtraFeedSlot(
                'GoodShort',
                'anime',
                (p) => fn(p),
                gsAnimeFeed.page + 1,
                true
              );
            }
            if (
              iqiyiProvider.fetchAnime &&
              (selectedProvider === 'All' || selectedProvider === 'iQIYI')
            ) {
              const fn = iqiyiProvider.fetchAnime;
              loadExtraFeedSlot(
                'iQIYI',
                'anime',
                (p) => fn(p),
                iqAnimeFeed.page + 1,
                true
              );
            }
          },
          onRetry: () => {
            if (netShortProvider.fetchAnime) {
              loadSingleFeed(netShortProvider.fetchAnime, setNsAnimeFeed, 1, false);
            }
            if (meloloProvider.fetchAnime) {
              loadSingleFeed(meloloProvider.fetchAnime, setMlAnimeFeed, 1, false);
            }
            loadExtraFeedSlot(
              'MoboReels',
              'anime',
              (p) => moboReelsProvider.fetchAnimasi(p),
              1,
              false
            );
            if (freeReelsProvider.fetchAnime) {
              const fn = freeReelsProvider.fetchAnime;
              loadExtraFeedSlot('FreeReels', 'anime', (p) => fn(p), 1, false);
            }
            if (goodShortProvider.fetchAnime) {
              const fn = goodShortProvider.fetchAnime;
              loadExtraFeedSlot('GoodShort', 'anime', (p) => fn(p), 1, false);
            }
            if (iqiyiProvider.fetchAnime) {
              const fn = iqiyiProvider.fetchAnime;
              loadExtraFeedSlot('iQIYI', 'anime', (p) => fn(p), 1, false);
            }
          },
        };
      }
      case 'dubbing': {
        const frDubFeed = extraFeeds.FreeReels.dubbing ?? IDLE_FEED;
        const gsDubFeed = extraFeeds.GoodShort.dubbing ?? IDLE_FEED;
        return {
          title: t.sections.dubbedSeries,
          items: combinedDubbingItems,
          loading:
            dbDubbingFeed.loading && frDubFeed.loading && gsDubFeed.loading,
          loadingMore:
            dbDubbingFeed.loadingMore ||
            frDubFeed.loadingMore ||
            gsDubFeed.loadingMore,
          error: dbDubbingFeed.error && frDubFeed.error && gsDubFeed.error,
          hasMore:
            dbDubbingFeed.hasMore || frDubFeed.hasMore || gsDubFeed.hasMore,
          badgeStyle: 'DUB' as const,
          ranked: false,
          onLoadMore: () => {
            if (
              dramaBoxProvider.fetchDubbing &&
              (selectedProvider === 'All' || selectedProvider === 'DramaBox')
            ) {
              loadSingleFeed(
                dramaBoxProvider.fetchDubbing,
                setDbDubbingFeed,
                dbDubbingFeed.page + 1,
                true
              );
            }
            if (
              freeReelsProvider.fetchDubbing &&
              (selectedProvider === 'All' || selectedProvider === 'FreeReels')
            ) {
              const fn = freeReelsProvider.fetchDubbing;
              loadExtraFeedSlot(
                'FreeReels',
                'dubbing',
                (p) => fn(p),
                frDubFeed.page + 1,
                true
              );
            }
            if (
              goodShortProvider.fetchDubbing &&
              (selectedProvider === 'All' || selectedProvider === 'GoodShort')
            ) {
              const fn = goodShortProvider.fetchDubbing;
              loadExtraFeedSlot(
                'GoodShort',
                'dubbing',
                (p) => fn(p),
                gsDubFeed.page + 1,
                true
              );
            }
          },
          onRetry: () => {
            if (dramaBoxProvider.fetchDubbing) {
              loadSingleFeed(
                dramaBoxProvider.fetchDubbing,
                setDbDubbingFeed,
                1,
                false
              );
            }
            if (freeReelsProvider.fetchDubbing) {
              const fn = freeReelsProvider.fetchDubbing;
              loadExtraFeedSlot('FreeReels', 'dubbing', (p) => fn(p), 1, false);
            }
            if (goodShortProvider.fetchDubbing) {
              const fn = goodShortProvider.fetchDubbing;
              loadExtraFeedSlot('GoodShort', 'dubbing', (p) => fn(p), 1, false);
            }
          },
        };
      }
      case 'mylist':
        return {
          title:
            watchlistCategory === 'movie'
              ? t.moviesPage.watchlistTitle
              : t.sections.dramaWatchlistTitle,
          items:
            watchlistCategory === 'movie' && !user ? [] : filteredWatchlistItems,
          loading: false,
          loadingMore: false,
          error: null,
          hasMore: false,
          badgeStyle: 'none' as const,
          ranked: false,
          onLoadMore: undefined,
          onRetry: () => {},
        };
      default:
        return null;
    }
  }, [
    activeTab,
    watchlistCategory,
    user,
    selectedProvider,
    t,
    dbRankingFeed,
    nsTrendingFeed,
    arAsianFeed,
    arForYouFeed,
    mlRankFeed,
    newReleaseItems,
    dbNewFeed,
    nsAllFeed,
    mlNewFeed,
    dbVipFeed,
    combinedAnimeItems,
    combinedDubbingItems,
    nsAnimeFeed,
    mlAnimeFeed,
    dbDubbingFeed,
    extraFeeds,
    filteredWatchlistItems,
    loadSingleFeed,
    loadExtraFeedSlot,
    ensureExtraProviderFullLoaded,
    fetchAllFeeds,
  ]);

  const providerLabel = (id: ProviderId): string => {
    if (id === 'All') return t.providers.all;
    if (id === 'DramaBox') return t.providers.dramaBox;
    if (id === 'NetShort') return t.providers.netShort;
    if (id === 'AnyReel') return t.providers.anyReel;
    if (id === 'Melolo') return t.providers.melolo;
    return ALL_PROVIDER_ADAPTERS[id]?.label ?? id;
  };

  return (
    <div className="min-h-screen bg-[var(--cd-bg)] text-[#FAFAFA] flex flex-col overflow-x-hidden">
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleNavigateTab}
        languageLoading={languageLoading}
        onChangeLanguage={handleChangeLanguage}
        onOpenSearchModal={handleOpenSearch}
      />

      <DesktopSidebar
        activeTab={activeTab}
        selectedProvider={selectedProvider}
        hasActiveSubRoute={Boolean(activeDramaRoute || activeSeoLanding)}
        onSelectTab={handleNavigateTab}
        onOpenProviderHub={handleOpenProviderHub}
      />

      {/* Native-feel PWA Install Bottom-Sheet / Modal */}
      <PWAInstallButton variant="banner" playerOpen={Boolean(playerState)} />

      <div className="flex-1 flex flex-col md:pl-[72px] lg:pl-[216px] min-w-0">

      {activeDramaRoute ? (
        <main className="flex-1">
          {activeDramaRoute.slugHint && !activeDramaRoute.drama ? (
            <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-20 flex justify-center">
              <Loader2 className="w-8 h-8 cd-accent-text animate-spin" />
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 flex justify-center">
                  <Loader2 className="w-7 h-7 cd-accent-text animate-spin" />
                </div>
              }
            >
              <DramaDetailPage
                bookId={activeDramaRoute.bookId}
                providerHint={activeDramaRoute.providerHint}
                initialDrama={activeDramaRoute.drama}
                initialEpisodes={activeDramaRoute.episodes}
                onBackHome={closeDramaRoute}
                onSelectTag={openTagRoute}
                onPlayEpisode={handlePlayEpisode}
              />
            </Suspense>
          )}
        </main>
      ) : activeSeoLanding ? (
        <main className="flex-1 pb-20 md:pb-12">
          <Suspense
            fallback={
              <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 flex justify-center">
                <Loader2 className="w-7 h-7 cd-accent-text animate-spin" />
              </div>
            }
          >
            <SeoLandingPage
              basePath={activeSeoLanding.basePath}
              slug={activeSeoLanding.slug}
              modifier={activeSeoLanding.modifier}
              localPool={allLoadedDramas}
              myListIds={myListIds}
              onBackHome={closeSeoLandingRoute}
              onNavigateLanding={openSeoLandingPath}
              onSelectDrama={openDramaRoute}
              onQuickPlay={(d) => handlePlayEpisode(d, 1)}
              onToggleMyList={toggleMyList}
            />
          </Suspense>
        </main>
      ) : (
        <main className="flex-1 pb-20 md:pb-8">
          {activeTab === 'dashboard' ? (
            <Suspense
              fallback={
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 flex justify-center">
                  <Loader2 className="w-7 h-7 cd-accent-text animate-spin" />
                </div>
              }
            >
              <UserDashboard
                onSelectDrama={openDramaRoute}
                onPlayDrama={(d, ep = 1, resumeTimeSec) =>
                  handlePlayEpisode(d, ep, [], resumeTimeSec)
                }
                onBackToHome={() => handleNavigateTab('home')}
                initialSubTab={dashboardSubTab}
                initialWatchlistCategory={dashboardWatchlistCategory}
              />
            </Suspense>
          ) : activeTab === 'movies' ? (
            <Suspense
              fallback={
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 space-y-8">
                  <CarouselSkeleton />
                  <CarouselSkeleton />
                </div>
              }
            >
              <MoviesView
                myListIds={myListIds}
                onSelectMovie={openDramaRoute}
                onQuickPlayMovie={(m) => handlePlayEpisode(m, 1)}
                onToggleMyList={toggleMyList}
                onSelectTag={openTagRoute}
                onMoviesPoolChange={setMoviesPool}
              />
            </Suspense>
          ) : activeTab === 'explore' ? (
            <Suspense
              fallback={
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 space-y-8">
                  <CarouselSkeleton />
                  <CarouselSkeleton />
                </div>
              }
            >
              <ExploreView
                selectedProvider={selectedProvider}
                extraProviderNames={EXTRA_PROVIDER_NAMES}
                dbRankingFeed={dbRankingFeed}
                nsTrendingFeed={nsTrendingFeed}
                arAsianFeed={arAsianFeed}
                mlRankFeed={mlRankFeed}
                dbForYouFeed={dbForYouFeed}
                nsForYouFeed={nsForYouFeed}
                arForYouFeed={arForYouFeed}
                mlForYouFeed={mlForYouFeed}
                dbNewFeed={dbNewFeed}
                nsAllFeed={nsAllFeed}
                mlNewFeed={mlNewFeed}
                dbVipFeed={dbVipFeed}
                nsAnimeFeed={nsAnimeFeed}
                mlAnimeFeed={mlAnimeFeed}
                dbDubbingFeed={dbDubbingFeed}
                recommendedItems={recommendedItems}
                newReleaseItems={newReleaseItems}
                combinedAnimeItems={combinedAnimeItems}
                combinedDubbingItems={combinedDubbingItems}
                extraFeeds={extraFeeds}
                myListIds={myListIds}
                onSelectProvider={(prov) => setSelectedProvider(prov)}
                onSelectTab={handleNavigateTab}
                onOpenTag={openTagRoute}
                onSelectDrama={openDramaRoute}
                onQuickPlay={(d) => handlePlayEpisode(d, 1)}
                onToggleMyList={toggleMyList}
                onOpenProviderHub={handleOpenProviderHub}
                onRetryCore={() => void fetchAllFeeds()}
                onRetryFeed={(prov, kind) => {
                  if (prov === 'DramaBox' && kind === 'rank') {
                    void loadSingleFeed(dramaBoxProvider.fetchRanking, setDbRankingFeed, 1, false);
                  } else if (prov === 'DramaBox' && kind === 'vip') {
                    void loadSingleFeed(dramaBoxProvider.fetchVip, setDbVipFeed, 1, false);
                  } else if (prov === 'DramaBox' && kind === 'dubbing' && dramaBoxProvider.fetchDubbing) {
                    void loadSingleFeed(dramaBoxProvider.fetchDubbing, setDbDubbingFeed, 1, false);
                  } else if (prov === 'NetShort' && kind === 'rank') {
                    void loadSingleFeed(netShortProvider.fetchRanking, setNsTrendingFeed, 1, false);
                  } else if (prov === 'NetShort' && kind === 'anime' && netShortProvider.fetchAnime) {
                    void loadSingleFeed(netShortProvider.fetchAnime, setNsAnimeFeed, 1, false);
                  } else if (prov === 'AnyReel' && kind === 'rank') {
                    void loadSingleFeed(anyReelProvider.fetchRanking, setArAsianFeed, 1, false);
                  } else if (prov === 'Melolo' && kind === 'rank') {
                    void loadSingleFeed(meloloProvider.fetchRanking, setMlRankFeed, 1, false);
                  }
                }}
                onLoadMoreRecommended={() => {
                  if (selectedProvider === 'All' || selectedProvider === 'DramaBox') {
                    void loadSingleFeed(dramaBoxProvider.fetchForYou, setDbForYouFeed, dbForYouFeed.page + 1, true);
                  }
                  if (selectedProvider === 'All' || selectedProvider === 'NetShort') {
                    void loadSingleFeed(netShortProvider.fetchForYou, setNsForYouFeed, nsForYouFeed.page + 1, true);
                  }
                  if (selectedProvider === 'All' || selectedProvider === 'AnyReel') {
                    void loadSingleFeed(anyReelProvider.fetchForYou, setArForYouFeed, arForYouFeed.page + 1, true);
                  }
                  if (selectedProvider === 'All' || selectedProvider === 'Melolo') {
                    void loadSingleFeed(meloloProvider.fetchForYou, setMlForYouFeed, mlForYouFeed.page + 1, true);
                  }
                }}
                onRetryExtraFull={(prov) => {
                  if (isExtraProvider(prov)) {
                    void ensureExtraProviderFullLoaded(prov, true);
                  }
                }}
                onLoadExtraBatch={(providers) => {
                  void loadExtraProvidersBatch(providers);
                }}
              />
            </Suspense>
          ) : !activeGridInfo ? (
            <>
              {/* 1. Hero Spotlight Banner */}
              <HeroSpotlight
                spotlights={heroSpotlights}
                loading={heroLoading}
                onPlayFirstEpisode={(d) => handlePlayEpisode(d, 1)}
                onOpenDetails={openDramaRoute}
                onSelectTag={openTagRoute}
              />

              {/* Compact Quick Provider Switcher (Single Horizontal Row — All 49 Providers) + Explore Link */}
              <section
                className="max-w-[1440px] mx-auto px-4 md:px-8 pt-2 pb-1"
                aria-label="Provider quick filter"
              >
                <div
                  className="flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-none py-1"
                  role="tablist"
                >
                  {PROVIDER_FILTERS.map((prov) => {
                    const active = selectedProvider === prov.id;
                    return (
                      <button
                        key={prov.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSelectedProvider(prov.id)}
                        className={`px-4 py-1.5 min-h-[38px] rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${
                          active
                            ? 'cd-accent-bg border-[var(--cd-accent)] text-white shadow-sm'
                            : 'bg-[var(--cd-surface)] border-[var(--cd-border)] text-[#E4E4E7] hover:border-white/30'
                        }`}
                      >
                        {providerLabel(prov.id)}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleNavigateTab('explore')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 min-h-[38px] rounded-full bg-[#141418] border border-white/15 hover:border-[var(--cd-accent)] text-xs font-semibold text-[#D4AF37] whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{t.nav.explore}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWatchlistCategory('drama');
                      handleNavigateTab('mylist');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 min-h-[38px] rounded-full bg-[#141418] border border-white/15 hover:border-[var(--cd-accent)] text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 cd-accent-text" />
                    <span>
                      {t.sections.dramaWatchlistTitle}
                      {dramaWatchlistItems.length > 0 ? ` (${dramaWatchlistItems.length})` : ''}
                    </span>
                  </button>
                </div>
              </section>

              {selectedProvider !== 'All' ? (
                <Suspense
                  fallback={
                    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6">
                      <CarouselSkeleton />
                    </div>
                  }
                >
                  <ProviderEndpointSection
                    provider={selectedProvider}
                    language={language}
                    myListIds={myListIds}
                    onResetProvider={() => setSelectedProvider('All')}
                    onSelectDrama={openDramaRoute}
                    onQuickPlay={(d) => handlePlayEpisode(d, 1)}
                    onToggleMyList={toggleMyList}
                  />
                </Suspense>
              ) : (
                <>
                  {/* 2. Continue Watching (Only shown when user has watch history) */}
                  {continueWatchingData.items.length > 0 && (
                <CarouselRow
                  title={t.sections.continueWatching}
                  icon={<Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />}
                  items={continueWatchingData.items}
                  loading={false}
                  error={null}
                  continueEpisodesMap={continueWatchingData.map}
                  myListIds={myListIds}
                  onRetry={() => {}}
                  onSeeAll={() => handleNavigateTab('dashboard')}
                  onSelectDrama={openDramaRoute}
                  onQuickPlay={(d) => {
                    const saved =
                      continueWatchingData.map[`${d.provider}:${d.bookId}`];
                    handlePlayEpisode(
                      d,
                      saved?.episode ?? 1,
                      [],
                      saved?.currentTime ?? 0
                    );
                  }}
                  onToggleMyList={toggleMyList}
                  onRemoveHistory={(d) => removeHistoryItem(d.bookId, d.provider)}
                />
              )}

              {/* 3. Top Category Carousel #1: Trending / Hot */}
              <CarouselRow
                title={t.sections.trendingNow}
                icon={<Flame className="w-4 h-4 cd-accent-text shrink-0" />}
                items={homeCatalog?.trendingTop ?? []}
                loading={homeLoading}
                error={homeError}
                ranked
                myListIds={myListIds}
                onRetry={() =>
                  void loadHomeFromCache(language, selectedProvider, true)
                }
                onSeeAll={() => handleNavigateTab('ranking')}
                onSelectDrama={openDramaRoute}
                onQuickPlay={(d) => handlePlayEpisode(d, 1)}
                onToggleMyList={toggleMyList}
              />

              {/* 3b. Personalized Recommendations ("Picked For You" / "Because You Watched ...") */}
              {(pickedForYouData.items.length > 0 || homeLoading) && (
                <CarouselRow
                  title={
                    pickedForYouData.anchorTitle
                      ? `${t.sections.becauseYouWatched} ${pickedForYouData.anchorTitle}`
                      : t.sections.pickedForYou
                  }
                  icon={<Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />}
                  items={pickedForYouData.items}
                  loading={homeLoading && pickedForYouData.items.length === 0}
                  error={null}
                  myListIds={myListIds}
                  onRetry={() =>
                    void loadHomeFromCache(language, selectedProvider, true)
                  }
                  onSeeAll={() => handleNavigateTab('explore')}
                  onSelectDrama={openDramaRoute}
                  onQuickPlay={(d) => handlePlayEpisode(d, 1)}
                  onToggleMyList={toggleMyList}
                />
              )}

              {/* 4. Top Category Carousel #2 (Below the Fold Lazy Mounted): Hot & New Picks */}
              <LazySection fallback={<CarouselSkeleton />} className="cv-auto">
                <CarouselRow
                  title={t.sections.hotPicks}
                  icon={<Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />}
                  items={homeCatalog?.hotReleases ?? []}
                  loading={homeLoading}
                  error={homeError}
                  badgeStyle="NEW"
                  myListIds={myListIds}
                  onRetry={() =>
                    void loadHomeFromCache(language, selectedProvider, true)
                  }
                  onSeeAll={() => handleNavigateTab('explore')}
                  onSelectDrama={openDramaRoute}
                  onQuickPlay={(d) => handlePlayEpisode(d, 1)}
                  onToggleMyList={toggleMyList}
                />
              </LazySection>

              {/* 5. Main Featured Catalog Grid (2.5-Card Horizontal Slider on Mobile, 5-Col Grid on Desktop) */}
              <LazySection
                className="cv-auto"
                fallback={
                  <section className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-8">
                    <div className="h-7 w-44 rounded-lg skeleton-espresso mb-4" />
                    <div className="flex flex-nowrap gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5 sm:overflow-visible">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-[0_0_40%] w-[40%] min-w-[40%] shrink-0 snap-start sm:flex-auto sm:w-full sm:min-w-0 sm:shrink space-y-2"
                        >
                          <div className="w-full aspect-[2/3] rounded-xl skeleton-espresso border border-white/10" />
                          <div className="px-0.5 space-y-1.5">
                            <div className="h-3.5 w-[88%] rounded skeleton-espresso" />
                            <div className="h-3 w-[55%] rounded skeleton-espresso" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                }
              >
                <section className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-8">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Film className="w-4 h-4 cd-accent-text shrink-0" />
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                        {t.sections.homeCatalogGrid}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNavigateTab('explore')}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>{t.nav.explore}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {homeLoading && !(homeCatalog?.catalogGrid.length) ? (
                    <div className="flex flex-nowrap gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5 sm:overflow-visible">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-[0_0_40%] w-[40%] min-w-[40%] shrink-0 snap-start sm:flex-auto sm:w-full sm:min-w-0 sm:shrink space-y-2"
                        >
                          <div className="w-full aspect-[2/3] rounded-xl skeleton-espresso border border-white/10" />
                          <div className="px-0.5 space-y-1.5">
                            <div className="h-3.5 w-[88%] rounded skeleton-espresso" />
                            <div className="h-3 w-[55%] rounded skeleton-espresso" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (homeCatalog?.catalogGrid.length ?? 0) > 0 ? (
                    <div className="flex flex-nowrap gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5 sm:overflow-visible">
                      {homeCatalog!.catalogGrid.map((drama) => (
                        <DramaCard
                          key={`${drama.provider}:${drama.bookId}`}
                          drama={drama}
                          isSaved={myListIds.includes(
                            `${drama.provider}:${drama.bookId}`
                          )}
                          responsiveGrid
                          onSelect={openDramaRoute}
                          onQuickPlay={(d) => handlePlayEpisode(d, 1)}
                          onToggleMyList={toggleMyList}
                        />
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleNavigateTab('explore')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-full bg-[var(--cd-surface)] border border-[var(--cd-border)] hover:border-[var(--cd-accent)] text-xs sm:text-sm font-semibold text-white transition-colors"
                    >
                      <Compass className="w-4 h-4 cd-accent-text" />
                      <span>{t.sections.exploreAllCategories}</span>
                      <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
                    </button>
                  </div>
                </section>
              </LazySection>
                </>
              )}
            </>
          ) : (
            /* Dedicated View for View All / Tabs / Custom Watchlist Folders */
            <section className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-16">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-5 pb-4 border-b border-white/10">
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-white">
                    {activeGridInfo.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 tabular-nums">
                    {activeGridInfo.items.length} titles
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'mylist' && (watchlistCategory === 'drama' || user) && (
                    <button
                      type="button"
                      onClick={() => setNewFolderOpen((p) => !p)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--cd-surface)] border border-[var(--cd-border)] hover:border-[var(--cd-accent)] text-xs font-semibold text-white"
                    >
                      <FolderPlus className="w-3.5 h-3.5 cd-accent-text" />
                      <span>+ {t.engagement.createFolder}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleNavigateTab('home')}
                    className="px-4 py-2 rounded-full bg-[var(--cd-surface)] border border-[var(--cd-border)] hover:border-[var(--cd-accent)] text-xs font-medium text-white"
                  >
                    {t.sections.backToHome}
                  </button>
                </div>
              </div>

              {/* Separated Drama Watchlist & Movie Watchlist Switcher */}
              {activeTab === 'mylist' && (
                <div
                  className="mb-5 inline-flex flex-wrap items-center gap-2 p-1 rounded-2xl bg-[#111015] border border-white/10"
                  role="tablist"
                  aria-label="Watchlist categories"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={watchlistCategory === 'drama'}
                    onClick={() => {
                      setWatchlistCategory('drama');
                      setActiveFolderId('all');
                      setWatchStatusFilter('all');
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      watchlistCategory === 'drama'
                        ? 'cd-accent-bg text-white shadow-md'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>
                      {t.sections.dramaWatchlistTitle} ({dramaWatchlistItems.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={watchlistCategory === 'movie'}
                    onClick={() => {
                      setWatchlistCategory('movie');
                      setActiveFolderId('all');
                      setWatchStatusFilter('all');
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      watchlistCategory === 'movie'
                        ? 'cd-accent-bg text-white shadow-md'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    <Clapperboard className="w-4 h-4" />
                    <span>
                      {t.moviesPage.watchlistTitle} ({user ? movieWatchlistItems.length : 0})
                    </span>
                    {!user && <Lock className="w-3.5 h-3.5 opacity-80" />}
                  </button>
                </div>
              )}

              {/* Login Required Gate for Movie Watchlist */}
              {activeTab === 'mylist' && watchlistCategory === 'movie' && !user ? (
                <div className="my-10 p-8 sm:p-10 rounded-3xl bg-[var(--cd-surface)] border border-white/10 text-center max-w-lg mx-auto space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--cd-accent-soft)] border border-[var(--cd-accent)]/40 flex items-center justify-center mx-auto cd-accent-text">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {t.moviesPage.watchlistLoginTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                      {t.moviesPage.watchlistLoginDesc}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => openAuthModal(t.auth.gateWatchlistReason)}
                      className="px-6 py-2.5 min-h-[44px] rounded-full cd-accent-bg text-xs sm:text-sm font-bold text-white shadow-lg"
                    >
                      {t.auth.continueBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigateTab('movies')}
                      className="px-5 py-2.5 min-h-[44px] rounded-full bg-[#18181D] border border-white/15 hover:border-white/30 text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-1.5"
                    >
                      <Clapperboard className="w-4 h-4 cd-accent-text" />
                      <span>{t.moviesPage.browseMoviesBtn}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
              {/* Custom Watchlist Folders Toolbar */}
              {activeTab === 'mylist' && (watchlistCategory === 'drama' || user) && (
                <div className="mb-6 space-y-3">
                  {newFolderOpen && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const created = createWatchlistFolder(newFolderName);
                        if (created) {
                          setActiveFolderId(created.id);
                          setNewFolderName('');
                          setNewFolderOpen(false);
                        }
                      }}
                      className="flex items-center gap-2 max-w-sm"
                    >
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={t.engagement.folderPlaceholder}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--cd-surface)] border border-[var(--cd-border)] focus:border-[var(--cd-accent)] text-xs text-white placeholder-[#71717A] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl cd-accent-bg text-white text-xs font-semibold"
                      >
                        Save
                      </button>
                    </form>
                  )}

                  {/* Smart Watchlist Status Tabs */}
                  <div
                    className="flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-none pb-1"
                    role="tablist"
                    aria-label="Watchlist Status Filter"
                  >
                    {(
                      [
                        { id: 'all', label: t.watchlistStatus.all, count: watchStatusCounts.all },
                        {
                          id: 'watching',
                          label: t.watchlistStatus.watching,
                          count: watchStatusCounts.watching,
                        },
                        {
                          id: 'plan',
                          label: t.watchlistStatus.plan,
                          count: watchStatusCounts.plan,
                        },
                        {
                          id: 'completed',
                          label: t.watchlistStatus.completed,
                          count: watchStatusCounts.completed,
                        },
                      ] as { id: WatchStatusFilter; label: string; count: number }[]
                    ).map((st) => {
                      const active = watchStatusFilter === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setWatchStatusFilter(st.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors inline-flex items-center gap-1.5 ${
                            active
                              ? 'bg-white text-[#09090B] border-white'
                              : 'bg-[#141418] border-white/10 text-[#D4D4D8] hover:border-white/30'
                          }`}
                        >
                          <span>{st.label}</span>
                          <span className="opacity-75 tabular-nums">
                            ({st.count})
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Watchlist Folders Strip */}
                  <div className="flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                    {watchlistFolders.map((folder) => {
                      const active = activeFolderId === folder.id;
                      const folderCount =
                        folder.id === 'all'
                          ? activeCategoryWatchlistItems.length
                          : activeCategoryWatchlistItems.filter(
                              (d) =>
                                getDramaFolderId(d.bookId, d.provider) ===
                                folder.id
                            ).length;

                      return (
                        <div
                          key={folder.id}
                          className={`inline-flex items-center gap-1 rounded-full border transition-colors shrink-0 ${
                            active
                              ? 'cd-accent-bg border-[var(--cd-accent)] text-white'
                              : 'bg-[var(--cd-surface)] border-[var(--cd-border)] text-[#D4D4D8] hover:border-white/30'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveFolderId(folder.id)}
                            className="px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5"
                          >
                            <span>{folder.name}</span>
                            <span className="opacity-75 tabular-nums">
                              ({folderCount})
                            </span>
                          </button>
                          {!folder.isDefault && (
                            <button
                              type="button"
                              onClick={() => {
                                if (activeFolderId === folder.id) {
                                  setActiveFolderId('all');
                                }
                                deleteWatchlistFolder(folder.id);
                              }}
                              aria-label={`Delete folder ${folder.name}`}
                              className="pr-2.5 text-white/75 hover:text-white"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeGridInfo.loading && activeGridInfo.items.length === 0 ? (
                <div className="flex flex-nowrap gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5 sm:overflow-visible">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-[0_0_40%] w-[40%] min-w-[40%] shrink-0 snap-start sm:flex-auto sm:w-full sm:min-w-0 sm:shrink space-y-2"
                    >
                      <div className="w-full aspect-[2/3] rounded-xl skeleton-espresso border border-white/10" />
                      <div className="px-0.5 space-y-1.5">
                        <div className="h-3.5 w-[88%] rounded skeleton-espresso" />
                        <div className="h-3 w-[55%] rounded skeleton-espresso" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeGridInfo.error && activeGridInfo.items.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[var(--cd-surface)] border border-red-500/30 max-w-lg mx-auto text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-white">
                    Unable to Load Catalog
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-1.5">
                    {activeGridInfo.error}
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={activeGridInfo.onRetry}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full cd-accent-bg text-white text-xs font-semibold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t.player.retry}
                    </button>
                  </div>
                </div>
              ) : activeGridInfo.items.length === 0 ? (
                <div className="my-12 p-10 rounded-2xl bg-[var(--cd-surface)] border border-white/10 text-center max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-xl bg-[#1C1C22] border border-white/10 flex items-center justify-center mx-auto mb-4 cd-accent-text">
                    {activeTab === 'mylist' && watchlistCategory === 'movie' ? (
                      <Clapperboard className="w-5 h-5" />
                    ) : activeTab === 'mylist' ? (
                      <Bookmark className="w-5 h-5" />
                    ) : (
                      <Film className="w-5 h-5" />
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {activeTab === 'mylist'
                      ? `${
                          watchlistCategory === 'movie'
                            ? t.moviesPage.watchlistTitle
                            : t.sections.dramaWatchlistTitle
                        } is empty`
                      : t.search.noResults}
                  </h2>
                  <p className="text-sm text-[#A1A1AA] mt-2 leading-relaxed">
                    {activeTab === 'mylist'
                      ? watchlistCategory === 'movie'
                        ? t.moviesPage.watchlistEmpty
                        : t.sections.dramaWatchlistEmpty
                      : t.search.tryAnother}
                  </p>
                  {activeTab === 'mylist' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateTab(
                          watchlistCategory === 'movie' ? 'movies' : 'home'
                        )
                      }
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full cd-accent-bg text-xs sm:text-sm font-bold text-white shadow-lg"
                    >
                      {watchlistCategory === 'movie' ? (
                        <>
                          <Clapperboard className="w-4 h-4" />
                          <span>{t.moviesPage.browseMoviesBtn}</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          <span>{t.sections.exploreDramasBtn}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-nowrap gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5 sm:overflow-visible">
                    {activeGridInfo.items.map((drama, idx) => (
                      <div
                        key={`${drama.provider}:${drama.bookId}`}
                        className="flex-[0_0_40%] w-[40%] min-w-[40%] shrink-0 snap-start sm:flex-auto sm:w-full sm:min-w-0 sm:shrink flex flex-col gap-2"
                      >
                        <DramaCard
                          drama={drama}
                          rank={activeGridInfo.ranked ? idx + 1 : undefined}
                          badgeStyle={activeGridInfo.badgeStyle}
                          isSaved={myListIds.includes(
                            `${drama.provider}:${drama.bookId}`
                          )}
                          fluid
                          onSelect={openDramaRoute}
                          onQuickPlay={(d) => handlePlayEpisode(d, 1)}
                          onToggleMyList={toggleMyList}
                        />
                        {activeTab === 'mylist' && (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={getDramaFolderId(
                                drama.bookId,
                                drama.provider
                              )}
                              onChange={(e) =>
                                assignDramaToFolder(
                                  drama.bookId,
                                  drama.provider,
                                  e.target.value
                                )
                              }
                              aria-label={`Assign ${drama.title} folder`}
                              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[var(--cd-surface)] border border-[var(--cd-border)] text-[11px] text-[#E4E4E7] focus:outline-none focus:border-[var(--cd-accent)]"
                            >
                              {watchlistFolders.map((f) => (
                                <option
                                  key={f.id}
                                  value={f.id}
                                  className="bg-[#141418] text-white"
                                >
                                  {f.name}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                toggleDramaCompleted(
                                  drama.bookId,
                                  drama.provider
                                )
                              }
                              title={t.watchlistStatus.markCompleted}
                              className={`px-2 py-1.5 rounded-lg border text-[10px] font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                                getDramaWatchStatus(drama) === 'completed'
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                  : 'bg-[var(--cd-surface)] border-[var(--cd-border)] text-[#A1A1AA] hover:text-white'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t.watchlistStatus.completedBadge}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {activeGridInfo.onLoadMore && activeGridInfo.hasMore && (
                    <div className="mt-10 flex justify-center">
                      <button
                        type="button"
                        onClick={activeGridInfo.onLoadMore}
                        disabled={activeGridInfo.loadingMore}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--cd-surface)] border border-[var(--cd-accent)] hover:bg-[var(--cd-accent-soft)] text-xs sm:text-sm font-semibold cd-accent-text transition-colors disabled:opacity-50"
                      >
                        {activeGridInfo.loadingMore && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {activeGridInfo.loadingMore
                          ? t.sections.loading
                          : t.sections.loadMore}
                      </button>
                    </div>
                  )}
                </>
              )}
                </>
              )}
            </section>
          )}
        </main>
      )}

      <Footer />
      </div>

      {/* 5-Tab Sticky Mobile Bottom Navigation: Home -> Search -> Provider -> Movie -> Login */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-[var(--cd-bg)]/95 backdrop-blur-xl border-t border-white/10 grid grid-cols-5 items-center pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile Bottom Navigation"
      >
        {/* 1. Home (/ or /drama) */}
        <button
          type="button"
          onClick={() => handleNavigateTab('home')}
          aria-label={t.nav.home}
          className={`flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[44px] text-[10px] font-medium transition-colors ${
            !activeDramaRoute &&
            !activeSeoLanding &&
            activeTab === 'home' &&
            !searchModalOpen &&
            !providerHubOpen &&
            !authModalOpen
              ? 'cd-accent-text'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="truncate max-w-[60px]">{t.nav.home}</span>
        </button>

        {/* 2. Search (/search) */}
        <button
          type="button"
          onClick={handleOpenSearch}
          aria-label={t.nav.search}
          className={`flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[44px] text-[10px] font-medium transition-colors ${
            searchModalOpen
              ? 'cd-accent-text'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span className="truncate max-w-[60px]">{t.nav.search}</span>
        </button>

        {/* 3. Provider (Opens Provider Hub modal/drawer) */}
        <button
          type="button"
          onClick={handleOpenProviderHub}
          aria-label={t.nav.providers}
          className={`flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[44px] text-[10px] font-semibold transition-colors ${
            providerHubOpen || selectedProvider !== 'All'
              ? 'cd-accent-text'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="truncate max-w-[60px]">
            {selectedProvider === 'All'
              ? t.nav.providers
              : selectedProvider.slice(0, 7)}
          </span>
        </button>

        {/* 4. Movie (/movies) */}
        <button
          type="button"
          onClick={() => handleNavigateTab('movies')}
          aria-label={t.nav.movies}
          className={`flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[44px] text-[10px] font-semibold transition-colors ${
            !activeDramaRoute &&
            !activeSeoLanding &&
            activeTab === 'movies' &&
            !searchModalOpen &&
            !providerHubOpen &&
            !authModalOpen
              ? 'cd-accent-text'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Clapperboard className="w-4 h-4" />
          <span className="truncate max-w-[60px]">{t.nav.movies}</span>
        </button>

        {/* 5. Login (Profile / Auth & Integrated Movie Watchlist) */}
        <button
          type="button"
          onClick={handleOpenLoginMenu}
          aria-label={user ? t.nav.account : t.nav.login}
          className={`flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[44px] text-[10px] font-medium transition-colors ${
            authModalOpen ||
            (!searchModalOpen &&
              !providerHubOpen &&
              (activeTab === 'dashboard' || activeTab === 'mylist'))
              ? 'cd-accent-text'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          {user ? (
            <>
              {user.photoURL && !mobileAvatarBroken ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setMobileAvatarBroken(true)}
                  className="w-4 h-4 rounded-full object-cover border border-white/25"
                />
              ) : (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold text-white border border-white/25"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.avatarInitials}
                </span>
              )}
              <span className="truncate max-w-[60px]">{t.nav.account}</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4" />
              <span className="truncate max-w-[60px]">{t.nav.login}</span>
            </>
          )}
        </button>
      </nav>

      {/* Subtle Browser Web Push Opt-In Prompt after watching 3 episodes */}
      {showPushPrompt && !playerState && (
        <aside
          aria-label={t.retention.pushPromptTitle}
          className="fixed bottom-16 md:bottom-6 right-3 sm:right-6 z-40 max-w-sm rounded-2xl bg-[#141418]/95 backdrop-blur-xl border border-[#D4AF37]/40 shadow-2xl p-4 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold text-white">
                {t.retention.pushPromptTitle}
              </p>
              <button
                type="button"
                onClick={dismissPushPrompt}
                aria-label="Dismiss notification prompt"
                className="text-[#A1A1AA] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-[#D4D4D8] leading-relaxed">
              {t.retention.pushPromptDesc}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void requestPushPermission();
                }}
                className="px-3.5 py-1.5 rounded-full cd-accent-bg text-white text-[11px] font-bold"
              >
                {t.retention.pushEnableBtn}
              </button>
              <button
                type="button"
                onClick={dismissPushPrompt}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-medium text-[#D4D4D8]"
              >
                {t.retention.pushLaterBtn}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Lazy-Loaded Heavy Modals & Video Player */}
      <Suspense fallback={null}>
        {providerHubOpen && (
          <ProviderHubModal
            open={providerHubOpen}
            selectedProvider={selectedProvider}
            counts={providerCounts}
            onSelectProvider={(prov) => {
              setSelectedProvider(prov);
              if (activeDramaRoute) closeDramaRoute();
              if (activeSeoLanding) closeSeoLandingRoute();
              if (
                activeTab === 'movies' ||
                activeTab === 'mylist' ||
                activeTab === 'dashboard'
              ) {
                handleNavigateTab('home');
              }
            }}
            onClose={() => setProviderHubOpen(false)}
          />
        )}

        {searchModalOpen && (
          <SearchModal
            open={searchModalOpen}
            onClose={handleCloseSearch}
            onSelectDrama={openDramaRoute}
            onQuickPlay={(d) => handlePlayEpisode(d, 1)}
            trendingDramas={trendingSearchPool}
          />
        )}

        {playerState &&
          (playerState.drama.provider === 'LK21' ||
          playerState.drama.mediaType === 'movie' ? (
            <MovieVideoPlayer
              drama={playerState.drama}
              episodeNumber={playerState.episode ?? 1}
              initialTime={playerState.initialTime ?? 0}
              episodes={playerState.episodes ?? []}
              relatedDramas={
                moviesPool.length > 0 ? moviesPool : allLoadedDramas
              }
              onSwitchDrama={(nextDrama, ep = 1) => {
                handlePlayEpisode(nextDrama, ep, []);
              }}
              onClose={() => {
                const activeDrama = activeDramaRoute?.drama ?? playerState?.drama;
                setPlayerState(null);
                if (
                  window.location.search.includes('drama=') ||
                  window.location.search.includes('ep=')
                ) {
                  window.history.replaceState(
                    window.history.state,
                    '',
                    window.location.pathname || '/'
                  );
                }
                if (activeDramaRoute?.drama) {
                  syncDramaDocumentSeo(
                    activeDramaRoute.drama,
                    activeDramaRoute.episodes,
                    language
                  );
                } else if (
                  activeDrama &&
                  (window.location.pathname.startsWith('/drama/') ||
                    window.location.pathname.startsWith('/movie/'))
                ) {
                  syncDramaDocumentSeo(
                    activeDrama,
                    playerState?.episodes ?? [],
                    language
                  );
                } else {
                  syncSectionDocumentSeo(activeTab);
                }
              }}
              onChangeEpisode={(nextEp) => {
                setPlayerState((prev) => {
                  if (!prev) return null;
                  recordWatchProgress(prev.drama, nextEp, 0, 0, true);
                  return { ...prev, episode: nextEp, initialTime: 0 };
                });
              }}
              onEpisodesLoaded={(eps) => {
                setPlayerState((prev) =>
                  prev ? { ...prev, episodes: eps } : null
                );
              }}
              onProgressUpdate={(ep, currentTime, duration, immediate) => {
                if (playerState?.drama) {
                  recordWatchProgress(
                    playerState.drama,
                    ep,
                    currentTime,
                    duration,
                    immediate
                  );
                }
              }}
            />
          ) : (
            <CinemaVideoPlayer
              drama={playerState.drama}
              episodeNumber={playerState.episode ?? 1}
              initialTime={playerState.initialTime ?? 0}
              episodes={playerState.episodes ?? []}
              relatedDramas={allLoadedDramas}
              onSwitchDrama={(nextDrama, ep = 1) => {
                handlePlayEpisode(nextDrama, ep, []);
              }}
              onClose={() => {
                const activeDrama = activeDramaRoute?.drama ?? playerState?.drama;
                setPlayerState(null);
                if (
                  window.location.search.includes('drama=') ||
                  window.location.search.includes('ep=')
                ) {
                  window.history.replaceState(
                    window.history.state,
                    '',
                    window.location.pathname || '/'
                  );
                }
                if (activeDramaRoute?.drama) {
                  syncDramaDocumentSeo(
                    activeDramaRoute.drama,
                    activeDramaRoute.episodes,
                    language
                  );
                } else if (
                  activeDrama &&
                  (window.location.pathname.startsWith('/drama/') ||
                    window.location.pathname.startsWith('/movie/'))
                ) {
                  syncDramaDocumentSeo(
                    activeDrama,
                    playerState?.episodes ?? [],
                    language
                  );
                } else {
                  syncSectionDocumentSeo(activeTab);
                }
              }}
              onChangeEpisode={(nextEp) => {
                setPlayerState((prev) => {
                  if (!prev) return null;
                  recordWatchProgress(prev.drama, nextEp, 0, 0, true);
                  return { ...prev, episode: nextEp, initialTime: 0 };
                });
              }}
              onEpisodesLoaded={(eps) => {
                setPlayerState((prev) =>
                  prev ? { ...prev, episodes: eps } : null
                );
              }}
              onProgressUpdate={(ep, currentTime, duration, immediate) => {
                if (playerState?.drama) {
                  recordWatchProgress(
                    playerState.drama,
                    ep,
                    currentTime,
                    duration,
                    immediate
                  );
                }
              }}
            />
          ))}

        {authModalOpen && <AuthProfileModal />}
        <HelpCenterModal />
      </Suspense>

      <OfflineIndicator />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
