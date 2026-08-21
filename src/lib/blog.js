/**
 * Blog Admin API – Categories & Tags
 * All requests use authenticatedFetch (X-API-Key + Bearer token)
 */

import { authenticatedFetch } from './auth';

const BLOG_PREFIX = '/api/v1/admin/blog';

async function parseBlogResponse(response, fallback) {
  const err = await response.json().catch(() => ({ message: fallback }));
  const message =
    err.error?.safeUserMessage ||
    err.error?.message ||
    err.message ||
    fallback;
  const error = new Error(message);
  error.payload = err;
  throw error;
}

async function blogFetch(path, options) {
  const response = await authenticatedFetch(`${BLOG_PREFIX}${path}`, options);
  const json = await response.json().catch(() => null);
  if (!response.ok || json?.success === false) {
    const err = json || { message: 'Blog request failed' };
    const message =
      err.error?.safeUserMessage ||
      err.error?.message ||
      err.message ||
      'Blog request failed';
    const error = new Error(message);
    error.payload = err;
    throw error;
  }
  return json;
}

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

export const importArticleJson = (article, { dryRun = false } = {}) =>
  blogFetch('/articles/import', {
    method: 'POST',
    body: JSON.stringify({ article, dryRun }),
  });

export const publishArticle = async (id, body = {}) => {
  return blogFetch(`/articles/${id}/publish`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
};

export const retryPublishArticle = (id) =>
  blogFetch(`/articles/${id}/retry-publish`, { method: 'POST' });

export const approveBlogMedia = (id) =>
  blogFetch(`/media/${id}/approve`, { method: 'POST' });

export const unpublishArticle = async (id, reason) => {
  return blogFetch(`/articles/${id}/unpublish`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
};

export const submitArticleReview = (id) =>
  blogFetch(`/articles/${id}/submit-review`, { method: 'POST' });

export const approveArticle = (id, body = {}) =>
  blogFetch(`/articles/${id}/approve`, { method: 'POST', body: JSON.stringify(body) });

export const requestArticleRevision = (id, reason) =>
  blogFetch(`/articles/${id}/request-revision`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });

export const scheduleArticle = (id, publishAt) =>
  blogFetch(`/articles/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify({ publishAt }),
  });

export const archiveArticle = (id, reason) =>
  blogFetch(`/articles/${id}/archive`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });

export const getArticleRevisions = (id) => blogFetch(`/articles/${id}/revisions`);

export const getArticleAudit = (id) => blogFetch(`/articles/${id}/audit`);

export const createPreviewToken = (id) =>
  blogFetch('/preview-token', {
    method: 'POST',
    body: JSON.stringify({ contentId: id, expiresInMinutes: 60 }),
  });

export const getBlogMedia = (params = {}) => {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page || 1));
  searchParams.set('limit', String(params.limit || 20));
  if (params.kind) searchParams.set('kind', params.kind);
  return blogFetch(`/media?${searchParams}`);
};

export const createBlogMedia = (body) =>
  blogFetch('/media', { method: 'POST', body: JSON.stringify(body) });

export const updateBlogMedia = (id, body) =>
  blogFetch(`/media/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteBlogMedia = (id) => blogFetch(`/media/${id}`, { method: 'DELETE' });

export const getBlogAuthors = () => blogFetch('/authors');

export const createBlogAuthor = (body) =>
  blogFetch('/authors', { method: 'POST', body: JSON.stringify(body) });

export const updateBlogAuthor = (id, body) =>
  blogFetch(`/authors/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteBlogAuthor = (id) => blogFetch(`/authors/${id}`, { method: 'DELETE' });

export const getDistribution = (article_id) => {
  const q = article_id ? `?article_id=${encodeURIComponent(article_id)}` : '';
  return blogFetch(`/distribution${q}`);
};

export const createDistribution = (body) =>
  blogFetch('/distribution', { method: 'POST', body: JSON.stringify(body) });

export const updateDistribution = (id, body) =>
  blogFetch(`/distribution/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const getBlogReports = () => blogFetch('/reports');

export const getBlogMe = () => blogFetch('/me');
