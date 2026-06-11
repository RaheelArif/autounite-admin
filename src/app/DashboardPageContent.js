'use client';

import { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaPaperPlane,
  FaChartLine,
  FaCalendarDay
} from 'react-icons/fa';
import RequestPageContent from './request/RequestPageContent';
import UsersPageContent from './users/UsersPageContent';
import { getUserStats } from '@/lib/users';
import { getUserRequestStats } from '@/lib/userRequests';

export default function DashboardPageContent() {
  const [activeTab, setActiveTab] = useState('request');
  const [userStats, setUserStats] = useState(null);
  const [requestStats, setRequestStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch both user and request stats in parallel
        const [userStatsData, requestStatsData] = await Promise.all([
          getUserStats().catch(() => ({ data: { stats: null } })),
          getUserRequestStats().catch(() => ({ stats: null }))
        ]);

        setUserStats(userStatsData.data?.stats || null);
        setRequestStats(requestStatsData.stats || null);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="au-dash-page">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="au-dash-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm au-dash-text-subtle">Total Requests</div>
            <FaPaperPlane className="w-5 h-5 au-dash-text-strong" />
          </div>
          <div className="text-3xl font-bold au-dash-text-strong">
            {loading ? (
              <div className="au-dash-spinner" />
            ) : (
              requestStats?.totalRequests?.toLocaleString() || 0
            )}
          </div>
        </div>

        {/* Requests Today */}
        <div className="au-dash-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm au-dash-text-subtle">Requests Today</div>
            <FaCalendarDay className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">
            {loading ? (
              <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
            ) : (
              (requestStats?.requestsToday || requestStats?.recentRequests || requestStats?.requestsTodayCount || 0).toLocaleString()
            )}
          </div>
        </div>

        {/* Total Users */}
        <div className="au-dash-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm au-dash-text-subtle">Total Users</div>
            <FaUsers className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400">
            {loading ? (
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            ) : (
              userStats?.totalUsers?.toLocaleString() || 0
            )}
          </div>
        </div>

        {/* Users Today */}
        <div className="au-dash-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm au-dash-text-subtle">Users Today</div>
            <FaChartLine className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {loading ? (
              <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
            ) : (
              userStats?.registeredToday?.toLocaleString() || 0
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="au-dash-card au-dash-tabs-panel">
        <div className="au-dash-tabs-panel__nav">
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`au-dash-tabs-panel__btn ${activeTab === 'request' ? 'au-dash-tabs-panel__btn--active' : ''}`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaPaperPlane className="w-4 h-4" />
                <span>Requests</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`au-dash-tabs-panel__btn ${activeTab === 'users' ? 'au-dash-tabs-panel__btn--active' : ''}`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaUsers className="w-4 h-4" />
                <span>Users</span>
              </div>
            </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'request' && <RequestPageContent hideStats={true} />}
          {activeTab === 'users' && <UsersPageContent />}
        </div>
      </div>
    </div>
  );
}
