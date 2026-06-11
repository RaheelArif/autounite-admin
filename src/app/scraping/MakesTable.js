'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FaFilter, 
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { getMakes } from '@/lib/scraping';

export default function MakesTable() {
  const [makes, setMakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Filters
  const [year, setYear] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('count');
  const [sortOrder, setSortOrder] = useState('desc');
  const [includeDetails, setIncludeDetails] = useState(false);

  const fetchMakes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch makes from vehicles API
      // Response structure: { success: true, count: 19, data: [{ make, count, yearsCount, modelsCount, ... }], makes: [...] }
      const filters = {};
      
      if (year) {
        filters.year = year;
      }
      
      // Map sortBy to API sort parameter
      if (sortBy === 'count') {
        filters.sort = 'count';
      } else if (sortBy === 'models' || sortBy === 'modelsCount') {
        filters.sort = 'models';
      } else if (sortBy === 'makeName' || sortBy === 'make') {
        // API doesn't support sorting by name, so we'll do client-side
        filters.sort = 'count'; // Default to count for API
      }
      
      filters.order = sortOrder;
      filters.includeDetails = includeDetails;
      
      const response = await getMakes(filters);
      
      let makesData = [];
      if (response.success && response.data && Array.isArray(response.data)) {
        makesData = response.data;
      } else if (Array.isArray(response)) {
        makesData = response;
      }
      
      // Apply client-side search filter
      if (search) {
        makesData = makesData.filter(make => 
          make.make?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Client-side sorting for make name (API doesn't support it)
      if (sortBy === 'makeName' || sortBy === 'make') {
        makesData.sort((a, b) => {
          const aVal = (a.make || '').toLowerCase();
          const bVal = (b.make || '').toLowerCase();
          
          if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
      }
      
      setMakes(makesData);
    } catch (err) {
      setError(err.message || 'Failed to load makes');
      setMakes([]);
    } finally {
      setLoading(false);
    }
  }, [year, sortBy, sortOrder, search, includeDetails]);

  useEffect(() => {
    fetchMakes();
  }, [fetchMakes]);

  const handleSort = (field) => {
    // Map UI field names to internal state
    const fieldMap = {
      'makeName': 'make',
      'name': 'make',
      'make': 'make',
      'models': 'models',
      'modelsCount': 'models',
    };
    
    const mappedField = fieldMap[field] || field;
    
    if (sortBy === mappedField || sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(mappedField);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    // Handle field name mapping for sort icon display
    const fieldMap = {
      'makeName': ['make', 'makeName'],
      'name': ['make', 'makeName'],
      'make': ['make', 'makeName'],
      'models': ['models', 'modelsCount'],
      'modelsCount': ['models', 'modelsCount'],
      'count': ['count'],
    };
    
    const fieldsToCheck = fieldMap[field] || [field];
    const isActive = fieldsToCheck.includes(sortBy);
    
    if (!isActive) {
      return <FaSort className="w-4 h-4 au-dash-text-subtle" />;
    }
    return sortOrder === 'asc' 
      ? <FaSortUp className="w-4 h-4 au-dash-text-strong" />
      : <FaSortDown className="w-4 h-4 au-dash-text-strong" />;
  };



  // Get unique years from makes (for filter dropdown)
  // If includeDetails is true, we can get years from the years array
  // Otherwise, we'll use common years
  const yearsFromMakes = makes
    .flatMap(m => m.years || (m.year ? [m.year] : []))
    .filter(Boolean);
  const years = [...new Set(yearsFromMakes)].sort((a, b) => b - a);
  
  // If no years available yet, provide common years as options
  const defaultYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="
                w-full px-4 py-2
                au-dash-input
                rounded-lg
                au-dash-text-strong
                focus:outline-none focus:ring-2 focus:ring-white/25
                
              "
            >
              <option value="">All Years</option>
              {(years.length > 0 ? years : defaultYears).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Search Make Name
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 au-dash-text-subtle" />
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
                  au-dash-input
                  rounded-lg
                  au-dash-text-strong placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-white/25
                  
                "
              />
            </div>
          </div>
          </div>

          {/* Include Details Toggle */}
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
                className="
                  w-4 h-4
                  rounded
                  au-dash-input
                  au-dash-text-strong
                  focus:ring-2 focus:ring-white/25
                  focus:ring-offset-0
                "
              />
              <span className="text-sm au-dash-text-muted">
                Include details (years and models arrays)
              </span>
            </label>
          </div>

            {/* Filter Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={fetchMakes}
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
                  setSearch('');
                  setSortBy('count');
                  setSortOrder('desc');
                  setIncludeDetails(false);
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

      {/* Makes Table */}
      <div className="au-dash-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="au-dash-spinner mx-auto" />
            <p className="au-dash-text-subtle mt-4">Loading makes...</p>
          </div>
        ) : makes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="au-dash-text-subtle">No makes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="au-dash-table-head">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('makeName')}
                      className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                    >
                      Make Name {getSortIcon('makeName')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('count')}
                      className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                    >
                      Vehicle Count {getSortIcon('count')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('models')}
                      className="flex items-center gap-2 text-sm font-semibold au-dash-text-muted hover:au-dash-text-strong transition-colors"
                    >
                      Models Count {getSortIcon('models')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">
                    Years Count
                  </th>
                  {includeDetails && (
                    <>
                      <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">
                        Years
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">
                        Models
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                {makes.map((make, index) => (
                  <tr
                    key={make._id || make.id || `${make.make || index}`}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm au-dash-text font-medium">
                      {make.make || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm au-dash-text-muted">
                      {make.count || 0}
                    </td>
                    <td className="px-6 py-4 text-sm au-dash-text-muted">
                      {make.modelsCount || 0}
                    </td>
                    <td className="px-6 py-4 text-sm au-dash-text-muted">
                      {make.yearsCount || 0}
                    </td>
                    {includeDetails && (
                      <>
                        <td className="px-6 py-4 text-sm au-dash-text-muted">
                          {make.years && make.years.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {make.years.slice(0, 5).map((y, i) => (
                                <span key={i} className="px-2 py-1 au-dash-badge">
                                  {y}
                                </span>
                              ))}
                              {make.years.length > 5 && (
                                <span className="px-2 py-1 au-dash-text-subtle text-xs">
                                  +{make.years.length - 5} more
                                </span>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm au-dash-text-muted">
                          {make.models && make.models.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {make.models.slice(0, 5).map((m, i) => (
                                <span key={i} className="px-2 py-1 au-dash-badge">
                                  {m}
                                </span>
                              ))}
                              {make.models.length > 5 && (
                                <span className="px-2 py-1 au-dash-text-subtle text-xs">
                                  +{make.models.length - 5} more
                                </span>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      </>
                    )}
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
