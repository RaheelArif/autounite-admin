'use client';

import { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaFilter, 
  FaChevronLeft, 
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaUserShield,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch
} from 'react-icons/fa';
import { getUsers } from '@/lib/users';
import { getUser, isAdmin } from '@/lib/auth';

export default function UsersPageContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  
  // Filter states
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [pagination, setPagination] = useState(null);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        search: search || undefined,
        role: role || undefined,
        isActive: isActive || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      };
      
      const data = await getUsers(filters);
      setUsers(data.data?.users || []);
      setPagination(data.data?.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Check user role on mount
  useEffect(() => {
    const user = getUser();
    setUserRole(user?.role || 'user');
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, sortBy, sortOrder]);

  // Apply filters
  const handleApplyFilters = () => {
    setPage(1);
    fetchUsers();
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearch('');
    setRole('');
    setIsActive('');
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
                You need admin privileges to view users. Your current role: <span className="font-semibold">{userRole || 'user'}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="au-dash-card overflow-hidden">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FaFilter className="w-5 h-5 au-dash-text-strong" />
            <h2 className="text-xl font-semibold au-dash-text">Filters</h2>
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
          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 au-dash-text-subtle" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Email, name..."
                className="
                  w-full pl-10 pr-4 py-2
                  au-dash-input
                  rounded-lg
                  au-dash-text-strong placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-white/25
                  
                "
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="
                w-full px-4 py-2
                au-dash-input
                rounded-lg
                au-dash-text-strong
                focus:outline-none focus:ring-2 focus:ring-white/25
                
              "
            >
              <option value="">All</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Active Status Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Active Status
            </label>
            <select
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              className="
                w-full px-4 py-2
                au-dash-input
                rounded-lg
                au-dash-text-strong
                focus:outline-none focus:ring-2 focus:ring-white/25
                
              "
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
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
              <option value={10}>10</option>
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
        )}
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

      {/* Users Table */}
      <div className="au-dash-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="au-dash-spinner mx-auto" />
            <p className="au-dash-text-subtle mt-4">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <FaUsers className="w-12 h-12 au-dash-text-subtle mx-auto mb-4" />
            <p className="au-dash-text-subtle">No users found</p>
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
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                      >
                        Email {getSortIcon('email')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('firstName')}
                        className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                      >
                        Name {getSortIcon('firstName')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('role')}
                        className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                      >
                        Role {getSortIcon('role')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm au-dash-text-subtle">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm au-dash-text">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm au-dash-text">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                              <FaUserShield className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="au-dash-badge flex items-center gap-1 rounded-full text-xs">
                              <FaUser className="w-3 h-3" />
                              User
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.isActive ? (
                            <span className="flex items-center gap-1 text-green-400 text-sm">
                              <FaCheckCircle className="w-4 h-4" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400 text-sm">
                              <FaTimesCircle className="w-4 h-4" />
                              Inactive
                            </span>
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
                bg-[rgba(8,10,18,0.35)] border-t border-[rgba(255,255,255,0.1)]
                flex items-center justify-between
              ">
                <div className="text-sm au-dash-text-subtle">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} of{' '}
                  {pagination.totalUsers} users
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
                    Page {pagination.currentPage} of {pagination.totalPages}
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

