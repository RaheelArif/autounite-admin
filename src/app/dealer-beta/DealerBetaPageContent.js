'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FaStore,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaClock,
  FaUserCheck,
  FaBan,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaExclamationCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch,
  FaEye,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import {
  getDealerBetaRequests,
  getDealerBetaStats,
  updateDealerBetaRequest,
  deleteDealerBetaRequest,
  DEALER_BETA_PAGE_SIZE,
} from '@/lib/dealerBetaRequests';
import { isAdmin } from '@/lib/auth';

const STATUS_CONFIG = {
  pending: { icon: FaClock, bgClass: 'bg-yellow-500/20', textClass: 'text-yellow-300', label: 'Pending' },
  contacted: { icon: FaCheckCircle, bgClass: 'bg-sky-500/20', textClass: 'text-sky-300', label: 'Contacted' },
  onboarding: { icon: FaUserCheck, bgClass: 'bg-green-500/20', textClass: 'text-green-300', label: 'Onboarding' },
  closed: { icon: FaBan, bgClass: 'bg-red-500/20', textClass: 'text-red-300', label: 'Closed' },
};

const PACKAGE_COLORS = {
  Beta: 'bg-purple-500/20 text-purple-300',
  Standard: 'bg-white/10 text-slate-200',
  Pro: 'bg-amber-500/20 text-amber-300',
  Elite: 'bg-orange-500/20 text-orange-300',
};

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 ${config.bgClass} ${config.textClass} text-xs font-medium rounded-full`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function PackageBadge({ pkg }) {
  const cls = PACKAGE_COLORS[pkg] || 'bg-white/10 text-slate-200';
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${cls}`}>
      {pkg || 'N/A'}
    </span>
  );
}

function DetailRow({ label, value, href }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-3 py-2 border-b border-white/5 last:border-0">
      <dt className="text-xs uppercase tracking-wide au-dash-text-subtle">{label}</dt>
      <dd className="text-sm au-dash-text break-words">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export default function DealerBetaPageContent() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [detailRequest, setDetailRequest] = useState(null);

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [status, setStatus] = useState('');
  const [interestedPackage, setInterestedPackage] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getDealerBetaStats();
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to load dealer beta statistics:', err);
    }
  }, []);

  const fetchRequests = useCallback(async (overrides = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await getDealerBetaRequests({
        status: status || undefined,
        interested_package: interestedPackage || undefined,
        state: stateFilter || undefined,
        search: search || undefined,
        page: overrides.page ?? page,
        limit: DEALER_BETA_PAGE_SIZE,
        sortBy,
        sortOrder,
      });
      setRequests(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load dealer beta requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [status, interestedPackage, stateFilter, search, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchRequests({ page: 1 });
  };

  const handleClearFilters = () => {
    setStatus('');
    setInterestedPackage('');
    setStateFilter('');
    setSearch('');
    setPage(1);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="w-4 h-4 au-dash-text-subtle" />;
    return sortOrder === 'asc'
      ? <FaSortUp className="w-4 h-4 au-dash-text-strong" />
      : <FaSortDown className="w-4 h-4 au-dash-text-strong" />;
  };

  const handleStartEdit = (request) => {
    setEditingId(request._id);
    setEditStatus(request.status || 'pending');
    setEditAdminNotes(request.admin_notes || '');
    setDetailRequest(request);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStatus('');
    setEditAdminNotes('');
  };

  const handleSaveEdit = async (id) => {
    try {
      const result = await updateDealerBetaRequest(id, {
        status: editStatus,
        admin_notes: editAdminNotes,
      });
      handleCancelEdit();
      if (detailRequest?._id === id && result?.data) {
        setDetailRequest(result.data);
      }
      fetchRequests();
      fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to update request');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this dealer beta request? This cannot be undone.')) return;
    try {
      await deleteDealerBetaRequest(id);
      if (detailRequest?._id === id) setDetailRequest(null);
      fetchRequests();
      fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to delete request');
    }
  };

  return (
    <div className="au-dash-page">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="au-dash-card p-4">
            <div className="text-sm au-dash-text-subtle">Total Submissions</div>
            <div className="text-2xl font-bold au-dash-text-strong mt-1">
              {stats.totalRequests?.toLocaleString() || 0}
            </div>
          </div>
          <div className="au-dash-card p-4">
            <div className="text-sm au-dash-text-subtle">Pending</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {stats.pendingRequests?.toLocaleString() || 0}
            </div>
          </div>
          <div className="au-dash-card p-4">
            <div className="text-sm au-dash-text-subtle">Contacted</div>
            <div className="text-2xl font-bold text-sky-400 mt-1">
              {stats.contactedRequests?.toLocaleString() || 0}
            </div>
          </div>
          <div className="au-dash-card p-4">
            <div className="text-sm au-dash-text-subtle">Onboarding</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {stats.onboardingRequests?.toLocaleString() || 0}
            </div>
          </div>
          <div className="au-dash-card p-4 col-span-2 lg:col-span-1">
            <div className="text-sm au-dash-text-subtle">Last 30 Days</div>
            <div className="text-2xl font-bold au-dash-text-strong mt-1">
              {stats.recentRequests?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      )}

      {!isAdmin() && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/50 text-yellow-400">
          <div className="flex items-start gap-3">
            <FaExclamationCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-1">Admin Access Required</p>
              <p className="text-sm text-yellow-300/80">
                You need admin privileges to manage dealer beta submissions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="au-dash-card overflow-hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FaFilter className="w-5 h-5 au-dash-text-strong" />
            <h2 className="text-xl font-semibold au-dash-text">Filters</h2>
            <span className="text-xs au-dash-text-subtle ml-2">{DEALER_BETA_PAGE_SIZE} per page</span>
          </div>
          {filtersOpen ? (
            <FaChevronUp className="w-5 h-5 au-dash-text-subtle" />
          ) : (
            <FaChevronDown className="w-5 h-5 au-dash-text-subtle" />
          )}
        </button>

        {filtersOpen && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium au-dash-text-muted mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 au-dash-input rounded-lg au-dash-text-strong focus:outline-none focus:ring-2 focus:ring-white/25"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium au-dash-text-muted mb-2">Package</label>
                <select
                  value={interestedPackage}
                  onChange={(e) => setInterestedPackage(e.target.value)}
                  className="w-full px-4 py-2 au-dash-input rounded-lg au-dash-text-strong focus:outline-none focus:ring-2 focus:ring-white/25"
                >
                  <option value="">All</option>
                  <option value="Beta">Beta</option>
                  <option value="Standard">Standard</option>
                  <option value="Pro">Pro</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium au-dash-text-muted mb-2">State</label>
                <input
                  type="text"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  placeholder="e.g. CA, Texas..."
                  className="w-full px-4 py-2 au-dash-input rounded-lg au-dash-text-strong placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium au-dash-text-muted mb-2">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 au-dash-text-subtle" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                    placeholder="Dealership, contact, email..."
                    className="w-full pl-10 pr-4 py-2 au-dash-input rounded-lg au-dash-text-strong placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/25"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="px-6 py-2 au-dash-btn text-white font-semibold rounded-lg transition-all duration-300 flex items-center gap-2"
              >
                <FaSearch className="w-4 h-4" />
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-6 py-2 au-dash-tab au-dash-text-muted font-semibold rounded-lg transition-all duration-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
          {error}
        </div>
      )}

      <div className="au-dash-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="au-dash-spinner mx-auto" />
            <p className="au-dash-text-subtle mt-4">Loading dealer submissions...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <FaStore className="w-12 h-12 au-dash-text-subtle mx-auto mb-4" />
            <p className="au-dash-text-subtle">No dealer beta submissions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="au-dash-table-head">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <button
                        type="button"
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                      >
                        Submitted {getSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left">
                      <button
                        type="button"
                        onClick={() => handleSort('dealership_name')}
                        className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                      >
                        Dealership {getSortIcon('dealership_name')}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold au-dash-text-muted">Contact</th>
                    <th className="px-4 py-4 text-left">
                      <button
                        type="button"
                        onClick={() => handleSort('interested_package')}
                        className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                      >
                        Package {getSortIcon('interested_package')}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold au-dash-text-muted">Location</th>
                    <th className="px-4 py-4 text-left">
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                      >
                        Status {getSortIcon('status')}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold au-dash-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                  {requests.map((request) => (
                    <tr key={request._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 text-sm au-dash-text-subtle whitespace-nowrap">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium au-dash-text">{request.dealership_name}</div>
                        {request.website ? (
                          <a
                            href={request.website.startsWith('http') ? request.website : `https://${request.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sky-300/80 hover:underline truncate block max-w-[180px]"
                          >
                            {request.website}
                          </a>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm au-dash-text">{request.contact_name}</div>
                        <div className="text-xs au-dash-text-subtle">{request.title || '—'}</div>
                        <a href={`mailto:${request.email}`} className="text-xs text-sky-300/80 hover:underline">
                          {request.email}
                        </a>
                      </td>
                      <td className="px-4 py-4">
                        <PackageBadge pkg={request.interested_package} />
                      </td>
                      <td className="px-4 py-4 text-sm au-dash-text-muted">
                        {request.city}, {request.state}
                      </td>
                      <td className="px-4 py-4">
                        {editingId === request._id ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="px-3 py-1 au-dash-input rounded-lg au-dash-text-strong text-sm focus:outline-none focus:ring-2 focus:ring-white/25"
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="onboarding">Onboarding</option>
                            <option value="closed">Closed</option>
                          </select>
                        ) : (
                          <StatusBadge status={request.status} />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          {editingId === request._id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(request._id)}
                                className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-all"
                                title="Save"
                              >
                                <FaSave className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="p-2 rounded-lg au-dash-tab au-dash-text-muted transition-all"
                                title="Cancel"
                              >
                                <FaTimes className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setDetailRequest(request)}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/18 au-dash-text-strong transition-all"
                                title="View details"
                              >
                                <FaEye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(request)}
                                className="p-2 rounded-lg bg-white/15 hover:bg-white/22 au-dash-text-strong transition-all"
                                title="Edit"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(request._id)}
                                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                                title="Delete"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && (
              <div className="px-6 py-4 bg-[rgba(8,10,18,0.35)] border-t border-[rgba(255,255,255,0.1)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm au-dash-text-subtle">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} submissions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage || loading}
                    className="px-4 py-2 au-dash-tab au-dash-text-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <FaChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="px-4 py-2 text-sm au-dash-text-muted">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNextPage || loading}
                    className="px-4 py-2 au-dash-tab au-dash-text-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    Next
                    <FaChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {detailRequest && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDetailRequest(null)}
          role="presentation"
        >
          <div
            className="au-dash-card w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dealer-beta-detail-title"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-6 border-b border-white/10 bg-[rgba(8,10,18,0.95)] backdrop-blur">
              <div>
                <h3 id="dealer-beta-detail-title" className="text-xl font-semibold au-dash-text-strong">
                  {detailRequest.dealership_name}
                </h3>
                <p className="text-sm au-dash-text-subtle mt-1">
                  Submitted {formatDate(detailRequest.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailRequest(null)}
                className="p-2 rounded-lg au-dash-tab au-dash-text-muted"
                aria-label="Close"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={detailRequest.status} />
                <PackageBadge pkg={detailRequest.interested_package} />
                {detailRequest.notificationSent ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/15 text-green-300 text-xs rounded-full">
                    <FaEnvelope className="w-3 h-3" />
                    Email sent
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-500/15 text-yellow-300 text-xs rounded-full">
                    Email pending
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`mailto:${detailRequest.email}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <FaEnvelope className="w-4 h-4 text-sky-300" />
                  <span className="text-sm au-dash-text truncate">{detailRequest.email}</span>
                </a>
                <a
                  href={`tel:${detailRequest.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <FaPhone className="w-4 h-4 text-green-300" />
                  <span className="text-sm au-dash-text">{detailRequest.phone}</span>
                </a>
                {detailRequest.website ? (
                  <a
                    href={detailRequest.website.startsWith('http') ? detailRequest.website : `https://${detailRequest.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors sm:col-span-2"
                  >
                    <FaGlobe className="w-4 h-4 text-amber-300" />
                    <span className="text-sm au-dash-text truncate">{detailRequest.website}</span>
                  </a>
                ) : null}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 sm:col-span-2">
                  <FaMapMarkerAlt className="w-4 h-4 text-red-300 shrink-0" />
                  <span className="text-sm au-dash-text">
                    {detailRequest.city}, {detailRequest.state}
                  </span>
                </div>
              </div>

              <dl>
                <DetailRow label="Contact" value={`${detailRequest.contact_name}${detailRequest.title ? ` — ${detailRequest.title}` : ''}`} />
                <DetailRow label="Dealer Notes" value={detailRequest.notes || '—'} />
                <DetailRow label="Admin Notes" value={detailRequest.admin_notes || '—'} />
                <DetailRow label="Source URL" value={detailRequest.source_url} href={detailRequest.source_url} />
                <DetailRow label="Referrer" value={detailRequest.referrer} />
                <DetailRow label="UTM Source" value={detailRequest.utm_source} />
                <DetailRow label="UTM Medium" value={detailRequest.utm_medium} />
                <DetailRow label="UTM Campaign" value={detailRequest.utm_campaign} />
              </dl>

              {editingId === detailRequest._id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-2">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 au-dash-input rounded-lg au-dash-text-strong text-sm focus:outline-none focus:ring-2 focus:ring-white/25"
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-2">Admin Notes</label>
                    <textarea
                      value={editAdminNotes}
                      onChange={(e) => setEditAdminNotes(e.target.value)}
                      rows={3}
                      placeholder="Internal notes for follow-up..."
                      className="w-full px-3 py-2 au-dash-input rounded-lg au-dash-text-strong text-sm focus:outline-none focus:ring-2 focus:ring-white/25 resize-none"
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                {editingId === detailRequest._id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(detailRequest._id)}
                      className="px-5 py-2 au-dash-btn text-white font-semibold rounded-lg flex items-center gap-2"
                    >
                      <FaSave className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-5 py-2 au-dash-tab au-dash-text-muted font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(detailRequest)}
                      className="px-5 py-2 au-dash-btn text-white font-semibold rounded-lg flex items-center gap-2"
                    >
                      <FaEdit className="w-4 h-4" />
                      Update Status
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(detailRequest._id)}
                      className="px-5 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold flex items-center gap-2"
                    >
                      <FaTrash className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
