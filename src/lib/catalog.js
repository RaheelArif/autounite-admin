/**
 * Admin Catalog v2 API client
 * GET /api/v1/admin/catalog/*
 */

import { authenticatedFetch } from './auth';

async function catalogFetch(path, options = {}) {
  const response = await authenticatedFetch(`/api/v1/admin/catalog${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Catalog request failed (${response.status})`);
  }
  return data;
}

export const getCatalogYears = async () => catalogFetch('/years');

export const getCatalogMakes = async (year, { canonicalScope = 'shopper' } = {}) => {
  const params = new URLSearchParams({ year: String(year), canonicalScope });
  return catalogFetch(`/makes?${params}`);
};

export const getCatalogModels = async ({ year, make, canonicalScope = 'shopper' }) => {
  const params = new URLSearchParams({
    year: String(year),
    make: String(make),
    canonicalScope,
  });
  return catalogFetch(`/models?${params}`);
};

export const getCatalogVehicles = async (filters = {}) => {
  const {
    year,
    make,
    model,
    page = 1,
    limit = 50,
    search,
    enrichStatus,
    hasFueleconomy,
    canonicalScope = 'shopper',
    sortBy = 'trim',
    sortOrder = 'asc',
  } = filters;

  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (make) params.set('make', String(make));
  if (model) params.set('model', String(model));
  params.set('page', String(page));
  params.set('limit', String(limit));
  params.set('sortBy', sortBy);
  params.set('sortOrder', sortOrder);
  params.set('canonicalScope', canonicalScope || 'shopper');
  if (search) params.set('search', search);
  if (enrichStatus) params.set('enrichStatus', enrichStatus);
  if (hasFueleconomy !== undefined && hasFueleconomy !== null && hasFueleconomy !== '') {
    params.set('hasFueleconomy', String(hasFueleconomy));
  }

  return catalogFetch(`/vehicles?${params}`);
};

export const getCatalogVehicleById = async (id) => catalogFetch(`/vehicles/${id}`);

export const checkNewInMarket = async ({ year, make, depth } = {}) => {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (make) params.set('make', String(make));
  if (depth) params.set('depth', String(depth));
  const q = params.toString();
  return catalogFetch(`/check-new-in-market${q ? `?${q}` : ''}`);
};

/** Controlled write: max 50 vehicles hard-capped on API. */
export const ingestMarketGaps = async ({ year, targets, max = 5, perModel = 2 } = {}) => {
  return catalogFetch('/ingest-market-gaps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, targets, max, perModel }),
  });
};
