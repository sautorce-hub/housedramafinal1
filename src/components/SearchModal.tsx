import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  X,
  Clock,
  Loader2,
  Play,
  Trash2,
  Film,
  Flame,
  Hash,
} from 'lucide-react';
import { searchAllProviders } from '../services/dramaProviders';
import { useDramaContext } from '../context/DramaContext';
import { ProviderBadge } from './ProviderBadge';
import type { DramaItem } from '../types/drama';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectDrama: (drama: DramaItem) => void;
  onQuickPlay: (drama: DramaItem) => void;
  trendingDramas?: DramaItem[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  open,
  onClose,
  onSelectDrama,
  onQuickPlay,
  trendingDramas = [],
}) => {
  const {
    t,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useDramaContext();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DramaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [failedCovers, setFailedCovers] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setSearchedOnce(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await searchAllProviders(trimmed, 1, 'All');
        if (cancelled) return;
        setResults(res.items);
        setSearchedOnce(true);
      } catch {
        if (cancelled) return;
        setResults([]);
        setSearchedOnce(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 340);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  if (!open) return null;

  const handleSelect = (item: DramaItem) => {
    if (query.trim()) {
      addRecentSearch(query.trim());
    } else if (item.title.trim()) {
      addRecentSearch(item.title.trim());
    }
    onClose();
    onSelectDrama(item);
  };

  const handleApplyKeyword = (keyword: string) => {
    const clean = keyword.trim();
    if (!clean) return;
    setQuery(clean);
    addRecentSearch(clean);
  };

  const trendingItems = trendingDramas.slice(0, 8);
  const genreSuggestions = t.seoTags.genres.slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#09090B]/95 backdrop-blur-xl flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={t.search.title}
    >
      {/* Search Bar Header */}
      <div className="border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) addRecentSearch(query.trim());
            }}
            className="flex-1 flex items-center gap-3 rounded-full bg-[#141418] border border-[var(--cd-accent)]/70 px-4 py-2.5 shadow-lg"
          >
            <Search className="w-4 h-4 cd-accent-text shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search.placeholder}
              className="w-full bg-transparent text-sm text-white placeholder-[#A1A1AA] focus:outline-none"
            />
            {loading ? (
              <Loader2 className="w-4 h-4 cd-accent-text animate-spin shrink-0" />
            ) : query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="p-1 text-[#A1A1AA] hover:text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </form>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close search modal"
            className="p-2.5 rounded-full bg-[#141418] border border-white/10 text-white hover:border-white/30 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Results, Recent Searches & Live Trending Searches Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {!query.trim() && (
            <div className="space-y-6">
              {/* Recent Searches (localStorage persisted) */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 cd-accent-text" />
                      {t.search.recentSearches}
                    </h2>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="inline-flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-[var(--cd-accent)] transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      {t.search.clearRecent}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((kw) => (
                      <div
                        key={kw}
                        className="inline-flex items-center rounded-full bg-[#141418] border border-white/10 hover:border-[var(--cd-accent)]/60 transition-colors overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => handleApplyKeyword(kw)}
                          className="pl-3.5 pr-2 py-1.5 text-xs font-medium text-white hover:cd-accent-text transition-colors"
                        >
                          {kw}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRecentSearch(kw)}
                          aria-label={`${t.search.removeRecent}: ${kw}`}
                          className="pr-2.5 pl-1 py-1.5 text-[#71717A] hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches (Live Popular Dramas & Genre Tags) */}
              {(trendingItems.length > 0 || genreSuggestions.length > 0) && (
                <div className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {t.search.trendingSearches}
                  </h2>

                  {trendingItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {trendingItems.map((item, idx) => (
                        <div
                          key={`trending-${item.provider}:${item.bookId}`}
                          className="group flex items-center gap-3 p-2.5 rounded-xl bg-[#141418] border border-white/10 hover:border-[var(--cd-accent)]/60 transition-colors"
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold tabular-nums shrink-0 ${
                              idx < 3
                                ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                                : 'bg-white/5 text-[#A1A1AA]'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelect(item)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <p className="text-xs font-semibold text-white group-hover:text-[var(--cd-accent)] truncate transition-colors">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#A1A1AA]">
                              <span>{item.provider}</span>
                              <span>·</span>
                              <span className="tabular-nums">
                                {item.chapterCount} Eps
                              </span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              addRecentSearch(item.title);
                              onClose();
                              onQuickPlay(item);
                            }}
                            aria-label={`Play ${item.title}`}
                            className="w-8 h-8 rounded-full bg-white/5 hover:cd-accent-bg text-white flex items-center justify-center shrink-0 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {genreSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {genreSuggestions.map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => handleApplyKeyword(genre)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#181518] border border-white/10 hover:border-[#D4AF37]/60 text-[11px] font-medium text-[#E4E4E7] hover:text-white transition-colors"
                        >
                          <Hash className="w-3 h-3 text-[#D4AF37]" />
                          <span>{genre}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {recentSearches.length === 0 && trendingItems.length === 0 && (
                <div className="p-6 rounded-2xl bg-[#141418] border border-white/10 text-center">
                  <Search className="w-8 h-8 cd-accent-text mx-auto mb-2.5 opacity-80" />
                  <p className="text-sm font-semibold text-white">
                    {t.search.title}
                  </p>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    {t.search.placeholder}
                  </p>
                </div>
              )}
            </div>
          )}

          {query.trim() && loading && results.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-[#A1A1AA]">{t.search.searchingBoth}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-[2/3] rounded-xl skeleton-espresso border border-white/10" />
                    <div className="px-0.5 space-y-1.5">
                      <div className="h-3.5 w-[88%] rounded skeleton-espresso" />
                      <div className="h-3 w-[55%] rounded skeleton-espresso" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim() && !loading && searchedOnce && results.length === 0 && (
            <div className="p-10 rounded-2xl bg-[#141418] border border-white/10 text-center">
              <Film className="w-8 h-8 cd-accent-text mx-auto mb-3 opacity-70" />
              <p className="text-base font-bold text-white">
                {t.search.noResults}
              </p>
              <p className="text-xs text-[#A1A1AA] mt-1">
                {t.search.tryAnother}
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <p className="text-xs text-[#A1A1AA] mb-4 tabular-nums">
                {results.length} {t.search.resultsCount}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                {results.map((item) => {
                  const key = `${item.provider}:${item.bookId}`;
                  const showCover = Boolean(item.cover) && !failedCovers[key];
                  const episodeCount = Math.max(1, item.chapterCount || 1);
                  return (
                    <article
                      key={key}
                      onClick={() => handleSelect(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelect(item);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${item.title}`}
                      className="group flex flex-col cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cd-accent)] rounded-xl"
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141418] border border-white/10 group-hover:border-[var(--cd-accent)]/75 transition-all">
                        {showCover ? (
                          <img
                            src={item.cover}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedCovers((prev) => ({
                                ...prev,
                                [key]: true,
                              }))
                            }
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3 text-center bg-gradient-to-br from-[#231915] to-[#0D0A09]">
                            <span className="text-xs text-white font-semibold line-clamp-3">
                              {item.title}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
                        <div className="absolute top-2 left-2">
                          <ProviderBadge provider={item.provider} size="xs" />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (query.trim()) addRecentSearch(query.trim());
                            onClose();
                            onQuickPlay(item);
                          }}
                          aria-label={`Play ${item.title}`}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full cd-accent-bg text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                      </div>
                      <div className="mt-2 px-0.5 space-y-1">
                        <h3 className="text-[13px] sm:text-sm font-semibold text-white line-clamp-2 leading-[1.35] min-h-[2.7em] group-hover:text-[var(--cd-accent-text)] transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA] tabular-nums truncate">
                          <span>Ep: {episodeCount}</span>
                          {item.tags[0] && (
                            <>
                              <span aria-hidden="true">•</span>
                              <span className="truncate">{item.tags[0]}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
