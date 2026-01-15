'use client';

import { useState, useEffect } from 'react';
import { 
  FaFilter, 
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { getScrapingProgress, getPendingItems } from '@/lib/scraping';

export default function MakesTable() {
  const [makes, setMakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Filters
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchMakes = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch makes from pending endpoint - it returns actual make items
      // API: GET /api/v1/scraping/pending?step=makes&limit=100
      // Returns: { success: true, count: X, data: [...] }
      let makesData = [];
      
      // Fetch pending makes
      if (status === 'all' || status === 'pending') {
        const pendingData = await getPendingItems({ step: 'makes', limit: 100 });
        if (pendingData.data && Array.isArray(pendingData.data)) {
          makesData = [...makesData, ...pendingData.data.filter(m => !status || m.status === status)];
        }
      }
      
      // For completed makes, we might need to check if there's a way to get them
      // The progress endpoint gives stats, not individual items
      // For now, we'll show pending makes and let the user filter by status
      
      
      // Apply filters
      if (year) {
        makesData = makesData.filter(m => m.year === year);
      }
      if (status !== 'all') {
        makesData = makesData.filter(m => m.status === status);
      }
      
      // Apply client-side search filter
      if (search) {
        makesData = makesData.filter(make => 
          make.makeName?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Sort
      makesData.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
          aVal = new Date(aVal || 0);
          bVal = new Date(bVal || 0);
        }
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
      
      setMakes(makesData);
    } catch (err) {
      setError(err.message || 'Failed to load makes');
      setMakes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMakes();
  }, [status, year, search]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <FaSort className="w-4 h-4 text-slate-500" />;
    }
    return sortOrder === 'asc' 
      ? <FaSortUp className="w-4 h-4 text-blue-400" />
      : <FaSortDown className="w-4 h-4 text-blue-400" />;
  };

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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'yellow', icon: '⏳', text: 'Pending' },
      in_progress: { color: 'blue', icon: '🔄', text: 'In Progress' },
      completed: { color: 'green', icon: '✅', text: 'Completed' },
      failed: { color: 'red', icon: '❌', text: 'Failed' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        badge.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-300' :
        badge.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
        badge.color === 'green' ? 'bg-green-500/20 text-green-300' :
        'bg-red-500/20 text-red-300'
      }`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  // Get unique years from makes
  const years = [...new Set(makes.map(m => m.year).filter(Boolean))].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Filters Section - Collapsible */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FaFilter className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-200">Filters</h2>
          </div>
          {filtersExpanded ? (
            <FaChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <FaChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        
        {filtersExpanded && (
          <div className="px-6 pb-6 border-t border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="
                w-full px-4 py-2
                bg-slate-900/50 border border-slate-700/50
                rounded-lg
                text-slate-100
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                focus:border-blue-500/50
              "
            >
              <option value="">All Years</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

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
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Search Make Name
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchMakes();
                  }
                }}
                placeholder="Search by make name..."
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
            </div>

            {/* Filter Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={fetchMakes}
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
                onClick={() => {
                  setYear('');
                  setStatus('all');
                  setSearch('');
                }}
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
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
          {error}
        </div>
      )}

      {/* Makes Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4">Loading makes...</p>
          </div>
        ) : makes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">No makes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('year')}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                    >
                      Year {getSortIcon('year')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('makeName')}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                    >
                      Make Name {getSortIcon('makeName')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Total Models
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                    >
                      Created At {getSortIcon('createdAt')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('updatedAt')}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                    >
                      Updated At {getSortIcon('updatedAt')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {makes.map((make) => (
                  <tr
                    key={make._id || `${make.year}-${make.makeName}`}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-300">{make.year || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-200 font-medium">
                      {make.makeName || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(make.status || 'pending')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {make.totalModels || make.count || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {formatDate(make.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {formatDate(make.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
