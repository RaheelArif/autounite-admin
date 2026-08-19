'use client';

import { useEffect, useState } from 'react';
import { getBlogReports } from '@/lib/blog';

export default function ReportsTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getBlogReports()
      .then((res) => setData(res.data || res))
      .catch((err) => setError(err.message || 'Failed to load reports'));
  }, []);

  if (error) {
    return <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">{error}</div>;
  }
  if (!data) {
    return <div className="p-8 text-center au-dash-text-subtle">Loading reports...</div>;
  }

  const statusEntries = Object.entries(data.articlesByStatus || {});
  const eventEntries = Object.entries(data.eventsByName || {});

  return (
    <div className="au-dash-page">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="au-dash-card p-4">
          <h2 className="au-dash-card-title mb-3">Articles by status</h2>
          {statusEntries.length === 0 ? (
            <p className="au-dash-text-subtle">No articles yet.</p>
          ) : (
            <ul className="space-y-2">
              {statusEntries.map(([status, count]) => (
                <li key={status} className="flex justify-between au-dash-text">
                  <span>{status}</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="au-dash-card p-4">
          <h2 className="au-dash-card-title mb-3">Public events</h2>
          {eventEntries.length === 0 ? (
            <p className="au-dash-text-subtle">No Blog OS events recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {eventEntries.map(([name, count]) => (
                <li key={name} className="flex justify-between au-dash-text">
                  <span>{name}</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="au-dash-card p-4">
        <h2 className="au-dash-card-title mb-3">Top content IDs</h2>
        {(data.topContent || []).length === 0 ? (
          <p className="au-dash-text-subtle">No content events yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.topContent.map((row) => (
              <li key={row._id} className="flex justify-between au-dash-text text-sm">
                <span>{row._id}</span>
                <span>{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
