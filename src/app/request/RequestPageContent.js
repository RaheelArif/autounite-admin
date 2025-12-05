'use client';

import { useState, useEffect } from 'react';
import { 
  FaPaperPlane, 
  FaFilter, 
  FaChevronLeft, 
  FaChevronRight,
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
  FaSearch
} from 'react-icons/fa';
import { getUserRequests, getUserRequestStats, updateUserRequest, deleteUserRequest } from '@/lib/userRequests';
import { getUser, isAdmin } from '@/lib/auth';

export default function RequestPageContent() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  
  // Filter states
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [pagination, setPagination] = useState(null);

  // Fetch requests
  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        status: status || undefined,
        source: source || undefined,
        search: search || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      };
      
      const data = await getUserRequests(filters);
      setRequests(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const data = await getUserRequestStats();
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  // Check user role on mount
  useEffect(() => {
    const user = getUser();
    setUserRole(user?.role || 'user');
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [page, limit, sortBy, sortOrder]);

  // Apply filters
  const handleApplyFilters = () => {
    setPage(1);
    fetchRequests();
  };

  // Clear filters
  const handleClearFilters = () => {
    setStatus('');
    setSource('');
    setSearch('');
    setPage(1);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Start editing
  const handleStartEdit = (request) => {
    setEditingId(request._id);
    setEditStatus(request.status || 'pending');
    setEditNotes(request.notes || '');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStatus('');
    setEditNotes('');
  };

  // Save changes
  const handleSaveEdit = async (id) => {
    try {
      await updateUserRequest(id, {
        status: editStatus,
        notes: editNotes,
      });
      setEditingId(null);
      setEditStatus('');
      setEditNotes('');
      fetchRequests();
      fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to update request');
    }
  };

  // Delete request
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this request?')) {
      return;
    }
    try {
      await deleteUserRequest(id);
      fetchRequests();
      fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to delete request');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <FaSort className="w-4 h-4 text-slate-500" />;
    }
    return sortOrder === 'asc' 
      ? <FaSortUp className="w-4 h-4 text-blue-400" />
      : <FaSortDown className="w-4 h-4 text-blue-400" />;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { icon: FaClock, bgClass: 'bg-yellow-500/20', textClass: 'text-yellow-300', label: 'Pending' },
      contacted: { icon: FaCheckCircle, bgClass: 'bg-blue-500/20', textClass: 'text-blue-300', label: 'Contacted' },
      registered: { icon: FaUserCheck, bgClass: 'bg-green-500/20', textClass: 'text-green-300', label: 'Registered' },
      ignored: { icon: FaBan, bgClass: 'bg-red-500/20', textClass: 'text-red-300', label: 'Ignored' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`flex items-center gap-1 px-2 py-1 ${config.bgClass} ${config.textClass} text-xs rounded-full`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="
            text-3xl font-bold
            bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500
            bg-clip-text text-transparent
          ">
            User Requests
          </h1>
          <p className="text-slate-400 mt-1">
            Manage demo requests and early access applications
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">Total Requests</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {stats.totalRequests?.toLocaleString() || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">Pending</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {stats.pendingRequests?.toLocaleString() || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">Contacted</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {stats.contactedRequests?.toLocaleString() || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">Registered</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {stats.registeredRequests?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      )}

      {/* Admin Access Warning */}
      {!isAdmin() && (
        <div className="
          p-4 rounded-lg
          bg-yellow-500/10 border border-yellow-500/50
          text-yellow-400
        ">
          <div className="flex items-start gap-3">
            <FaExclamationCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Admin Access Required</p>
              <p className="text-sm text-yellow-300/80">
                You need admin privileges to view requests. Your current role: <span className="font-semibold">{userRole || 'user'}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-slate-200">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="registered">Registered</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Source
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., website, api..."
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100 placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            />
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Email, name..."
                className="
                  w-full pl-10 pr-4 py-2
                  bg-slate-900/50 border border-slate-700/50
                  rounded-lg
                  text-slate-100 placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  focus:border-blue-500/50
                "
              />
            </div>
          </div>

          {/* Limit Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Results Per Page
            </label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleApplyFilters}
            className="
              px-6 py-2
              bg-gradient-to-r from-blue-500 to-blue-600
              hover:from-blue-400 hover:to-blue-500
              text-white font-semibold
              rounded-lg
              transition-all duration-300
              flex items-center gap-2
            "
          >
            <FaSearch className="w-4 h-4" />
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="
              px-6 py-2
              bg-slate-700/50 hover:bg-slate-700
              text-slate-300 font-semibold
              rounded-lg
              transition-all duration-300
            "
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="
          p-4 rounded-lg
          bg-red-500/10 border border-red-500/50
          text-red-400
        ">
          {error}
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <FaPaperPlane className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No requests found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        Date {getSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        Status {getSortIcon('status')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Notes
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {requests.map((request) => (
                    <tr
                      key={request._id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-200">
                          {request.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-200">
                          {request.firstName} {request.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === request._id ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="
                              px-3 py-1
                              bg-slate-900/50 border border-slate-700/50
                              rounded-lg
                              text-slate-100 text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500/50
                            "
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="registered">Registered</option>
                            <option value="ignored">Ignored</option>
                          </select>
                        ) : (
                          getStatusBadge(request.status)
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300">
                          {request.source || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === request._id ? (
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes..."
                            rows={2}
                            className="
                              w-full px-3 py-2
                              bg-slate-900/50 border border-slate-700/50
                              rounded-lg
                              text-slate-100 text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500/50
                              resize-none
                            "
                          />
                        ) : (
                          <div className="text-sm text-slate-400 max-w-xs truncate" title={request.notes}>
                            {request.notes || 'No notes'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {editingId === request._id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(request._id)}
                                className="
                                  p-2 rounded-lg
                                  bg-green-500/20 hover:bg-green-500/30
                                  text-green-400
                                  transition-all duration-300
                                "
                                title="Save"
                              >
                                <FaSave className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="
                                  p-2 rounded-lg
                                  bg-slate-700/50 hover:bg-slate-700
                                  text-slate-300
                                  transition-all duration-300
                                "
                                title="Cancel"
                              >
                                <FaTimes className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(request)}
                                className="
                                  p-2 rounded-lg
                                  bg-blue-500/20 hover:bg-blue-500/30
                                  text-blue-400
                                  transition-all duration-300
                                "
                                title="Edit"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(request._id)}
                                className="
                                  p-2 rounded-lg
                                  bg-red-500/20 hover:bg-red-500/30
                                  text-red-400
                                  transition-all duration-300
                                "
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

            {/* Pagination */}
            {pagination && (
              <div className="
                px-6 py-4
                bg-slate-900/50 border-t border-slate-700/50
                flex items-center justify-between
              ">
                <div className="text-sm text-slate-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} requests
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage || loading}
                    className="
                      px-4 py-2
                      bg-slate-700/50 hover:bg-slate-700
                      text-slate-300
                      rounded-lg
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300
                      flex items-center gap-2
                    "
                  >
                    <FaChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="px-4 py-2 text-sm text-slate-300">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasNextPage || loading}
                    className="
                      px-4 py-2
                      bg-slate-700/50 hover:bg-slate-700
                      text-slate-300
                      rounded-lg
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300
                      flex items-center gap-2
                    "
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
    </div>
  );
}

