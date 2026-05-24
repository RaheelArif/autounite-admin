import { authenticatedFetch } from './auth';

export async function listSearchSynonyms() {
  const response = await authenticatedFetch('/api/v1/admin/search-synonyms');
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to load synonyms');
  }
  return response.json();
}

export async function createSearchSynonym({ from, to, note }) {
  const response = await authenticatedFetch('/api/v1/admin/search-synonyms', {
    method: 'POST',
    body: JSON.stringify({ from, to, field: 'query', note }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create synonym');
  }
  return response.json();
}

export async function deleteSearchSynonym(id) {
  const response = await authenticatedFetch(`/api/v1/admin/search-synonyms/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete synonym');
  }
  return response.json();
}

export async function toggleSearchSynonym(id, isActive) {
  const response = await authenticatedFetch(`/api/v1/admin/search-synonyms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update synonym');
  }
  return response.json();
}
