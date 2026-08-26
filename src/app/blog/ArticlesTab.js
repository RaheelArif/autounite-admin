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
  FaTimesCircle,
  FaArchive as FaBoxArchive,
} from 'react-icons/fa';
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  publishArticle,
  unpublishArticle,
  submitArticleReview,
  approveArticle,
  requestArticleRevision,
  scheduleArticle,
  archiveArticle,
  purgeArticle,
  getArticleAudit,
  getCategories,
  getTags,
  getBlogMedia,
} from '@/lib/blog';
import ArticlePreviewModal from '@/app/blog/ArticlePreviewModal';
import ArticleEditor from '@/app/blog/ArticleEditor';
import { normalizeMediaUrl } from '@/lib/blogMediaUrl';
import { useDialog } from '@/components/Dialog';

const ARTICLE_TYPES = [
  { value: 'article', label: 'Article' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'guide', label: 'Guide' },
  { value: 'explainer', label: 'Explainer' },
  { value: 'data_piece', label: 'Insight / Data' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'news_brief', label: 'News Brief' },
  { value: 'opinion', label: 'Opinion' },
];

const READING_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
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

const DEFAULT_LINEAGE = {
  original_platform: '',
  original_url: '',
  original_published_at: '',
  last_verified_at: '',
  auto_unite_published_at: '',
};

const DEFAULT_FORM = {
  title: '',
  slug: '',
  summary: '',
  type: 'article',
  tags: [],
  categorySlug: '',
  reading_level: 'intermediate',
  hero_image_url: '',
  hero_image_alt: '',
  author_name: '',
  status: 'draft',
  read_time_min: 5,
  badge: '',
  seo: { ...DEFAULT_SEO },
  sections: [],
  related_article_ids: [],
  sources: [],
  decide_first: null,
  lineage: { ...DEFAULT_LINEAGE },
};

/** Gate failures carry the exact fields that blocked them — show those, not just the headline. */
function describeError(err, fallback) {
  const headline = err?.message || fallback;
  const fields = err?.payload?.error?.fieldErrors || [];
  const detail = fields
    .map((item) => (item.field ? `${item.field}: ${item.message}` : item.message))
    .filter(Boolean)
    .join(' · ');
  return detail ? `${headline} — ${detail}` : headline;
}

export default function ArticlesTab() {
  const dialog = useDialog();
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
  const [previewArticle, setPreviewArticle] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [approvedMedia, setApprovedMedia] = useState([]);

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

  const fetchApprovedMedia = useCallback(async () => {
    try {
      const res = await getBlogMedia({ page: 1, limit: 100 });
      const rows = res.data?.media || [];
      setApprovedMedia(
        rows.filter((row) => row.approved === true && row.rights_status === 'cleared' && row.url),
      );
    } catch {
      setApprovedMedia([]);
    }
  }, []);

  useEffect(() => {
    if (formOpen) {
      fetchCategoriesAndTags();
      fetchAllArticles();
      fetchApprovedMedia();
    }
  }, [formOpen, fetchCategoriesAndTags, fetchAllArticles, fetchApprovedMedia]);

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
        hero_image_alt: a.hero_image_alt || '',
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
        sources: Array.isArray(a.sources) ? a.sources : [],
        decide_first: a.decide_first || null,
        lineage: { ...DEFAULT_LINEAGE, ...(a.lineage || {}) },
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

  /** Fill from the pasted package, but never overwrite something already typed. */
  const applyPastedPackage = ({ meta, decideFirst, sources } = {}) => {
    if (!meta) return;
    setFormData((prev) => {
      const next = { ...prev, seo: { ...prev.seo }, lineage: { ...prev.lineage } };
      if (!prev.title.trim() && meta.title) {
        next.title = meta.title;
        if (!prev.slug.trim()) next.slug = slugFromTitle(meta.title);
      }
      if (!prev.slug.trim() && meta.slug) next.slug = meta.slug;
      if (!prev.summary.trim() && meta.summary) next.summary = meta.summary;
      if (!prev.tags.length && meta.tags?.length) next.tags = meta.tags;
      if (meta.readTimeMin) next.read_time_min = meta.readTimeMin;
      if (!prev.author_name.trim() && meta.authorName) next.author_name = meta.authorName;
      if (!prev.hero_image_alt.trim() && meta.heroAlt) next.hero_image_alt = meta.heroAlt;
      if (meta.contentType && ARTICLE_TYPES.some((row) => row.value === meta.contentType.toLowerCase())) {
        next.type = meta.contentType.toLowerCase();
      }
      // Categories are locked to four; a package label like "Car Financing" is left
      // for the editor to choose rather than guessed at.
      if (!prev.categorySlug && meta.category) {
        const match = categories.find(
          (row) => row.slug === meta.category.toLowerCase() || row.name?.toLowerCase() === meta.category.toLowerCase(),
        );
        if (match) next.categorySlug = match.slug;
      }
      if (!prev.seo.meta_title?.trim() && meta.metaTitle) next.seo.meta_title = meta.metaTitle;
      if (!prev.seo.meta_description?.trim() && meta.metaDescription) {
        next.seo.meta_description = meta.metaDescription;
      }
      // The canonical URL is derived from our own origin and slug on save; a package
      // value is only accepted when it already points at that article.
      if (!prev.seo.canonical_url?.trim() && meta.canonicalUrl?.includes(`/blog/${next.slug}`)) {
        next.seo.canonical_url = meta.canonicalUrl;
      }
      if (meta.originalPlatform && !prev.lineage.original_url) {
        next.lineage.original_platform = meta.originalPlatform.toLowerCase().replace(/\s+/g, '_');
      }
      if (meta.originalUrl) next.lineage.original_url = meta.originalUrl;
      if (meta.originalPublishedAt) next.lineage.original_published_at = meta.originalPublishedAt;
      if (meta.lastVerifiedAt) next.lineage.last_verified_at = meta.lastVerifiedAt;
      if (decideFirst && !prev.decide_first) {
        next.decide_first = {
          what_matters: decideFirst.whatMatters || [],
          watch_this: decideFirst.watchThis || [],
          your_next_move: decideFirst.yourNextMove || [],
        };
      }
      if (sources?.length && !prev.sources.length) {
        next.sources = sources.map((row) => ({
          label: row.label || '',
          url: row.url,
          source_name: row.sourceName || '',
          verified_at: row.verifiedAt || null,
        }));
      }
      return next;
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
        hero_image_url: formData.hero_image_url
          ? normalizeMediaUrl(formData.hero_image_url)
          : undefined,
        hero_image_alt: formData.hero_image_alt || undefined,
        author_name: formData.author_name || undefined,
        status: formData.status,
        read_time_min: Number(formData.read_time_min) || 5,
        badge: formData.badge || undefined,
        seo: {
          ...formData.seo,
          og_image_url: formData.seo.og_image_url
            ? normalizeMediaUrl(formData.seo.og_image_url)
            : formData.seo.og_image_url,
        },
        sections: formData.sections,
        related_article_ids: formData.related_article_ids,
        sources: formData.sources.length ? formData.sources : undefined,
        decide_first: formData.decide_first || undefined,
        // Blank lineage rows would overwrite the defaults the API owns.
        lineage: Object.fromEntries(Object.entries(formData.lineage).filter(([, value]) => value)),
      };
      if (!Object.keys(payload.lineage).length) delete payload.lineage;
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

  /** Permanent, and only for content the public has never seen. */
  const handleDelete = async (article) => {
    if (['published', 'updated'].includes(article.status)) {
      await dialog.notice({
        title: 'Unpublish first',
        message:
          'This article is live. Unpublish it so the URL is redirected and the search index is cleared, then delete it.',
      });
      return;
    }
    const confirmed = await dialog.confirm({
      title: 'Delete permanently',
      message: `“${article.title}” and its revision history will be removed from the database. This cannot be undone — use Archive if you only want it out of the way.`,
      label: `Type the slug to confirm: ${article.slug}`,
      placeholder: article.slug,
      confirmText: article.slug,
      confirmLabel: 'Delete forever',
      tone: 'danger',
    });
    if (!confirmed) return;
    setError('');
    try {
      await purgeArticle(article._id, 'deleted from admin');
      fetchArticles();
    } catch (err) {
      setError(describeError(err, 'Failed to delete'));
    }
  };

  const handlePublish = async (id) => {
    setError('');
    try {
      await publishArticle(id);
      fetchArticles();
    } catch (err) {
      setError(describeError(err, 'Failed to publish'));
    }
  };

  const handleUnpublish = async (id) => {
    const reason = await dialog.prompt({
      title: 'Unpublish article',
      message: 'The article leaves the public site and the search index. The reason is kept in the audit trail.',
      label: 'Reason',
      inputType: 'textarea',
      required: true,
      confirmLabel: 'Unpublish',
      tone: 'danger',
    });
    if (!reason) return;
    setError('');
    try {
      await unpublishArticle(id, reason);
      fetchArticles();
    } catch (err) {
      setError(describeError(err, 'Failed to unpublish'));
    }
  };

  const handleSubmitReview = async (id) => {
    setError('');
    try {
      await submitArticleReview(id);
      fetchArticles();
    } catch (err) {
      setError(describeError(err, 'Failed to submit for review'));
    }
  };

  const handleApprove = async (id) => {
    setError('');
    try {
      await approveArticle(id);
      fetchArticles();
    } catch (err) {
      setError(describeError(err, 'Failed to approve'));
    }
  };

  const handleRequestRevision = async (id) => {
    const reason = await dialog.prompt({
      title: 'Request revision',
      message: 'The writer sees this reason when the article comes back to them.',
      label: 'What needs to change',
      inputType: 'textarea',
      required: true,
      confirmLabel: 'Send back',
    });
    if (!reason) return;
    setError('');
    try {
      await requestArticleRevision(id, reason);
      fetchArticles();
    } catch (err) {
      setError(describeError(err, 'Failed to request revision'));
    }
  };

  const handleSchedule = async (id) => {
    const publishAt = await dialog.prompt({
      title: 'Schedule publish',
      message: 'The article publishes automatically at this time. To publish right now, use Publish instead.',
      label: 'Publish at (your local time)',
      inputType: 'datetime-local',
      required: true,
      confirmLabel: 'Schedule',
    });
    if (!publishAt) return;
    setError('');
    try {
      await scheduleArticle(id, new Date(publishAt).toISOString());
      fetchArticles();
    } catch (err) {
      setError(describeError(err, 'Failed to schedule'));
    }
  };

  const handleArchive = async (id) => {
    const reason = await dialog.prompt({
      title: 'Archive article',
      message: 'Archiving hides the article from the working list but keeps it in the database.',
      label: 'Reason',
      inputType: 'textarea',
      required: true,
      confirmLabel: 'Archive',
    });
    if (!reason) return;
    setError('');
    try {
      await archiveArticle(id, reason);
      fetchArticles();
    } catch (err) {
      setError(describeError(err, 'Failed to archive'));
    }
  };

  const handlePreview = async (id) => {
    setError('');
    setPreviewLoading(true);
    try {
      const res = await getArticleById(id);
      setPreviewArticle(res.data?.article || null);
    } catch (err) {
      setError(err.message || 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAudit = async (id) => {
    setError('');
    try {
      const res = await getArticleAudit(id);
      const items = (res.data?.audit || [])
        .slice(0, 12)
        .map((row) => `${row.action} → ${row.to_status || ''} (${row.actor_email || row.actor_id || 'system'})`);
      await dialog.notice({
        title: 'Audit trail',
        message: items.length ? 'The twelve most recent events.' : 'No audit events yet.',
        items,
      });
    } catch (err) {
      setError(err.message || 'Failed to load audit');
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
          <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium au-dash-text-muted mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="au-dash-input"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="revision_requested">Revision requested</option>
                <option value="unpublished">Unpublished</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium au-dash-text-muted mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                className="au-dash-input"
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
              <label className="block text-sm font-medium au-dash-text-muted mb-1">Category</label>
              <select
                value={filters.categorySlug}
                onChange={(e) => setFilters((f) => ({ ...f, categorySlug: e.target.value }))}
                className="au-dash-input"
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
              <label className="block text-sm font-medium au-dash-text-muted mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Title, slug, summary..."
                className="au-dash-input"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
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
          </div>
        )}
      </div>

      {/* Table */}
      <div className="au-dash-card overflow-hidden">
        <div className="p-4 au-dash-tabs-underline flex justify-between items-center">
          <h2 className="au-dash-card-title">Articles</h2>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 au-dash-btn font-medium"
          >
            <FaPlus className="w-4 h-4" />
            Add Article
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="au-dash-spinner mx-auto" />
            <p className="au-dash-text-subtle mt-4">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center au-dash-text-subtle">No articles found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="au-dash-table-head">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Slug</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Visibility</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Index</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Updated</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold au-dash-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                  {articles.map((art) => (
                    <tr key={art._id} className="hover:bg-white/5">
                      <td className="px-6 py-4 au-dash-text font-medium max-w-[200px] truncate" title={art.title}>
                        {art.title}
                      </td>
                      <td className="px-6 py-4 au-dash-text-subtle text-sm max-w-[150px] truncate">{art.slug}</td>
                      <td className="px-6 py-4 au-dash-text-subtle text-sm">
                        {ARTICLE_TYPES.find((t) => t.value === art.type)?.label || art.type}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            art.status === 'published'
                              ? 'bg-green-500/20 text-green-400'
                              : art.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : art.status === 'in_review'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : art.status === 'scheduled'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : art.status === 'archived' || art.status === 'unpublished'
                                      ? 'bg-red-500/20 text-red-300'
                                      : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {art.status}
                        </span>
                        {(art.publish_orchestration?.status === "schedule_failed" ||
                          art.publish_orchestration?.status === "partial") && (
                          <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-300">
                            Needs retry
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 au-dash-text-subtle text-sm">{art.visibility || 'private'}</td>
                      <td className="px-6 py-4 au-dash-text-subtle text-sm">
                        {art.seo?.noindex === false ? 'index' : 'noindex'}
                      </td>
                      <td className="px-6 py-4 au-dash-text-subtle text-sm">{art.categorySlug || '-'}</td>
                      <td className="px-6 py-4 au-dash-text-subtle text-sm">{formatDate(art.updatedAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(art.status === 'draft' || art.status === 'revision_requested') && (
                            <button
                              onClick={() => handleSubmitReview(art._id)}
                              className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs"
                              title="Submit for review"
                            >
                              Review
                            </button>
                          )}
                          {art.status === 'in_review' && (
                            <>
                              <button
                                onClick={() => handleApprove(art._id)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs"
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRequestRevision(art._id)}
                                className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 text-xs"
                                title="Request revision"
                              >
                                Revise
                              </button>
                            </>
                          )}
                          {art.status === 'approved' && (
                            <>
                              <button
                                onClick={() => handlePublish(art._id)}
                                className="px-2 py-1 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs"
                                title="Publish now"
                              >
                                Publish
                              </button>
                              <button
                                onClick={() => handleSchedule(art._id)}
                                className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs"
                                title="Schedule"
                              >
                                Schedule
                              </button>
                            </>
                          )}
                          {art.status === 'scheduled' && (
                            <button
                              onClick={() => handlePublish(art._id)}
                              className="px-2 py-1 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs"
                              title="Publish now"
                            >
                              Publish now
                            </button>
                          )}
                          {(art.status === 'published' || art.status === 'updated') && (
                            <button
                              onClick={() => handleUnpublish(art._id)}
                              className="p-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                              title="Unpublish"
                            >
                              <FaTimesCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handlePreview(art._id)}
                            disabled={previewLoading}
                            className="px-2 py-1 rounded-lg bg-white/10 au-dash-text-subtle text-xs disabled:opacity-50"
                            title="Admin preview"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleAudit(art._id)}
                            className="px-2 py-1 rounded-lg bg-white/10 au-dash-text-subtle text-xs"
                            title="Audit log"
                          >
                            Audit
                          </button>
                          <button
                            onClick={() => openEditForm(art)}
                            className="p-2 rounded-lg bg-white/15 hover:bg-white/22 au-dash-text-strong"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          {art.status !== 'archived' && (
                            <button
                              onClick={() => handleArchive(art._id)}
                              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 au-dash-text-subtle"
                              title="Archive (keeps the record)"
                            >
                              <FaBoxArchive className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(art)}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                            title="Delete permanently"
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

      {previewArticle && (
        <ArticlePreviewModal article={previewArticle} onClose={() => setPreviewArticle(null)} />
      )}

      {/* Create/Edit Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="au-dash-modal w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col my-8">
            <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)] flex-shrink-0">
              <h3 className="au-dash-card-title">
                {editingArticle ? 'Edit Article' : 'Add Article'}
              </h3>
              <button
                onClick={closeForm}
                className="p-2 rounded-lg au-dash-text-subtle hover:au-dash-text hover:au-dash-badge"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Basic */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold au-dash-text-strong">Basic</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={handleTitleChange}
                      required
                      placeholder="e.g. How to Compare Car Trims"
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Slug *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                      required
                      placeholder="e.g. how-to-compare-car-trims"
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                      className="au-dash-input"
                    >
                      {ARTICLE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Summary *</label>
                    <textarea
                      value={formData.summary}
                      onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
                      required
                      rows={3}
                      placeholder="e.g. A practical guide to comparing trim levels when buying a car. Learn what features matter most."
                      className="au-dash-input resize-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Category</label>
                    <select
                      value={formData.categorySlug}
                      onChange={(e) => setFormData((p) => ({ ...p, categorySlug: e.target.value }))}
                      className="au-dash-input"
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
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.tags.join(', ')}
                      onChange={handleTagsInput}
                      placeholder="e.g. comparison, trim, buying-guide, sedan"
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Reading Level</label>
                    <select
                      value={formData.reading_level}
                      onChange={(e) => setFormData((p) => ({ ...p, reading_level: e.target.value }))}
                      className="au-dash-input"
                    >
                      {READING_LEVELS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Status</label>
                    <input
                      type="text"
                      value={formData.status}
                      disabled
                      className="au-dash-input opacity-70"
                    />
                    <p className="text-xs au-dash-text-subtle mt-1">
                      Status changes through Review → Approve → Publish / Schedule.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Read Time (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.read_time_min}
                      onChange={(e) => setFormData((p) => ({ ...p, read_time_min: e.target.value }))}
                      placeholder="e.g. 5"
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Hero Image</label>
                    <select
                      value=""
                      onChange={(e) => {
                        const row = approvedMedia.find((item) => item._id === e.target.value);
                        if (!row) return;
                        setFormData((p) => ({
                          ...p,
                          hero_image_url: normalizeMediaUrl(row.url),
                          hero_image_alt: p.hero_image_alt || row.alt || '',
                        }));
                      }}
                      className="au-dash-input mb-2"
                    >
                      <option value="">Pick approved media…</option>
                      {approvedMedia.map((row) => (
                        <option key={row._id} value={row._id}>
                          {row.kind} — {row.alt || row.media_id}
                        </option>
                      ))}
                    </select>
                    <input
                      type="url"
                      value={formData.hero_image_url}
                      onChange={(e) => setFormData((p) => ({ ...p, hero_image_url: e.target.value }))}
                      onBlur={(e) =>
                        setFormData((p) => ({ ...p, hero_image_url: normalizeMediaUrl(e.target.value) }))
                      }
                      placeholder="Or paste Drive link / image URL"
                      className="au-dash-input placeholder-slate-500"
                    />
                    {formData.hero_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={normalizeMediaUrl(formData.hero_image_url)}
                        alt={formData.hero_image_alt || 'Hero preview'}
                        className="mt-2 max-h-32 rounded object-contain bg-black/30"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Hero Image Alt</label>
                    <input
                      type="text"
                      value={formData.hero_image_alt}
                      onChange={(e) => setFormData((p) => ({ ...p, hero_image_alt: e.target.value }))}
                      placeholder="Describe the image for screen readers — required before publishing"
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Author Name</label>
                    <input
                      type="text"
                      value={formData.author_name}
                      onChange={(e) => setFormData((p) => ({ ...p, author_name: e.target.value }))}
                      placeholder="e.g. AutoUnite Team"
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Badge</label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData((p) => ({ ...p, badge: e.target.value }))}
                      placeholder="e.g. Popular, New, Updated"
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold au-dash-text-strong">SEO</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Canonical URL</label>
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
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Meta Title</label>
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
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">OG Image</label>
                    <select
                      value=""
                      onChange={(e) => {
                        const row = approvedMedia.find((item) => item._id === e.target.value);
                        if (!row) return;
                        setFormData((p) => ({
                          ...p,
                          seo: { ...p.seo, og_image_url: normalizeMediaUrl(row.url) },
                        }));
                      }}
                      className="au-dash-input mb-2"
                    >
                      <option value="">Pick approved media…</option>
                      {approvedMedia.map((row) => (
                        <option key={row._id} value={row._id}>
                          {row.kind} — {row.alt || row.media_id}
                        </option>
                      ))}
                    </select>
                    <input
                      type="url"
                      value={formData.seo.og_image_url}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          seo: { ...p.seo, og_image_url: e.target.value },
                        }))
                      }
                      onBlur={(e) =>
                        setFormData((p) => ({
                          ...p,
                          seo: { ...p.seo, og_image_url: normalizeMediaUrl(e.target.value) },
                        }))
                      }
                      placeholder="Or paste Drive link / image URL"
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Meta Description</label>
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
                      className="au-dash-input resize-none placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Robots</label>
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
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium au-dash-text-muted mb-1">Schema Type</label>
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
                      className="au-dash-input placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <h4 className="text-md font-semibold au-dash-text-strong">Body</h4>
                <ArticleEditor
                  value={formData.sections}
                  onChange={(sections) => setFormData((p) => ({ ...p, sections }))}
                  onPackageDetected={applyPastedPackage}
                />
              </div>

              {/* Filled by the paste, not typed. Shown so the editor can see what was
                  captured and clear it if a package was pasted by mistake. */}
              {(formData.decide_first || formData.sources.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-md font-semibold au-dash-text-strong">Modules from the package</h4>
                  {formData.decide_first && (
                    <div className="au-dash-card p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium au-dash-text-strong">Decide First</span>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, decide_first: null }))}
                          className="text-xs au-dash-text-subtle hover:au-dash-text-strong"
                        >
                          Remove
                        </button>
                      </div>
                      {[
                        ['What matters', formData.decide_first.what_matters],
                        ['Watch this', formData.decide_first.watch_this],
                        ['Your next move', formData.decide_first.your_next_move],
                      ].map(([label, lines]) => (
                        <p key={label} className="au-dash-text-muted">
                          <span className="au-dash-text-subtle">{label}:</span> {(lines || []).join(' ') || '—'}
                        </p>
                      ))}
                    </div>
                  )}
                  {formData.sources.length > 0 && (
                    <div className="au-dash-card p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium au-dash-text-strong">
                          Sources ({formData.sources.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, sources: [] }))}
                          className="text-xs au-dash-text-subtle hover:au-dash-text-strong"
                        >
                          Remove all
                        </button>
                      </div>
                      <ul className="space-y-0.5 au-dash-text-muted">
                        {formData.sources.map((source) => (
                          <li key={source.url}>
                            {source.source_name ? `${source.source_name} — ` : ''}
                            {source.label || source.url}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Related Articles */}
              <div className="space-y-2">
                <h4 className="text-md font-semibold au-dash-text-strong">Related Articles</h4>
                <select
                  multiple
                  value={formData.related_article_ids}
                  onChange={(e) => {
                    const sel = Array.from(e.target.selectedOptions, (o) => o.value);
                    setFormData((p) => ({ ...p, related_article_ids: sel }));
                  }}
                  className="au-dash-input min-h-[80px]"
                >
                  {allArticles
                    .filter((a) => !editingArticle || a._id !== editingArticle._id)
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.title} ({a.slug})
                      </option>
                    ))}
                </select>
                <p className="text-xs au-dash-text-subtle">Ctrl/Cmd + click to select multiple</p>
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                <button
                  type="submit"
                  disabled={submitting}
                  className="au-dash-btn disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingArticle ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 au-dash-tab au-dash-text-muted rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dialog.node}
    </div>
  );
}
