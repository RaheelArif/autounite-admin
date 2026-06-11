'use client';

import { useState, useEffect } from 'react';
import { 
  FaIndustry, 
  FaCar, 
  FaDatabase,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import { getScrapingSummary } from '@/lib/scraping';

export default function ScrapingDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      setError('');
      const data = await getScrapingSummary();
      // API returns: { success: true, scraping: {...}, vehicles: {...}, recent: [...] }
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // Poll every 30 seconds
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="au-dash-spinner mx-auto" />
        <p className="au-dash-text-subtle mt-4">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
        {error}
      </div>
    );
  }

  if (!summary || !summary.success) {
    return (
      <div className="p-12 text-center">
        <p className="au-dash-text-subtle">No data available</p>
      </div>
    );
  }

  // API returns data directly, not wrapped in data property
  const scraping = summary.scraping || summary.data?.scraping;
  const vehicles = summary.vehicles || summary.data?.vehicles;
  const recent = summary.recent || summary.data?.recent || [];
  const makes = scraping?.byStep?.find(s => s._id === 'makes') || { total: 0, completed: 0, pending: 0, failed: 0 };
  const models = scraping?.byStep?.find(s => s._id === 'models') || { total: 0, completed: 0, pending: 0, failed: 0 };
  const vehiclesStep = scraping?.byStep?.find(s => s._id === 'vehicles') || { total: 0, completed: 0, pending: 0, failed: 0 };

  const makesProgress = makes.total > 0 ? (makes.completed / makes.total) * 100 : 0;
  const modelsProgress = models.total > 0 ? (models.completed / models.total) * 100 : 0;
  const vehiclesProgress = vehiclesStep.total > 0 ? (vehiclesStep.completed / vehiclesStep.total) * 100 : 0;

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

  return (
    <div className="au-dash-page">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Makes Card */}
        <div className="au-dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/12 rounded-lg">
              <FaIndustry className="w-6 h-6 au-dash-text-strong" />
            </div>
          </div>
          <h3 className="text-sm font-medium au-dash-text-subtle mb-1">Makes</h3>
          <p className="text-2xl font-bold au-dash-text">
            {makes.completed} / {makes.total}
          </p>
          <p className="text-xs au-dash-text-subtle mt-1">
            {makesProgress.toFixed(1)}% Complete
          </p>
        </div>

        {/* Models Card */}
        <div className="au-dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <FaCar className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium au-dash-text-subtle mb-1">Models</h3>
          <p className="text-2xl font-bold au-dash-text">
            {models.completed} / {models.total}
          </p>
          <p className="text-xs au-dash-text-subtle mt-1">
            {modelsProgress.toFixed(1)}% Complete
          </p>
        </div>

        {/* Vehicles Card */}
        <div className="au-dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FaDatabase className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium au-dash-text-subtle mb-1">Vehicles</h3>
          <p className="text-2xl font-bold au-dash-text">
            {vehicles?.total || 0}
          </p>
          <p className="text-xs au-dash-text-subtle mt-1">
            {vehicles?.withFueleconomy || 0} with fueleconomy
          </p>
        </div>

        {/* Coverage Card */}
        <div className="au-dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <FaCheckCircle className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium au-dash-text-subtle mb-1">Coverage</h3>
          <p className="text-2xl font-bold au-dash-text">
            {vehicles?.coverage || '0'}%
          </p>
          <p className="text-xs au-dash-text-subtle mt-1">
            {vehicles?.withFueleconomy || 0} / {vehicles?.total || 0} vehicles
          </p>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="au-dash-card p-6 space-y-6">
        <h2 className="text-xl font-semibold au-dash-text">Progress Overview</h2>
        
        {/* Makes Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium au-dash-text-muted">Makes Progress</span>
            <span className="text-sm au-dash-text-subtle">
              {makes.completed} / {makes.total} ({makesProgress.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-[rgba(8,10,18,0.35)] rounded-full h-3">
            <div
              className="bg-white/70 h-3 rounded-full transition-all duration-300"
              style={{ width: `${makesProgress}%` }}
            />
          </div>
        </div>

        {/* Models Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium au-dash-text-muted">Models Progress</span>
            <span className="text-sm au-dash-text-subtle">
              {models.completed} / {models.total} ({modelsProgress.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-[rgba(8,10,18,0.35)] rounded-full h-3">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${modelsProgress}%` }}
            />
          </div>
        </div>

        {/* Vehicles Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium au-dash-text-muted">Vehicles Progress</span>
            <span className="text-sm au-dash-text-subtle">
              {vehiclesStep.completed} / {vehiclesStep.total} ({vehiclesProgress.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-[rgba(8,10,18,0.35)] rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${vehiclesProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recent && recent.length > 0 && (
        <div className="au-dash-card overflow-hidden">
          <div className="p-6 au-dash-tabs-underline">
            <h2 className="text-xl font-semibold au-dash-text">Recent Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="au-dash-table-head">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Year</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Make</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Model</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Step</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                {recent.map((item) => (
                  <tr key={item._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm au-dash-text-muted">{item.year}</td>
                    <td className="px-6 py-4 text-sm au-dash-text-muted">{item.makeName || '-'}</td>
                    <td className="px-6 py-4 text-sm au-dash-text-muted">{item.modelName || '-'}</td>
                    <td className="px-6 py-4 text-sm au-dash-text-muted capitalize">{item.step}</td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-sm au-dash-text-subtle">{formatDate(item.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
