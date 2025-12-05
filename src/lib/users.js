/**
 * Users API utility functions
 * Handles all user management API calls (Admin only)
 * 
 * Note: All requests automatically include:
 * - X-API-Key header (via authenticatedFetch)
 * - Authorization Bearer token (required for admin endpoints)
 */

import { authenticatedFetch } from './auth';

/**
 * Get all users with filters
 */
export const getUsers = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  // Build query string
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) {
    params.append('search', search);
  }
  if (role) {
    params.append('role', role);
  }
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    params.append('isActive', isActive);
  }
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  const response = await authenticatedFetch(`/api/v1/users?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
    throw new Error(error.message || 'Failed to fetch users');
  }

  const data = await response.json();
  return data;
};

/**
 * Get user by ID
 */
export const getUserById = async (id) => {
  const response = await authenticatedFetch(`/api/v1/users/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch user' }));
    throw new Error(error.message || 'Failed to fetch user');
  }

  const data = await response.json();
  return data;
};

