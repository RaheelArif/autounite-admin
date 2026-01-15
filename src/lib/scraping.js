/**
 * Scraping API utility functions
 * Handles all scraping-related API calls
 * 
 * Note: All requests automatically include:
 * - X-API-Key header (via authenticatedFetch)
 * - Authorization Bearer token (if authenticated)
 */

import { authenticatedFetch } from './auth';

/**
 * Get scraping summary (dashboard overview)
 */
export const getScrapingSummary = async () => {
  const response = await authenticatedFetch('/api/v1/scraping/summary');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch scraping summary');
  }

  const data = await response.json();
  return data;
};

/**
 * Get scraping progress with filters
 */
export const getScrapingProgress = async (filters = {}) => {
  const {
    step,
    status,
    year,
  } = filters;

  const params = new URLSearchParams();
  if (step) params.append('step', step);
  if (status) params.append('status', status);
  if (year) params.append('year', year);

  const response = await authenticatedFetch(`/api/v1/scraping/progress?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch scraping progress');
  }

  const data = await response.json();
  return data;
};

/**
 * Get pending items
 */
export const getPendingItems = async (filters = {}) => {
  const {
    step,
    limit = 50,
  } = filters;

  const params = new URLSearchParams();
  if (step) params.append('step', step);
  params.append('limit', limit.toString());

  const response = await authenticatedFetch(`/api/v1/scraping/pending?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch pending items');
  }

  const data = await response.json();
  return data;
};

/**
 * Get failed items
 */
export const getFailedItems = async (filters = {}) => {
  const {
    step,
    limit = 50,
  } = filters;

  const params = new URLSearchParams();
  if (step) params.append('step', step);
  params.append('limit', limit.toString());

  const response = await authenticatedFetch(`/api/v1/scraping/failed?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch failed items');
  }

  const data = await response.json();
  return data;
};

/**
 * Retry failed items
 */
export const retryFailedItems = async (data) => {
  const { step, ids } = data;

  const response = await authenticatedFetch('/api/v1/scraping/retry', {
    method: 'POST',
    body: JSON.stringify({ step, ids }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retry failed items');
  }

  const result = await response.json();
  return result;
};

/**
 * Get vehicles with filters
 */
export const getVehicles = async (filters = {}) => {
  const {
    page = 1,
    limit = 50,
    search,
    year,
    make,
    model,
    bodyType,
    drivetrain,
    fuelType,
    isElectric,
    minMpg,
    maxMpg,
    hasFueleconomy,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  
  if (search) params.append('search', search);
  if (year) params.append('year', year);
  if (make) params.append('make', make);
  if (model) params.append('model', model);
  if (bodyType) params.append('bodyType', bodyType);
  if (drivetrain) params.append('drivetrain', drivetrain);
  if (fuelType) params.append('fuelType', fuelType);
  if (isElectric !== undefined && isElectric !== null && isElectric !== '') {
    params.append('isElectric', isElectric.toString());
  }
  if (minMpg) params.append('minMpg', minMpg.toString());
  if (maxMpg) params.append('maxMpg', maxMpg.toString());
  if (hasFueleconomy !== undefined && hasFueleconomy !== null && hasFueleconomy !== '') {
    params.append('hasFueleconomy', hasFueleconomy.toString());
  }

  const response = await authenticatedFetch(`/api/v1/vehicles?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch vehicles');
  }

  const data = await response.json();
  return data;
};

/**
 * Get vehicle statistics
 */
export const getVehicleStats = async () => {
  const response = await authenticatedFetch('/api/v1/vehicles/stats');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch vehicle statistics');
  }

  const data = await response.json();
  return data;
};

/**
 * Get single vehicle by ID
 */
export const getVehicleById = async (id) => {
  const response = await authenticatedFetch(`/api/v1/vehicles/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch vehicle');
  }

  const data = await response.json();
  return data;
};

/**
 * Get vehicle images
 */
export const getVehicleImages = async (id) => {
  const response = await authenticatedFetch(`/api/v1/vehicles/${id}/images`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch vehicle images');
  }

  const data = await response.json();
  return data;
};
