/** Sidebar order + navbar titles (keep in sync). */
export const ADMIN_NAV_ITEMS = [
  { id: 'search-governance', label: 'Search QA' },
  { id: 'blog', label: 'Blog' },
  { id: 'users', label: 'Users' },
  { id: 'dealer-bootstrap', label: 'Dealer Bootstrap' },
  { id: 'scraping', label: 'Scraping' },
];

const EXTRA_PAGE_TITLES = {
  request: 'User Requests',
  queries: 'Search Queries',
};

/** @param {string} tabId */
export function getAdminNavTitle(tabId) {
  const fromNav = ADMIN_NAV_ITEMS.find((item) => item.id === tabId);
  if (fromNav) return fromNav.label;
  return EXTRA_PAGE_TITLES[tabId] || 'Admin';
}
