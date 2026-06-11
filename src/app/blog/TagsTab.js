'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from '@/lib/blog';

function slugFromName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function TagsTab() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [isActiveFilter, setIsActiveFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (isActiveFilter !== '') params.isActive = isActiveFilter === 'true';
      const res = await getTags(params);
      const data = res.data || res;
      setTags(data.tags || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load tags');
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, isActiveFilter]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const openCreateModal = () => {
    setEditingTag(null);
    setFormData({ name: '', slug: '' });
    setModalOpen(true);
  };

  const openEditModal = (tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name || '', slug: tag.slug || '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTag(null);
    setSubmitting(false);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingTag ? prev.slug : slugFromName(name),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || slugFromName(formData.name),
      };
      if (editingTag) {
        await updateTag(editingTag._id, payload);
      } else {
        await createTag(payload);
      }
      closeModal();
      fetchTags();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Soft delete this tag? (isActive = false)')) return;
    setError('');
    try {
      await deleteTag(id);
      fetchTags();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchTags();
  };

  const handleClearFilters = () => {
    setIsActiveFilter('');
    setPage(1);
  };

  return (
    <div className="au-dash-page">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="au-dash-card overflow-hidden">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FaFilter className="w-5 h-5 au-dash-text-strong" />
            <h2 className="au-dash-card-title">Filters</h2>
          </div>
          {filtersOpen ? <FaChevronUp className="w-5 h-5 au-dash-text-subtle" /> : <FaChevronDown className="w-5 h-5 au-dash-text-subtle" />}
        </button>
        {filtersOpen && (
          <div className="px-4 pb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium au-dash-text-muted mb-1">Active</label>
              <select
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
                className="px-4 py-2 au-dash-input rounded-lg au-dash-text-strong"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <button
              onClick={handleApplyFilters}
              className="au-dash-btn font-medium"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 au-dash-tab au-dash-text-muted rounded-lg"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="au-dash-card overflow-hidden">
        <div className="p-4 au-dash-tabs-underline flex justify-between items-center">
          <h2 className="au-dash-card-title">Tags</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 au-dash-btn font-medium"
          >
            <FaPlus className="w-4 h-4" />
            Add Tag
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="au-dash-spinner mx-auto" />
            <p className="au-dash-text-subtle mt-4">Loading tags...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="p-12 text-center au-dash-text-subtle">No tags found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="au-dash-table-head">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Slug</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Active</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                  {tags.map((tag) => (
                    <tr key={tag._id} className="hover:bg-white/5">
                      <td className="px-6 py-4 au-dash-text font-medium">{tag.name}</td>
                      <td className="px-6 py-4 au-dash-text-subtle text-sm">{tag.slug}</td>
                      <td className="px-6 py-4">
                        {tag.isActive ? (
                          <FaCheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <FaTimesCircle className="w-5 h-5 text-red-400" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(tag)}
                            className="p-2 rounded-lg bg-white/15 hover:bg-white/22 au-dash-text-strong"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tag._id)}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                            title="Delete (soft)"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.1)] flex items-center justify-between">
                <p className="text-sm au-dash-text-subtle">
                  Page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="px-4 py-2 au-dash-badge rounded-lg au-dash-text-muted disabled:opacity-50 flex items-center gap-1"
                  >
                    <FaChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= pagination.totalPages || loading}
                    className="px-4 py-2 au-dash-badge rounded-lg au-dash-text-muted disabled:opacity-50 flex items-center gap-1"
                  >
                    Next
                    <FaChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="au-dash-modal w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)]">
              <h3 className="au-dash-card-title">
                {editingTag ? 'Edit Tag' : 'Add Tag'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg au-dash-text-subtle hover:au-dash-text hover:au-dash-badge"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium au-dash-text-muted mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="au-dash-input"
                  placeholder="e.g. comparison"
                />
              </div>
              <div>
                <label className="block text-sm font-medium au-dash-text-muted mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                  required
                  className="au-dash-input"
                  placeholder="e.g. comparison"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 au-dash-btn disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTag ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 au-dash-tab au-dash-text-muted rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
