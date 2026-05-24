const DEFAULT_CONSUMER_BASE = 'https://www.autounite.com';

export function getConsumerBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_CONSUMER_BASE_URL || DEFAULT_CONSUMER_BASE;
  return String(raw).trim().replace(/\/+$/, '') || DEFAULT_CONSUMER_BASE;
}

/**
 * Deep link to consumer Research or Cars Near Me for a governance log row.
 */
export function buildConsumerSearchUrl({ surface, rawQuery, zip, radius = 50 } = {}) {
  const query = String(rawQuery || '').trim();
  if (!query) return null;

  const base = getConsumerBaseUrl();

  if (surface === 'cars_near_me') {
    const params = new URLSearchParams({ q: query });
    if (zip) {
      params.set('zip', String(zip).trim());
      params.set('radius', String(radius || 50));
    }
    return `${base}/cars-near-me?${params.toString()}`;
  }

  const params = new URLSearchParams({ q: query, page: '1' });
  return `${base}/research?${params.toString()}`;
}

export function getConsumerOpenLabel(surface) {
  if (surface === 'cars_near_me') return 'Open in Cars Near Me';
  return 'Open in Research';
}
