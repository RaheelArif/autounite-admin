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
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/blog';

function slugFromName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [isActiveFilter, setIsActiveFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sortOrder: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (isActiveFilter !== '') params.isActive = isActiveFilter === 'true';
      const res = await getCategories(params);
      const data = res.data || res;
      setCategories(data.categories || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, isActiveFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', sortOrder: 0 });
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      sortOrder: cat.sortOrder ?? 0,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setSubmitting(false);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : slugFromName(name),
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
        description: formData.description.trim() || undefined,
        sortOrder: Number(formData.sortOrder) || 0,
      };
      if (editingCategory) {
        await updateCategory(editingCategory._id, payload);
      } else {
        await createCategory(payload);
      }
      closeModal();
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Soft delete this category? (isActive = false)')) return;
    setError('');
    try {
      await deleteCategory(id);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchCategories();
  };

  const handleClearFilters = () => {
    setIsActiveFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FaFilter className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-200">Filters</h2>
          </div>
          {filtersOpen ? <FaChevronUp className="w-5 h-5 text-slate-400" /> : <FaChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {filtersOpen && (
          <div className="px-4 pb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Active</label>
              <select
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-100"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg font-medium"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-200">Categories</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg font-medium"
          >
            <FaPlus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No categories found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Slug</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Sort Order</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Active</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {categories.map((cat) => (
                    <tr key={cat._id} className="hover:bg-slate-800/30">
                      <td className="px-6 py-4 text-slate-200 font-medium">{cat.name}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{cat.slug}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm max-w-xs truncate">{cat.description || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{cat.sortOrder ?? 0}</td>
                      <td className="px-6 py-4">
                        {cat.isActive ? (
                          <FaCheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <FaTimesCircle className="w-5 h-5 text-red-400" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat._id)}
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
              <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="px-4 py-2 bg-slate-700/50 rounded-lg text-slate-300 disabled:opacity-50 flex items-center gap-1"
                  >
                    <FaChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= pagination.totalPages || loading}
                    className="px-4 py-2 bg-slate-700/50 rounded-lg text-slate-300 disabled:opacity-50 flex items-center gap-1"
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
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-200">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100"
                  placeholder="e.g. Buying Guide"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                  required
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100"
                  placeholder="e.g. buying-guide"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 resize-none"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData((p) => ({ ...p, sortOrder: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg"
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
