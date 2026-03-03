/**
 * Blog Admin API – Categories & Tags
 * All requests use authenticatedFetch (X-API-Key + Bearer token)
 */

import { authenticatedFetch } from './auth';

const BLOG_PREFIX = '/api/v1/admin/blog';

// --- Categories ---

export const getCategories = async (params = {}) => {
  const { page = 1, limit = 20, isActive } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    searchParams.set('isActive', isActive.toString());
  }
  const response = await authenticatedFetch(`${BLOG_PREFIX}/categories?${searchParams}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch categories' }));
    throw new Error(err.message || 'Failed to fetch categories');
  }
  return response.json();
};

export const getCategoryById = async (id) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/categories/${id}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch category' }));
    throw new Error(err.message || 'Failed to fetch category');
  }
  return response.json();
};

export const createCategory = async (body) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/categories`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create category' }));
    throw new Error(err.message || 'Failed to create category');
  }
  return response.json();
};

export const updateCategory = async (id, body) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update category' }));
    throw new Error(err.message || 'Failed to update category');
  }
  return response.json();
};

export const deleteCategory = async (id) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/categories/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to delete category' }));
    throw new Error(err.message || 'Failed to delete category');
  }
  return response.json();
};

// --- Tags ---

export const getTags = async (params = {}) => {
  const { page = 1, limit = 20, isActive } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    searchParams.set('isActive', isActive.toString());
  }
  const response = await authenticatedFetch(`${BLOG_PREFIX}/tags?${searchParams}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch tags' }));
    throw new Error(err.message || 'Failed to fetch tags');
  }
  return response.json();
};

export const getTagById = async (id) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/tags/${id}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch tag' }));
    throw new Error(err.message || 'Failed to fetch tag');
  }
  return response.json();
};

export const createTag = async (body) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/tags`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create tag' }));
    throw new Error(err.message || 'Failed to create tag');
  }
  return response.json();
};

export const updateTag = async (id, body) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update tag' }));
    throw new Error(err.message || 'Failed to update tag');
  }
  return response.json();
};

export const deleteTag = async (id) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/tags/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to delete tag' }));
    throw new Error(err.message || 'Failed to delete tag');
  }
  return response.json();
};

// --- Articles ---

export const getArticles = async (params = {}) => {
  const { page = 1, limit = 20, status, type, categorySlug, search } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());
  if (status) searchParams.set('status', status);
  if (type) searchParams.set('type', type);
  if (categorySlug) searchParams.set('categorySlug', categorySlug);
  if (search) searchParams.set('search', search);
  const response = await authenticatedFetch(`${BLOG_PREFIX}/articles?${searchParams}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch articles' }));
    throw new Error(err.message || 'Failed to fetch articles');
  }
  return response.json();
};

export const getArticleById = async (id) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/articles/${id}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch article' }));
    throw new Error(err.message || 'Failed to fetch article');
  }
  return response.json();
};

export const createArticle = async (body) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/articles`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create article' }));
    throw new Error(err.message || 'Failed to create article');
  }
  return response.json();
};

export const updateArticle = async (id, body) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update article' }));
    throw new Error(err.message || 'Failed to update article');
  }
  return response.json();
};

export const deleteArticle = async (id) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/articles/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to delete article' }));
    throw new Error(err.message || 'Failed to delete article');
  }
  return response.json();
};

export const publishArticle = async (id) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/articles/${id}/publish`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to publish article' }));
    throw new Error(err.message || 'Failed to publish article');
  }
  return response.json();
};

export const unpublishArticle = async (id) => {
  const response = await authenticatedFetch(`${BLOG_PREFIX}/articles/${id}/unpublish`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to unpublish article' }));
    throw new Error(err.message || 'Failed to unpublish article');
  }
  return response.json();
};
