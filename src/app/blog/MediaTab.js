'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaCheck, FaPlus, FaTrash } from 'react-icons/fa';
import { approveBlogMedia, createBlogMedia, deleteBlogMedia, getBlogMedia } from '@/lib/blog';

export default function MediaTab() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ url: '', alt: '', kind: 'hero' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getBlogMedia({ page: 1, limit: 50 });
      setItems(res.data?.media || []);
    } catch (err) {
      setError(err.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createBlogMedia(form);
      setForm({ url: '', alt: '', kind: 'hero' });
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save media');
    } finally {
      setSubmitting(false);
    }
  };

  /** Media uploads land unapproved; publishing is blocked until rights are cleared. */
  const handleApprove = async (id) => {
    setError('');
    try {
      await approveBlogMedia(id);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to approve media');
    }
  };

  return (
    <div className="au-dash-page">
      {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">{error}</div>}
      <div className="au-dash-card p-4">
        <h2 className="au-dash-card-title mb-3">Add media (URL + alt required)</h2>
        <p className="text-sm au-dash-text-subtle mb-3">
          New media is saved unapproved. Approve it here once rights are cleared — an article cannot publish while its
          hero or OG image is unapproved.
        </p>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            required
            type="url"
            placeholder="https://..."
            value={form.url}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            className="au-dash-input md:col-span-2"
          />
          <input
            required
            placeholder="Alt text"
            value={form.alt}
            onChange={(e) => setForm((p) => ({ ...p, alt: e.target.value }))}
            className="au-dash-input"
          />
          <div className="flex gap-2">
            <select
              value={form.kind}
              onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value }))}
              className="au-dash-input"
            >
              <option value="hero">Hero</option>
              <option value="card">Card</option>
              <option value="og">OG</option>
              <option value="inline">Inline</option>
              <option value="other">Other</option>
            </select>
            <button type="submit" disabled={submitting} className="au-dash-btn flex items-center gap-2">
              <FaPlus className="w-3 h-3" /> Add
            </button>
          </div>
        </form>
      </div>
      <div className="au-dash-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center au-dash-text-subtle">Loading media...</div>
        ) : (
          <table className="w-full">
            <thead className="au-dash-table-head">
              <tr>
                <th className="px-4 py-3 text-left text-sm au-dash-text-muted">Kind</th>
                <th className="px-4 py-3 text-left text-sm au-dash-text-muted">Alt</th>
                <th className="px-4 py-3 text-left text-sm au-dash-text-muted">URL</th>
                <th className="px-4 py-3 text-left text-sm au-dash-text-muted">ID</th>
                <th className="px-4 py-3 text-left text-sm au-dash-text-muted">Approval</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row._id} className="border-t border-white/10">
                  <td className="px-4 py-3 au-dash-text">{row.kind}</td>
                  <td className="px-4 py-3 au-dash-text">{row.alt}</td>
                  <td className="px-4 py-3 au-dash-text-subtle text-sm truncate max-w-[280px]">{row.url}</td>
                  <td className="px-4 py-3 au-dash-text-subtle text-xs">{row.media_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        row.approved === true && row.rights_status === 'cleared'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {row.approved === true && row.rights_status === 'cleared'
                        ? 'Approved'
                        : `Not approved · ${row.rights_status || 'unverified'}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.approved === true && row.rights_status === 'cleared' ? null : (
                        <button
                          onClick={() => handleApprove(row._id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs"
                          title="Approve media (clears rights)"
                        >
                          <FaCheck className="w-3 h-3" /> Approve
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          await deleteBlogMedia(row._id);
                          load();
                        }}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
