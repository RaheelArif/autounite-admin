'use client';

import { useCallback, useEffect, useState } from 'react';
import { createDistribution, getArticles, getDistribution } from '@/lib/blog';

export default function DistributionTab() {
  const [items, setItems] = useState([]);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    article_id: '',
    channel: 'linkedin',
    post_copy: '',
    external_url: '',
    status: 'draft',
  });

  const load = useCallback(async () => {
    setError('');
    try {
      const [dist, arts] = await Promise.all([
        getDistribution(),
        getArticles({ page: 1, limit: 50, status: 'published' }),
      ]);
      setItems(dist.data?.distribution || []);
      setArticles((arts.data || arts).articles || []);
    } catch (err) {
      setError(err.message || 'Failed to load distribution');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createDistribution(form);
      setForm((p) => ({ ...p, post_copy: '', external_url: '' }));
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save distribution');
    }
  };

  return (
    <div className="au-dash-page">
      {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">{error}</div>}
      <div className="au-dash-card p-4 space-y-3">
        <h2 className="au-dash-card-title">Track published distribution</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            required
            value={form.article_id}
            onChange={(e) => setForm((p) => ({ ...p, article_id: e.target.value }))}
            className="au-dash-input"
          >
            <option value="">Published article</option>
            {articles.map((a) => (
              <option key={a._id} value={a.article_id}>
                {a.title}
              </option>
            ))}
          </select>
          <select
            value={form.channel}
            onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))}
            className="au-dash-input"
          >
            <option value="linkedin">LinkedIn</option>
            <option value="newsletter">Newsletter</option>
            <option value="x">X</option>
            <option value="other">Other</option>
          </select>
          <input
            placeholder="External URL"
            value={form.external_url}
            onChange={(e) => setForm((p) => ({ ...p, external_url: e.target.value }))}
            className="au-dash-input md:col-span-2"
          />
          <textarea
            placeholder="Caption / post copy"
            value={form.post_copy}
            onChange={(e) => setForm((p) => ({ ...p, post_copy: e.target.value }))}
            className="au-dash-input md:col-span-2 min-h-[80px]"
          />
          <button type="submit" className="au-dash-btn">
            Save distribution
          </button>
        </form>
      </div>
      <div className="au-dash-card overflow-hidden">
        <table className="w-full">
          <thead className="au-dash-table-head">
            <tr>
              <th className="px-4 py-3 text-left text-sm au-dash-text-muted">Article</th>
              <th className="px-4 py-3 text-left text-sm au-dash-text-muted">Channel</th>
              <th className="px-4 py-3 text-left text-sm au-dash-text-muted">Status</th>
              <th className="px-4 py-3 text-left text-sm au-dash-text-muted">URL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row._id} className="border-t border-white/10">
                <td className="px-4 py-3 au-dash-text text-sm">{row.article_id}</td>
                <td className="px-4 py-3 au-dash-text">{row.channel}</td>
                <td className="px-4 py-3 au-dash-text-subtle">{row.status}</td>
                <td className="px-4 py-3 au-dash-text-subtle text-sm truncate max-w-[240px]">{row.external_url || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
