import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Globe,
  ChevronDown,
  Check,
  Menu,
  Loader2,
  Palette,
  User,
  Flame,
} from 'lucide-react';
import { CoffeeDramaLogo } from './CoffeeDramaLogo';
import { PWAInstallButton } from './PWAInstallBanner';
import { useDramaContext } from '../context/DramaContext';
import type {
  AccentThemeId,
  LanguageCode,
  NavTab,
} from '../types/drama';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  languageLoading: boolean;
  onChangeLanguage: (lang: LanguageCode) => void;
  onOpenSearchModal: () => void;
}

const LANGUAGES: { code: LanguageCode; flag: string; label: string }[] = [
  { code: 'id', flag: '🇮🇩', label: 'Bahasa Indonesia (ID)' },
  { code: 'en', flag: '🇺🇸', label: 'English (EN)' },
  { code: 'cn', flag: '🇨🇳', label: '中文 (CN)' },
  { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt (VI)' },
];

const ACCENT_PRESETS: { id: AccentThemeId; name: string; color: string }[] = [
  { id: 'crimson', name: 'Crimson Noir', color: '#EF4444' },
  { id: 'gold', name: 'Espresso Gold', color: '#D4AF37' },
  { id: 'rose', name: 'Royal Rose', color: '#E11D48' },
  { id: 'emerald', name: 'Emerald Jade', color: '#10B981' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  languageLoading,
  onChangeLanguage,
  onOpenSearchModal,
}) => {
  const {
    language,
    t,
    user,
    streak,
    openAuthModal,
    myListItems,
    accentTheme,
    setAccentTheme,
    highContrast,
    setHighContrast,
  } = useDramaContext();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarBroken(false);
  }, [user?.photoURL]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rightRef.current && !rightRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
        setThemeMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLangMenuOpen(false);
        setThemeMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const navTabs: { id: NavTab; label: string }[] = [
    { id: 'home', label: t.nav.home },
    { id: 'explore', label: t.nav.explore },
    { id: 'ranking', label: t.nav.trending },
    { id: 'terbaru', label: t.nav.latest },
    { id: 'vip', label: t.nav.vip },
    { id: 'mylist', label: t.nav.watchlist },
    { id: 'dashboard', label: t.nav.dashboard },
  ];

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-[var(--cd-bg)]/95 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Zone: Brand Logo + Primary Nav Links */}
        <div className="flex items-center gap-5 lg:gap-7 min-w-0">
          <button
            type="button"
            onClick={() => {
              onSelectTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cd-accent)] rounded-lg shrink-0"
            aria-label="House Drama Home"
          >
            <CoffeeDramaLogo />
          </button>

          <nav
            className="hidden lg:flex items-center gap-5"
            aria-label="Primary Navigation"
          >
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {tab.label}
                    {tab.id === 'mylist' && myListItems.length > 0 && (
                      <span className="text-[11px] font-semibold tabular-nums cd-accent-text">
                        ({myListItems.length})
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] cd-accent-bg rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Zone: PWA Install, Theme Accent Switcher, Language Switcher, Search, Account */}
        <div ref={rightRef} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <PWAInstallButton variant="header" />

          {/* Accent Theme & Contrast Customizer */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setThemeMenuOpen((prev) => !prev);
                setLangMenuOpen(false);
              }}
              aria-label={t.engagement.themeTitle}
              aria-expanded={themeMenuOpen}
              className="p-2 rounded-lg bg-[var(--cd-surface)] border border-[var(--cd-border)] hover:border-[var(--cd-accent)] text-[#FAFAFA] transition-colors"
            >
              <Palette className="w-4 h-4 cd-accent-text" />
            </button>

            {themeMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#141418]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-3 z-50 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  {t.engagement.themeTitle}
                </p>
                <div className="space-y-1">
                  {ACCENT_PRESETS.map((preset) => {
                    const active = accentTheme === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAccentTheme(preset.id)}
                        className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                          active
                            ? 'bg-white/10 text-white font-semibold'
                            : 'text-[#D4D4D8] hover:bg-white/5'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/25"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span>{preset.name}</span>
                        </span>
                        {active && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-[#A1A1AA]">
                    {t.engagement.contrastLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHighContrast(!highContrast)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                      highContrast
                        ? 'cd-accent-bg border-[var(--cd-accent)] text-white'
                        : 'bg-[#18181D] border-white/10 text-[#D4D4D8]'
                    }`}
                  >
                    {highContrast
                      ? t.engagement.highContrast
                      : t.engagement.standardContrast}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setLangMenuOpen((prev) => !prev);
                setThemeMenuOpen(false);
              }}
              disabled={languageLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--cd-surface)] border border-[var(--cd-border)] hover:border-white/25 text-xs font-medium text-[#FAFAFA] whitespace-nowrap shrink-0 transition-colors"
              aria-label="Switch language"
              aria-expanded={langMenuOpen}
            >
              {languageLoading ? (
                <Loader2 className="w-3.5 h-3.5 cd-accent-text animate-spin" />
              ) : (
                <span aria-hidden="true">{currentLang.flag}</span>
              )}
              <span className="hidden md:inline">{currentLang.label}</span>
              <span className="md:hidden uppercase">{currentLang.code}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA]" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#141418]/95 backdrop-blur-xl border border-white/15 shadow-2xl py-1.5 z-50">
                {LANGUAGES.map((l) => {
                  const active = language === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        onChangeLanguage(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                        active
                          ? 'cd-accent-text bg-[var(--cd-accent-soft)] font-semibold'
                          : 'text-[#FAFAFA] hover:bg-white/5'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </span>
                      {active && <Check className="w-3.5 h-3.5 cd-accent-text" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Modal Button */}
          <button
            type="button"
            onClick={onOpenSearchModal}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[var(--cd-surface)] border border-[var(--cd-border)] hover:border-[var(--cd-accent)] text-xs text-[#FAFAFA] hover:text-white transition-colors"
            aria-label={t.nav.search}
          >
            <Search className="w-3.5 h-3.5 cd-accent-text" />
            <span className="hidden lg:inline text-[#A1A1AA]">
              {t.nav.search}
            </span>
          </button>

          {/* Daily Watch Streak Pill (Desktop lg+) */}
          {user && streak.count > 0 && (
            <button
              type="button"
              onClick={() => openAuthModal()}
              title={t.retention.streakRule}
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/35 text-[11px] font-bold text-orange-300 whitespace-nowrap shrink-0"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span className="tabular-nums">{streak.count}</span>
            </button>
          )}

          {/* Desktop Account / Google Sign-In Button */}
          <button
            type="button"
            onClick={() => openAuthModal()}
            aria-label={user ? t.nav.account : t.nav.login}
            className="hidden md:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[var(--cd-surface)] border border-[var(--cd-border)] hover:border-[var(--cd-accent)] text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
          >
            {user ? (
              <>
                {user.photoURL && !avatarBroken ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarBroken(true)}
                    className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/25"
                  />
                ) : (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {user.avatarInitials}
                  </span>
                )}
                <span className="max-w-[90px] truncate">
                  {user.displayName.split(' ')[0]}
                </span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 cd-accent-text" />
                <span>{t.nav.login}</span>
              </>
            )}
          </button>

          {/* Drawer Trigger for smaller viewports */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg text-[#FAFAFA] hover:bg-white/5"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Responsive Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[var(--cd-bg)]/95 backdrop-blur-xl px-4 py-3 space-y-1">
          {[
            ...navTabs,
            { id: 'anime' as NavTab, label: t.nav.anime },
            { id: 'dubbing' as NavTab, label: t.nav.dubbed },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onSelectTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                  isActive
                    ? 'bg-[var(--cd-accent-soft)] cd-accent-text'
                    : 'text-[#FAFAFA] hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === 'mylist' && myListItems.length > 0 && (
                  <span className="text-xs tabular-nums">
                    {myListItems.length}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-[#A1A1AA]">
            <span className="inline-flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 cd-accent-text" />
              {currentLang.label}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
