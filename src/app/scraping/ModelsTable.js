'use client';

import { useState, useEffect } from 'react';
import { 
  FaFilter, 
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { getPendingItems, getScrapingProgress } from '@/lib/scraping';

export default function ModelsTable() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Filters
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(50);

  const fetchModels = async () => {
    setLoading(true);
    setError('');
    try {
      let modelsData = [];
      
      if (status === 'pending' || status === 'all') {
        const pendingData = await getPendingItems({ step: 'models', limit: 100 });
        // API returns { success: true, count: X, data: [...] }
        if (pendingData.data && Array.isArray(pendingData.data)) {
          modelsData = [...modelsData, ...pendingData.data];
        }
      }
      
      // Note: Completed models might not be available via pending endpoint
      // The progress endpoint returns aggregated stats, not individual items
      // For now, we show pending models. Completed models would need a different endpoint
      
      // Apply filters
      if (year) {
        modelsData = modelsData.filter(m => m.year === year);
      }
      if (make) {
        modelsData = modelsData.filter(m => 
          m.makeName?.toLowerCase().includes(make.toLowerCase())
        );
      }
      if (search) {
        modelsData = modelsData.filter(m => 
          m.modelName?.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (status !== 'all') {
        modelsData = modelsData.filter(m => m.status === status);
      }
      
      // Limit results
      modelsData = modelsData.slice(0, limit);
      
      setModels(modelsData);
    } catch (err) {
      setError(err.message || 'Failed to load models');
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [status, limit]);

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
        badge.color === 'blue' ? 'bg-white/15 au-dash-text' :
        badge.color === 'green' ? 'bg-green-500/20 text-green-300' :
        'bg-red-500/20 text-red-300'
      }`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  // Get unique values for filters
  const years = [...new Set(models.map(m => m.year).filter(Boolean))].sort((a, b) => b - a);
  const makes = [...new Set(models.map(m => m.makeName).filter(Boolean))].sort();

  return (
    <div className="au-dash-page">
      {/* Filters Section - Collapsible */}
      <div className="au-dash-card overflow-hidden">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FaFilter className="w-5 h-5 au-dash-text-strong" />
            <h2 className="text-xl font-semibold au-dash-text">Filters</h2>
          </div>
          {filtersExpanded ? (
            <FaChevronUp className="w-5 h-5 au-dash-text-subtle" />
          ) : (
            <FaChevronDown className="w-5 h-5 au-dash-text-subtle" />
          )}
        </button>
        
        {filtersExpanded && (
          <div className="px-6 pb-6 border-t border-[rgba(255,255,255,0.1)]">
        
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Year
            </label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., 2024"
              className="
                w-full px-4 py-2
                au-dash-input
                rounded-lg
                au-dash-text-strong placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-white/25
                
              "
            />
          </div>

          {/* Make Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Make
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 au-dash-text-subtle" />
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Search make..."
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

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="
                w-full px-4 py-2
                au-dash-input
                rounded-lg
                au-dash-text-strong
                focus:outline-none focus:ring-2 focus:ring-white/25
                
              "
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Limit Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Results Per Page
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
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

            {/* Search Filter */}
            <div className="mt-4">
          <label className="block text-sm font-medium au-dash-text-muted mb-2">
            Search Model Name
          </label>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 au-dash-text-subtle" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchModels();
                }
              }}
              placeholder="Search by model name..."
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

            {/* Filter Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={fetchModels}
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
                onClick={() => {
                  setYear('');
                  setMake('');
                  setStatus('all');
                  setSearch('');
                }}
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
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
          {error}
        </div>
      )}

      {/* Models Table */}
      <div className="au-dash-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="au-dash-spinner mx-auto" />
            <p className="au-dash-text-subtle mt-4">Loading models...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="p-12 text-center">
            <p className="au-dash-text-subtle">No models found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="au-dash-table-head">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Year</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Make</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Model</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Total Vehicles</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Processed</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">With Fueleconomy</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                {models.map((model) => (
                  <tr
                    key={model._id || `${model.year}-${model.makeName}-${model.modelName}`}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm au-dash-text-muted">{model.year || '-'}</td>
                    <td className="px-6 py-4 text-sm au-dash-text font-medium">
                      {model.makeName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm au-dash-text font-medium">
                      {model.modelName || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(model.status || 'pending')}
                    </td>
                    <td className="px-6 py-4 text-sm au-dash-text-muted">
                      {model.totalVehicles || 0}
                    </td>
                    <td className="px-6 py-4 text-sm au-dash-text-muted">
                      {model.processedVehicles || 0}
                    </td>
                    <td className="px-6 py-4 text-sm au-dash-text-muted">
                      {model.vehiclesWithFueleconomy || 0}
                    </td>
                    <td className="px-6 py-4 text-sm au-dash-text-subtle">
                      {formatDate(model.updatedAt)}
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
