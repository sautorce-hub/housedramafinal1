import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  signInWithRealGoogle,
  signOutRealGoogle,
} from '../config/auth';
import { setActiveAppLanguage } from '../services/dramaProviders';
import { TRANSLATIONS, type Translations } from '../i18n/translations';
import type {
  AccentThemeId,
  DailyStreakState,
  DramaItem,
  EpisodeComment,
  GoogleUser,
  LanguageCode,
  ProviderName,
  ReactionKey,
  SubtitleStyleConfig,
  ToastItem,
  WatchHistoryEntry,
  WatchlistFolder,
  WatchStatusFilter,
} from '../types/drama';

const MY_LIST_STORAGE_KEY = 'house_drama_mylist_v2';
const LIKED_DRAMAS_STORAGE_KEY = 'house_drama_liked_v1';
const COMPLETED_DRAMAS_STORAGE_KEY = 'house_drama_completed_v1';
const HISTORY_STORAGE_KEY = 'house_drama_history_v2';
const WATCHED_EPS_STORAGE_KEY = 'house_drama_watched_eps_v1';
const RECENT_SEARCH_STORAGE_KEY = 'house_drama_recent_searches_v1';
const LANG_STORAGE_KEY = 'house_drama_lang_v3';
const THEME_STORAGE_KEY = 'house_drama_theme_v1';
const SUBTITLE_STORAGE_KEY = 'house_drama_subtitle_style_v1';
const FOLDERS_STORAGE_KEY = 'house_drama_folders_v1';
const ITEM_FOLDER_STORAGE_KEY = 'house_drama_item_folders_v1';
const RATINGS_STORAGE_KEY = 'house_drama_ratings_v1';
const REACTIONS_STORAGE_KEY = 'house_drama_reactions_v1';
const COMMENTS_STORAGE_KEY = 'house_drama_comments_v1';
const UNLOCKED_VIP_STORAGE_KEY = 'house_drama_unlocked_eps_v1';
const WATCHED_COUNT_STORAGE_KEY = 'house_drama_watched_count_v1';
const PUSH_DISMISSED_STORAGE_KEY = 'house_drama_push_dismissed_v1';

export const DEFAULT_WATCHLIST_FOLDERS: WatchlistFolder[] = [
  { id: 'all', name: 'All Saved', isDefault: true },
  { id: 'ceo', name: 'CEO & Romance', isDefault: true },
  { id: 'wuxia', name: 'Historical / Wuxia', isDefault: true },
  { id: 'later', name: 'Watch Later', isDefault: true },
];

const DEFAULT_SUBTITLE_STYLE: SubtitleStyleConfig = {
  fontSize: 'medium',
  textColor: 'white',
  bgOpacity: 50,
};

const EMPTY_STREAK: DailyStreakState = {
  count: 0,
  lastVisitDate: '',
  isVipCoffeeLover: false,
};

const AVATAR_COLORS = ['#EF4444', '#D4AF37', '#10B981', '#E11D48', '#3B82F6'];

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'HD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
}

function mapFirebaseUser(fbUser: FirebaseUser): GoogleUser {
  const displayName =
    fbUser.displayName?.trim() ||
    fbUser.email?.split('@')[0] ||
    'House Viewer';
  const email = fbUser.email?.trim() || '';
  const color =
    AVATAR_COLORS[
      Math.abs(
        (email || fbUser.uid)
          .split('')
          .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      ) % AVATAR_COLORS.length
    ];
  return {
    uid: fbUser.uid,
    displayName,
    email,
    photoURL: fbUser.photoURL || null,
    avatarInitials: buildInitials(displayName),
    avatarColor: color,
    signedInAt: Date.now(),
  };
}

function computeNextStreak(prev: DailyStreakState): DailyStreakState {
  const today = getLocalDateKey();
  const yesterday = getYesterdayDateKey();
  if (prev.lastVisitDate === today && prev.count >= 1) {
    return {
      count: prev.count,
      lastVisitDate: today,
      isVipCoffeeLover: prev.count >= 3,
    };
  }
  const nextCount =
    prev.lastVisitDate === yesterday ? Math.max(2, prev.count + 1) : 1;
  return {
    count: nextCount,
    lastVisitDate: today,
    isVipCoffeeLover: nextCount >= 3,
  };
}

interface DramaContextValue {
  language: LanguageCode;
  t: Translations;
  setLanguageState: (lang: LanguageCode) => void;
  user: GoogleUser | null;
  authLoading: boolean;
  authError: string | null;
  authModalOpen: boolean;
  authPromptReason: string | null;
  openAuthModal: (reason?: string, onSuccess?: (u: GoogleUser) => void) => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<GoogleUser | null>;
  signOut: () => Promise<void>;
  requireAuth: (reason: string, action: (u: GoogleUser) => void) => Promise<void>;
  visitorId: string;
  updateUserProfile: (patch: {
    displayName?: string;
    bio?: string;
    preferredLanguage?: LanguageCode;
    accentTheme?: AccentThemeId;
    highContrast?: boolean;
    subtitleStyle?: SubtitleStyleConfig;
  }) => Promise<boolean>;
  loadUserCommentHistory: () => Promise<
    Array<
      EpisodeComment & {
        dramaId: string;
        provider: ProviderName;
        episodeNumber: number;
      }
    >
  >;
  streak: DailyStreakState;
  helpModalOpen: boolean;
  setHelpModalOpen: (open: boolean) => void;
  accentTheme: AccentThemeId;
  setAccentTheme: (theme: AccentThemeId) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  subtitleStyle: SubtitleStyleConfig;
  setSubtitleStyle: (style: SubtitleStyleConfig) => void;
  myListItems: DramaItem[];
  myListIds: string[];
  toggleMyList: (drama: DramaItem, folderId?: string) => void;
  isDramaSaved: (bookId: string, provider?: ProviderName) => boolean;
  likedDramaIds: string[];
  isDramaLiked: (bookId: string, provider?: ProviderName) => boolean;
  toggleLikeDrama: (drama: DramaItem) => void;
  completedDramaIds: string[];
  toggleDramaCompleted: (bookId: string, provider: ProviderName) => void;
  getDramaWatchStatus: (
    drama: DramaItem
  ) => Exclude<WatchStatusFilter, 'all'>;
  watchlistFolders: WatchlistFolder[];
  itemFolderMap: Record<string, string>;
  createWatchlistFolder: (name: string) => WatchlistFolder | null;
  deleteWatchlistFolder: (folderId: string) => void;
  assignDramaToFolder: (
    bookId: string,
    provider: ProviderName,
    folderId: string
  ) => void;
  getDramaFolderId: (bookId: string, provider: ProviderName) => string;
  watchHistory: WatchHistoryEntry[];
  recordWatchProgress: (
    drama: DramaItem,
    episode: number,
    currentTime?: number,
    duration?: number,
    immediate?: boolean
  ) => void;
  removeHistoryItem: (bookId: string, provider?: ProviderName) => void;
  getResumePoint: (
    bookId: string,
    provider?: ProviderName
  ) => { episode: number; currentTime: number; progress: number } | null;
  getWatchedEpisodes: (bookId: string, provider: ProviderName) => number[];
  getDramaRating: (bookId: string, provider: ProviderName) => number;
  setDramaRating: (
    bookId: string,
    provider: ProviderName,
    stars: number
  ) => void;
  getEpisodeReactions: (
    bookId: string,
    provider: ProviderName,
    episode: number
  ) => Record<ReactionKey, number>;
  addEpisodeReaction: (
    bookId: string,
    provider: ProviderName,
    episode: number,
    key: ReactionKey
  ) => void;
  syncEpisodeComments: (
    bookId: string,
    provider: ProviderName,
    episode: number
  ) => Promise<void>;
  getEpisodeComments: (
    bookId: string,
    provider: ProviderName,
    episode: number
  ) => EpisodeComment[];
  addEpisodeComment: (
    bookId: string,
    provider: ProviderName,
    episode: number,
    text: string,
    videoTimestampSec?: number
  ) => Promise<boolean>;
  isEpisodeUnlocked: (
    bookId: string,
    provider: ProviderName,
    episode: number
  ) => boolean;
  unlockVipEpisode: (
    bookId: string,
    provider: ProviderName,
    episode: number
  ) => void;
  recentSearches: string[];
  addRecentSearch: (keyword: string) => void;
  removeRecentSearch: (keyword: string) => void;
  clearRecentSearches: () => void;
  episodesWatchedCount: number;
  showPushPrompt: boolean;
  dismissPushPrompt: () => void;
  requestPushPermission: () => Promise<void>;
  toasts: ToastItem[];
  pushToast: (message: string, tone?: ToastItem['tone']) => void;
  dismissToast: (id: string) => void;
  getDramaLiveStats: (
    bookId: string,
    provider?: ProviderName
  ) => {
    dailyViews: number;
    totalViews: number;
    trendBadge?: 'HOT' | 'TRENDING';
  } | null;
}

const DramaContext = createContext<DramaContextValue | null>(null);

function makeItemKey(bookId: string, provider: ProviderName = 'DramaBox') {
  return `${provider}:${bookId}`;
}

function makeEpisodeKey(
  bookId: string,
  provider: ProviderName,
  episode: number
) {
  const safeId = bookId.replace(/[^a-zA-Z0-9_\-:]/g, '_');
  return `${provider}:${safeId}:ep${episode}`.slice(0, 128);
}

function readJsonStorage<T>(
  key: string,
  fallback: T,
  legacyKey?: string
): T {
  try {
    const raw =
      localStorage.getItem(key) ||
      (legacyKey ? localStorage.getItem(legacyKey) : null);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // Ignore storage read errors
  }
  return fallback;
}

function streakStorageKey(uid: string): string {
  return `house_drama_streak_v1_${uid}`;
}

function legacyStreakStorageKey(uid: string): string {
  return `coffee_drama_streak_v1_${uid}`;
}

function getPersistentVisitorId(): string {
  try {
    const existing = localStorage.getItem('hd_visitor_id');
    if (existing && existing.trim()) return existing.trim();
    const next = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('hd_visitor_id', next);
    return next;
  } catch {
    return 'v-anon';
  }
}

export const DramaProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visitorId] = useState<string>(() => getPersistentVisitorId());
  const [language, setLanguageRaw] = useState<LanguageCode>(() => {
    try {
      const saved = (localStorage.getItem(LANG_STORAGE_KEY) ||
        localStorage.getItem('coffee_drama_lang_v3')) as LanguageCode | null;
      if (saved === 'en' || saved === 'id' || saved === 'cn' || saved === 'vi') {
        setActiveAppLanguage(saved);
        return saved;
      }
    } catch {
      // Ignore
    }
    setActiveAppLanguage('en');
    return 'en';
  });

  const [user, setUser] = useState<GoogleUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<string | null>(null);
  const pendingAuthCallbackRef = useRef<((u: GoogleUser) => void) | null>(
    null
  );
  const [streak, setStreak] = useState<DailyStreakState>(EMPTY_STREAK);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const [accentTheme, setAccentThemeState] = useState<AccentThemeId>(() => {
    const saved = readJsonStorage<{ accent?: AccentThemeId; contrast?: boolean }>(
      THEME_STORAGE_KEY,
      {},
      'coffee_drama_theme_v1'
    );
    return saved.accent &&
      ['crimson', 'gold', 'rose', 'emerald'].includes(saved.accent)
      ? saved.accent
      : 'crimson';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    const saved = readJsonStorage<{ accent?: AccentThemeId; contrast?: boolean }>(
      THEME_STORAGE_KEY,
      {},
      'coffee_drama_theme_v1'
    );
    return Boolean(saved.contrast);
  });

  const [subtitleStyle, setSubtitleStyleState] = useState<SubtitleStyleConfig>(
    () =>
      readJsonStorage(
        SUBTITLE_STORAGE_KEY,
        DEFAULT_SUBTITLE_STYLE,
        'coffee_drama_subtitle_style_v1'
      )
  );

  const [myListItems, setMyListItems] = useState<DramaItem[]>(() => {
    const parsed = readJsonStorage<DramaItem[]>(
      MY_LIST_STORAGE_KEY,
      [],
      'coffee_drama_mylist_v2'
    );
    return Array.isArray(parsed)
      ? parsed.map((d) => ({ ...d, provider: d.provider || 'DramaBox' }))
      : [];
  });

  const [likedDramaIds, setLikedDramaIds] = useState<string[]>(() =>
    readJsonStorage<string[]>(
      LIKED_DRAMAS_STORAGE_KEY,
      [],
      'coffee_drama_liked_v1'
    )
  );

  const [completedDramaIds, setCompletedDramaIds] = useState<string[]>(() =>
    readJsonStorage<string[]>(
      COMPLETED_DRAMAS_STORAGE_KEY,
      [],
      'coffee_drama_completed_v1'
    )
  );

  const [watchlistFolders, setWatchlistFolders] = useState<WatchlistFolder[]>(
    () => {
      const saved = readJsonStorage<WatchlistFolder[]>(
        FOLDERS_STORAGE_KEY,
        DEFAULT_WATCHLIST_FOLDERS,
        'coffee_drama_folders_v1'
      );
      return Array.isArray(saved) && saved.length > 0
        ? saved
        : DEFAULT_WATCHLIST_FOLDERS;
    }
  );

  const [itemFolderMap, setItemFolderMap] = useState<Record<string, string>>(
    () =>
      readJsonStorage(ITEM_FOLDER_STORAGE_KEY, {}, 'coffee_drama_item_folders_v1')
  );

  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>(() => {
    try {
      const raw =
        localStorage.getItem(HISTORY_STORAGE_KEY) ||
        localStorage.getItem('coffee_drama_history_v2') ||
        localStorage.getItem('coffee_drama_history_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((e) => e && e.drama && e.drama.bookId)
            .map((entry) => {
              const prov: ProviderName =
                entry.provider || entry.drama?.provider || 'DramaBox';
              return {
                bookId: entry.bookId || entry.drama.bookId,
                provider: prov,
                title: entry.title || entry.drama.title,
                cover: entry.cover || entry.drama.cover || '',
                drama: { ...entry.drama, provider: prov },
                episode: typeof entry.episode === 'number' ? entry.episode : 1,
                currentTime:
                  typeof entry.currentTime === 'number' ? entry.currentTime : 0,
                duration:
                  typeof entry.duration === 'number' ? entry.duration : 0,
                progress:
                  typeof entry.progress === 'number' ? entry.progress : 15,
                updatedAt:
                  typeof entry.updatedAt === 'number'
                    ? entry.updatedAt
                    : Date.now(),
              };
            });
        }
      }
    } catch {
      // Ignore
    }
    return [];
  });

  const [watchedMap, setWatchedMap] = useState<Record<string, number[]>>(() =>
    readJsonStorage(WATCHED_EPS_STORAGE_KEY, {}, 'coffee_drama_watched_eps_v1')
  );

  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>(() =>
    readJsonStorage(RATINGS_STORAGE_KEY, {}, 'coffee_drama_ratings_v1')
  );

  const [reactionsMap, setReactionsMap] = useState<
    Record<string, Record<ReactionKey, number>>
  >(() =>
    readJsonStorage(REACTIONS_STORAGE_KEY, {}, 'coffee_drama_reactions_v1')
  );

  const [commentsMap, setCommentsMap] = useState<
    Record<string, EpisodeComment[]>
  >(() =>
    readJsonStorage(COMMENTS_STORAGE_KEY, {}, 'coffee_drama_comments_v1')
  );

  const [unlockedVipList, setUnlockedVipList] = useState<string[]>(() =>
    readJsonStorage(
      UNLOCKED_VIP_STORAGE_KEY,
      [],
      'coffee_drama_unlocked_eps_v1'
    )
  );

  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readJsonStorage(
      RECENT_SEARCH_STORAGE_KEY,
      [],
      'coffee_drama_recent_searches_v1'
    )
  );

  const [episodesWatchedCount, setEpisodesWatchedCount] = useState<number>(
    () =>
      readJsonStorage<number>(
        WATCHED_COUNT_STORAGE_KEY,
        0,
        'coffee_drama_watched_count_v1'
      )
  );
  const [pushPromptDismissed, setPushPromptDismissed] = useState<boolean>(() =>
    readJsonStorage<boolean>(
      PUSH_DISMISSED_STORAGE_KEY,
      false,
      'coffee_drama_push_dismissed_v1'
    )
  );
  const [notificationPermission, setNotificationPermission] = useState<string>(
    () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission;
      }
      return 'denied';
    }
  );

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [liveBadgeMap, setLiveBadgeMap] = useState<
    Record<
      string,
      {
        dailyViews: number;
        totalViews: number;
        trendBadge?: 'HOT' | 'TRENDING';
      }
    >
  >({});
  const countedEpisodesSessionRef = useRef<Set<string>>(new Set());
  const lastHistoryPostRef = useRef<Record<string, { at: number; ep: number }>>({});

  const refreshLiveBadges = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/badges');
      if (!res.ok) return;
      const data = (await res.json()) as {
        ok?: boolean;
        stats?: Record<
          string,
          {
            dailyViews: number;
            totalViews: number;
            trendBadge?: 'HOT' | 'TRENDING';
          }
        >;
      };
      if (data.ok && data.stats) {
        setLiveBadgeMap(data.stats);
      }
    } catch {
      // Keep existing map on transient error
    }
  }, []);

  useEffect(() => {
    void refreshLiveBadges();
    const timer = window.setInterval(() => {
      void refreshLiveBadges();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [refreshLiveBadges]);

  const pushToast = useCallback(
    (message: string, tone: ToastItem['tone'] = 'gold') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3400);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync user's daily streak & profile to PostgreSQL (/api/users/sync) with localStorage fallback
  const syncUserStreak = useCallback(
    async (mappedUser: GoogleUser) => {
      const localKey = streakStorageKey(mappedUser.uid);
      const baseStreak = readJsonStorage<DailyStreakState>(
        localKey,
        EMPTY_STREAK,
        legacyStreakStorageKey(mappedUser.uid)
      );

      let resolvedStreak = computeNextStreak(baseStreak);

      try {
        const res = await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: mappedUser.uid,
            email: mappedUser.email,
            displayName: mappedUser.displayName,
            photoURL: mappedUser.photoURL,
            avatarInitials: mappedUser.avatarInitials,
            avatarColor: mappedUser.avatarColor,
            visitDate: getLocalDateKey(),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            ok?: boolean;
            user?: {
              displayName?: string;
              bio?: string;
              preferredLanguage?: LanguageCode;
              preferences?: {
                accentTheme?: AccentThemeId;
                highContrast?: boolean;
                subtitleStyle?: SubtitleStyleConfig;
              };
              streakCount?: number;
              lastVisitDate?: string;
              isVip?: boolean;
            } | null;
          };
          if (data.user) {
            if (typeof data.user.streakCount === 'number') {
              const count = Math.max(1, data.user.streakCount);
              resolvedStreak = {
                count,
                lastVisitDate: data.user.lastVisitDate || getLocalDateKey(),
                isVipCoffeeLover: Boolean(data.user.isVip) || count >= 3,
              };
            }
            if (data.user.displayName || data.user.bio || data.user.preferredLanguage) {
              setUser((prev) =>
                prev && prev.uid === mappedUser.uid
                  ? {
                      ...prev,
                      displayName: data.user?.displayName || prev.displayName,
                      bio: data.user?.bio ?? prev.bio,
                      preferredLanguage: data.user?.preferredLanguage || prev.preferredLanguage,
                    }
                  : prev
              );
            }
            const prefs = data.user.preferences;
            if (prefs) {
              if (
                prefs.accentTheme &&
                ['crimson', 'gold', 'rose', 'emerald'].includes(prefs.accentTheme)
              ) {
                setAccentThemeState(prefs.accentTheme);
              }
              if (typeof prefs.highContrast === 'boolean') {
                setHighContrastState(prefs.highContrast);
              }
              if (prefs.subtitleStyle && typeof prefs.subtitleStyle === 'object') {
                setSubtitleStyleState(prefs.subtitleStyle);
              }
            }
          }
        }
      } catch {
        // Resilient fallback to computed local streak
      }

      setStreak(resolvedStreak);
      try {
        localStorage.setItem(localKey, JSON.stringify(resolvedStreak));
      } catch {
        // Ignore
      }

      return resolvedStreak;
    },
    []
  );

  // Hydrate Watch History from PostgreSQL (for both signed-in users and guest visitorId)
  const hydrateWatchHistoryFromPostgres = useCallback(async (actorId: string) => {
    if (!actorId) return;
    try {
      const res = await fetch(
        `/api/watch-history?userId=${encodeURIComponent(actorId)}&limit=24`
      );
      if (!res.ok) return;
      const json = (await res.json()) as {
        items?: Array<{
          bookId: string;
          provider: ProviderName;
          episode: number;
          currentTime: number;
          duration: number;
          progress: number;
          drama?: Partial<DramaItem>;
          updatedAt: number;
        }>;
      };
      if (!Array.isArray(json.items) || json.items.length === 0) return;
      const remoteEntries: WatchHistoryEntry[] = json.items
        .filter((e) => e && e.bookId)
        .map((e) => {
          const prov = (e.provider || 'DramaBox') as ProviderName;
          const d = e.drama || {};
          const dramaObj: DramaItem = {
            bookId: e.bookId,
            title: d.title || 'Drama Series',
            slug: d.slug,
            cover: d.cover || '',
            description: d.description || '',
            chapterCount: Number(d.chapterCount) || 1,
            tags: Array.isArray(d.tags) ? d.tags : [],
            playCount: d.playCount,
            corner: d.corner,
            protagonist: d.protagonist,
            author: d.author,
            isVip: Boolean(d.isVip),
            provider: prov,
            status: d.status,
            rating: d.rating,
          };
          return {
            bookId: e.bookId,
            provider: prov,
            title: dramaObj.title,
            cover: dramaObj.cover,
            drama: dramaObj,
            episode: Number(e.episode) || 1,
            currentTime: Number(e.currentTime) || 0,
            duration: Number(e.duration) || 0,
            progress: Number(e.progress) || 10,
            updatedAt: Number(e.updatedAt) || Date.now(),
          };
        });

      setWatchHistory((prev) => {
        const merged = new Map<string, WatchHistoryEntry>();
        for (const item of [...remoteEntries, ...prev]) {
          const k = makeItemKey(item.bookId, item.provider);
          const existing = merged.get(k);
          if (!existing || item.updatedAt > existing.updatedAt) {
            merged.set(k, item);
          }
        }
        return Array.from(merged.values())
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 24);
      });
    } catch {
      // Non-blocking fallback to localStorage watch history
    }
  }, []);

  // Hydrate authenticated user's Favorites, Likes & Watch History from PostgreSQL
  const hydrateUserLibraryFromPostgres = useCallback(
    async (uid: string) => {
      try {
        const [favRes, likeRes] = await Promise.allSettled([
          fetch(`/api/favorites?userId=${encodeURIComponent(uid)}&limit=100`),
          fetch(`/api/likes?userId=${encodeURIComponent(uid)}&limit=100`),
          hydrateWatchHistoryFromPostgres(uid),
        ]);

        if (favRes.status === 'fulfilled' && favRes.value.ok) {
          const favJson = (await favRes.value.json()) as {
            items?: Array<{
              dramaId: string;
              provider: ProviderName;
              folderId: string;
              drama?: Partial<DramaItem>;
            }>;
          };
          if (Array.isArray(favJson.items) && favJson.items.length > 0) {
            const remoteDramas: DramaItem[] = [];
            const remoteFolders: Record<string, string> = {};
            for (const entry of favJson.items) {
              if (!entry.dramaId) continue;
              const prov = (entry.provider || 'DramaBox') as ProviderName;
              const d = entry.drama ?? {};
              const item: DramaItem = {
                bookId: entry.dramaId,
                title: d.title || 'Saved Drama',
                slug: d.slug,
                cover: d.cover || '',
                description: d.description || '',
                chapterCount: Number(d.chapterCount) || 1,
                tags: Array.isArray(d.tags) ? d.tags : [],
                playCount: d.playCount,
                corner: d.corner,
                protagonist: d.protagonist,
                author: d.author,
                isVip: Boolean(d.isVip),
                provider: prov,
              };
              remoteDramas.push(item);
              if (entry.folderId && entry.folderId !== 'all') {
                remoteFolders[makeItemKey(entry.dramaId, prov)] = entry.folderId;
              }
            }
            setMyListItems((prev) => {
              const seen = new Set(remoteDramas.map((d) => makeItemKey(d.bookId, d.provider)));
              const localOnly = prev.filter((d) => !seen.has(makeItemKey(d.bookId, d.provider)));
              return [...remoteDramas, ...localOnly];
            });
            if (Object.keys(remoteFolders).length > 0) {
              setItemFolderMap((prev) => ({ ...prev, ...remoteFolders }));
            }
          }
        }

        if (likeRes.status === 'fulfilled' && likeRes.value.ok) {
          const likeJson = (await likeRes.value.json()) as {
            items?: Array<{ dramaId: string; provider: ProviderName }>;
          };
          if (Array.isArray(likeJson.items) && likeJson.items.length > 0) {
            const remoteKeys = likeJson.items.map((l) =>
              makeItemKey(l.dramaId, (l.provider || 'DramaBox') as ProviderName)
            );
            setLikedDramaIds((prev) => Array.from(new Set([...remoteKeys, ...prev])));
          }
        }
      } catch {
        // Keep local library gracefully
      }
    },
    [hydrateWatchHistoryFromPostgres]
  );

  // Hydrate guest watch history once on mount if not logged in
  useEffect(() => {
    void hydrateWatchHistoryFromPostgres(visitorId);
  }, [visitorId, hydrateWatchHistoryFromPostgres]);

  // Real Firebase Auth State Listener synced to PostgreSQL
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const mapped = mapFirebaseUser(fbUser);
        setUser(mapped);
        setAuthError(null);
        void syncUserStreak(mapped);
        void hydrateUserLibraryFromPostgres(mapped.uid);
      } else {
        setUser(null);
        setStreak(EMPTY_STREAK);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [syncUserStreak, hydrateUserLibraryFromPostgres]);

  useEffect(() => {
    const root = document.documentElement;
    if (accentTheme === 'crimson') {
      root.removeAttribute('data-accent');
    } else {
      root.setAttribute('data-accent', accentTheme);
    }
    if (highContrast) {
      root.setAttribute('data-contrast', 'high');
    } else {
      root.removeAttribute('data-contrast');
    }
    try {
      localStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify({ accent: accentTheme, contrast: highContrast })
      );
    } catch {
      // Ignore
    }
  }, [accentTheme, highContrast]);

  useEffect(() => {
    try {
      localStorage.setItem(SUBTITLE_STORAGE_KEY, JSON.stringify(subtitleStyle));
    } catch {
      // Ignore
    }
  }, [subtitleStyle]);

  useEffect(() => {
    try {
      localStorage.setItem(MY_LIST_STORAGE_KEY, JSON.stringify(myListItems));
    } catch {
      // Ignore
    }
  }, [myListItems]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LIKED_DRAMAS_STORAGE_KEY,
        JSON.stringify(likedDramaIds)
      );
    } catch {
      // Ignore
    }
  }, [likedDramaIds]);

  useEffect(() => {
    try {
      localStorage.setItem(
        COMPLETED_DRAMAS_STORAGE_KEY,
        JSON.stringify(completedDramaIds)
      );
    } catch {
      // Ignore
    }
  }, [completedDramaIds]);

  useEffect(() => {
    try {
      localStorage.setItem(
        FOLDERS_STORAGE_KEY,
        JSON.stringify(watchlistFolders)
      );
    } catch {
      // Ignore
    }
  }, [watchlistFolders]);

  useEffect(() => {
    try {
      localStorage.setItem(
        ITEM_FOLDER_STORAGE_KEY,
        JSON.stringify(itemFolderMap)
      );
    } catch {
      // Ignore
    }
  }, [itemFolderMap]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(watchHistory));
    } catch {
      // Ignore
    }
  }, [watchHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(WATCHED_EPS_STORAGE_KEY, JSON.stringify(watchedMap));
    } catch {
      // Ignore
    }
  }, [watchedMap]);

  useEffect(() => {
    try {
      localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratingsMap));
    } catch {
      // Ignore
    }
  }, [ratingsMap]);

  useEffect(() => {
    try {
      localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(reactionsMap));
    } catch {
      // Ignore
    }
  }, [reactionsMap]);

  useEffect(() => {
    try {
      localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentsMap));
    } catch {
      // Ignore
    }
  }, [commentsMap]);

  useEffect(() => {
    try {
      localStorage.setItem(
        UNLOCKED_VIP_STORAGE_KEY,
        JSON.stringify(unlockedVipList)
      );
    } catch {
      // Ignore
    }
  }, [unlockedVipList]);

  useEffect(() => {
    try {
      localStorage.setItem(
        RECENT_SEARCH_STORAGE_KEY,
        JSON.stringify(recentSearches)
      );
    } catch {
      // Ignore
    }
  }, [recentSearches]);

  useEffect(() => {
    try {
      localStorage.setItem(
        WATCHED_COUNT_STORAGE_KEY,
        JSON.stringify(episodesWatchedCount)
      );
    } catch {
      // Ignore
    }
  }, [episodesWatchedCount]);

  useEffect(() => {
    try {
      localStorage.setItem(
        PUSH_DISMISSED_STORAGE_KEY,
        JSON.stringify(pushPromptDismissed)
      );
    } catch {
      // Ignore
    }
  }, [pushPromptDismissed]);

  const setLanguageState = useCallback((lang: LanguageCode) => {
    setActiveAppLanguage(lang);
    setLanguageRaw(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore
    }
  }, []);

  const openAuthModal = useCallback(
    (reason?: string, onSuccess?: (u: GoogleUser) => void) => {
      setAuthError(null);
      setAuthPromptReason(reason ?? null);
      pendingAuthCallbackRef.current = onSuccess ?? null;
      setAuthModalOpen(true);
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setAuthPromptReason(null);
    setAuthError(null);
    pendingAuthCallbackRef.current = null;
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<GoogleUser | null> => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const fbUser = await signInWithRealGoogle();
      const mapped = mapFirebaseUser(fbUser);
      setUser(mapped);
      setAuthModalOpen(false);
      setAuthPromptReason(null);
      await syncUserStreak(mapped);
      void hydrateUserLibraryFromPostgres(mapped.uid);
      pushToast(`Signed in as ${mapped.displayName}`, 'gold');
      const cb = pendingAuthCallbackRef.current;
      pendingAuthCallbackRef.current = null;
      if (cb) cb(mapped);
      return mapped;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : TRANSLATIONS[language].auth.authErrorPopupBlocked;
      setAuthError(msg);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [language, pushToast, syncUserStreak, hydrateUserLibraryFromPostgres]);

  const signOut = useCallback(async () => {
    try {
      await signOutRealGoogle();
    } catch {
      // Ignore
    }
    setUser(null);
    setStreak(EMPTY_STREAK);
    setAuthModalOpen(false);
    pushToast('Signed out', 'neutral');
  }, [pushToast]);

  const requireAuth = useCallback(
    async (reason: string, action: (u: GoogleUser) => void) => {
      if (user) {
        action(user);
        return;
      }
      // Immediately trigger real Google Sign-In popup; fall back cleanly to modal if blocked
      setAuthError(null);
      setAuthLoading(true);
      try {
        const fbUser = await signInWithRealGoogle();
        const mapped = mapFirebaseUser(fbUser);
        setUser(mapped);
        await syncUserStreak(mapped);
        void hydrateUserLibraryFromPostgres(mapped.uid);
        pushToast(`Signed in as ${mapped.displayName}`, 'gold');
        action(mapped);
      } catch {
        setAuthLoading(false);
        openAuthModal(reason, (signedInUser) => action(signedInUser));
        setAuthError(TRANSLATIONS[language].auth.authErrorPopupBlocked);
      } finally {
        setAuthLoading(false);
      }
    },
    [user, language, openAuthModal, pushToast, syncUserStreak, hydrateUserLibraryFromPostgres]
  );

  const setAccentTheme = useCallback((theme: AccentThemeId) => {
    setAccentThemeState(theme);
  }, []);

  const setHighContrast = useCallback((enabled: boolean) => {
    setHighContrastState(enabled);
  }, []);

  const setSubtitleStyle = useCallback((style: SubtitleStyleConfig) => {
    setSubtitleStyleState(style);
  }, []);

  const updateUserProfile = useCallback(
    async (patch: {
      displayName?: string;
      bio?: string;
      preferredLanguage?: LanguageCode;
      accentTheme?: AccentThemeId;
      highContrast?: boolean;
      subtitleStyle?: SubtitleStyleConfig;
    }): Promise<boolean> => {
      if (patch.accentTheme) setAccentThemeState(patch.accentTheme);
      if (typeof patch.highContrast === 'boolean') setHighContrastState(patch.highContrast);
      if (patch.subtitleStyle) setSubtitleStyleState(patch.subtitleStyle);
      if (patch.preferredLanguage) setLanguageState(patch.preferredLanguage);

      if (!user) {
        pushToast(TRANSLATIONS[language].dashboard.savedSuccess, 'gold');
        return true;
      }

      try {
        const res = await fetch('/api/users/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            displayName: patch.displayName,
            bio: patch.bio,
            preferredLanguage: patch.preferredLanguage || language,
            preferences: {
              accentTheme: patch.accentTheme || accentTheme,
              highContrast:
                typeof patch.highContrast === 'boolean'
                  ? patch.highContrast
                  : highContrast,
              subtitleStyle: patch.subtitleStyle || subtitleStyle,
            },
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            user?: {
              displayName?: string;
              bio?: string;
              preferredLanguage?: LanguageCode;
            } | null;
          };
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  displayName:
                    data.user?.displayName ||
                    patch.displayName?.trim() ||
                    prev.displayName,
                  bio:
                    data.user?.bio ??
                    (typeof patch.bio === 'string' ? patch.bio : prev.bio),
                  preferredLanguage:
                    data.user?.preferredLanguage ||
                    patch.preferredLanguage ||
                    prev.preferredLanguage,
                }
              : prev
          );
        }
        pushToast(TRANSLATIONS[language].dashboard.savedSuccess, 'gold');
        return true;
      } catch {
        return false;
      }
    },
    [user, language, accentTheme, highContrast, subtitleStyle, setLanguageState, pushToast]
  );

  const loadUserCommentHistory = useCallback(async () => {
    if (!user) return [];
    try {
      const res = await fetch(
        `/api/comments?userId=${encodeURIComponent(user.uid)}&limit=50`
      );
      if (!res.ok) return [];
      const data = (await res.json()) as {
        comments?: Array<
          EpisodeComment & {
            dramaId: string;
            provider: ProviderName;
            episodeNumber: number;
          }
        >;
      };
      return Array.isArray(data.comments) ? data.comments : [];
    } catch {
      return [];
    }
  }, [user]);

  const toggleMyList = useCallback(
    (drama: DramaItem, folderId = 'all') => {
      const key = makeItemKey(drama.bookId, drama.provider);
      setMyListItems((prev) => {
        const exists = prev.some(
          (d) => d.bookId === drama.bookId && d.provider === drama.provider
        );
        if (exists) {
          pushToast(`Removed "${drama.title}"`, 'neutral');
          return prev.filter(
            (d) => !(d.bookId === drama.bookId && d.provider === drama.provider)
          );
        }
        if (folderId && folderId !== 'all') {
          setItemFolderMap((m) => ({ ...m, [key]: folderId }));
        }
        pushToast(`Saved "${drama.title}"`, 'gold');
        return [drama, ...prev];
      });

      if (user) {
        void fetch('/api/favorites/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            dramaId: drama.bookId,
            provider: drama.provider,
            folderId,
            title: drama.title,
            cover: drama.cover,
            drama,
          }),
        }).catch(() => {});
      }
    },
    [pushToast, user]
  );

  const isDramaSaved = useCallback(
    (bookId: string, provider?: ProviderName) =>
      myListItems.some(
        (d) => d.bookId === bookId && (!provider || d.provider === provider)
      ),
    [myListItems]
  );

  const isDramaLiked = useCallback(
    (bookId: string, provider: ProviderName = 'DramaBox') =>
      likedDramaIds.includes(makeItemKey(bookId, provider)),
    [likedDramaIds]
  );

  const toggleLikeDrama = useCallback(
    (drama: DramaItem) => {
      const tCur = TRANSLATIONS[language];
      void requireAuth(tCur.auth.gateLikeReason, (activeUser) => {
        const key = makeItemKey(drama.bookId, drama.provider);
        setLikedDramaIds((prev) => {
          const exists = prev.includes(key);
          if (exists) {
            pushToast(`Unliked "${drama.title}"`, 'neutral');
            return prev.filter((k) => k !== key);
          }
          pushToast(`Liked "${drama.title}"`, 'gold');
          setMyListItems((listPrev) => {
            const alreadySaved = listPrev.some(
              (d) =>
                d.bookId === drama.bookId && d.provider === drama.provider
            );
            return alreadySaved ? listPrev : [drama, ...listPrev];
          });
          void fetch('/api/favorites/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: activeUser.uid,
              dramaId: drama.bookId,
              provider: drama.provider,
              folderId: 'all',
              title: drama.title,
              cover: drama.cover,
              drama,
              forceSave: true,
            }),
          }).catch(() => {});
          return [key, ...prev];
        });

        void fetch('/api/likes/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: activeUser.uid,
            dramaId: drama.bookId,
            provider: drama.provider,
          }),
        }).catch(() => {});
      });
    },
    [language, requireAuth, pushToast]
  );

  const toggleDramaCompleted = useCallback(
    (bookId: string, provider: ProviderName) => {
      const key = makeItemKey(bookId, provider);
      setCompletedDramaIds((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      );
    },
    []
  );

  const getDramaWatchStatus = useCallback(
    (drama: DramaItem): Exclude<WatchStatusFilter, 'all'> => {
      const key = makeItemKey(drama.bookId, drama.provider);
      if (completedDramaIds.includes(key)) return 'completed';
      const watchedEps = watchedMap[key] ?? [];
      if (
        drama.chapterCount > 1 &&
        watchedEps.length >= drama.chapterCount
      ) {
        return 'completed';
      }
      const hasHistory = watchHistory.some(
        (h) => h.bookId === drama.bookId && h.provider === drama.provider
      );
      if (hasHistory || watchedEps.length > 0) return 'watching';
      return 'plan';
    },
    [completedDramaIds, watchedMap, watchHistory]
  );

  const createWatchlistFolder = useCallback(
    (name: string): WatchlistFolder | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const id = `folder-${Date.now().toString(36)}`;
      const folder: WatchlistFolder = { id, name: trimmed, isDefault: false };
      setWatchlistFolders((prev) => [...prev, folder]);
      pushToast(`Created folder "${trimmed}"`, 'gold');
      return folder;
    },
    [pushToast]
  );

  const deleteWatchlistFolder = useCallback((folderId: string) => {
    setWatchlistFolders((prev) =>
      prev.filter((f) => f.id !== folderId || f.isDefault)
    );
    setItemFolderMap((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(next)) {
        if (v === folderId) delete next[k];
      }
      return next;
    });
  }, []);

  const assignDramaToFolder = useCallback(
    (bookId: string, provider: ProviderName, folderId: string) => {
      const key = makeItemKey(bookId, provider);
      setItemFolderMap((prev) => {
        const next = { ...prev };
        if (folderId === 'all') {
          delete next[key];
        } else {
          next[key] = folderId;
        }
        return next;
      });
      if (user) {
        void fetch('/api/favorites/folder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            dramaId: bookId,
            provider,
            folderId,
          }),
        }).catch(() => {});
      }
    },
    [user]
  );

  const getDramaFolderId = useCallback(
    (bookId: string, provider: ProviderName) => {
      return itemFolderMap[makeItemKey(bookId, provider)] ?? 'all';
    },
    [itemFolderMap]
  );

  const recordWatchProgress = useCallback(
    (
      drama: DramaItem,
      episode: number,
      currentTime = 0,
      duration = 0,
      immediate = false
    ) => {
      const pct =
        duration > 0
          ? Math.min(100, Math.max(5, Math.round((currentTime / duration) * 100)))
          : Math.min(
              92,
              Math.max(
                12,
                Math.round((episode / Math.max(1, drama.chapterCount)) * 100) +
                  10
              )
            );

      const epSessionKey = makeEpisodeKey(drama.bookId, drama.provider, episode);
      if (!countedEpisodesSessionRef.current.has(epSessionKey)) {
        countedEpisodesSessionRef.current.add(epSessionKey);
        setEpisodesWatchedCount((c) => c + 1);
        const dramaKey = makeItemKey(drama.bookId, drama.provider);
        setLiveBadgeMap((prev) => {
          const cur = prev[dramaKey];
          const nextDaily = (cur?.dailyViews ?? drama.dailyViews ?? 0) + 1;
          const nextTotal = (cur?.totalViews ?? drama.totalViews ?? 0) + 1;
          return {
            ...prev,
            [dramaKey]: {
              dailyViews: nextDaily,
              totalViews: nextTotal,
              trendBadge: cur?.trendBadge || 'HOT',
            },
          };
        });
        void fetch('/api/stats/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dramaId: drama.bookId,
            provider: drama.provider,
            episodeNumber: episode,
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data: { siteTotalViews?: number } | null) => {
            if (
              data &&
              typeof data.siteTotalViews === 'number' &&
              typeof window !== 'undefined'
            ) {
              window.dispatchEvent(
                new CustomEvent('hd:view-recorded', {
                  detail: { siteTotalViews: data.siteTotalViews },
                })
              );
            }
            void refreshLiveBadges();
          })
          .catch(() => {});
      }

      if (user) {
        const today = getLocalDateKey();
        if (streak.lastVisitDate !== today) {
          void syncUserStreak(user);
        }
      }

      const key = makeItemKey(drama.bookId, drama.provider);
      setWatchedMap((prev) => {
        const existingList = prev[key] ?? [];
        if (existingList.includes(episode)) return prev;
        return {
          ...prev,
          [key]: [...existingList, episode],
        };
      });

      let resolvedTime = Math.max(0, Math.floor(currentTime));
      let resolvedDuration = Math.max(0, Math.floor(duration));

      setWatchHistory((prev) => {
        const existing = prev.find(
          (item) =>
            item.bookId === drama.bookId && item.provider === drama.provider
        );
        const safeTime =
          currentTime > 0
            ? Math.floor(currentTime)
            : existing && existing.episode === episode
            ? existing.currentTime
            : 0;
        const safeDuration =
          duration > 0
            ? Math.floor(duration)
            : existing && existing.episode === episode
            ? existing.duration
            : 0;

        resolvedTime = safeTime;
        resolvedDuration = safeDuration;

        const filtered = prev.filter(
          (item) =>
            !(item.bookId === drama.bookId && item.provider === drama.provider)
        );
        return [
          {
            bookId: drama.bookId,
            provider: drama.provider,
            title: drama.title,
            cover: drama.cover,
            drama,
            episode,
            currentTime: safeTime,
            duration: safeDuration,
            progress: pct,
            updatedAt: Date.now(),
          },
          ...filtered,
        ].slice(0, 24);
      });

      // Cloud sync watch_history to PostgreSQL (throttled every 4.5s or immediate on close/pause/switch)
      const nowMs = Date.now();
      const lastSync = lastHistoryPostRef.current[key];
      if (immediate || !lastSync || lastSync.ep !== episode || nowMs - lastSync.at >= 4500) {
        lastHistoryPostRef.current[key] = { at: nowMs, ep: episode };
        const actorId = user?.uid || visitorId;
        void fetch('/api/watch-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: actorId,
            dramaId: drama.bookId,
            provider: drama.provider,
            episodeNumber: episode,
            currentTime: resolvedTime,
            duration: resolvedDuration,
            progress: pct,
            drama,
          }),
        }).catch(() => {});
      }
    },
    [user, visitorId, streak.lastVisitDate, syncUserStreak, refreshLiveBadges]
  );

  const getDramaLiveStats = useCallback(
    (bookId: string, provider: ProviderName = 'DramaBox') => {
      return liveBadgeMap[makeItemKey(bookId, provider)] ?? null;
    },
    [liveBadgeMap]
  );

  const removeHistoryItem = useCallback(
    (bookId: string, provider?: ProviderName) => {
      setWatchHistory((prev) =>
        prev.filter(
          (item) =>
            !(
              item.bookId === bookId &&
              (!provider || item.provider === provider)
            )
        )
      );
      const actorId = user?.uid || visitorId;
      const params = new URLSearchParams({
        userId: actorId,
        dramaId: bookId,
      });
      if (provider) params.set('provider', provider);
      void fetch(`/api/watch-history?${params.toString()}`, {
        method: 'DELETE',
      }).catch(() => {});
    },
    [user, visitorId]
  );

  const getResumePoint = useCallback(
    (bookId: string, provider?: ProviderName) => {
      const found = watchHistory.find(
        (h) => h.bookId === bookId && (!provider || h.provider === provider)
      );
      if (!found) return null;
      return {
        episode: found.episode,
        currentTime: found.currentTime,
        progress: found.progress,
      };
    },
    [watchHistory]
  );

  const getWatchedEpisodes = useCallback(
    (bookId: string, provider: ProviderName) => {
      return watchedMap[makeItemKey(bookId, provider)] ?? [];
    },
    [watchedMap]
  );

  const getDramaRating = useCallback(
    (bookId: string, provider: ProviderName) => {
      return ratingsMap[makeItemKey(bookId, provider)] ?? 0;
    },
    [ratingsMap]
  );

  const setDramaRating = useCallback(
    (bookId: string, provider: ProviderName, stars: number) => {
      const safe = Math.min(5, Math.max(1, Math.round(stars)));
      setRatingsMap((prev) => ({
        ...prev,
        [makeItemKey(bookId, provider)]: safe,
      }));
      pushToast(`Rated ${safe}/5 stars`, 'gold');
    },
    [pushToast]
  );

  const getEpisodeReactions = useCallback(
    (
      bookId: string,
      provider: ProviderName,
      episode: number
    ): Record<ReactionKey, number> => {
      const existing = reactionsMap[makeEpisodeKey(bookId, provider, episode)];
      return (
        existing ?? {
          plotTwist: 0,
          baper: 0,
          emosi: 0,
          romantis: 0,
        }
      );
    },
    [reactionsMap]
  );

  const addEpisodeReaction = useCallback(
    (
      bookId: string,
      provider: ProviderName,
      episode: number,
      key: ReactionKey
    ) => {
      const tCur = TRANSLATIONS[language];
      void requireAuth(tCur.auth.gateCommentReason, () => {
        const epKey = makeEpisodeKey(bookId, provider, episode);
        setReactionsMap((prev) => {
          const current = prev[epKey] ?? {
            plotTwist: 0,
            baper: 0,
            emosi: 0,
            romantis: 0,
          };
          return {
            ...prev,
            [epKey]: {
              ...current,
              [key]: current[key] + 1,
            },
          };
        });
      });
    },
    [language, requireAuth]
  );

  const syncEpisodeComments = useCallback(
    async (bookId: string, provider: ProviderName, episode: number) => {
      const epKey = makeEpisodeKey(bookId, provider, episode);
      try {
        const params = new URLSearchParams({
          dramaId: bookId,
          provider,
          episode: String(episode),
          limit: '40',
          offset: '0',
        });
        const res = await fetch(`/api/comments?${params.toString()}`);
        if (!res.ok) return;
        const json = (await res.json()) as {
          ok?: boolean;
          comments?: EpisodeComment[];
        };
        const remoteComments = Array.isArray(json.comments)
          ? json.comments.map((c) => ({
              ...c,
              authorInitials: c.authorInitials || buildInitials(c.author || 'Viewer'),
              authorColor: c.authorColor || '#EF4444',
              videoTimestampSec:
                typeof c.videoTimestampSec === 'number' ? c.videoTimestampSec : 0,
            }))
          : [];
        if (remoteComments.length === 0) return;

        setCommentsMap((prev) => {
          const localOnly = (prev[epKey] ?? []).filter(
            (lc) => !remoteComments.some((rc) => rc.id === lc.id)
          );
          const merged = [...remoteComments, ...localOnly]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 40);
          return { ...prev, [epKey]: merged };
        });
      } catch {
        // Local cache remains active if API call fails
      }
    },
    []
  );

  const getEpisodeComments = useCallback(
    (bookId: string, provider: ProviderName, episode: number) => {
      return commentsMap[makeEpisodeKey(bookId, provider, episode)] ?? [];
    },
    [commentsMap]
  );

  const addEpisodeComment = useCallback(
    async (
      bookId: string,
      provider: ProviderName,
      episode: number,
      text: string,
      videoTimestampSec = 0
    ): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      const tCur = TRANSLATIONS[language];
      const safeTimestamp = Math.max(0, Math.floor(Number(videoTimestampSec) || 0));

      const commitComment = async (activeUser: GoogleUser) => {
        const epKey = makeEpisodeKey(bookId, provider, episode);
        const commentId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const localStreak = readJsonStorage<DailyStreakState>(
          streakStorageKey(activeUser.uid),
          streak,
          legacyStreakStorageKey(activeUser.uid)
        );
        const badge =
          streak.isVipCoffeeLover || localStreak.isVipCoffeeLover
            ? 'VIP House Lover'
            : undefined;

        const comment: EpisodeComment = {
          id: commentId,
          authorUid: activeUser.uid,
          author: activeUser.displayName,
          authorEmail: activeUser.email,
          authorPhotoURL: activeUser.photoURL,
          authorBadge: badge,
          authorInitials: activeUser.avatarInitials,
          authorColor: activeUser.avatarColor,
          text: trimmed.slice(0, 240),
          videoTimestampSec: safeTimestamp,
          createdAt: Date.now(),
        };

        setCommentsMap((prev) => ({
          ...prev,
          [epKey]: [comment, ...(prev[epKey] ?? [])].slice(0, 40),
        }));

        try {
          await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: commentId,
              dramaId: bookId,
              provider,
              episodeNumber: episode,
              userId: activeUser.uid,
              authorName: activeUser.displayName.slice(0, 120),
              authorEmail: activeUser.email,
              authorPhotoURL: activeUser.photoURL,
              authorBadge: badge,
              authorInitials: activeUser.avatarInitials,
              authorColor: activeUser.avatarColor,
              text: trimmed.slice(0, 240),
              videoTimestampSec: safeTimestamp,
            }),
          });
        } catch {
          // Keep optimistic local comment cleanly
        }
      };

      if (!user) {
        await requireAuth(tCur.auth.gateCommentReason, (signedInUser) => {
          void commitComment(signedInUser);
        });
        return Boolean(auth.currentUser);
      }

      await commitComment(user);
      return true;
    },
    [language, user, streak, requireAuth]
  );

  const isEpisodeUnlocked = useCallback(
    (bookId: string, provider: ProviderName, episode: number) => {
      if (episode <= 10) return true;
      return unlockedVipList.includes(makeEpisodeKey(bookId, provider, episode));
    },
    [unlockedVipList]
  );

  const unlockVipEpisode = useCallback(
    (bookId: string, provider: ProviderName, episode: number) => {
      const epKey = makeEpisodeKey(bookId, provider, episode);
      setUnlockedVipList((prev) =>
        prev.includes(epKey) ? prev : [...prev, epKey]
      );
      pushToast(`EP ${episode} unlocked free! Enjoy watching`, 'gold');
    },
    [pushToast]
  );

  const addRecentSearch = useCallback((keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setRecentSearches((prev) =>
      [
        trimmed,
        ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 8)
    );
  }, []);

  const removeRecentSearch = useCallback((keyword: string) => {
    setRecentSearches((prev) =>
      prev.filter((item) => item.toLowerCase() !== keyword.toLowerCase())
    );
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const dismissPushPrompt = useCallback(() => {
    setPushPromptDismissed(true);
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushPromptDismissed(true);
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      setPushPromptDismissed(true);
      if (perm === 'granted') {
        pushToast(TRANSLATIONS[language].retention.pushEnabledToast, 'gold');
      }
    } catch {
      setPushPromptDismissed(true);
    }
  }, [language, pushToast]);

  const showPushPrompt = useMemo(() => {
    if (pushPromptDismissed || episodesWatchedCount < 3) return false;
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return notificationPermission === 'default';
  }, [pushPromptDismissed, episodesWatchedCount, notificationPermission]);

  const myListIds = useMemo(
    () => myListItems.map((d) => `${d.provider}:${d.bookId}`),
    [myListItems]
  );

  const t = TRANSLATIONS[language];

  const value = useMemo(
    () => ({
      language,
      t,
      setLanguageState,
      user,
      authLoading,
      authError,
      authModalOpen,
      authPromptReason,
      openAuthModal,
      closeAuthModal,
      signInWithGoogle,
      signOut,
      requireAuth,
      visitorId,
      updateUserProfile,
      loadUserCommentHistory,
      streak,
      helpModalOpen,
      setHelpModalOpen,
      accentTheme,
      setAccentTheme,
      highContrast,
      setHighContrast,
      subtitleStyle,
      setSubtitleStyle,
      myListItems,
      myListIds,
      toggleMyList,
      isDramaSaved,
      likedDramaIds,
      isDramaLiked,
      toggleLikeDrama,
      completedDramaIds,
      toggleDramaCompleted,
      getDramaWatchStatus,
      watchlistFolders,
      itemFolderMap,
      createWatchlistFolder,
      deleteWatchlistFolder,
      assignDramaToFolder,
      getDramaFolderId,
      watchHistory,
      recordWatchProgress,
      removeHistoryItem,
      getResumePoint,
      getWatchedEpisodes,
      getDramaRating,
      setDramaRating,
      getEpisodeReactions,
      addEpisodeReaction,
      syncEpisodeComments,
      getEpisodeComments,
      addEpisodeComment,
      isEpisodeUnlocked,
      unlockVipEpisode,
      recentSearches,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches,
      episodesWatchedCount,
      showPushPrompt,
      dismissPushPrompt,
      requestPushPermission,
      toasts,
      pushToast,
      dismissToast,
      getDramaLiveStats,
    }),
    [
      language,
      t,
      setLanguageState,
      user,
      authLoading,
      authError,
      authModalOpen,
      authPromptReason,
      openAuthModal,
      closeAuthModal,
      signInWithGoogle,
      signOut,
      requireAuth,
      visitorId,
      updateUserProfile,
      loadUserCommentHistory,
      streak,
      helpModalOpen,
      accentTheme,
      setAccentTheme,
      highContrast,
      setHighContrast,
      subtitleStyle,
      setSubtitleStyle,
      myListItems,
      myListIds,
      toggleMyList,
      isDramaSaved,
      likedDramaIds,
      isDramaLiked,
      toggleLikeDrama,
      completedDramaIds,
      toggleDramaCompleted,
      getDramaWatchStatus,
      watchlistFolders,
      itemFolderMap,
      createWatchlistFolder,
      deleteWatchlistFolder,
      assignDramaToFolder,
      getDramaFolderId,
      watchHistory,
      recordWatchProgress,
      removeHistoryItem,
      getResumePoint,
      getWatchedEpisodes,
      getDramaRating,
      setDramaRating,
      getEpisodeReactions,
      addEpisodeReaction,
      syncEpisodeComments,
      getEpisodeComments,
      addEpisodeComment,
      isEpisodeUnlocked,
      unlockVipEpisode,
      recentSearches,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches,
      episodesWatchedCount,
      showPushPrompt,
      dismissPushPrompt,
      requestPushPermission,
      toasts,
      pushToast,
      dismissToast,
      getDramaLiveStats,
    ]
  );

  return (
    <DramaContext.Provider value={value}>{children}</DramaContext.Provider>
  );
};

export function useDramaContext(): DramaContextValue {
  const ctx = useContext(DramaContext);
  if (!ctx) {
    throw new Error('useDramaContext must be used inside <DramaProvider>');
  }
  return ctx;
}
