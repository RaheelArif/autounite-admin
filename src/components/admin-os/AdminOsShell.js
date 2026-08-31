'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ADMIN_OS_LEGACY_LINKS,
  ADMIN_OS_TAB_ORDER,
  ADMIN_OS_TABS,
  getAdminOsEnvironmentLabel,
} from '@/config/adminOsTabs';
import { getUser, logout } from '@/lib/auth';
import { hrefForAdminOsToolId, parseAdminOsTool } from '@/lib/adminOsTools';
import AdminOsCardDrawer from '@/components/admin-os/AdminOsCardDrawer';
import AdminOsToolWorkspace from '@/components/admin-os/AdminOsToolWorkspace';
import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn, FaBars, FaTimes } from 'react-icons/fa';
import '../../app/admin/admin-os.css';

const ADMIN_OS_SOCIAL_LINKS = [
  { id: 'facebook', label: 'Facebook', href: 'https://facebook.com/autounite', Icon: FaFacebookF },
  { id: 'instagram', label: 'Instagram', href: 'https://instagram.com/autouniteofficial', Icon: FaInstagram },
  { id: 'youtube', label: 'YouTube', href: 'https://youtube.com/@AutoUniteOfficial', Icon: FaYoutube },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/auto-unite/', Icon: FaLinkedinIn },
];

function initialsFromUser(user) {
  const name = user?.name || user?.email || 'AU';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
}

const CARD_ICONS = ['▦', '◈', '◉', '◎', '◇', '▣'];

const BG_LAYER = {
  backgroundImage: [
    'linear-gradient(90deg, rgba(3,5,10,.96) 0%, rgba(5,8,18,.78) 24%, rgba(5,8,18,.45) 52%, rgba(5,8,18,.72) 100%)',
    'linear-gradient(180deg, rgba(5,8,18,.1), rgba(5,8,18,.96))',
    "url('/admin-os/bg/admin-command-bg.jpg')",
  ].join(', '),
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

export default function AdminOsShell({ tabId = 'dealers' }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = ADMIN_OS_TABS[tabId] || ADMIN_OS_TABS.dealers;
  const [cardPage, setCardPage] = useState(0);
  const [activePill, setActivePill] = useState(0);
  const [drawerCard, setDrawerCard] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const envLabel = getAdminOsEnvironmentLabel();
  const user = typeof window !== 'undefined' ? getUser() : null;

  const visibleCards = useMemo(() => {
    const start = cardPage * 3;
    return (tab.cards || []).slice(start, start + 3);
  }, [tab, cardPage]);

  const writeToolQuery = (tool) => {
    const params = new URLSearchParams(searchParams?.toString?.() || '');
    if (tool?.id) params.set('tool', tool.id);
    else params.delete('tool');
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  // Restore embedded tool from ?tool= so URL matches what’s on screen
  useEffect(() => {
    const toolId = searchParams?.get?.('tool');
    if (!toolId) {
      setActiveTool(null);
      return;
    }
    if (activeTool?.id === toolId) return;
    const href = hrefForAdminOsToolId(toolId);
    if (!href) return;
    const tool = parseAdminOsTool(href);
    if (tool && tool.id !== 'external') setActiveTool(tool);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from URL only
  }, [searchParams]);

  const handleCardClick = (card) => {
    if (card?.existingHref) {
      openTool(card.existingHref);
      return;
    }
    setDrawerCard(card);
  };

  const openCard = (card) => handleCardClick(card);

  const openTool = (href) => {
    const tool = parseAdminOsTool(href);
    setDrawerCard(null);
    setAiOpen(false);
    setMobileMenuOpen(false);
    if (!tool || tool.id === 'external') {
      router.push(href);
      return;
    }
    setActiveTool(tool);
    writeToolQuery(tool);
  };

  const closeTool = () => {
    setActiveTool(null);
    writeToolQuery(null);
  };

  const switchTab = (id) => {
    setCardPage(0);
    setActivePill(0);
    setDrawerCard(null);
    setAiOpen(false);
    setActiveTool(null);
    setMobileMenuOpen(false);
    router.push(`/admin/${id}`);
  };

  return (
    <div className="aos-shell">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .aos-shell{display:grid!important;grid-template-columns:248px minmax(0,1fr)!important;min-height:100vh;color:#fff;background:#050812;position:relative}
            .aos-sidebar{display:flex!important;flex-direction:column!important;height:100vh;padding:28px 20px 24px;border-right:1px solid rgba(255,255,255,.13);background:linear-gradient(180deg,rgba(3,6,13,.95),rgba(7,11,22,.92));overflow-y:auto;z-index:40}
            .aos-nav{display:flex!important;flex-direction:column!important;gap:9px;padding-top:12px}
            .aos-nav-btn{border:1px solid transparent;border-radius:14px;background:transparent;color:rgba(255,255,255,.83);padding:13px 14px;display:flex;align-items:center;gap:12px;font:inherit;font-size:15px;cursor:pointer;text-align:left;width:100%}
            .aos-nav-btn.is-active{background:linear-gradient(135deg,#4517f5,#210c9f);border-color:rgba(142,92,255,.45);color:#fff}
            .aos-main{min-width:0;height:100vh;overflow:auto;padding:30px 44px 30px 50px;display:grid;grid-template-rows:auto auto minmax(300px,1fr) auto auto auto;gap:16px;position:relative;z-index:auto}
            .aos-main--tool{display:block!important;grid-template-rows:none!important;padding:20px 28px!important}
            .aos-hero h1{margin:6px 0 10px;font-size:clamp(42px,4.1vw,72px);line-height:.95;letter-spacing:-.055em;font-weight:700}
            .aos-carousel{position:relative;display:flex;align-items:center;justify-content:center;min-height:320px;padding:0 56px 28px}
            .aos-cards{width:min(1060px,100%);display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:24px}
            .aos-card{position:relative;min-height:300px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(180deg,rgba(10,17,30,.86),rgba(7,12,22,.91));border-radius:22px;padding:30px 30px 70px;box-shadow:0 30px 80px rgba(0,0,0,.48);cursor:pointer;text-align:left;color:inherit;font:inherit;width:100%}
            .aos-card h3{margin:0 0 12px;font-size:26px;letter-spacing:-.035em;font-weight:700}
            .aos-card__purpose{margin:0;color:rgba(255,255,255,.75);font-size:15px;line-height:1.5;min-height:70px}
            .aos-chip{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);margin-top:16px;font-size:13px}
            .aos-card__action{position:absolute;left:30px;right:30px;bottom:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,.1);color:#8d5cff;display:flex;justify-content:space-between;font-size:15px;font-weight:600}
            .aos-ai{width:min(930px,78%);margin:0 auto;display:grid;grid-template-columns:70px 1fr 28px;align-items:center;gap:18px;min-height:92px;border:1px solid rgba(255,255,255,.15);background:rgba(9,15,27,.84);border-radius:18px;padding:14px 22px;cursor:pointer}
            .aos-bottom-pills{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:20px}
            .aos-bottom-pill{min-height:64px;border-radius:14px;border:1px solid rgba(255,255,255,.13);background:rgba(10,15,26,.76);color:#fff;font:inherit;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer}
            .aos-bottom-pill.is-active{background:linear-gradient(135deg,#4517f5,#210c9f)}
            .aos-utility{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
            .aos-pill{border:1px solid rgba(255,255,255,.16);background:rgba(6,10,19,.72);color:#fff;border-radius:14px;min-height:44px;padding:0 16px;display:inline-flex;align-items:center;gap:10px}
            .aos-top{display:flex;justify-content:space-between;align-items:center;min-height:50px;gap:12px;flex-wrap:wrap}
            .aos-shell__bg,.aos-shell__glow{position:fixed;inset:0;pointer-events:none}
            .aos-shell__bg{z-index:-3;filter:saturate(1.1) contrast(1.08)}
            .aos-shell__glow{z-index:-2;background:radial-gradient(circle at 62% 18%,rgba(111,48,255,.26),transparent 32%),radial-gradient(circle at 20% 85%,rgba(232,169,78,.12),transparent 28%)}
            .aos-mobile-bar{display:none}

            @media (max-width:1023px){
              .aos-shell{display:flex!important;flex-direction:column!important;grid-template-columns:1fr!important;min-height:100vh}
              .aos-mobile-bar{display:flex!important;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;height:56px;padding:0 16px;background:rgba(5,8,18,.95);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.12)}
              .aos-sidebar{position:fixed!important;top:0;left:0;bottom:0;width:280px!important;max-width:85vw!important;height:100vh!important;z-index:1000!important;transform:translateX(-100%);transition:transform .28s cubic-bezier(.16,1,.3,1),opacity .28s ease;opacity:0;pointer-events:none;box-shadow:20px 0 50px rgba(0,0,0,.85)}
              .aos-sidebar.is-mobile-open{transform:translateX(0)!important;opacity:1!important;pointer-events:auto!important}
              .aos-sidebar-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:999}
              .aos-main{height:auto!important;min-height:calc(100vh - 56px);padding:16px!important;overflow-x:hidden!important}
              .aos-main--tool{padding:12px!important}
              .aos-cards{grid-template-columns:1fr!important;width:100%!important}
              .aos-carousel{padding:0 10px 24px!important;min-height:unset!important}
              .aos-bottom-pills{grid-template-columns:1fr 1fr!important;gap:12px!important}
              .aos-ai{width:100%!important;grid-template-columns:50px 1fr 20px!important;padding:12px 16px!important}
              .aos-top{flex-direction:column!important;align-items:flex-start!important;gap:8px!important}
            }
            @media (max-width:480px){
              .aos-bottom-pills{grid-template-columns:1fr!important}
            }
          `,
        }}
      />
      <div className="aos-shell__bg" style={BG_LAYER} aria-hidden />
      <div className="aos-shell__glow" aria-hidden />

      {/* Mobile Top Header */}
      <div className="aos-mobile-bar">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors flex items-center justify-center border border-white/15 shadow-sm"
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
          >
            {mobileMenuOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
          </button>
          <img src="/au-mark-white.png" alt="AutoUnite" width={80} height={34} className="object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/30 text-indigo-200 border border-indigo-500/30">
            {activeTool ? activeTool.label : tab.label}
          </span>
          <button
            type="button"
            className="aos-avatar-btn !w-8 !h-8 !text-xs"
            title={user?.email || 'Admin'}
            onClick={() => { try { logout(); } catch {} router.push('/login'); }}
          >
            {initialsFromUser(user)}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileMenuOpen ? (
        <div
          className="aos-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside className={`aos-sidebar${mobileMenuOpen ? ' is-mobile-open' : ''}`} aria-label="Admin OS navigation">
        <div className="aos-logo flex items-center justify-between">
          <img src="/au-mark-white.png" alt="AutoUnite" width={96} height={40} />
          {mobileMenuOpen && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="aos-nav">
          {ADMIN_OS_TAB_ORDER.map((id) => {
            const item = ADMIN_OS_TABS[id];
            return (
              <button
                key={id}
                type="button"
                className={`aos-nav-btn${tab.id === id && !activeTool ? ' is-active' : ''}`}
                onClick={() => switchTab(id)}
                aria-current={tab.id === id && !activeTool ? 'page' : undefined}
                title={item.label}
              >
                <span className="aos-nav-btn__icon" aria-hidden>{item.icon}</span>
                <span className="aos-nav-btn__label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="aos-sidebar-section">
          <p className="aos-sidebar-section__label">Connected tools</p>
          <nav className="aos-nav">
            {ADMIN_OS_LEGACY_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                className={`aos-nav-btn${activeTool?.id === link.id ? ' is-active' : ''}`}
                onClick={() => openTool(link.href)}
                title={link.label}
              >
                <span className="aos-nav-btn__icon" aria-hidden>·</span>
                <span className="aos-nav-btn__label">{link.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="aos-sidebar-footer">
          <span className="aos-follow">Follow Us</span>
          <div className="aos-socials">
            {ADMIN_OS_SOCIAL_LINKS.map(({ id, label, href, Icon }) => (
              <a
                key={id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="aos-socials__link"
                aria-label={label}
                title={label}
              >
                <Icon aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </aside>

      <main className={`aos-main${activeTool ? ' aos-main--tool' : ''}`}>
        <div className="aos-top">
          <div className="aos-breadcrumb">
            {activeTool
              ? `Admin OS > Connected tools > ${activeTool.label}`
              : `Admin OS > ${tab.label}`}
          </div>
          <div className="aos-utility">
            <span className="aos-pill">▣ Admin OS</span>
            <span className={`aos-pill aos-pill--env${envLabel === 'Staging' ? ' is-staging' : envLabel === 'Production' ? ' is-production' : ''}`}>
              <i aria-hidden />
              <strong>{envLabel}</strong>
            </span>
            <button type="button" className="aos-bell" aria-label="Notifications">♧<em>0</em></button>
            <button
              type="button"
              className="aos-avatar-btn"
              title={user?.email || 'Admin'}
              onClick={() => { try { logout(); } catch {} router.push('/login'); }}
            >
              {initialsFromUser(user)}
            </button>
          </div>
        </div>

        {activeTool ? (
          <AdminOsToolWorkspace tool={activeTool} onBack={closeTool} />
        ) : (
          <>
            <section className="aos-hero">
              <h1>{tab.label}</h1>
              <p>{tab.description}</p>
            </section>

            <section className="aos-carousel" aria-label="Admin cards">
              <button type="button" className="aos-carousel__arrow aos-carousel__arrow--left" aria-label="Previous card page" disabled={cardPage <= 0} onClick={() => setCardPage(0)}>‹</button>

              <div className="aos-cards">
                {visibleCards.map((card, idx) => (
                  <button key={card.title} type="button" className="aos-card" onClick={() => openCard(card)}>
                    <div className="aos-card__icon" aria-hidden>{CARD_ICONS[(cardPage * 3 + idx) % CARD_ICONS.length]}</div>
                    <h3>{card.title}</h3>
                    <p className="aos-card__purpose">{card.purpose}</p>
                    <span className={`aos-chip${card.tone === 'amber' ? ' aos-chip--amber' : ''}`}>
                      <i aria-hidden />
                      {card.status}
                    </span>
                    <span className="aos-card__action">
                      <span>{card.action}</span>
                      <span aria-hidden>›</span>
                    </span>
                  </button>
                ))}
              </div>

              <button type="button" className="aos-carousel__arrow aos-carousel__arrow--right" aria-label="Next card page" disabled={cardPage >= 1} onClick={() => setCardPage(1)}>›</button>

              <div className="aos-dots" aria-label="Card pages">
                <button type="button" className={`aos-dot${cardPage === 0 ? ' is-active' : ''}`} aria-label="Page 1 of 2" onClick={() => setCardPage(0)} />
                <button type="button" className={`aos-dot${cardPage === 1 ? ' is-active' : ''}`} aria-label="Page 2 of 2" onClick={() => setCardPage(1)} />
                <span className="aos-page-num">{cardPage + 1} / 2</span>
              </div>
            </section>

            <section
              className="aos-ai"
              role="button"
              tabIndex={0}
              aria-label="Open AI Assistant"
              onClick={() => setAiOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAiOpen(true); } }}
            >
              <div className="aos-ai__orb" aria-hidden>✦</div>
              <div>
                <strong>AI Assistant</strong>
                <p>{tab.ai}</p>
              </div>
              <span className="aos-ai__chevron" aria-hidden>›</span>
            </section>

            <section className="aos-bottom-pills" aria-label="Context filters">
              {(tab.pills || []).map((pill, idx) => (
                <button key={pill} type="button" className={`aos-bottom-pill${activePill === idx ? ' is-active' : ''}`} onClick={() => setActivePill(idx)}>
                  {pill}
                </button>
              ))}
            </section>

            <p className="aos-note">
              Phase 2 · Linked tools open inside Admin OS (sidebar stays) · No backend route changes
            </p>
          </>
        )}
      </main>

      {drawerCard ? (
        <AdminOsCardDrawer
          card={drawerCard}
          filterLabel={tab.pills?.[activePill]}
          onClose={() => setDrawerCard(null)}
          onOpenExisting={openTool}
        />
      ) : null}

      {aiOpen ? (
        <>
          <div className="aos-overlay" onClick={() => setAiOpen(false)} aria-hidden />
          <aside className="aos-ai-panel" role="dialog" aria-modal="true" aria-label="AI Assistant">
            <div className="aos-ai-panel__head">
              <div>
                <div className="aos-drawer__eyebrow">Contextual AI</div>
                <h2>AI Assistant</h2>
              </div>
              <button type="button" className="aos-drawer__close" onClick={() => setAiOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="aos-ai-panel__body">
              <p style={{ marginTop: 0 }}>{tab.ai}</p>
              <button type="button" className="aos-suggestion">Summarize this tab (coming later)</button>
              <button type="button" className="aos-suggestion">Suggest next admin step (coming later)</button>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                BuildX rule: no sensitive actions without confirmation, role check, and audit.
              </p>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
