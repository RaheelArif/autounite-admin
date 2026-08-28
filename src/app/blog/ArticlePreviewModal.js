'use client';

import { Fragment } from 'react';
import { FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import { normalizeMediaUrl } from '@/lib/blogMediaUrl';

function parseInlineMarkdown(text) {
  if (typeof text !== 'string' || !text) return text;
  const linkRegex = /\[([^\]\n]+)\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\)/g;
  if (!linkRegex.test(text)) return text;
  linkRegex.lastIndex = 0;

  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const label = match[1];
    const href = match[2];
    const external = href && !href.startsWith('/');
    parts.push(
      <a
        key={`md-link-${key++}`}
        href={href}
        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors inline-flex items-center gap-1 font-medium"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
        {external ? <FaExternalLinkAlt className="w-2.5 h-2.5 opacity-70" /> : null}
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function RichText({ block, runs: runsProp }) {
  const runs = runsProp || block?.textRuns || block?.text_runs;
  const text = block?.text || block?.body || '';
  if (!Array.isArray(runs) || !runs.length) return parseInlineMarkdown(text);

  return runs.map((run, index) => {
    let node = run?.text;
    if (run?.italic) node = <em className="italic">{node}</em>;
    if (run?.bold) node = <strong className="font-bold text-white">{node}</strong>;
    const href = run?.href;
    if (!href) {
      return (
        <Fragment key={index}>
          {typeof node === 'string' ? parseInlineMarkdown(node) : node}
        </Fragment>
      );
    }
    const external = !href.startsWith('/');
    return (
      <a
        key={index}
        href={href}
        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors inline-flex items-center gap-1 font-medium"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {node}
        {external ? <FaExternalLinkAlt className="w-2.5 h-2.5 opacity-70" /> : null}
      </a>
    );
  });
}

function BlockView({ block }) {
  if (!block) return null;
  const kind = block.kind || block.type;

  if (kind === 'text' || kind === 'paragraph') {
    return (
      <p className="text-slate-200 leading-relaxed text-[15px] sm:text-[16px] font-normal">
        <RichText block={block} />
      </p>
    );
  }
  if (kind === 'heading') {
    return (
      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight pt-2">
        {block.text}
      </h3>
    );
  }
  if ((kind === 'bullets' || kind === 'checklist') && Array.isArray(block.bullets || block.items)) {
    const items = (block.bullets || block.items).filter(Boolean);
    const itemRuns = block.itemRuns || block.item_runs || [];
    return (
      <ul className="list-disc pl-5 space-y-1.5 text-slate-200 text-[15px]">
        {items.map((item, i) => (
          <li key={i}>
            {Array.isArray(itemRuns[i]) && itemRuns[i].length ? (
              <RichText runs={itemRuns[i]} />
            ) : (
              parseInlineMarkdown(item)
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (kind === 'numbered_list' && Array.isArray(block.bullets || block.items)) {
    const items = (block.bullets || block.items).filter(Boolean);
    const itemRuns = block.itemRuns || block.item_runs || [];
    return (
      <ol className="list-decimal pl-5 space-y-1.5 text-slate-200 text-[15px]">
        {items.map((item, i) => (
          <li key={i}>
            {Array.isArray(itemRuns[i]) && itemRuns[i].length ? (
              <RichText runs={itemRuns[i]} />
            ) : (
              parseInlineMarkdown(item)
            )}
          </li>
        ))}
      </ol>
    );
  }
  if (kind === 'quote') {
    return (
      <blockquote className="border-l-4 border-indigo-500 bg-indigo-950/20 py-2.5 px-4 rounded-r-xl italic text-slate-200 my-3 text-[15px]">
        <RichText block={block} />
      </blockquote>
    );
  }
  if (kind === 'table' && block.table) {
    const cols = block.table.columns || [];
    const rows = block.table.rows || [];
    return (
      <div className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <table className="w-full text-left text-sm">
          {cols.length > 0 && (
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {cols.map((col, idx) => (
                  <th key={idx} className="p-3.5 font-semibold text-slate-200">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-white/5">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                {(Array.isArray(row) ? row : []).map((cell, j) => (
                  <td key={j} className="p-3.5 text-slate-300">
                    {parseInlineMarkdown(String(cell ?? ''))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (kind === 'image' && (block.url || block.src || block.image_url)) {
    const src = block.url || block.src || block.image_url;
    return (
      <figure className="my-4 space-y-2">
        <img
          src={normalizeMediaUrl(src)}
          alt={block.alt || ''}
          className="w-full rounded-xl max-h-96 object-cover border border-white/10 shadow-lg"
        />
        {block.caption ? <figcaption className="text-xs text-slate-400 text-center">{block.caption}</figcaption> : null}
      </figure>
    );
  }
  if (block.text) {
    return (
      <p className="text-slate-200 leading-relaxed text-[15px]">
        <RichText block={block} />
      </p>
    );
  }
  return null;
}

export default function ArticlePreviewModal({ article, onClose }) {
  if (!article) return null;

  const seo = article.seo || {};
  const heroRaw = article.hero_image_url || seo.og_image_url;
  const hero = heroRaw ? normalizeMediaUrl(heroRaw) : '';
  const decideFirst = article.decide_first || article.decideFirst;
  const sources = article.sources || [];
  const sections = article.sections || article.bodySections || [];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[94vh] overflow-hidden flex flex-col my-auto border border-white/20 bg-[#070b14] shadow-2xl rounded-2xl text-white">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
              Live Preview
            </span>
            <span className="text-xs text-slate-400 truncate hidden sm:inline">
              Exact Public Styling & Component Mock
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Close preview"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Reader View */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 custom-scrollbar bg-gradient-to-b from-[#090e1a] to-[#05070f]">
          {/* Category & Kicker */}
          <div className="flex flex-wrap items-center gap-2">
            {article.categorySlug && (
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {article.categorySlug}
              </span>
            )}
            <span className="text-slate-600 text-xs">·</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              {article.type || 'Article'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.2]">
            {article.title}
          </h1>

          {/* Author & Meta */}
          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400 pb-2 border-b border-white/10">
            <span className="text-slate-200 font-semibold">{article.author_name || 'Kenny Smith'}</span>
            <span>·</span>
            <span>{article.read_time_min ? `${article.read_time_min} min read` : '5 min read'}</span>
            {article.slug ? (
              <>
                <span>·</span>
                <span className="font-mono text-slate-500">/{article.slug}</span>
              </>
            ) : null}
          </div>

          {/* Excerpt / Subtitle */}
          {article.summary || article.excerpt ? (
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              {article.summary || article.excerpt}
            </p>
          ) : null}

          {/* Decide First Module */}
          {decideFirst && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black/60 border border-indigo-500/30 shadow-xl space-y-4 my-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Decide First
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {decideFirst.what_matters?.length ? (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                    <p className="text-xs font-bold text-slate-300 uppercase">What Matters</p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {decideFirst.what_matters.join(' ')}
                    </p>
                  </div>
                ) : null}
                {decideFirst.watch_this?.length ? (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                    <p className="text-xs font-bold text-amber-300 uppercase">Watch This</p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {decideFirst.watch_this.join(' ')}
                    </p>
                  </div>
                ) : null}
                {decideFirst.your_next_move?.length ? (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                    <p className="text-xs font-bold text-emerald-300 uppercase">Your Next Move</p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {decideFirst.your_next_move.join(' ')}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Hero Image */}
          {hero ? (
            <div className="my-6">
              <img
                src={hero}
                alt={article.hero_image_alt || article.title || 'Hero'}
                className="w-full rounded-2xl max-h-[500px] object-cover object-top border border-white/15 shadow-2xl"
              />
              {article.hero_image_alt ? (
                <p className="text-xs text-slate-400 mt-2 text-center italic">
                  Alt: {article.hero_image_alt}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Article Sections */}
          <div className="space-y-8 pt-2">
            {sections.map((sec, si) => (
              <section key={sec.section_id || si} className="space-y-3.5">
                {sec.label ? (
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight border-b border-white/10 pb-2">
                    {sec.label}
                  </h2>
                ) : null}
                {(sec.blocks || []).map((block, bi) => (
                  <BlockView key={bi} block={block} />
                ))}
              </section>
            ))}
          </div>

          {/* Sources Module */}
          {sources.length > 0 && (
            <div className="mt-10 p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sources & Verified Citations
              </h4>
              <ul className="space-y-2">
                {sources.map((src, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                    <span className="text-slate-500">•</span>
                    <div>
                      <span className="font-semibold text-slate-200">{src.source_name || src.label}: </span>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                      >
                        {src.label || src.url}
                        <FaExternalLinkAlt className="w-2.5 h-2.5 opacity-70" />
                      </a>
                      {src.verified_at ? (
                        <span className="text-xs text-emerald-400/80 ml-2">
                          (Verified {new Date(src.verified_at).toLocaleDateString()})
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
