/**
 * Map Admin OS existingHref → in-shell tool (no legacy sidebar jump).
 */

export function parseAdminOsTool(href) {
  const raw = String(href || '').trim();
  if (!raw) return null;

  let path = raw;
  let search = '';
  const q = raw.indexOf('?');
  if (q >= 0) {
    path = raw.slice(0, q);
    search = raw.slice(q + 1);
  }
  const params = new URLSearchParams(search);
  const normalized = path.replace(/\/$/, '') || '/';

  if (normalized === '/users') {
    return {
      id: 'users',
      label: 'Users',
      href: raw,
      props: { tab: params.get('tab') || 'users' },
    };
  }
  if (normalized === '/request') {
    return { id: 'request', label: 'User Requests', href: raw, props: {} };
  }
  if (normalized === '/blog') {
    return { id: 'blog', label: 'Blog admin', href: raw, props: {} };
  }
  if (normalized === '/dealer-beta') {
    return { id: 'dealer-beta', label: 'Dealer Beta', href: raw, props: {} };
  }
  if (normalized === '/dealer-bootstrap') {
    return {
      id: 'dealer-bootstrap',
      label: 'Dealer Bootstrap',
      href: raw,
      props: {
        section: params.get('section') || 'bootstrap',
        inbox: params.get('inbox') || 'verification',
      },
    };
  }
  if (normalized === '/queries') {
    return { id: 'queries', label: 'Search Queries', href: raw, props: {} };
  }
  if (normalized === '/catalog') {
    return { id: 'catalog', label: 'Vehicles (Data Ops)', href: raw, props: {} };
  }
  if (normalized === '/search-governance') {
    return { id: 'search-governance', label: 'Search QA', href: raw, props: {} };
  }

  return { id: 'external', label: 'Admin tool', href: raw, props: {} };
}
