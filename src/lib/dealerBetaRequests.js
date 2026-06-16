import { authenticatedFetch } from './auth';

const PAGE_SIZE = 10;

/**
 * Get dealer beta requests with filters (Admin only)
 */
export const getDealerBetaRequests = async (filters = {}) => {
  const {
    status,
    interested_package,
    state,
    search,
    page = 1,
    limit = PAGE_SIZE,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  if (status) params.append('status', status);
  if (interested_package) params.append('interested_package', interested_package);
  if (state) params.append('state', state);
  if (search) params.append('search', search);

  const response = await authenticatedFetch(`/api/v1/dealer-beta-requests?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch dealer beta requests' }));
    throw new Error(error.message || 'Failed to fetch dealer beta requests');
  }

  return response.json();
};

/**
 * Get dealer beta request statistics (Admin only)
 */
export const getDealerBetaStats = async () => {
  const response = await authenticatedFetch('/api/v1/dealer-beta-requests/stats');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch statistics' }));
    throw new Error(error.message || 'Failed to fetch statistics');
  }

  return response.json();
};

/**
 * Get dealer beta request by ID (Admin only)
 */
export const getDealerBetaRequestById = async (id) => {
  const response = await authenticatedFetch(`/api/v1/dealer-beta-requests/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch dealer beta request' }));
    throw new Error(error.message || 'Failed to fetch dealer beta request');
  }

  return response.json();
};

/**
 * Update dealer beta request (Admin only)
 */
export const updateDealerBetaRequest = async (id, updates) => {
  const { status, admin_notes } = updates;

  const response = await authenticatedFetch(`/api/v1/dealer-beta-requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, admin_notes }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update dealer beta request' }));
    throw new Error(error.message || 'Failed to update dealer beta request');
  }

  return response.json();
};

/**
 * Delete dealer beta request (Admin only)
 */
export const deleteDealerBetaRequest = async (id) => {
  const response = await authenticatedFetch(`/api/v1/dealer-beta-requests/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete dealer beta request' }));
    throw new Error(error.message || 'Failed to delete dealer beta request');
  }

  return response.json();
};

export { PAGE_SIZE as DEALER_BETA_PAGE_SIZE };
