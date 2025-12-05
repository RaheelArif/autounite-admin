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
      return <FaSort className="w-4 h-4 text-slate-500" />;
    }
    return sortOrder === 'asc' 
      ? <FaSortUp className="w-4 h-4 text-blue-400" />
      : <FaSortDown className="w-4 h-4 text-blue-400" />;
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
            Search Queries
          </h1>
          <p className="text-slate-400 mt-1">
            View and manage all user search queries
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">Total Queries</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {stats.totalQueries?.toLocaleString() || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">With Results</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {stats.queriesWithResults?.toLocaleString() || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">Without Results</div>
            <div className="text-2xl font-bold text-red-400 mt-1">
              {stats.queriesWithoutResults?.toLocaleString() || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">Avg Results</div>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {stats.averageResultsCount?.toFixed(1) || 0}
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
          {/* Has Results Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Has Results
            </label>
            <select
              value={hasResults}
              onChange={(e) => setHasResults(e.target.value)}
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
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Search Attempted Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Search Attempted
            </label>
            <select
              value={searchAttempted}
              onChange={(e) => setSearchAttempted(e.target.value)}
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
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* User Email Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              User Email
            </label>
            <input
              type="text"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Search by email..."
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
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4">Loading queries...</p>
          </div>
        ) : queries.length === 0 ? (
          <div className="p-12 text-center">
            <FaSearch className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No queries found</p>
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
                      Query
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      User
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('resultsCount')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        Results {getSortIcon('resultsCount')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Filters Used
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {queries.map((query) => (
                    <tr
                      key={query._id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(query.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-200 max-w-md">
                          {query.query || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300">
                          {query.userEmail || (
                            <span className="text-slate-500 italic">Anonymous</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-200">
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
                                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded"
                              >
                                {key.split('.').pop()}: {value}
                              </span>
                            ))}
                            {Object.keys(query.filtersUsed).length > 3 && (
                              <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded">
                                +{Object.keys(query.filtersUsed).length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm italic">None</span>
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
                bg-slate-900/50 border-t border-slate-700/50
                flex items-center justify-between
              ">
                <div className="text-sm text-slate-400">
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

