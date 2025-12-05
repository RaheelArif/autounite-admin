/**
 * Queries API utility functions
 * Handles all query-related API calls
 * 
 * Note: All requests automatically include:
 * - X-API-Key header (via authenticatedFetch)
 * - Authorization Bearer token (if authenticated)
 */

import { authenticatedFetch } from './auth';

/**
 * Get all queries with filters
 */
export const getQueries = async (filters = {}) => {
  const {
    hasResults,
    searchAttempted,
    userEmail,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  // Build query string
  const params = new URLSearchParams();
  if (hasResults !== undefined && hasResults !== null && hasResults !== '') {
    params.append('hasResults', hasResults);
  }
  if (searchAttempted !== undefined && searchAttempted !== null && searchAttempted !== '') {
    params.append('searchAttempted', searchAttempted);
  }
  if (userEmail) {
    params.append('userEmail', userEmail);
  }
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  const response = await authenticatedFetch(`/api/v1/queries?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch queries');
  }

  const data = await response.json();
  return data;
};

/**
 * Get queries without results
 */
export const getQueriesWithoutResults = async (page = 1, limit = 50) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await authenticatedFetch(`/api/v1/queries/no-results?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch queries without results');
  }

  const data = await response.json();
  return data;
};

/**
 * Get query statistics
 */
export const getQueryStats = async () => {
  try {
    const response = await authenticatedFetch('/api/v1/queries/stats');

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch query statistics' }));
      throw new Error(error.message || 'Failed to fetch query statistics');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Re-throw with more context if it's a 403
    if (error.message && error.message.includes('forbidden')) {
      throw new Error('Access denied. You need admin privileges to view query statistics.');
    }
    throw error;
  }
};

/**
 * Get query by ID
 */
export const getQueryById = async (id) => {
  const response = await authenticatedFetch(`/api/v1/queries/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch query');
  }

  const data = await response.json();
  return data;
};

