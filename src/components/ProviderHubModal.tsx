import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Check, Layers } from 'lucide-react';
import { useDramaContext } from '../context/DramaContext';
import type { ProviderId, ProviderName } from '../types/drama';

interface ProviderHubModalProps {
  open: boolean;
  selectedProvider: ProviderId;
  counts: { all: number } & Partial<Record<ProviderName, number>>;
  onSelectProvider: (provider: ProviderId) => void;
  onClose: () => void;
}

interface ProviderCardSpec {
  id: ProviderId;
  name: string;
  tagline: string;
  available: boolean;
  count: number;
  logo: React.ReactNode;
}

function makeMonoLogo(
  mono: string,
  accentHex: string,
  textHex = '#FFFFFF',
  borderClass = 'border-white/20'
): React.ReactNode {
  return (
    <div
      className={`w-11 h-11 rounded-xl bg-[#09090B] border ${borderClass} flex items-center justify-center shadow-lg shrink-0`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect width="24" height="24" rx="6" fill={accentHex} />
        <text
          x="12"
          y="15.5"
          textAnchor="middle"
          fill={textHex}
          fontSize="10"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {mono}
        </text>
      </svg>
    </div>
  );
}

export const ProviderHubModal: React.FC<ProviderHubModalProps> = ({
  open,
  selectedProvider,
  counts,
  onSelectProvider,
  onClose,
}) => {
  const { t } = useDramaContext();
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
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

  const providers: ProviderCardSpec[] = useMemo(
    () => [
      {
        id: 'All',
        name: t.providers.all,
        tagline: 'Unified 49-platform House Drama live catalog',
        available: true,
        count: counts.all,
        logo: (
          <div className="w-11 h-11 rounded-xl cd-accent-bg flex items-center justify-center text-white shadow-lg shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        ),
      },
      {
        id: 'DramaBox',
        name: 'DramaBox',
        tagline: 'Billionaire Romance, Revenge & VIP Exclusives',
        available: true,
        count: counts.DramaBox ?? 0,
        logo: (
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect width="24" height="24" rx="6" fill="#09090B" />
              <path d="M8.5 7.2L17.2 12L8.5 16.8V7.2Z" fill="#EF4444" />
            </svg>
          </div>
        ),
      },
      {
        id: 'NetShort',
        name: 'NetShort',
        tagline: 'Trending Vertical Shorts & Donghua Hits',
        available: true,
        count: counts.NetShort ?? 0,
        logo: makeMonoLogo('NS', '#EF4444', '#FFFFFF', 'border-red-500/35'),
      },
      {
        id: 'AnyReel',
        name: 'AnyReel',
        tagline: 'Asian Short Dramas, Werewolf & Contract Romance',
        available: true,
        count: counts.AnyReel ?? 0,
        logo: makeMonoLogo('AR', '#10B981', '#09090B', 'border-emerald-400/35'),
      },
      {
        id: 'Melolo',
        name: 'Melolo',
        tagline: 'System Awakening, Anime Shorts & Encrypted HD Streams',
        available: true,
        count: counts.Melolo ?? 0,
        logo: makeMonoLogo('ML', '#F59E0B', '#09090B', 'border-amber-400/35'),
      },
      {
        id: 'WeTV',
        name: 'WeTV',
        tagline: 'Premium Asian Series & Youth Campus Dramas',
        available: true,
        count: counts.WeTV ?? 0,
        logo: makeMonoLogo('WT', '#F97316', '#FFFFFF', 'border-orange-400/35'),
      },
      {
        id: 'ReelShort',
        name: 'ReelShort',
        tagline: 'Global Billionaire, Werewolf & Romance Hits',
        available: true,
        count: counts.ReelShort ?? 0,
        logo: makeMonoLogo('RS', '#E11D48', '#FFFFFF', 'border-rose-500/35'),
      },
      {
        id: 'ReelShortV2',
        name: 'ReelShort V2',
        tagline: 'Extended ReelShort Multi-Region Catalog',
        available: true,
        count: counts.ReelShortV2 ?? 0,
        logo: makeMonoLogo('R2', '#BE123C', '#FFFFFF', 'border-rose-600/35'),
      },
      {
        id: 'ShortMax',
        name: 'ShortMax',
        tagline: 'Dual AES/Plain HD Vertical Blockbusters',
        available: true,
        count: counts.ShortMax ?? 0,
        logo: makeMonoLogo('SM', '#EF4444', '#FFFFFF', 'border-red-500/35'),
      },
      {
        id: 'ShortMaxV2',
        name: 'ShortMax V2',
        tagline: 'ShortMax V2 Mirror & International Feed',
        available: true,
        count: counts.ShortMaxV2 ?? 0,
        logo: makeMonoLogo('M2', '#DC2626', '#FFFFFF', 'border-red-600/35'),
      },
      {
        id: 'GoodShort',
        name: 'GoodShort',
        tagline: 'Trending, Terbaru, Anime & Indonesian Dubbing',
        available: true,
        count: counts.GoodShort ?? 0,
        logo: makeMonoLogo('GS', '#D97706', '#FFFFFF', 'border-amber-500/35'),
      },
      {
        id: 'FreeReels',
        name: 'FreeReels',
        tagline: 'Cursor-Paginated Popular, Anime & Dubbed Reels',
        available: true,
        count: counts.FreeReels ?? 0,
        logo: makeMonoLogo('FE', '#34D399', '#09090B', 'border-emerald-400/35'),
      },
      {
        id: 'DramaWave',
        name: 'DramaWave',
        tagline: 'Exclusive & VIP Dubbed Fantasy Dramas',
        available: true,
        count: counts.DramaWave ?? 0,
        logo: makeMonoLogo('DW', '#2DD4BF', '#09090B', 'border-teal-400/35'),
      },
      {
        id: 'FlickReels',
        name: 'FlickReels',
        tagline: 'All-Drama Catalog & Rebirth Family Shorts',
        available: true,
        count: counts.FlickReels ?? 0,
        logo: makeMonoLogo('FR', '#F43F5E', '#FFFFFF', 'border-rose-400/35'),
      },
      {
        id: 'Vigloo',
        name: 'Vigloo',
        tagline: 'K-Short Originals, Ranking & Filterable Browse',
        available: true,
        count: counts.Vigloo ?? 0,
        logo: makeMonoLogo('VG', '#7C3AED', '#FFFFFF', 'border-violet-500/35'),
      },
      {
        id: 'FlexTV',
        name: 'FlexTV',
        tagline: 'Urban Secret Identity & Melodrama Mini-Series',
        available: true,
        count: counts.FlexTV ?? 0,
        logo: makeMonoLogo('FX', '#2563EB', '#FFFFFF', 'border-blue-500/35'),
      },
      {
        id: 'DramaDash',
        name: 'DramaDash',
        tagline: 'Fast-Paced Trending Romance & Thriller Shorts',
        available: true,
        count: counts.DramaDash ?? 0,
        logo: makeMonoLogo('DD', '#F87171', '#09090B', 'border-red-400/35'),
      },
      {
        id: 'FlareFlow',
        name: 'FlareFlow',
        tagline: '1080p Dubbed & Original Vertical Dramas',
        available: true,
        count: counts.FlareFlow ?? 0,
        logo: makeMonoLogo('FF', '#FB923C', '#09090B', 'border-orange-400/35'),
      },
      {
        id: 'StoryReel',
        name: 'StoryReel',
        tagline: 'Encrypted & Plain 1080p HLS Mini-Dramas',
        available: true,
        count: counts.StoryReel ?? 0,
        logo: makeMonoLogo('SR', '#818CF8', '#09090B', 'border-indigo-400/35'),
      },
      {
        id: 'StoryReelV2',
        name: 'StoryReel V2',
        tagline: 'StoryReel V2 Multilingual Global Catalog',
        available: true,
        count: counts.StoryReelV2 ?? 0,
        logo: makeMonoLogo('S2', '#6366F1', '#FFFFFF', 'border-indigo-500/35'),
      },
      {
        id: 'VibeShort',
        name: 'VibeShort',
        tagline: 'Dubbed Mafia, CEO & Plain-Stream Verticals',
        available: true,
        count: counts.VibeShort ?? 0,
        logo: makeMonoLogo('VS', '#E879F9', '#09090B', 'border-fuchsia-400/35'),
      },
      {
        id: 'VibeShortV2',
        name: 'VibeShort V2',
        tagline: 'VibeShort V2 Fresh Drops & Multi-Audio Feed',
        available: true,
        count: counts.VibeShortV2 ?? 0,
        logo: makeMonoLogo('V2', '#C026D3', '#FFFFFF', 'border-fuchsia-500/35'),
      },
      {
        id: 'CubeTV',
        name: 'CubeTV',
        tagline: 'Hot Wuxia, Martial Arts & New Release Shorts',
        available: true,
        count: counts.CubeTV ?? 0,
        logo: makeMonoLogo('CT', '#22D3EE', '#09090B', 'border-cyan-400/35'),
      },
      {
        id: 'MicroDrama',
        name: 'MicroDrama',
        tagline: 'Bite-Sized Micro Episodes & Revenge Arcs',
        available: true,
        count: counts.MicroDrama ?? 0,
        logo: makeMonoLogo('MD', '#38BDF8', '#09090B', 'border-sky-400/35'),
      },
      {
        id: 'FunDrama',
        name: 'FunDrama',
        tagline: 'Lighthearted Rom-Com & Trending Short Stories',
        available: true,
        count: counts.FunDrama ?? 0,
        logo: makeMonoLogo('FD', '#FACC15', '#09090B', 'border-yellow-400/35'),
      },
      {
        id: 'FreeShort',
        name: 'FreeShort',
        tagline: 'Hot, Ranking & Dubbed Vertical Drama Library',
        available: true,
        count: counts.FreeShort ?? 0,
        logo: makeMonoLogo('FS', '#4ADE80', '#09090B', 'border-green-400/35'),
      },
      {
        id: 'ToonShort',
        name: 'ToonShort',
        tagline: 'Popular Motion-Comic & Contract Love Shorts',
        available: true,
        count: counts.ToonShort ?? 0,
        logo: makeMonoLogo('TS', '#C084FC', '#09090B', 'border-purple-400/35'),
      },
      {
        id: 'HappyShort',
        name: 'HappyShort',
        tagline: 'Trending, Popular, Terbaru & Daily Rankings',
        available: true,
        count: counts.HappyShort ?? 0,
        logo: makeMonoLogo('HS', '#FDE047', '#09090B', 'border-yellow-300/35'),
      },
      {
        id: 'PineDrama',
        name: 'PineDrama',
        tagline: 'Vertical Legal, Suspense & Romance Mini-Series',
        available: true,
        count: counts.PineDrama ?? 0,
        logo: makeMonoLogo('PN', '#16A34A', '#FFFFFF', 'border-green-500/35'),
      },
      {
        id: 'DotDrama',
        name: 'DotDrama',
        tagline: 'Fantasy Mystery & Supernatural Short Series',
        available: true,
        count: counts.DotDrama ?? 0,
        logo: makeMonoLogo('DT', '#EC4899', '#FFFFFF', 'border-pink-500/35'),
      },
      {
        id: 'iDrama',
        name: 'iDrama',
        tagline: 'H.264 High-Compatibility CEO & Romance Catalog',
        available: true,
        count: counts.iDrama ?? 0,
        logo: makeMonoLogo('ID', '#0284C7', '#FFFFFF', 'border-sky-500/35'),
      },
      {
        id: 'iDramaV2',
        name: 'iDrama V2',
        tagline: 'iDrama V2 Extended Cursor Catalog',
        available: true,
        count: counts.iDramaV2 ?? 0,
        logo: makeMonoLogo('I2', '#0369A1', '#FFFFFF', 'border-sky-600/35'),
      },
      {
        id: 'DramaOra',
        name: 'DramaOra',
        tagline: 'Curated Category Hits, Romance & Revenge Shorts',
        available: true,
        count: counts.DramaOra ?? 0,
        logo: makeMonoLogo('DO', '#EC4899', '#FFFFFF', 'border-pink-400/35'),
      },
      {
        id: 'MeloShort',
        name: 'MeloShort',
        tagline: 'Top Rankings, Fresh Picks & Multi-Genre Reels',
        available: true,
        count: counts.MeloShort ?? 0,
        logo: makeMonoLogo('MS', '#8B5CF6', '#FFFFFF', 'border-violet-400/35'),
      },
      {
        id: 'PetaDrama',
        name: 'PetaDrama',
        tagline: 'Full Catalog Vertical Series & Category Specials',
        available: true,
        count: counts.PetaDrama ?? 0,
        logo: makeMonoLogo('PD', '#06B6D4', '#09090B', 'border-cyan-400/35'),
      },
      {
        id: 'RadReels',
        name: 'RadReels',
        tagline: 'Latest Releases & High-Speed Trending Reels',
        available: true,
        count: counts.RadReels ?? 0,
        logo: makeMonoLogo('RR', '#F97316', '#09090B', 'border-orange-400/35'),
      },
      {
        id: 'DramaVerse',
        name: 'DramaVerse',
        tagline: 'Hot Releases, Modern CEO & Mystery Shorts',
        available: true,
        count: counts.DramaVerse ?? 0,
        logo: makeMonoLogo('DV', '#6366F1', '#FFFFFF', 'border-indigo-400/35'),
      },
      {
        id: 'KalosTV',
        name: 'KalosTV',
        tagline: 'Curated Vertical Mini-Series & Global Subs',
        available: true,
        count: counts.KalosTV ?? 0,
        logo: makeMonoLogo('KT', '#14B8A6', '#09090B', 'border-teal-400/35'),
      },
      {
        id: 'StardustTV',
        name: 'StardustTV',
        tagline: 'Hot Charts, Terbaru Drops & Exclusive Mini-Dramas',
        available: true,
        count: counts.StardustTV ?? 0,
        logo: makeMonoLogo('SD', '#EAB308', '#09090B', 'border-yellow-400/35'),
      },
      {
        id: 'StarShort',
        name: 'StarShort',
        tagline: 'Trending VIP Shorts, Billionaire & Urban Romance',
        available: true,
        count: counts.StarShort ?? 0,
        logo: makeMonoLogo('SS', '#3B82F6', '#FFFFFF', 'border-blue-400/35'),
      },
      {
        id: 'DramaBite',
        name: 'DramaBite',
        tagline: 'Bite-Sized Cliffhangers & Fast-Paced Thrillers',
        available: true,
        count: counts.DramaBite ?? 0,
        logo: makeMonoLogo('DB', '#FB7185', '#09090B', 'border-rose-400/35'),
      },
      {
        id: 'LoveShots',
        name: 'LoveShots',
        tagline: 'Top Rankings, Sweet Romance & Melodrama Hits',
        available: true,
        count: counts.LoveShots ?? 0,
        logo: makeMonoLogo('LS', '#F43F5E', '#FFFFFF', 'border-rose-500/35'),
      },
      {
        id: 'MyDrama',
        name: 'MyDrama',
        tagline: 'Daily Picks & Bite-Sized Asian Mini-Series',
        available: true,
        count: counts.MyDrama ?? 0,
        logo: makeMonoLogo('MY', '#A855F7', '#FFFFFF', 'border-purple-400/35'),
      },
      {
        id: 'ShotShort',
        name: 'ShotShort',
        tagline: 'Newest Drops & Sorted All-Drama Catalog',
        available: true,
        count: counts.ShotShort ?? 0,
        logo: makeMonoLogo('SH', '#84CC16', '#09090B', 'border-lime-400/35'),
      },
      {
        id: 'MoboReels',
        name: 'MoboReels',
        tagline: 'Original Hits, Asia, Animasi & Dedicated VTT Subtitles',
        available: true,
        count: counts.MoboReels ?? 0,
        logo: makeMonoLogo('MR', '#0EA5E9', '#FFFFFF', 'border-sky-400/35'),
      },
      {
        id: 'BlinkDrama',
        name: 'BlinkDrama',
        tagline: 'Dual AES/Plain HD Streams & Fresh Drama Drops',
        available: true,
        count: counts.BlinkDrama ?? 0,
        logo: makeMonoLogo('BD', '#D946EF', '#FFFFFF', 'border-fuchsia-400/35'),
      },
      {
        id: 'JoyReels',
        name: 'JoyReels',
        tagline: 'Weekly Top Charts, Hot Reels, Films & Asian Series',
        available: true,
        count: counts.JoyReels ?? 0,
        logo: makeMonoLogo('JR', '#F43F5E', '#FFFFFF', 'border-rose-400/35'),
      },
      {
        id: 'SodaReels',
        name: 'SodaReels',
        tagline: 'Multi-Quality Modern Romance & Urban Short Dramas',
        available: true,
        count: counts.SodaReels ?? 0,
        logo: makeMonoLogo('SR', '#06B6D4', '#09090B', 'border-cyan-400/35'),
      },
      {
        id: 'BonusTV',
        name: 'BonusTV',
        tagline: 'CEO Romance, Family Revenge & Vertical Mini-Dramas',
        available: true,
        count: counts.BonusTV ?? 0,
        logo: makeMonoLogo('BT', '#F59E0B', '#09090B', 'border-amber-400/35'),
      },
      {
        id: 'iQIYI',
        name: 'iQIYI',
        tagline: 'Premium C-Drama, K-Drama, Anime, Film & VIP Picks',
        available: true,
        count: counts.iQIYI ?? 0,
        logo: makeMonoLogo('IQ', '#00BE06', '#09090B', 'border-green-400/35'),
      },
    ],
    [t, counts]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q)
    );
  }, [providers, searchQuery]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.providers.hubTitle}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl max-h-[85dvh] rounded-t-3xl sm:rounded-3xl bg-[#111115]/95 backdrop-blur-xl border-t sm:border border-white/15 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mx-auto mt-3" />

        <div className="px-5 pt-4 pb-3 border-b border-white/10 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              {t.providers.hubTitle}
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              {t.providers.hubSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Provider Hub"
            className="min-w-[44px] min-h-[44px] rounded-full bg-white/5 hover:bg-white/15 text-[#A1A1AA] hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Search Bar */}
        <div className="px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#18181D] border border-white/10 focus-within:border-[var(--cd-accent)]">
            <Search className="w-4 h-4 cd-accent-text shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.providers.searchPlaceholder}
              className="w-full bg-transparent text-sm text-white placeholder-[#71717A] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear provider search"
                className="text-[#A1A1AA] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Provider Cards List */}
        <div className="overflow-y-auto p-5 space-y-2.5 pb-8 sm:pb-5">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#A1A1AA]">
              {t.providers.noMatches}
            </div>
          ) : (
            filtered.map((prov) => {
              const isSelected = selectedProvider === prov.id;
              return (
                <button
                  key={prov.id}
                  type="button"
                  disabled={!prov.available}
                  onClick={() => {
                    if (!prov.available) return;
                    onSelectProvider(prov.id);
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all min-h-[68px] ${
                    isSelected
                      ? 'bg-[var(--cd-accent-soft)] border-[var(--cd-accent)] shadow-lg'
                      : prov.available
                      ? 'bg-[#18181D] border-white/10 hover:border-white/30'
                      : 'bg-[#141418]/60 border-white/5 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {prov.logo}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {prov.name}
                        </span>
                        {!prov.available && (
                          <span className="text-[11px] font-medium text-[#71717A]">
                            · {t.providers.comingSoon}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
                        {prov.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {prov.available && (
                      <span className="text-xs font-semibold text-[#D4D4D8] tabular-nums">
                        {prov.count} {t.providers.titlesLoaded}
                      </span>
                    )}
                    {isSelected && (
                      <span className="w-7 h-7 rounded-full cd-accent-bg text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
