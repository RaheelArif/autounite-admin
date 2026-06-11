/**
 * Admin OS backgrounds — /public/background/
 *
 * Pack: Admin OS 100 Final (single control-room scene for all admin surfaces)
 * - Desktop: 1920×1080 — dashboard, tables, scraping, users, blog, search QA, dealer bootstrap
 * - Mobile:  1080×1920 — same routes on narrow screens
 *
 * Recommended delivery format per README: webp. Mobile falls back to desktop if missing.
 */

export const ADMIN_BACKGROUNDS = {
  /** Login + all authenticated admin routes share one OS scene */
  admin: {
    desktop: '/background/autounite_admin_os_desktop_1920x1080.webp',
    mobile: '/background/autounite_admin_os_mobile_1080x1920.webp',
  },
};

/** @param {keyof typeof ADMIN_BACKGROUNDS} [surface='admin'] */
export function getAdminBackground(surface = 'admin') {
  const entry = ADMIN_BACKGROUNDS[surface] || ADMIN_BACKGROUNDS.admin;
  const desktop = entry.desktop || null;
  const mobile = entry.mobile || desktop;
  return { desktop, mobile };
}
