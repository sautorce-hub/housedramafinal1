import React, { useEffect, useState } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  Mail,
  MessageCircle,
  Eye,
  Users,
} from 'lucide-react';
import { CoffeeDramaLogo } from './CoffeeDramaLogo';
import { useDramaContext } from '../context/DramaContext';
import type { LegalModalTopic } from '../types/drama';

interface VisitorStats {
  onlineNow: number;
  todayVisitors: number;
  totalVisitors: number;
  totalViews: number;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem('hd_session_id');
    if (!sid) {
      sid = createId('s');
      sessionStorage.setItem('hd_session_id', sid);
    }
    return sid;
  } catch {
    return createId('s');
  }
}

function getVisitorId(): string {
  try {
    let vid = localStorage.getItem('hd_visitor_id');
    if (!vid) {
      vid = createId('v');
      localStorage.setItem('hd_visitor_id', vid);
    }
    // Clean up legacy seeded localStorage keys if present
    localStorage.removeItem('house_visits_total');
    localStorage.removeItem('coffee_visits_total');
    return vid;
  } catch {
    return getSessionId();
  }
}

const COLLECTION_LINKS = [
  { path: '/genre/ceo-romance', label: 'CEO Romance' },
  { path: '/genre/billionaire-revenge', label: 'Billionaire Revenge' },
  { path: '/genre/hidden-identity-ceo', label: 'Hidden Identity' },
  { path: '/genre/flash-marriage-romance', label: 'Flash Marriage' },
  { path: '/genre/completed-ceo-romance', label: 'Completed Series' },
  { path: '/genre/rebirth-revenge', label: 'Rebirth & Vengeance' },
  { path: '/genre/royal-palace-drama', label: 'Royal Palace' },
  { path: '/genre/best-vertical-short-dramas', label: 'Top Short Dramas' },
];

export const Footer: React.FC = () => {
  const { t, pushToast, setHelpModalOpen } = useDramaContext();
  const [activeModal, setActiveModal] = useState<LegalModalTopic | null>(null);
  const [stats, setStats] = useState<VisitorStats>({
    onlineNow: 0,
    todayVisitors: 0,
    totalVisitors: 0,
    totalViews: 0,
  });

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);

  // Sync realistic visitor & viewer stats directly with PostgreSQL backend (starting from 0)
  useEffect(() => {
    const sid = getSessionId();
    const vid = getVisitorId();
    let mounted = true;

    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/visitors/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, visitorId: vid }),
        });
        if (res.ok && mounted) {
          const data = (await res.json()) as Partial<VisitorStats>;
          setStats({
            onlineNow: Math.max(0, Number(data.onlineNow) || 0),
            todayVisitors: Math.max(0, Number(data.todayVisitors) || 0),
            totalVisitors: Math.max(0, Number(data.totalVisitors) || 0),
            totalViews: Math.max(0, Number(data.totalViews) || 0),
          });
        }
      } catch {
        // Keep current DB-backed counts if temporarily offline
      }
    };

    const handleViewRecorded = (evt: Event) => {
      const detail = (evt as CustomEvent<{ siteTotalViews?: number }>).detail;
      if (detail && typeof detail.siteTotalViews === 'number' && mounted) {
        setStats((prev) => ({
          ...prev,
          totalViews: Math.max(prev.totalViews, detail.siteTotalViews!),
        }));
      }
    };

    void sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, 25000);
    window.addEventListener('hd:view-recorded', handleViewRecorded);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener('hd:view-recorded', handleViewRecorded);
    };
  }, []);

  useEffect(() => {
    if (!activeModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeModal]);

  const legalLinks: { topic: LegalModalTopic; label: string }[] = [
    { topic: 'about', label: t.footer.about },
    { topic: 'privacy', label: t.footer.privacy },
    { topic: 'terms', label: t.footer.terms },
    { topic: 'dmca', label: t.footer.dmca },
    { topic: 'contact', label: t.footer.contact },
  ];

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMsg.trim()) return;
    setContactSent(true);
    pushToast(t.contactForm.sentSuccess, 'gold');
    setContactName('');
    setContactEmail('');
    setContactMsg('');
  };

  return (
    <>
      <footer className="border-t border-white/[0.08] bg-[#090706] pt-12 sm:pt-14 pb-[calc(6.75rem+env(safe-area-inset-bottom))] md:pb-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8">
            {/* Brand + Editorial Statement */}
            <div className="sm:col-span-2 lg:col-span-3 space-y-3.5">
              <CoffeeDramaLogo />
              <p className="text-xs sm:text-[13px] text-[#8E8E93] leading-relaxed max-w-xs">
                {t.footer.tagline}
              </p>
            </div>

            {/* Curated Collections */}
            <nav
              aria-label={t.footer.collectionsTitle}
              className="lg:col-span-3 space-y-3"
            >
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D4D4D8]">
                {t.footer.collectionsTitle}
              </h3>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {COLLECTION_LINKS.map((link) => (
                  <li key={link.path}>
                    <a
                      href={link.path}
                      onClick={(e) => {
                        e.preventDefault();
                        window.dispatchEvent(
                          new CustomEvent('hd:navigate-path', {
                            detail: { path: link.path },
                          })
                        );
                      }}
                      className="inline-flex items-center min-h-[36px] text-xs text-[#8E8E93] hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Legal & Information */}
            <nav
              aria-label={t.footer.linksTitle}
              className="lg:col-span-2 space-y-3"
            >
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D4D4D8]">
                {t.footer.linksTitle}
              </h3>
              <ul className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-0.5">
                {legalLinks.map((item) => (
                  <li key={item.topic}>
                    <button
                      type="button"
                      onClick={() => {
                        setContactSent(false);
                        setActiveModal(item.topic);
                      }}
                      className="inline-flex items-center min-h-[36px] text-xs text-[#8E8E93] hover:text-white transition-colors text-left"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => setHelpModalOpen(true)}
                    className="inline-flex items-center min-h-[36px] text-xs text-[#A1A1AA] hover:text-white transition-colors text-left"
                  >
                    {t.footer.helpCenter}
                  </button>
                </li>
              </ul>
            </nav>

            {/* Audience Reach Widget (Restored Subtle Card + Thin Hairline Aesthetic) */}
            <div className="sm:col-span-2 lg:col-span-4 space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D4D4D8]">
                {t.footer.communityTitle}
              </h3>
              <div className="rounded-2xl bg-[#12100F] border border-white/[0.08] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    <span className="text-xs font-medium text-[#E4E4E7]">
                      {t.footer.onlineNow}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 tabular-nums">
                    {stats.onlineNow.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.08]">
                  <div className="rounded-xl bg-[#1A1512]/70 border border-white/[0.05] px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[10px] text-[#8E8E93] truncate">
                      <Users className="w-3 h-3 text-[#D4AF37] shrink-0" />
                      <span className="truncate">{t.footer.todayVisitors}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-0.5 tabular-nums">
                      {stats.todayVisitors.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#1A1512]/70 border border-white/[0.05] px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[10px] text-[#8E8E93] truncate">
                      <Users className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{t.footer.totalVisitors}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-0.5 tabular-nums">
                      {stats.totalVisitors.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#1A1512]/70 border border-white/[0.05] px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[10px] text-[#8E8E93] truncate">
                      <Eye className="w-3 h-3 text-[#EF4444] shrink-0" />
                      <span className="truncate">{t.footer.totalViews}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-0.5 tabular-nums">
                      {stats.totalViews.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-xs text-[#71717A] tracking-wide leading-relaxed">
              {t.footer.rights}
            </p>
          </div>
        </div>
      </footer>

      {/* Legal & Contact Modal Drawer */}
      {activeModal && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#141211] border border-white/15 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {t.legal[activeModal].title}
                </h2>
                <p className="text-xs text-[#D4AF37]">
                  {t.legal[activeModal].subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {t.legal[activeModal].paragraphs.map((p, idx) => (
                <p
                  key={idx}
                  className="text-sm text-[#D4D4D8] leading-relaxed"
                >
                  {p}
                </p>
              ))}

              {activeModal === 'contact' && (
                <div className="pt-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <a
                      href="mailto:support@housedrama.fun"
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1A1512] border border-white/10 hover:border-[#EF4444]/60 text-white"
                    >
                      <Mail className="w-4 h-4 text-[#EF4444]" />
                      <div>
                        <p className="text-[10px] text-[#A1A1AA]">
                          {t.contactForm.emailLabel}
                        </p>
                        <p className="font-semibold">support@housedrama.fun</p>
                      </div>
                    </a>
                    <a
                      href="https://t.me/housedrama"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1A1512] border border-white/10 hover:border-[#EF4444]/60 text-white"
                    >
                      <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
                      <div>
                        <p className="text-[10px] text-[#A1A1AA]">
                          {t.contactForm.telegramLabel}
                        </p>
                        <p className="font-semibold">@housedrama</p>
                      </div>
                    </a>
                  </div>

                  {contactSent ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>{t.contactForm.sentSuccess}</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSendContact} className="space-y-3">
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={t.contactForm.namePlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090706] border border-white/10 focus:border-[#EF4444] text-xs text-white focus:outline-none"
                      />
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder={t.contactForm.emailPlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090706] border border-white/10 focus:border-[#EF4444] text-xs text-white focus:outline-none"
                      />
                      <textarea
                        rows={3}
                        required
                        value={contactMsg}
                        onChange={(e) => setContactMsg(e.target.value)}
                        placeholder={t.contactForm.messagePlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#090706] border border-white/10 focus:border-[#EF4444] text-xs text-white focus:outline-none resize-none"
                      />
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{t.contactForm.send}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
