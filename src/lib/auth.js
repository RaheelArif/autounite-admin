/**
 * Authentication utility functions
 * Handles login, token storage, and API authentication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ;

/**
 * Get default headers with API key
 */
export const getDefaultHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Always include API key if it exists
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }
  
  return headers;
};

/**
 * Store authentication token in localStorage
 */
export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

/**
 * Store user data in localStorage
 */
export const setUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Get user data from localStorage
 */
export const getUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

/**
 * Remove user data from localStorage
 */
export const removeUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Check if current user is admin
 */
export const isAdmin = () => {
  const user = getUser();
  return user?.role === 'admin';
};

/**
 * Register a new user
 */
export const register = async (email, password, firstName, lastName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    if (data.success && data.data) {
      // Store token and user data
      setAuthToken(data.data.token);
      setUser(data.data.user);
      return data.data;
    }

    throw new Error(data.message || 'Registration failed');
  } catch (error) {
    throw error;
  }
};

/**
 * Login user with email and password
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.success && data.data) {
      // Store token and user data
      setAuthToken(data.data.token);
      setUser(data.data.user);
      return data.data;
    }

    throw new Error(data.message || 'Login failed');
  } catch (error) {
    throw error;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        ...getDefaultHeaders(),
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid, clear auth data
        logout();
      }
      throw new Error(data.message || 'Failed to get user');
    }

    if (data.success && data.data) {
      setUser(data.data.user);
      return data.data.user;
    }

    throw new Error(data.message || 'Failed to get user');
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = () => {
  removeAuthToken();
  removeUser();
};

/**
 * Make authenticated API request
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    ...getDefaultHeaders(),
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token is invalid, logout user
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  if (response.status === 403) {
    // Forbidden - user doesn't have admin permissions
    const error = await response.json().catch(() => ({ message: 'Access forbidden. Admin role required.' }));
    throw new Error(error.message || 'Access forbidden. Admin role required.');
  }

  return response;
};

