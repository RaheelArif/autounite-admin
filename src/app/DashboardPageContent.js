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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="
            text-3xl font-bold
            bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500
            bg-clip-text text-transparent
          ">
            Users & Requests
          </h1>
          <p className="text-slate-400 mt-1">
            Manage users and requests dashboard
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-400">Total Requests</div>
            <FaPaperPlane className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {loading ? (
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              requestStats?.totalRequests?.toLocaleString() || 0
            )}
          </div>
        </div>

        {/* Requests Today */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-400">Requests Today</div>
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
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-400">Total Users</div>
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
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-400">Users Today</div>
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
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="border-b border-slate-700/50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('request')}
              className={`
                flex-1 px-6 py-4 text-sm font-semibold
                transition-all duration-300
                relative
                ${activeTab === 'request'
                  ? 'text-blue-400 bg-slate-900/50'
                  : 'text-slate-400 hover:text-slate-300'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <FaPaperPlane className="w-4 h-4" />
                <span>Requests</span>
              </div>
              {activeTab === 'request' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`
                flex-1 px-6 py-4 text-sm font-semibold
                transition-all duration-300
                relative
                ${activeTab === 'users'
                  ? 'text-blue-400 bg-slate-900/50'
                  : 'text-slate-400 hover:text-slate-300'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <FaUsers className="w-4 h-4" />
                <span>Users</span>
              </div>
              {activeTab === 'users' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'request' && <RequestPageContent hideHeader={true} hideStats={true} />}
          {activeTab === 'users' && <UsersPageContent hideHeader={true} />}
        </div>
      </div>
    </div>
  );
}
