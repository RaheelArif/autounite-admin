'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCheck, FaCopy, FaEdit, FaEye, FaPlus, FaTimes, FaTrash, FaWrench } from 'react-icons/fa';
import { approveBlogMedia, createBlogMedia, deleteBlogMedia, getBlogMedia, updateBlogMedia } from '@/lib/blog';
import { isBrokenDriveEmbedUrl, normalizeMediaUrl } from '@/lib/blogMediaUrl';
import { useDialog } from '@/components/Dialog';

const EMPTY_FORM = { url: '', alt: '', kind: 'hero' };

export default function MediaTab() {
  const dialog = useDialog();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [formPreviewBroken, setFormPreviewBroken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState('');

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

  const displayUrl = useMemo(() => normalizeMediaUrl(form.url), [form.url]);

  useEffect(() => {
    setFormPreviewBroken(false);
  }, [displayUrl]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormPreviewBroken(false);
  };

  const applyUrl = (raw) => {
    const next = normalizeMediaUrl(raw);
    setForm((p) => ({ ...p, url: next }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const body = {
        ...form,
        url: normalizeMediaUrl(form.url),
        alt: form.alt.trim(),
      };
      if (editingId) {
        await updateBlogMedia(editingId, body);
      } else {
        await createBlogMedia(body);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message || (editingId ? 'Failed to update media' : 'Failed to save media'));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row._id);
    setForm({
      url: normalizeMediaUrl(row.url || ''),
      alt: row.alt || '',
      kind: row.kind || 'hero',
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Rewrite a stored Drive /view or uc link to the embeddable lh3 URL. */
  const handleFixDriveUrl = async (row) => {
    setError('');
    try {
      const url = normalizeMediaUrl(row.url);
      if (url === row.url) return;
      await updateBlogMedia(row._id, { url, alt: row.alt, kind: row.kind });
      await load();
    } catch (err) {
      setError(err.message || 'Failed to fix Drive URL');
    }
  };

  const handleApprove = async (id) => {
    setError('');
    try {
      await approveBlogMedia(id);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to approve media');
    }
  };

  const handleCopyUrl = async (row) => {
    setError('');
    try {
      await navigator.clipboard.writeText(row.url);
      setCopiedId(row._id);
      window.setTimeout(() => setCopiedId((current) => (current === row._id ? '' : current)), 1500);
    } catch {
      setError('Could not copy URL — select it and copy manually');
    }
  };

  const handleDelete = async (row) => {
    const ok = await dialog.confirm({
      title: 'Delete Media',
      message: `Are you sure you want to delete this ${row.kind || 'image'} (${row.media_id || row.alt || 'media'})?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    setError('');
    try {
      await deleteBlogMedia(row._id);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to delete media');
    }
  };

  return (
    <div className="au-dash-page">
      {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">{error}</div>}
      <div className="au-dash-card p-4 space-y-3">
        <h2 className="au-dash-card-title">{editingId ? 'Edit media' : 'Add media'}</h2>
        <p className="text-sm au-dash-text-subtle">
          Paste any Google Drive share link — it converts automatically to an image URL that works in the blog. Approve
          after save; then pick it on the article form (or Copy into Hero / OG).
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            required
            type="url"
            placeholder="Paste Drive share link or https://… image URL"
            value={form.url}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            onBlur={(e) => applyUrl(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              if (!pasted) return;
              e.preventDefault();
              applyUrl(pasted);
            }}
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
              {editingId ? (
                <>
                  <FaCheck className="w-3 h-3" /> Save
                </>
              ) : (
                <>
                  <FaPlus className="w-3 h-3" /> Add
                </>
              )}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 rounded-lg bg-white/10 au-dash-text-muted text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {displayUrl && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2">
            <p className="text-xs au-dash-text-subtle">Live preview (must load before you save):</p>
            {formPreviewBroken ? (
              <p className="text-sm text-red-400">
                Image did not load. Confirm Drive sharing is “Anyone with the link → Viewer”, then paste the link again.
              </p>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayUrl}
                alt={form.alt || 'Media preview'}
                className="max-h-48 rounded object-contain bg-black/40"
                onError={() => setFormPreviewBroken(true)}
              />
            )}
            <p className="text-xs au-dash-text-subtle break-all">{displayUrl}</p>
          </div>
        )}
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
                  <td className="px-4 py-3 au-dash-text-subtle text-sm max-w-[280px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate" title={row.url}>
                        {row.url}
                      </span>
                      {isBrokenDriveEmbedUrl(row.url) && (
                        <button
                          type="button"
                          onClick={() => handleFixDriveUrl(row)}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs"
                          title="Convert Drive share link to an embeddable image URL"
                        >
                          <FaWrench className="w-3 h-3" /> Fix link
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(row)}
                        className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                          copiedId === row._id
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/10 au-dash-text-muted hover:au-dash-text-strong'
                        }`}
                        title="Copy URL for the article form"
                      >
                        {copiedId === row._id ? (
                          <>
                            <FaCheck className="w-3 h-3" /> Copied
                          </>
                        ) : (
                          <>
                            <FaCopy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </td>
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
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewBroken(false);
                          setPreview(row);
                        }}
                        className="p-2 rounded-lg bg-white/10 au-dash-text-muted"
                        title="Preview image"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-300"
                        title="Edit media"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
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
                        onClick={() => handleDelete(row)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                        title="Delete media"
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

      {preview && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
          onClick={() => setPreview(null)}
          role="presentation"
        >
          <div
            className="au-dash-card max-w-3xl w-full p-5 space-y-4 border border-white/20 bg-[#080c18] shadow-2xl rounded-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Media preview"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="au-dash-text-strong font-medium truncate">
                  {preview.kind} · {preview.media_id}
                </p>
                <p className="text-sm au-dash-text-muted">{preview.alt}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="p-2 rounded-lg bg-white/10 au-dash-text-muted"
                title="Close preview"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            {previewBroken ? (
              <p className="text-sm text-red-400 p-4">
                Image failed to load. Click <strong>Fix link</strong> on the row if this is an old Drive /view URL.
              </p>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt={preview.alt || 'Media preview'}
                className="w-full max-h-[70vh] object-contain rounded-lg bg-black/40"
                onError={() => setPreviewBroken(true)}
              />
            )}
            <p className="text-xs au-dash-text-subtle break-all">{preview.url}</p>
          </div>
        </div>
      )}

      {dialog.node}
    </div>
  );
}
