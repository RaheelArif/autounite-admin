'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { createBlogAuthor, deleteBlogAuthor, getBlogAuthors } from '@/lib/blog';

export default function AuthorsTab() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', bio: '' });

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await getBlogAuthors();
      setItems(res.data?.authors || []);
    } catch (err) {
      setError(err.message || 'Failed to load authors');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createBlogAuthor(form);
      setForm({ name: '', slug: '', bio: '' });
      await load();
    } catch (err) {
      setError(err.message || 'Failed to create author');
    }
  };

  return (
    <div className="au-dash-page">
      {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">{error}</div>}
      <div className="au-dash-card p-4">
        <h2 className="au-dash-card-title mb-3">Authors</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="au-dash-input"
          />
          <input
            placeholder="slug (optional)"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            className="au-dash-input"
          />
          <input
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            className="au-dash-input"
          />
          <button type="submit" className="au-dash-btn flex items-center justify-center gap-2">
            <FaPlus className="w-3 h-3" /> Add author
          </button>
        </form>
      </div>
      <div className="au-dash-card overflow-hidden">
        <table className="w-full">
          <thead className="au-dash-table-head">
            <tr>
              <th className="px-4 py-3 text-left text-sm au-dash-text-muted">Name</th>
              <th className="px-4 py-3 text-left text-sm au-dash-text-muted">Slug</th>
              <th className="px-4 py-3 text-left text-sm au-dash-text-muted">Author ID</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row._id} className="border-t border-white/10">
                <td className="px-4 py-3 au-dash-text">{row.name}</td>
                <td className="px-4 py-3 au-dash-text-subtle">{row.slug}</td>
                <td className="px-4 py-3 au-dash-text-subtle text-xs">{row.author_id}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={async () => {
                      await deleteBlogAuthor(row._id);
                      load();
                    }}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
