'use client';

import { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaChevronLeft, 
  FaChevronRight,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';
import { getQueries, getQueryStats } from '@/lib/queries';
import { getUser, isAdmin } from '@/lib/auth';

export default function QueriesPage() {
  const [queries, setQueries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  
  // Filter states
  const [hasResults, setHasResults] = useState('');
  const [searchAttempted, setSearchAttempted] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [pagination, setPagination] = useState(null);

  // Fetch queries
  const fetchQueries = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        hasResults: hasResults || undefined,
        searchAttempted: searchAttempted || undefined,
        userEmail: userEmail || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      };
      
      const data = await getQueries(filters);
      setQueries(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load queries');
      setQueries([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const data = await getQueryStats();
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      // Don't set error state for stats, just log it
      // The main queries table will show the error if needed
      if (err.message && err.message.includes('admin')) {
        setError('Admin privileges required to view statistics');
      }
    }
  };

  // Check user role on mount
  useEffect(() => {
    const user = getUser();
    setUserRole(user?.role || 'user');
  }, []);

  useEffect(() => {
    fetchQueries();
    fetchStats();
  }, [page, limit, sortBy, sortOrder]);

  // Apply filters
  const handleApplyFilters = () => {
    setPage(1); // Reset to first page when filters change
    fetchQueries();
  };

  // Clear filters
  const handleClearFilters = () => {
    setHasResults('');
    setSearchAttempted('');
    setUserEmail('');
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
      return <FaSort className="w-4 h-4 au-dash-text-subtle" />;
    }
    return sortOrder === 'asc' 
      ? <FaSortUp className="w-4 h-4 au-dash-text-strong" />
      : <FaSortDown className="w-4 h-4 au-dash-text-strong" />;
  };

  return (
    <div className="au-dash-page">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="au-dash-card p-4">
            <div className="text-sm au-dash-text-subtle">Total Queries</div>
            <div className="text-2xl font-bold au-dash-text-strong mt-1">
              {stats.totalQueries?.toLocaleString() || 0}
            </div>
          </div>
          <div className="au-dash-card p-4">
            <div className="text-sm au-dash-text-subtle">With Results</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {stats.queriesWithResults?.toLocaleString() || 0}
            </div>
          </div>
          <div className="au-dash-card p-4">
            <div className="text-sm au-dash-text-subtle">Without Results</div>
            <div className="text-2xl font-bold text-red-400 mt-1">
              {stats.queriesWithoutResults?.toLocaleString() || 0}
            </div>
          </div>
          <div className="au-dash-card p-4">
            <div className="text-sm au-dash-text-subtle">Avg Results</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {stats.averageResultsCount?.toFixed(1) || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="au-dash-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="w-5 h-5 au-dash-text-strong" />
          <h2 className="text-xl font-semibold au-dash-text">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Has Results Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Has Results
            </label>
            <select
              value={hasResults}
              onChange={(e) => setHasResults(e.target.value)}
              className="
                w-full px-4 py-2
                au-dash-input
                rounded-lg
                au-dash-text-strong
                focus:outline-none focus:ring-2 focus:ring-white/25
                
              "
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Search Attempted Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Search Attempted
            </label>
            <select
              value={searchAttempted}
              onChange={(e) => setSearchAttempted(e.target.value)}
              className="
                w-full px-4 py-2
                au-dash-input
                rounded-lg
                au-dash-text-strong
                focus:outline-none focus:ring-2 focus:ring-white/25
                
              "
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* User Email Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              User Email
            </label>
            <input
              type="text"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Search by email..."
              className="
                w-full px-4 py-2
                au-dash-input
                rounded-lg
                au-dash-text-strong placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-white/25
                
              "
            />
          </div>

          {/* Limit Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
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
                au-dash-input
                rounded-lg
                au-dash-text-strong
                focus:outline-none focus:ring-2 focus:ring-white/25
                
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
              au-dash-btn
              
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
              au-dash-tab
              au-dash-text-muted font-semibold
              rounded-lg
              transition-all duration-300
            "
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Admin Access Warning */}
      {!isAdmin() && (
        <div className="
          p-4 rounded-lg
          bg-yellow-500/10 border border-yellow-500/50
          text-yellow-400
          mb-4
        ">
          <div className="flex items-start gap-3">
            <FaExclamationCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Admin Access Required</p>
              <p className="text-sm text-yellow-300/80">
                You need admin privileges to view queries. Your current role: <span className="font-semibold">{userRole || 'user'}</span>
              </p>
              <p className="text-sm text-yellow-300/80 mt-2">
                To create an admin user:
              </p>
              <ol className="text-sm text-yellow-300/80 mt-1 ml-4 list-decimal space-y-1">
                <li>Register a user via <code className="bg-yellow-500/20 px-1 rounded">POST /api/v1/auth/register</code></li>
                <li>Update the user's role to "admin" in MongoDB</li>
                <li>Log in with the admin account</li>
              </ol>
            </div>
          </div>
        </div>
      )}

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

      {/* Queries Table */}
      <div className="au-dash-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="au-dash-spinner mx-auto" />
            <p className="au-dash-text-subtle mt-4">Loading queries...</p>
          </div>
        ) : queries.length === 0 ? (
          <div className="p-12 text-center">
            <FaSearch className="w-12 h-12 au-dash-text-subtle mx-auto mb-4" />
            <p className="au-dash-text-subtle">No queries found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="au-dash-table-head">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                      >
                        Date {getSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">
                      Query
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">
                      User
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('resultsCount')}
                        className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                      >
                        Results {getSortIcon('resultsCount')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">
                      Filters Used
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                  {queries.map((query) => (
                    <tr
                      key={query._id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm au-dash-text-subtle">
                        {formatDate(query.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm au-dash-text max-w-md">
                          {query.query || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm au-dash-text-muted">
                          {query.userEmail || (
                            <span className="au-dash-text-subtle italic">Anonymous</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="au-dash-card-title au-dash-card-title--sm">
                          {query.resultsCount || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {query.searchAttempted ? (
                            query.hasResults ? (
                              <span className="flex items-center gap-1 text-green-400 text-sm">
                                <FaCheckCircle className="w-4 h-4" />
                                Has Results
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400 text-sm">
                                <FaTimesCircle className="w-4 h-4" />
                                No Results
                              </span>
                            )
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-400 text-sm">
                              <FaExclamationCircle className="w-4 h-4" />
                              No Search
                            </span>
                          )}
                        </div>
                        {query.error && (
                          <div className="text-xs text-red-400 mt-1 max-w-xs truncate" title={query.error}>
                            {query.error}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {query.filtersUsed && Object.keys(query.filtersUsed).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(query.filtersUsed).slice(0, 3).map(([key, value]) => (
                              <span
                                key={key}
                                className="au-dash-badge text-xs"
                              >
                                {key.split('.').pop()}: {value}
                              </span>
                            ))}
                            {Object.keys(query.filtersUsed).length > 3 && (
                              <span className="px-2 py-1 au-dash-badge au-dash-text-subtle text-xs rounded">
                                +{Object.keys(query.filtersUsed).length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="au-dash-text-subtle text-sm italic">None</span>
                        )}
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
                bg-[rgba(8,10,18,0.35)] border-t border-[rgba(255,255,255,0.1)]
                flex items-center justify-between
              ">
                <div className="text-sm au-dash-text-subtle">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} queries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage || loading}
                    className="
                      px-4 py-2
                      au-dash-tab
                      au-dash-text-muted
                      rounded-lg
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300
                      flex items-center gap-2
                    "
                  >
                    <FaChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="px-4 py-2 text-sm au-dash-text-muted">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasNextPage || loading}
                    className="
                      px-4 py-2
                      au-dash-tab
                      au-dash-text-muted
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

