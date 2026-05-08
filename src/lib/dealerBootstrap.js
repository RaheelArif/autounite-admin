import { authenticatedFetch } from './auth';

export const createDealerStore = async (payload) => {
  const response = await authenticatedFetch('/api/v1/dealer/admin/bootstrap-store', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create dealer store');
  }
  return data;
};

export const assignDealerUser = async (payload) => {
  const response = await authenticatedFetch('/api/v1/dealer/admin/assign-user', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to assign dealer user');
  }
  return data;
};

export const getDealerStores = async () => {
  const response = await authenticatedFetch('/api/v1/dealer/admin/stores');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dealer stores');
  }
  return data;
};

export const getDealerAuditLogs = async () => {
  const response = await authenticatedFetch('/api/v1/dealer/admin/audit-logs');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dealer audit logs');
  }
  return data;
};

export const getCnmLeadExceptions = async () => {
  const response = await authenticatedFetch('/api/v1/dealer/admin/cnm-lead-exceptions');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch CNM lead exceptions');
  }
  return data;
};

export const updateCnmLeadExceptionStatus = async ({ exceptionId, status, reason = '' }) => {
  const response = await authenticatedFetch(`/api/v1/dealer/admin/cnm-lead-exceptions/${exceptionId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update CNM exception status');
  }
  return data;
};

export const getOpsVerificationRequests = async () => {
  const response = await authenticatedFetch('/api/v1/dealer/admin/ops-verification-requests');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch ops verification requests');
  }
  return data;
};

export const updateOpsVerificationStatus = async ({ requestId, status, reason = '' }) => {
  const response = await authenticatedFetch(`/api/v1/dealer/admin/ops-verification-requests/${requestId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update ops verification status');
  }
  return data;
};
