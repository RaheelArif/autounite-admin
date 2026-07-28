/**
 * Admin OS Phase 2 — read-only live summaries for card drawers.
 * Uses existing client libs / GET endpoints only. No route renames.
 */

import { getUserStats } from './users';
import { getUserRequestStats } from './userRequests';
import { getDealerBetaStats } from './dealerBetaRequests';
import { getArticles } from './blog';
import { getQueryStats } from './queries';
import {
  getDealerStores,
  getDealerAuditLogs,
  getCnmLeadExceptions,
  getOpsVerificationRequests,
} from './dealerBootstrap';

function isAuthError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('access denied') ||
    msg.includes('admin')
  );
}

/**
 * @returns {Promise<{ status: 'ok'|'empty'|'error'|'forbidden', lines: string[], detail?: string }>}
 */
export async function fetchAdminOsSummary(summaryKey) {
  if (!summaryKey) {
    return { status: 'empty', lines: ['No live summary for this card yet.'] };
  }

  try {
    switch (summaryKey) {
      case 'users': {
        const res = await getUserStats();
        const stats = res?.data?.stats || res?.stats || {};
        const total = stats.totalUsers ?? stats.total ?? null;
        if (total == null && !Object.keys(stats).length) {
          return { status: 'empty', lines: ['No user stats returned.'] };
        }
        return {
          status: 'ok',
          lines: [
            `Total users: ${Number(total || 0).toLocaleString()}`,
            stats.activeUsers != null ? `Active: ${Number(stats.activeUsers).toLocaleString()}` : null,
            stats.adminUsers != null ? `Admins: ${Number(stats.adminUsers).toLocaleString()}` : null,
            stats.usersToday != null ? `Today: ${Number(stats.usersToday).toLocaleString()}` : null,
          ].filter(Boolean),
        };
      }

      case 'user-requests': {
        const res = await getUserRequestStats();
        const stats = res?.stats || res?.data?.stats || {};
        const total = stats.totalRequests ?? stats.total ?? 0;
        return {
          status: total === 0 ? 'empty' : 'ok',
          lines: [
            `Total requests: ${Number(total).toLocaleString()}`,
            `Pending: ${Number(stats.pendingRequests || 0).toLocaleString()}`,
            `Contacted: ${Number(stats.contactedRequests || 0).toLocaleString()}`,
            `Registered: ${Number(stats.registeredRequests || 0).toLocaleString()}`,
          ],
        };
      }

      case 'dealer-beta': {
        const res = await getDealerBetaStats();
        const stats = res?.stats || res?.data?.stats || {};
        const total = stats.totalRequests ?? stats.total ?? 0;
        return {
          status: total === 0 ? 'empty' : 'ok',
          lines: [
            `Beta submissions: ${Number(total).toLocaleString()}`,
            `Pending: ${Number(stats.pendingRequests || 0).toLocaleString()}`,
            `Contacted: ${Number(stats.contactedRequests || 0).toLocaleString()}`,
            `Onboarding: ${Number(stats.onboardingRequests || 0).toLocaleString()}`,
          ],
        };
      }

      case 'blog': {
        const [all, drafts, published] = await Promise.all([
          getArticles({ page: 1, limit: 1 }),
          getArticles({ page: 1, limit: 1, status: 'draft' }).catch(() => null),
          getArticles({ page: 1, limit: 1, status: 'published' }).catch(() => null),
        ]);
        const total =
          all?.data?.pagination?.total ??
          all?.pagination?.total ??
          all?.data?.articles?.length ??
          0;
        const draftTotal = drafts?.data?.pagination?.total ?? drafts?.pagination?.total;
        const pubTotal = published?.data?.pagination?.total ?? published?.pagination?.total;
        return {
          status: Number(total) === 0 ? 'empty' : 'ok',
          lines: [
            `Articles (total): ${Number(total || 0).toLocaleString()}`,
            draftTotal != null ? `Drafts: ${Number(draftTotal).toLocaleString()}` : null,
            pubTotal != null ? `Published: ${Number(pubTotal).toLocaleString()}` : null,
          ].filter(Boolean),
        };
      }

      case 'queries': {
        const res = await getQueryStats();
        const stats = res?.stats || res?.data?.stats || res?.data || {};
        return {
          status: 'ok',
          lines: [
            stats.totalQueries != null
              ? `Total queries: ${Number(stats.totalQueries).toLocaleString()}`
              : `Query stats loaded`,
            stats.queriesWithoutResults != null
              ? `Without results: ${Number(stats.queriesWithoutResults).toLocaleString()}`
              : null,
            stats.today != null ? `Today: ${Number(stats.today).toLocaleString()}` : null,
          ].filter(Boolean),
        };
      }

      case 'dealer-stores': {
        const res = await getDealerStores();
        const stores = res?.data?.stores || [];
        if (!stores.length) {
          return { status: 'empty', lines: ['No dealer stores found yet.'] };
        }
        const preview = stores.slice(0, 5).map((s) => s.name || s.legalName || s._id);
        return {
          status: 'ok',
          lines: [
            `Stores: ${stores.length.toLocaleString()}`,
            ...preview.map((name) => `· ${name}`),
            stores.length > 5 ? `…and ${stores.length - 5} more` : null,
          ].filter(Boolean),
        };
      }

      case 'dealer-audit': {
        const res = await getDealerAuditLogs();
        const logs = res?.data?.logs || [];
        return {
          status: logs.length === 0 ? 'empty' : 'ok',
          lines: [
            `Audit entries: ${logs.length.toLocaleString()}`,
            logs[0]
              ? `Latest: ${logs[0].action || logs[0].type || 'event'} · ${logs[0].createdAt ? new Date(logs[0].createdAt).toLocaleString() : '—'}`
              : null,
          ].filter(Boolean),
        };
      }

      case 'cnm-exceptions': {
        const res = await getCnmLeadExceptions();
        const rows = Array.isArray(res?.data) ? res.data : res?.data?.exceptions || [];
        return {
          status: rows.length === 0 ? 'empty' : 'ok',
          lines: [
            `CNM lead exceptions: ${rows.length.toLocaleString()}`,
            'Open Dealer Bootstrap → Operations for full queue.',
          ],
        };
      }

      case 'ops-verification': {
        const res = await getOpsVerificationRequests();
        const rows = Array.isArray(res?.data) ? res.data : res?.data?.requests || [];
        return {
          status: rows.length === 0 ? 'empty' : 'ok',
          lines: [
            `Ops verification requests: ${rows.length.toLocaleString()}`,
            'Open Dealer Bootstrap → Operations for review.',
          ],
        };
      }

      default:
        return { status: 'empty', lines: ['No live summary mapped for this card.'] };
    }
  } catch (err) {
    if (isAuthError(err)) {
      return {
        status: 'forbidden',
        lines: ['You need an admin session to load this summary.'],
        detail: String(err.message || err),
      };
    }
    return {
      status: 'error',
      lines: ['Could not load live summary.'],
      detail: String(err.message || err),
    };
  }
}
