import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Play,
  Plus,
  Check,
  Crown,
  Lock,
  LockOpen,
  AlertCircle,
  RotateCcw,
  Film,
  Loader2,
  Share2,
  Eye,
  Clock,
  Star,
  FolderOpen,
  Heart,
} from 'lucide-react';
import { getProviderAdapter } from '../services/dramaProviders';
import {
  fetchLk21Detail,
  fetchLk21EpisodesAsEpisodeItems,
  movieToDramaItem,
} from '../services/movieService';
import { useDramaContext } from '../context/DramaContext';
import { ProviderBadge } from './ProviderBadge';
import { ShareDramaModal } from './ShareDramaModal';
import {
  formatPlaybackClock,
  getDramaPath,
  syncDramaDocumentSeo,
} from '../utils/seo';
import type { DramaItem, EpisodeItem, MediaProviderName } from '../types/drama';

interface DramaDetailPageProps {
  bookId: string;
  providerHint?: MediaProviderName;
  initialDrama?: DramaItem | null;
  initialEpisodes?: EpisodeItem[];
  onBackHome: () => void;
  onSelectTag?: (tag: string) => void;
  onPlayEpisode: (
    drama: DramaItem,
    episodeNumber: number,
    episodesList: EpisodeItem[],
    startAtSeconds?: number
  ) => void;
}

const BATCH_SIZE = 30;

export const DramaDetailPage: React.FC<DramaDetailPageProps> = ({
  bookId,
  providerHint,
  initialDrama = null,
  initialEpisodes = [],
  onBackHome,
  onSelectTag,
  onPlayEpisode,
}) => {
  const {
    language,
    t,
    isDramaSaved,
    toggleMyList,
    isDramaLiked,
    toggleLikeDrama,
    watchlistFolders,
    getDramaFolderId,
    assignDramaToFolder,
    getResumePoint,
    getWatchedEpisodes,
    getDramaRating,
    setDramaRating,
    isEpisodeUnlocked,
  } = useDramaContext();

  const resolvedProvider: MediaProviderName =
    initialDrama?.provider ?? providerHint ?? 'DramaBox';

  const [detail, setDetail] = useState<DramaItem | null>(initialDrama);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>(initialEpisodes);
  const [loading, setLoading] = useState<boolean>(!initialDrama);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState(0);
  const [coverFailed, setCoverFailed] = useState(false);
  const [hoverStar, setHoverStar] = useState<number>(0);

  const [shareModalState, setShareModalState] = useState<{
    open: boolean;
    episode: number;
    unlockMode: boolean;
  }>({ open: false, episode: 1, unlockMode: false });

  const activeReqIdRef = useRef(0);

  const loadDetailAndEpisodes = async (
    id: string,
    provider: MediaProviderName,
    baseDrama: DramaItem | null
  ) => {
    const reqId = ++activeReqIdRef.current;
    setLoading(true);
    setError(null);

    try {
      if (provider === 'LK21' || baseDrama?.mediaType === 'movie') {
        const [movieRes, epsRes] = await Promise.allSettled([
          fetchLk21Detail(id),
          fetchLk21EpisodesAsEpisodeItems(id),
        ]);
        if (reqId !== activeReqIdRef.current) return;

        const eps = epsRes.status === 'fulfilled' ? epsRes.value : [];
        let mergedMovie = baseDrama;
        if (movieRes.status === 'fulfilled' && movieRes.value) {
          const converted = movieToDramaItem(movieRes.value, eps.length || 1);
          mergedMovie = baseDrama
            ? {
                ...baseDrama,
                ...converted,
                tags:
                  converted.tags.length > 0 ? converted.tags : baseDrama.tags,
              }
            : converted;
          setDetail(mergedMovie);
        }

        if (epsRes.status === 'fulfilled') {
          setEpisodes(eps);
          if (mergedMovie) {
            syncDramaDocumentSeo(mergedMovie, eps, language);
          }
        } else {
          setError(
            epsRes.reason instanceof Error
              ? epsRes.reason.message
              : 'Failed to load movie stream list.'
          );
        }
        return;
      }

      const adapter = getProviderAdapter(provider);
      const [detailRes, episodesRes] = await Promise.allSettled([
        adapter.fetchDetail(id),
        adapter.fetchAllEpisodes(id),
      ]);
      if (reqId !== activeReqIdRef.current) return;

      let mergedDrama = baseDrama;
      if (detailRes.status === 'fulfilled' && detailRes.value) {
        mergedDrama = baseDrama
          ? {
              ...baseDrama,
              ...detailRes.value,
              tags:
                detailRes.value.tags.length > 0
                  ? detailRes.value.tags
                  : baseDrama.tags,
            }
          : detailRes.value;
        setDetail(mergedDrama);
      }

      if (episodesRes.status === 'fulfilled') {
        setEpisodes(episodesRes.value);
        if (mergedDrama) {
          syncDramaDocumentSeo(mergedDrama, episodesRes.value, language);
        }
      } else {
        setError(
          episodesRes.reason instanceof Error
            ? episodesRes.reason.message
            : 'Failed to load episodes.'
        );
      }
    } catch (err) {
      if (reqId !== activeReqIdRef.current) return;
      setError(
        err instanceof Error ? err.message : 'Unable to fetch drama details.'
      );
    } finally {
      if (reqId === activeReqIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setDetail(initialDrama);
    setEpisodes(initialEpisodes);
    setSelectedBatch(0);
    setCoverFailed(false);

    if (initialDrama) {
      syncDramaDocumentSeo(initialDrama, initialEpisodes, language);
    }
    loadDetailAndEpisodes(bookId, resolvedProvider, initialDrama);
  }, [bookId, resolvedProvider, language]);

  useEffect(() => {
    if (detail) {
      syncDramaDocumentSeo(detail, episodes, language);
      const canonicalPath = getDramaPath(
        detail.bookId,
        detail.title,
        detail.provider,
        detail.slug
      );
      if (window.location.pathname !== canonicalPath) {
        window.history.replaceState(window.history.state, '', canonicalPath);
      }
    }
  }, [detail, episodes, language]);

  const batches = useMemo(() => {
    const groups: { label: string; items: EpisodeItem[] }[] = [];
    for (let i = 0; i < episodes.length; i += BATCH_SIZE) {
      const slice = episodes.slice(i, i + BATCH_SIZE);
      groups.push({
        label: `${slice[0]?.episodeNumber ?? i + 1}–${
          slice[slice.length - 1]?.episodeNumber ?? i + slice.length
        }`,
        items: slice,
      });
    }
    return groups;
  }, [episodes]);

  const activeBatchItems = batches[selectedBatch]?.items ?? [];
  const resumePoint = detail
    ? getResumePoint(detail.bookId, detail.provider)
    : null;
  const watchedList = detail
    ? getWatchedEpisodes(detail.bookId, detail.provider)
    : [];
  const isSaved = detail
    ? isDramaSaved(detail.bookId, detail.provider)
    : false;
  const isLiked = detail
    ? isDramaLiked(detail.bookId, detail.provider)
    : false;
  const userRating = detail
    ? getDramaRating(detail.bookId, detail.provider)
    : 0;
  const currentFolderId = detail
    ? getDramaFolderId(detail.bookId, detail.provider)
    : 'all';

  if (loading && !detail) {
    return (
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="h-8 w-36 rounded-full skeleton-espresso" />
        <div className="rounded-3xl bg-[var(--cd-surface)] border border-white/10 p-6 sm:p-10 flex flex-col sm:flex-row gap-8">
          <div className="w-44 aspect-[9/16] rounded-2xl skeleton-espresso shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-6 w-32 rounded skeleton-espresso" />
            <div className="h-10 w-3/4 rounded skeleton-espresso" />
            <div className="h-20 w-full rounded skeleton-espresso" />
          </div>
        </div>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16">
        <div className="max-w-lg mx-auto p-8 rounded-2xl bg-[var(--cd-surface)] border border-red-500/30 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white">Series Not Found</h1>
          <p className="text-sm text-[#A1A1AA] mt-2">
            {error || 'Could not load this drama.'}
          </p>
          <button
            type="button"
            onClick={onBackHome}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full cd-accent-bg text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.sections.backToHome}
          </button>
        </div>
      </section>
    );
  }

  const totalEpisodeCount =
    episodes.length > 0 ? episodes.length : detail.chapterCount;
  const hasLockedEpisodes = episodes.some(
    (ep) =>
      ep.isVipLocked &&
      !isEpisodeUnlocked(detail.bookId, detail.provider, ep.episodeNumber)
  );

  return (
    <article
      className="max-w-[1440px] mx-auto px-3 sm:px-8 pt-4 pb-24"
      itemScope
      itemType="https://schema.org/TVSeries"
    >
      <nav
        className="flex items-center justify-between gap-4 mb-4"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--cd-surface)] border border-[var(--cd-border)] hover:border-[var(--cd-accent)] text-xs sm:text-sm font-medium text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 cd-accent-text" />
          {t.sections.backToBrowse}
        </button>

        <button
          type="button"
          onClick={() =>
            setShareModalState({
              open: true,
              episode: resumePoint?.episode ?? 1,
              unlockMode: false,
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--cd-surface)] border border-[var(--cd-border)] hover:border-[var(--cd-accent)] text-xs font-semibold text-white transition-colors"
        >
          <Share2 className="w-3.5 h-3.5 cd-accent-text" />
          {t.engagement.generateSpoilerCard}
        </button>
      </nav>

      {/* Hero Detail Card */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#111115] border border-[var(--cd-border)] shadow-2xl mb-6 sm:mb-8">
        {detail.cover && !coverFailed && (
          <img
            src={detail.cover}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-25 pointer-events-none"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#111115] via-[#111115]/80 to-[#111115]/60"
          aria-hidden="true"
        />

        <div className="relative z-10 p-5 sm:p-8 lg:p-10 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
          <div className="w-36 sm:w-52 aspect-[9/16] rounded-2xl overflow-hidden bg-[#18181D] border border-white/15 shadow-2xl shrink-0">
            {detail.cover && !coverFailed ? (
              <img
                src={detail.cover}
                alt={detail.title}
                itemProp="image"
                referrerPolicy="no-referrer"
                onError={() => setCoverFailed(true)}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-10 h-10 cd-accent-text opacity-50" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold mb-3">
              <ProviderBadge provider={detail.provider} size="sm" />
              {detail.isVip && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#D4AF37] text-[#09090B] text-[10px] font-bold">
                  <Crown className="w-2.5 h-2.5" />
                  VIP
                </span>
              )}
              {detail.playCount && (
                <span className="inline-flex items-center gap-1 text-[#A1A1AA] tabular-nums">
                  <Eye className="w-3.5 h-3.5" />
                  {detail.playCount}
                </span>
              )}
            </div>

            <h1
              itemProp="name"
              className="text-2xl sm:text-4xl font-bold text-white leading-tight mb-3"
              style={{ textWrap: 'balance' }}
            >
              {detail.title}
            </h1>

            {/* Clean Typographic Metadata Line */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#D4D4D8] mb-4">
              <span itemProp="numberOfEpisodes" className="font-semibold cd-accent-text tabular-nums">
                {detail.mediaType === 'movie' && totalEpisodeCount === 1
                  ? detail.quality || 'HD Movie'
                  : `${totalEpisodeCount} Episodes`}
              </span>
              {detail.year && (
                <>
                  <span aria-hidden="true" className="text-[#71717A]">
                    ·
                  </span>
                  <span className="tabular-nums">{detail.year}</span>
                </>
              )}
              {detail.area && (
                <>
                  <span aria-hidden="true" className="text-[#71717A]">
                    ·
                  </span>
                  <span>{detail.area}</span>
                </>
              )}
              {detail.tags.map((tag) => (
                <React.Fragment key={tag}>
                  <span aria-hidden="true" className="text-[#71717A]">
                    ·
                  </span>
                  <button
                    type="button"
                    itemProp="genre"
                    onClick={() => onSelectTag?.(tag)}
                    className="hover:text-[var(--cd-accent)] underline-offset-2 hover:underline transition-colors"
                  >
                    {tag}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <p
              itemProp="description"
              className="text-sm sm:text-base text-[#D4D4D8] leading-relaxed max-w-3xl mb-5"
            >
              {detail.description}
            </p>

            {detail.director && (
              <p className="text-xs sm:text-sm text-[#A1A1AA] mb-2">
                <span className="text-white font-medium">Director: </span>
                {detail.director}
              </p>
            )}

            {detail.protagonist && (
              <p className="text-xs sm:text-sm text-[#A1A1AA] mb-5">
                <span className="text-white font-medium">Cast: </span>
                {detail.protagonist}
              </p>
            )}

            {/* 1–5 Star Rating Widget */}
            <div className="flex flex-wrap items-center gap-3 mb-6 py-2.5 px-3.5 rounded-xl bg-black/35 border border-white/10 w-fit">
              <span className="text-xs font-semibold text-white">
                {t.engagement.rateTitle}:
              </span>
              <div
                className="flex items-center gap-1"
                onMouseLeave={() => setHoverStar(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= (hoverStar || userRating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverStar(star)}
                      onClick={() =>
                        setDramaRating(detail.bookId, detail.provider, star)
                      }
                      aria-label={`Rate ${star} stars`}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          filled
                            ? 'text-[#D4AF37] fill-[#D4AF37]'
                            : 'text-[#52525B]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-[#A1A1AA] tabular-nums">
                {userRating > 0
                  ? `${userRating}/5 (${t.engagement.yourRating})`
                  : t.engagement.tapToRate}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {resumePoint ? (
                <button
                  type="button"
                  onClick={() =>
                    onPlayEpisode(
                      detail,
                      resumePoint.episode,
                      episodes,
                      resumePoint.currentTime
                    )
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full cd-accent-bg text-white font-semibold text-sm shadow-lg transition-all whitespace-nowrap shrink-0"
                >
                  <Clock className="w-4 h-4" />
                  {t.sections.resumeEp} {resumePoint.episode}
                  {resumePoint.currentTime > 2
                    ? ` · ${formatPlaybackClock(resumePoint.currentTime)}`
                    : ''}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading && episodes.length === 0}
                  onClick={() => onPlayEpisode(detail, 1, episodes, 0)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full cd-accent-bg text-white font-semibold text-sm shadow-lg transition-all disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {t.hero.playNow}
                </button>
              )}

              <button
                type="button"
                onClick={() => toggleLikeDrama(detail)}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isLiked
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-white/10 border-white/15 hover:bg-white/15 text-white'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isLiked ? 'fill-current text-red-400' : ''}`}
                />
                <span>{isLiked ? t.player.liked : t.player.like}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleMyList(detail)}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isSaved
                    ? 'bg-[var(--cd-accent-soft)] border-[var(--cd-accent)] text-[var(--cd-accent-text)]'
                    : 'bg-white/10 border-white/15 hover:bg-white/15 text-white'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t.hero.inList}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {t.hero.addToList}
                  </>
                )}
              </button>

              {/* Watchlist Folder Selector */}
              {isSaved && (
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[#18181D] border border-white/15 text-xs text-white">
                  <FolderOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <select
                    value={currentFolderId}
                    onChange={(e) =>
                      assignDramaToFolder(
                        detail.bookId,
                        detail.provider,
                        e.target.value
                      )
                    }
                    aria-label={t.engagement.saveToFolder}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
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
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share-to-Unlock Banner if VIP episodes exist */}
      {hasLockedEpisodes && (
        <div className="mb-5 p-4 rounded-2xl bg-[#18140F] border border-[#D4AF37]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LockOpen className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">
                {t.engagement.vipUnlockTitle}
              </p>
              <p className="text-xs text-[#D4D4D8]">
                {t.engagement.vipUnlockDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const firstLocked = episodes.find(
                (ep) =>
                  ep.isVipLocked &&
                  !isEpisodeUnlocked(
                    detail.bookId,
                    detail.provider,
                    ep.episodeNumber
                  )
              );
              setShareModalState({
                open: true,
                episode: firstLocked?.episodeNumber ?? 1,
                unlockMode: true,
              });
            }}
            className="px-4 py-2 rounded-full bg-[#D4AF37] text-[#09090B] text-xs font-bold whitespace-nowrap shrink-0 hover:brightness-110 transition-all"
          >
            {t.engagement.shareToUnlockBtn}
          </button>
        </div>
      )}

      {/* Episode Grid with Watched Checkmarks & Share-to-Unlock */}
      <section className="rounded-2xl sm:rounded-3xl bg-[#111115] border border-[var(--cd-border)] p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
              {t.player.episodes} ({totalEpisodeCount})
              {loading && (
                <Loader2 className="w-4 h-4 cd-accent-text animate-spin" />
              )}
            </h2>
          </div>

          {batches.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {batches.map((batch, idx) => (
                <button
                  key={batch.label}
                  type="button"
                  onClick={() => setSelectedBatch(idx)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium tabular-nums whitespace-nowrap transition-colors border ${
                    selectedBatch === idx
                      ? 'cd-accent-bg border-[var(--cd-accent)] text-white'
                      : 'bg-[#18181D] border-white/10 text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {batch.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && episodes.length === 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div
                key={idx}
                className="h-14 rounded-xl skeleton-espresso border border-white/5"
              />
            ))}
          </div>
        ) : error && episodes.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#18181D] border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">
                  {t.player.streamUnavailable}
                </p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                loadDetailAndEpisodes(detail.bookId, detail.provider, detail)
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full cd-accent-bg text-xs font-semibold text-white shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t.player.retry}
            </button>
          </div>
        ) : episodes.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#18181D] border border-white/10 text-center text-sm text-[#A1A1AA]">
            Tap Play now above to start Episode 1.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {activeBatchItems.map((ep) => {
              const isCurrentResume =
                resumePoint && resumePoint.episode === ep.episodeNumber;
              const isWatched = watchedList.includes(ep.episodeNumber);
              const unlocked = isEpisodeUnlocked(
                detail.bookId,
                detail.provider,
                ep.episodeNumber
              );
              const locked = ep.isVipLocked && !unlocked;

              return (
                <button
                  key={ep.chapterId}
                  type="button"
                  onClick={() => {
                    if (locked) {
                      setShareModalState({
                        open: true,
                        episode: ep.episodeNumber,
                        unlockMode: true,
                      });
                      return;
                    }
                    onPlayEpisode(
                      detail,
                      ep.episodeNumber,
                      episodes,
                      isCurrentResume ? resumePoint.currentTime : 0
                    );
                  }}
                  className={`group p-3 rounded-xl border text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cd-accent)] ${
                    isCurrentResume
                      ? 'border-[var(--cd-accent)] bg-[#221417]'
                      : isWatched
                      ? 'border-[#D4AF37]/40 bg-[#171410]'
                      : 'border-white/10 bg-[#18181D] hover:border-[var(--cd-accent)] hover:bg-[#22181A]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isCurrentResume
                          ? 'cd-accent-text'
                          : isWatched
                          ? 'text-[#D4AF37]'
                          : 'text-white group-hover:text-[var(--cd-accent)]'
                      }`}
                    >
                      EP {ep.episodeNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      {isWatched && (
                        <Check
                          className="w-3 h-3 text-[#D4AF37]"
                          aria-label={t.player.watched}
                        />
                      )}
                      {locked && (
                        <Lock
                          className="w-3 h-3 cd-accent-text shrink-0"
                          aria-label="VIP episode — share to unlock"
                        />
                      )}
                      {ep.isVipLocked && unlocked && (
                        <LockOpen
                          className="w-3 h-3 text-emerald-400 shrink-0"
                          aria-label={t.engagement.unlockedBadge}
                        />
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA] truncate">
                    {locked
                      ? 'Share to unlock'
                      : isCurrentResume && resumePoint.currentTime > 2
                      ? formatPlaybackClock(resumePoint.currentTime)
                      : isWatched
                      ? t.player.watched
                      : ep.title}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <ShareDramaModal
        open={shareModalState.open}
        drama={detail}
        episodeNumber={shareModalState.episode}
        unlockVipMode={shareModalState.unlockMode}
        onUnlockSuccess={() => {
          onPlayEpisode(detail, shareModalState.episode, episodes, 0);
        }}
        onClose={() =>
          setShareModalState((prev) => ({ ...prev, open: false }))
        }
      />
    </article>
  );
};
