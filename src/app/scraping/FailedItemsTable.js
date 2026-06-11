'use client';

import { useState, useEffect } from 'react';
import { 
  FaFilter, 
  FaRedo,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { getFailedItems, retryFailedItems } from '@/lib/scraping';

export default function FailedItemsTable() {
  const [failed, setFailed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Filters
  const [step, setStep] = useState('all');
  const [limit, setLimit] = useState(50);

  const fetchFailed = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        step: step !== 'all' ? step : undefined,
        limit,
      };
      
      const data = await getFailedItems(filters);
      // API returns { success: true, count: X, data: [...] }
      setFailed(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load failed items');
      setFailed([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailed();
    // Poll every 30 seconds
    const interval = setInterval(fetchFailed, 30000);
    return () => clearInterval(interval);
  }, [step, limit]);

  const handleRetrySingle = async (id) => {
    setRetrying(true);
    try {
      await retryFailedItems({ ids: [id] });
      await fetchFailed();
    } catch (err) {
      setError(err.message || 'Failed to retry item');
    } finally {
      setRetrying(false);
    }
  };

  const handleRetryAll = async () => {
    if (!confirm('Are you sure you want to retry all failed items?')) {
      return;
    }
    
    setRetrying(true);
    try {
      if (step !== 'all') {
        await retryFailedItems({ step });
      } else {
        // Retry all steps
        await retryFailedItems({ step: 'makes' });
        await retryFailedItems({ step: 'models' });
        await retryFailedItems({ step: 'vehicles' });
      }
      await fetchFailed();
    } catch (err) {
      setError(err.message || 'Failed to retry failed items');
    } finally {
      setRetrying(false);
    }
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

  return (
    <div className="au-dash-page">
      {/* Header with Retry All Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold au-dash-text">Failed Items</h2>
          <p className="au-dash-subtitle">
            View and retry failed scraping items
          </p>
        </div>
        <button
          onClick={handleRetryAll}
          disabled={retrying || failed.length === 0}
          className="
            px-6 py-2
            bg-gradient-to-r from-orange-500 to-orange-600
            hover:from-orange-400 hover:to-orange-500
            text-white font-semibold
            rounded-lg
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
            flex items-center gap-2
          "
        >
          <FaRedo className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          Retry All Failed
        </button>
      </div>

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
          {/* Step Filter */}
          <div>
            <label className="block text-sm font-medium au-dash-text-muted mb-2">
              Step
            </label>
            <select
              value={step}
              onChange={(e) => setStep(e.target.value)}
              className="
                w-full px-4 py-2
                au-dash-input
                rounded-lg
                au-dash-text-strong
                focus:outline-none focus:ring-2 focus:ring-white/25
                
              "
            >
              <option value="all">All Steps</option>
              <option value="makes">Makes</option>
              <option value="models">Models</option>
              <option value="vehicles">Vehicles</option>
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
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
          {error}
        </div>
      )}

      {/* Failed Items Table */}
      <div className="au-dash-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="au-dash-spinner mx-auto" />
            <p className="au-dash-text-subtle mt-4">Loading failed items...</p>
          </div>
        ) : failed.length === 0 ? (
          <div className="p-12 text-center">
            <FaCheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="au-dash-text-subtle">No failed items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="au-dash-table-head">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Year</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Make</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Model</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Step</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Error</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Retries</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Failed At</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                {failed.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm au-dash-text-muted">{item.year || '-'}</td>
                    <td className="px-6 py-4 text-sm au-dash-text font-medium">
                      {item.makeName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm au-dash-text font-medium">
                      {item.modelName || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 capitalize">
                        {item.step || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2 max-w-md">
                        <FaExclamationTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-red-300 break-words">
                          {item.error || 'Unknown error'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm au-dash-text-muted">
                      {item.retryCount || 0}
                    </td>
                    <td className="px-6 py-4 text-sm au-dash-text-subtle">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRetrySingle(item._id)}
                        disabled={retrying}
                        className="
                          px-4 py-2
                          bg-white/15 hover:bg-white/22
                          au-dash-text font-medium text-sm
                          rounded-lg
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-300
                          flex items-center gap-2
                        "
                      >
                        <FaRedo className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
                        Retry
                      </button>
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
