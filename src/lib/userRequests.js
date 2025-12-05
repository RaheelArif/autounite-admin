/**
 * User Requests API utility functions
 * Handles all user request management API calls
 * 
 * Note: Admin endpoints automatically include:
 * - X-API-Key header (via authenticatedFetch)
 * - Authorization Bearer token (required for admin endpoints)
 */

import { authenticatedFetch, getDefaultHeaders } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

/**
 * Submit a demo request (Public - no auth required)
 */
export const submitDemoRequest = async (requestData) => {
  const { email, firstName, lastName, source, metadata } = requestData;

  const response = await fetch(`${API_BASE_URL}/api/v1/user-requests`, {
    method: 'POST',
    headers: getDefaultHeaders(),
    body: JSON.stringify({
      email,
      firstName,
      lastName,
      source: source || 'website',
      metadata: metadata || {},
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to submit request' }));
    throw new Error(error.message || 'Failed to submit request');
  }

  const data = await response.json();
  return data;
};

/**
 * Get all user requests with filters (Admin only)
 */
export const getUserRequests = async (filters = {}) => {
  const {
    status,
    source,
    search,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  // Build query string
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status) {
    params.append('status', status);
  }
  if (source) {
    params.append('source', source);
  }
  if (search) {
    params.append('search', search);
  }
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  const response = await authenticatedFetch(`/api/v1/user-requests?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch user requests' }));
    throw new Error(error.message || 'Failed to fetch user requests');
  }

  const data = await response.json();
  return data;
};

/**
 * Get user request statistics (Admin only)
 */
export const getUserRequestStats = async () => {
  const response = await authenticatedFetch('/api/v1/user-requests/stats');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch statistics' }));
    throw new Error(error.message || 'Failed to fetch statistics');
  }

  const data = await response.json();
  return data;
};

/**
 * Get user request by ID (Admin only)
 */
export const getUserRequestById = async (id) => {
  const response = await authenticatedFetch(`/api/v1/user-requests/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch user request' }));
    throw new Error(error.message || 'Failed to fetch user request');
  }

  const data = await response.json();
  return data;
};

/**
 * Update user request (Admin only)
 */
export const updateUserRequest = async (id, updates) => {
  const { status, notes } = updates;

  const response = await authenticatedFetch(`/api/v1/user-requests/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status,
      notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update user request' }));
    throw new Error(error.message || 'Failed to update user request');
  }

  const data = await response.json();
  return data;
};

/**
 * Delete user request (Admin only)
 */
export const deleteUserRequest = async (id) => {
  const response = await authenticatedFetch(`/api/v1/user-requests/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete user request' }));
    throw new Error(error.message || 'Failed to delete user request');
  }

  const data = await response.json();
  return data;
};

