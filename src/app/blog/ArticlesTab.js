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
  FaMinus,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
  getCategories,
  getTags,
} from '@/lib/blog';

const ARTICLE_TYPES = [
  { value: 'guide', label: 'Guide' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'explainer', label: 'Explainer' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'news_brief', label: 'News Brief' },
  { value: 'opinion', label: 'Opinion' },
];

const READING_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const SECTION_IDS = ['overview', 'details', 'examples', 'compare', 'related', 'sources'];

const BLOCK_KINDS = [
  { value: 'text', label: 'Text' },
  { value: 'bullets', label: 'Bullets' },
  { value: 'tile_row', label: 'Tile Row' },
  { value: 'table', label: 'Table' },
  { value: 'link_list', label: 'Link List' },
];

function slugFromTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

const DEFAULT_SEO = {
  canonical_url: '',
  meta_title: '',
  meta_description: '',
  og_image_url: '',
  robots: 'index,follow',
  schema_org_type: 'Article',
};

const DEFAULT_FORM = {
  title: '',
  slug: '',
  summary: '',
  type: 'guide',
  tags: [],
  categorySlug: '',
  reading_level: 'intermediate',
  hero_image_url: '',
  author_name: '',
  status: 'draft',
  read_time_min: 5,
  badge: '',
  seo: { ...DEFAULT_SEO },
  sections: [],
  related_article_ids: [],
};

export default function ArticlesTab() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    categorySlug: '',
    search: '',
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [allArticles, setAllArticles] = useState([]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.categorySlug) params.categorySlug = filters.categorySlug;
      if (filters.search) params.search = filters.search;
      const res = await getArticles(params);
      const data = res.data || res;
      setArticles(data.articles || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load articles');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const fetchCategoriesForFilters = useCallback(async () => {
    try {
      const catRes = await getCategories({ page: 1, limit: 100 });
      setCategories((catRes.data || catRes).categories || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCategoriesForFilters();
  }, [fetchCategoriesForFilters]);

  const fetchCategoriesAndTags = useCallback(async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        getCategories({ page: 1, limit: 100 }),
        getTags({ page: 1, limit: 100 }),
      ]);
      setCategories((catRes.data || catRes).categories || []);
      setTags((tagRes.data || tagRes).tags || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchAllArticles = useCallback(async () => {
    try {
      const res = await getArticles({ page: 1, limit: 200 });
      setAllArticles((res.data || res).articles || []);
    } catch {
      setAllArticles([]);
    }
  }, []);

  useEffect(() => {
    if (formOpen) {
      fetchCategoriesAndTags();
      fetchAllArticles();
    }
  }, [formOpen, fetchCategoriesAndTags, fetchAllArticles]);

  const openCreateForm = () => {
    setEditingArticle(null);
    setFormData({
      ...DEFAULT_FORM,
      seo: { ...DEFAULT_SEO },
      sections: [],
    });
    setFormOpen(true);
  };

  const openEditForm = async (article) => {
    setEditingArticle(article);
    try {
      const res = await getArticleById(article._id);
      const data = res.data || res;
      const a = data.article || data;
      if (!a || !a._id) throw new Error('Article not found');
      setFormData({
        title: a.title || '',
        slug: a.slug || '',
        summary: a.summary || '',
        type: a.type || 'guide',
        tags: Array.isArray(a.tags) ? a.tags : [],
        categorySlug: a.categorySlug || '',
        reading_level: a.reading_level || 'intermediate',
        hero_image_url: a.hero_image_url || '',
        author_name: a.author_name || '',
        status: a.status || 'draft',
        read_time_min: a.read_time_min ?? 5,
        badge: a.badge || '',
        seo: {
          ...DEFAULT_SEO,
          ...(a.seo || {}),
        },
        sections: Array.isArray(a.sections) ? JSON.parse(JSON.stringify(a.sections)) : [],
        related_article_ids: Array.isArray(a.related_article_ids) ? a.related_article_ids : [],
      });
      setFormOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to load article');
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingArticle(null);
    setSubmitting(false);
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingArticle ? prev.slug : slugFromTitle(title),
    }));
  };

  const handleTagsInput = (e) => {
    const val = e.target.value;
    const arr = val.split(',').map((s) => s.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, tags: arr }));
  };

  const addSection = () => {
    const used = formData.sections.map((s) => s.section_id);
    const nextId = SECTION_IDS.find((id) => !used.includes(id)) || `section_${formData.sections.length}`;
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { section_id: nextId, label: nextId.charAt(0).toUpperCase() + nextId.slice(1), blocks: [] },
      ],
    }));
  };

  const removeSection = (idx) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx),
    }));
  };

  const addBlock = (sectionIdx) => {
    setFormData((prev) => {
      const sections = [...prev.sections];
      const blocks = sections[sectionIdx].blocks || [];
      blocks.push({ kind: 'text', text: '', clamp_lines_default: 4 });
      sections[sectionIdx] = { ...sections[sectionIdx], blocks };
      return { ...prev, sections };
    });
  };

  const updateBlock = (sectionIdx, blockIdx, field, value) => {
    setFormData((prev) => {
      const sections = JSON.parse(JSON.stringify(prev.sections));
      const block = sections[sectionIdx].blocks[blockIdx];
      if (field === 'kind') {
        const kind = value;
        if (kind === 'text') {
          sections[sectionIdx].blocks[blockIdx] = { kind: 'text', text: block.text || '', clamp_lines_default: 4 };
        } else if (kind === 'bullets') {
          sections[sectionIdx].blocks[blockIdx] = {
            kind: 'bullets',
            bullets: Array.isArray(block.bullets) ? block.bullets : [''],
            clamp_items_default: 5,
          };
        } else {
          sections[sectionIdx].blocks[blockIdx] = { ...block, kind, [field]: value };
        }
      } else {
        block[field] = value;
      }
      return { ...prev, sections };
    });
  };

  const updateBullets = (sectionIdx, blockIdx, bullets) => {
    setFormData((prev) => {
      const sections = JSON.parse(JSON.stringify(prev.sections));
      sections[sectionIdx].blocks[blockIdx].bullets = bullets;
      return { ...prev, sections };
    });
  };

  const removeBlock = (sectionIdx, blockIdx) => {
    setFormData((prev) => {
      const sections = [...prev.sections];
      sections[sectionIdx].blocks = sections[sectionIdx].blocks.filter((_, i) => i !== blockIdx);
      return { ...prev, sections };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || slugFromTitle(formData.title),
        summary: formData.summary.trim(),
        type: formData.type,
        tags: formData.tags,
        categorySlug: formData.categorySlug || undefined,
        reading_level: formData.reading_level,
        hero_image_url: formData.hero_image_url || undefined,
        author_name: formData.author_name || undefined,
        status: formData.status,
        read_time_min: Number(formData.read_time_min) || 5,
        badge: formData.badge || undefined,
        seo: formData.seo,
        sections: formData.sections,
        related_article_ids: formData.related_article_ids,
      };
      if (editingArticle) {
        await updateArticle(editingArticle._id, payload);
      } else {
        await createArticle(payload);
      }
      closeForm();
      fetchArticles();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hard delete this article? This cannot be undone.')) return;
    setError('');
    try {
      await deleteArticle(id);
      fetchArticles();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handlePublish = async (id) => {
    setError('');
    try {
      await publishArticle(id);
      fetchArticles();
    } catch (err) {
      setError(err.message || 'Failed to publish');
    }
  };

  const handleUnpublish = async (id) => {
    setError('');
    try {
      await unpublishArticle(id);
      fetchArticles();
    } catch (err) {
      setError(err.message || 'Failed to unpublish');
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchArticles();
  };

  const handleClearFilters = () => {
    setFilters({ status: '', type: '', categorySlug: '', search: '' });
    setPage(1);
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="">All</option>
                {ARTICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
              <select
                value={filters.categorySlug}
                onChange={(e) => setFilters((f) => ({ ...f, categorySlug: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Title, slug, summary..."
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
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
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-200">Articles</h2>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg font-medium"
          >
            <FaPlus className="w-4 h-4" />
            Add Article
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No articles found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Slug</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Updated</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {articles.map((art) => (
                    <tr key={art._id} className="hover:bg-slate-800/30">
                      <td className="px-6 py-4 text-slate-200 font-medium max-w-[200px] truncate" title={art.title}>
                        {art.title}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm max-w-[150px] truncate">{art.slug}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {ARTICLE_TYPES.find((t) => t.value === art.type)?.label || art.type}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            art.status === 'published'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {art.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{art.categorySlug || '-'}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{formatDate(art.updatedAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {art.status === 'draft' ? (
                            <button
                              onClick={() => handlePublish(art._id)}
                              className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400"
                              title="Publish"
                            >
                              <FaCheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnpublish(art._id)}
                              className="p-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                              title="Unpublish"
                            >
                              <FaTimesCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditForm(art)}
                            className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(art._id)}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                            title="Delete"
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

      {/* Create/Edit Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-200">
                {editingArticle ? 'Edit Article' : 'Add Article'}
              </h3>
              <button
                onClick={closeForm}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Basic */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-blue-400">Basic</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={handleTitleChange}
                      required
                      placeholder="e.g. How to Compare Car Trims"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Slug *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                      required
                      placeholder="e.g. how-to-compare-car-trims"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100"
                    >
                      {ARTICLE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Summary *</label>
                    <textarea
                      value={formData.summary}
                      onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
                      required
                      rows={3}
                      placeholder="e.g. A practical guide to comparing trim levels when buying a car. Learn what features matter most."
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 resize-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                    <select
                      value={formData.categorySlug}
                      onChange={(e) => setFormData((p) => ({ ...p, categorySlug: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100"
                    >
                      <option value="">—</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.tags.join(', ')}
                      onChange={handleTagsInput}
                      placeholder="e.g. comparison, trim, buying-guide, sedan"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Reading Level</label>
                    <select
                      value={formData.reading_level}
                      onChange={(e) => setFormData((p) => ({ ...p, reading_level: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100"
                    >
                      {READING_LEVELS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Read Time (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.read_time_min}
                      onChange={(e) => setFormData((p) => ({ ...p, read_time_min: e.target.value }))}
                      placeholder="e.g. 5"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Hero Image URL</label>
                    <input
                      type="url"
                      value={formData.hero_image_url}
                      onChange={(e) => setFormData((p) => ({ ...p, hero_image_url: e.target.value }))}
                      placeholder="e.g. https://cdn.example.com/images/hero-car-trims.jpg"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={formData.author_name}
                      onChange={(e) => setFormData((p) => ({ ...p, author_name: e.target.value }))}
                      placeholder="e.g. AutoUnite Team"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Badge</label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData((p) => ({ ...p, badge: e.target.value }))}
                      placeholder="e.g. Popular, New, Updated"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-blue-400">SEO</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Canonical URL</label>
                    <input
                      type="url"
                      value={formData.seo.canonical_url}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          seo: { ...p.seo, canonical_url: e.target.value },
                        }))
                      }
                      placeholder="e.g. https://autounite.com/blog/how-to-compare-car-trims"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={formData.seo.meta_title}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          seo: { ...p.seo, meta_title: e.target.value },
                        }))
                      }
                      placeholder="e.g. How to Compare Car Trims | AutoUnite"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">OG Image URL</label>
                    <input
                      type="url"
                      value={formData.seo.og_image_url}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          seo: { ...p.seo, og_image_url: e.target.value },
                        }))
                      }
                      placeholder="e.g. https://cdn.example.com/og-car-trims.jpg"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Meta Description</label>
                    <textarea
                      value={formData.seo.meta_description}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          seo: { ...p.seo, meta_description: e.target.value },
                        }))
                      }
                      rows={2}
                      placeholder="e.g. Learn how to compare trim levels and choose the right car for your budget and needs."
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 resize-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Robots</label>
                    <input
                      type="text"
                      value={formData.seo.robots}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          seo: { ...p.seo, robots: e.target.value },
                        }))
                      }
                      placeholder="e.g. index,follow"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Schema Type</label>
                    <input
                      type="text"
                      value={formData.seo.schema_org_type}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          seo: { ...p.seo, schema_org_type: e.target.value },
                        }))
                      }
                      placeholder="e.g. Article"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-semibold text-blue-400">Sections</h4>
                  <button
                    type="button"
                    onClick={addSection}
                    className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded text-sm"
                  >
                    + Add Section
                  </button>
                </div>
                {formData.sections.map((sec, si) => (
                  <div key={si} className="border border-slate-700 rounded-lg p-4 bg-slate-900/30">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={sec.section_id}
                          onChange={(e) =>
                            setFormData((p) => {
                              const s = [...p.sections];
                              s[si] = { ...s[si], section_id: e.target.value };
                              return { ...p, sections: s };
                            })
                          }
                          placeholder="e.g. overview"
                          className="w-32 px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500"
                        />
                        <input
                          type="text"
                          value={sec.label}
                          onChange={(e) =>
                            setFormData((p) => {
                              const s = [...p.sections];
                              s[si] = { ...s[si], label: e.target.value };
                              return { ...p, sections: s };
                            })
                          }
                          placeholder="e.g. Overview"
                          className="w-40 px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSection(si)}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                      >
                        <FaMinus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(sec.blocks || []).map((blk, bi) => (
                        <div key={bi} className="flex gap-2 items-start p-2 bg-slate-900/50 rounded">
                          <select
                            value={blk.kind}
                            onChange={(e) => updateBlock(si, bi, 'kind', e.target.value)}
                            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100"
                          >
                            {BLOCK_KINDS.map((b) => (
                              <option key={b.value} value={b.value}>
                                {b.label}
                              </option>
                            ))}
                          </select>
                          {blk.kind === 'text' && (
                            <textarea
                              value={blk.text || ''}
                              onChange={(e) => updateBlock(si, bi, 'text', e.target.value)}
                              rows={2}
                              className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500"
                              placeholder="e.g. Key points about comparing trim levels..."
                            />
                          )}
                          {blk.kind === 'bullets' && (
                            <div className="flex-1 space-y-1">
                              {(blk.bullets || ['']).map((b, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  value={b}
                                  onChange={(e) => {
                                    const arr = [...(blk.bullets || [])];
                                    arr[i] = e.target.value;
                                    updateBullets(si, bi, arr);
                                  }}
                                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500"
                                  placeholder={`e.g. Bullet point ${i + 1}`}
                                />
                              ))}
                              <button
                                type="button"
                                onClick={() =>
                                  updateBullets(si, bi, [...(blk.bullets || []), ''])
                                }
                                className="text-xs text-blue-400 hover:underline"
                              >
                                + Add bullet
                              </button>
                            </div>
                          )}
                          {(blk.kind === 'tile_row' || blk.kind === 'table' || blk.kind === 'link_list') && (
                            <div className="flex-1 px-2 py-1 text-slate-500 text-sm">
                              (Edit in JSON or extend editor)
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeBlock(si, bi)}
                            className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                          >
                            <FaMinus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addBlock(si)}
                        className="text-sm text-blue-400 hover:underline"
                      >
                        + Add block
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Related Articles */}
              <div className="space-y-2">
                <h4 className="text-md font-semibold text-blue-400">Related Articles</h4>
                <select
                  multiple
                  value={formData.related_article_ids}
                  onChange={(e) => {
                    const sel = Array.from(e.target.selectedOptions, (o) => o.value);
                    setFormData((p) => ({ ...p, related_article_ids: sel }));
                  }}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 min-h-[80px]"
                >
                  {allArticles
                    .filter((a) => !editingArticle || a._id !== editingArticle._id)
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.title} ({a.slug})
                      </option>
                    ))}
                </select>
                <p className="text-xs text-slate-500">Ctrl/Cmd + click to select multiple</p>
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingArticle ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
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
