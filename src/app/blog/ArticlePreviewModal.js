'use client';

import { FaTimes } from 'react-icons/fa';
import { normalizeMediaUrl } from '@/lib/blogMediaUrl';

function BlockView({ block }) {
  if (!block) return null;
  if ((block.kind === 'text' || block.kind === 'paragraph') && block.text) {
    return <p className="au-dash-text leading-relaxed whitespace-pre-wrap">{block.text}</p>;
  }
  if (block.kind === 'heading' && block.text) {
    return <h3 className="text-lg font-semibold au-dash-text-strong">{block.text}</h3>;
  }
  if ((block.kind === 'bullets' || block.kind === 'checklist') && Array.isArray(block.bullets)) {
    return (
      <ul className="list-disc pl-5 space-y-1 au-dash-text">
        {block.bullets.filter(Boolean).map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.kind === 'quote' && block.text) {
    return <blockquote className="border-l-2 border-white/20 pl-3 italic au-dash-text-muted">{block.text}</blockquote>;
  }
  if (block.kind === 'image' && (block.url || block.src)) {
    return (
      <img
        src={block.url || block.src}
        alt={block.alt || ''}
        className="w-full rounded-lg max-h-80 object-cover"
      />
    );
  }
  if (block.kind === 'table' && block.table) {
    const cols = block.table.columns || [];
    const rows = block.table.rows || [];
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {cols.length > 0 && (
            <thead>
              <tr>
                {cols.map((col) => (
                  <th key={col} className="text-left p-2 au-dash-text-muted border-b border-white/10">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {(Array.isArray(row) ? row : []).map((cell, j) => (
                  <td key={j} className="p-2 au-dash-text border-b border-white/5">
                    {String(cell ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.kind === 'link_list' && Array.isArray(block.links)) {
    return (
      <ul className="space-y-1">
        {block.links.map((link, i) => (
          <li key={i}>
            <span className="au-dash-text">{link.label || link.url}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.kind === 'tile_row' && Array.isArray(block.tiles)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {block.tiles.map((tile, i) => (
          <div key={i} className="au-dash-card p-3">
            <p className="font-medium au-dash-text-strong">{tile.title}</p>
            <p className="text-sm au-dash-text-muted mt-1">{tile.body}</p>
          </div>
        ))}
      </div>
    );
  }
  if (block.text) {
    return <p className="au-dash-text">{block.text}</p>;
  }
  return null;
}

export default function ArticlePreviewModal({ article, onClose }) {
  if (!article) return null;

  const seo = article.seo || {};
  const heroRaw = article.hero_image_url || seo.og_image_url;
  const hero = heroRaw ? normalizeMediaUrl(heroRaw) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="au-dash-modal w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col my-8">
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)] flex-shrink-0">
          <div>
            <h3 className="au-dash-card-title">Article preview</h3>
            <p className="text-xs au-dash-text-subtle mt-1">
              Public website is not connected yet. This is admin-only.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg au-dash-text-subtle hover:au-dash-text hover:au-dash-badge"
            aria-label="Close preview"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="au-dash-badge px-2 py-1 rounded">{article.status}</span>
            {article.categorySlug && (
              <span className="au-dash-badge px-2 py-1 rounded">{article.categorySlug}</span>
            )}
            {article.badge && <span className="au-dash-badge px-2 py-1 rounded">{article.badge}</span>}
          </div>
          <h2 className="text-2xl font-semibold au-dash-text-strong">{article.title}</h2>
          <p className="text-sm au-dash-text-muted">
            {article.author_name || 'AutoUnite'}
            {article.read_time_min ? ` · ${article.read_time_min} min read` : ''}
            {article.slug ? ` · /${article.slug}` : ''}
          </p>
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero}
              alt={article.hero_image_alt || article.title || ''}
              className="w-full rounded-lg max-h-72 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const note = e.currentTarget.nextElementSibling;
                if (note) note.hidden = false;
              }}
            />
          ) : null}
          {hero ? (
            <p className="text-sm text-red-400" hidden>
              Hero image failed to load. On Media tab click “Fix link” for Drive URLs, then re-pick the image on this
              article and Save.
            </p>
          ) : null}
          {article.summary ? <p className="au-dash-text-muted leading-relaxed">{article.summary}</p> : null}
          {(article.sections || []).map((sec, si) => (
            <section key={sec.section_id || si} className="space-y-3">
              {sec.label ? <h3 className="text-lg font-semibold au-dash-text-strong">{sec.label}</h3> : null}
              {(sec.blocks || []).map((block, bi) => (
                <BlockView key={bi} block={block} />
              ))}
            </section>
          ))}
          {(article.sections || []).length === 0 && (
            <p className="au-dash-text-subtle">No sections yet.</p>
          )}
          {(seo.meta_title || seo.meta_description) && (
            <div className="au-dash-card p-4 space-y-1">
              <p className="text-xs au-dash-text-subtle uppercase tracking-wide">SEO</p>
              {seo.meta_title ? <p className="au-dash-text-strong">{seo.meta_title}</p> : null}
              {seo.meta_description ? <p className="text-sm au-dash-text-muted">{seo.meta_description}</p> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
