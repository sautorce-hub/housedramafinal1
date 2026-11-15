import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Share,
  Smartphone,
  Sparkles,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useDramaContext } from '../context/DramaContext';

const PWA_WELCOME_DISMISSED_KEY = 'house_drama_welcome_pwa_v1';
const LEGACY_PWA_DISMISSED_KEY = 'house_drama_pwa_dismissed_v1';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner';
  playerOpen?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  playerOpen = false,
}) => {
  const { t, pushToast } = useDramaContext();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return (
        localStorage.getItem(PWA_WELCOME_DISMISSED_KEY) === '1' ||
        localStorage.getItem(LEGACY_PWA_DISMISSED_KEY) === '1'
      );
    } catch {
      return false;
    }
  });

  // First-visit Welcome / Install App Popup Modal (appears once on initial visit if not installed)
  useEffect(() => {
    if (variant !== 'banner' || isInstalled || dismissed || playerOpen) return;
    const timer = window.setTimeout(() => {
      setPopupOpen(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [variant, isInstalled, dismissed, playerOpen]);

  const handleDismissPopup = () => {
    setPopupOpen(false);
    setShowManualGuide(false);
    setDismissed(true);
    try {
      localStorage.setItem(PWA_WELCOME_DISMISSED_KEY, '1');
      localStorage.setItem(LEGACY_PWA_DISMISSED_KEY, '1');
    } catch {
      // Ignore storage failures
    }
  };

  const handleInstallAction = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        pushToast('House Drama installed!', 'gold');
        handleDismissPopup();
      }
      return;
    }
    if (isIOS) {
      setShowManualGuide(true);
      return;
    }
    setShowManualGuide((prev) => !prev);
  };

  useEffect(() => {
    if (!popupOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismissPopup();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [popupOpen]);

  if (isInstalled) return null;

  if (variant === 'banner') {
    if (!popupOpen || playerOpen || dismissed) {
      return null;
    }

    return (
      <div
        onClick={handleDismissPopup}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label={t.pwa.installTitle}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0D0B0A]/95 backdrop-blur-2xl border-t sm:border border-[#D4AF37]/35 shadow-2xl p-5 sm:p-6 pb-[max(22px,env(safe-area-inset-bottom))] space-y-4"
        >
          {/* Mobile drag handle indicator */}
          <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mx-auto -mt-1" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src="/assets/aistudio/logo_dan_pavicon_f5e028e6.png"
                  alt="House Drama"
                  className="w-14 h-14 rounded-2xl border border-[#D4AF37]/40 bg-[#090706] p-1 shadow-lg object-contain"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#D4AF37] text-[#090706] flex items-center justify-center shadow">
                  <Sparkles className="w-3 h-3" />
                </span>
              </div>
              <div className="min-w-0">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-0.5">
                  {t.pwa.welcomeBadge}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {t.pwa.installTitle}
                </h3>
                <p className="text-xs text-[#D4D4D8] mt-1 leading-relaxed">
                  {t.pwa.installBenefits}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismissPopup}
              aria-label={t.pwa.later}
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-[#A1A1AA] hover:text-white shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Clean Feature Highlights */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5 space-y-1">
              <Zap className="w-4 h-4 text-[#D4AF37] mx-auto" />
              <p className="text-[11px] font-semibold text-white">
                {t.pwa.perkFast}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5 space-y-1">
              <Smartphone className="w-4 h-4 cd-accent-text mx-auto" />
              <p className="text-[11px] font-semibold text-white">
                {t.pwa.perkFullscreen}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5 space-y-1">
              <WifiOff className="w-4 h-4 text-emerald-400 mx-auto" />
              <p className="text-[11px] font-semibold text-white">
                {t.pwa.perkOffline}
              </p>
            </div>
          </div>

          {showManualGuide && (
            <div className="rounded-2xl bg-[#1A1512] border border-[#D4AF37]/30 p-3.5 space-y-1.5">
              <div className="flex items-start gap-2.5 text-xs text-white font-medium leading-relaxed">
                {isIOS ? (
                  <Share className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                )}
                <span>
                  {isIOS ? t.pwa.iosTooltip : t.pwa.browserInstallHint}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => void handleInstallAction()}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-full cd-accent-bg text-white text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>{t.pwa.installNow}</span>
            </button>
            <button
              type="button"
              onClick={handleDismissPopup}
              className="px-4 py-3 min-h-[44px] rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#D4D4D8] hover:text-white whitespace-nowrap transition-colors"
            >
              {t.pwa.later}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Header compact install button
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isInstallable) {
            void install();
          } else {
            setShowIOSGuide(true);
          }
        }}
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 hover:bg-[#D4AF37]/25 text-[#FDE68A] text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>{t.pwa.installBtn}</span>
      </button>

      {showIOSGuide && (
        <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
};

const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useDramaContext();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-[#090706] border border-[#D4AF37]/30 p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center gap-3">
          <img
            src="/apple-touch-icon.png"
            alt="House Drama"
            className="w-11 h-11 rounded-xl border border-white/15"
          />
          <div>
            <h3 className="text-base font-bold text-white">
              {t.pwa.iosGuideTitle}
            </h3>
            <p className="text-xs text-[#A1A1AA]">Safari Web App</p>
          </div>
        </div>
        <div className="space-y-2 text-xs text-[#D4D4D8] leading-relaxed bg-[#141418] rounded-xl p-3.5 border border-white/10">
          <p className="flex items-center gap-2">
            <Share className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>{t.pwa.iosTooltip}</span>
          </p>
          <p className="text-[#A1A1AA]">{t.pwa.iosStep1}</p>
          <p className="text-[#A1A1AA]">{t.pwa.iosStep2}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-full cd-accent-bg text-white text-xs font-semibold"
        >
          {t.pwa.close}
        </button>
      </div>
    </div>
  );
};
