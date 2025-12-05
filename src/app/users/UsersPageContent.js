'use client';

import { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaFilter, 
  FaChevronLeft, 
  FaChevronRight,
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
            Users Management
          </h1>
          <p className="text-slate-400 mt-1">
            View and manage all registered users
          </p>
        </div>
      </div>

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
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-slate-200">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
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
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Active Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Active Status
            </label>
            <select
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
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
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
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

      {/* Users Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <FaUsers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No users found</p>
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
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        Email {getSortIcon('email')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('firstName')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        Name {getSortIcon('firstName')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('role')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        Role {getSortIcon('role')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-200">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-200">
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
                            <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
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
                bg-slate-900/50 border-t border-slate-700/50
                flex items-center justify-between
              ">
                <div className="text-sm text-slate-400">
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
                    Page {pagination.currentPage} of {pagination.totalPages}
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

