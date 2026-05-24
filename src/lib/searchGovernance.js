/**
 * S6 — Search governance API (Research + CNM auto-logs)
 */

import { authenticatedFetch } from './auth';

export async function getSearchGovernanceLogs(filters = {}) {
  const {
    surface,
    routeMismatch,
    noResults,
    weakResult,
    q,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const params = new URLSearchParams();
  if (surface) params.append('surface', surface);
  if (routeMismatch !== undefined && routeMismatch !== null && routeMismatch !== '') {
    params.append('routeMismatch', String(routeMismatch));
  }
  if (noResults !== undefined && noResults !== null && noResults !== '') {
    params.append('noResults', String(noResults));
  }
  if (weakResult !== undefined && weakResult !== null && weakResult !== '') {
    params.append('weakResult', String(weakResult));
  }
  if (q) params.append('q', q);
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  const response = await authenticatedFetch(
    `/api/v1/admin/search-governance?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch search governance logs');
  }

  return response.json();
}

export async function getSearchGovernanceStats() {
  const response = await authenticatedFetch('/api/v1/admin/search-governance/stats');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch search governance stats');
  }

  return response.json();
}

export async function getSearchGovernanceLogById(id) {
  const response = await authenticatedFetch(`/api/v1/admin/search-governance/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch log');
  }

  return response.json();
}
