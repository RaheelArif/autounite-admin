/**
 * Bridge between Blog OS storage (sections[] / blocks[]) and the editor's HTML.
 *
 * HTML is the interchange format on purpose: it is what Word, Google Docs and
 * ChatGPT put on the clipboard, so a pasted article keeps its headings, lists,
 * tables and links without a separate parser.
 */

/** Blocks the editor can render and read back. Everything else is preserved untouched. */
const EDITABLE_TYPES = new Set([
  'paragraph',
  'text',
  'heading',
  'bullets',
  'numbered_list',
  'quote',
  'callout',
  'table',
  'image',
  'media',
]);

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function slugifySection(value, fallback) {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || fallback;
}

export function isEditableBlock(block) {
  return EDITABLE_TYPES.has(String(block?.kind || block?.type || '').trim());
}

const blockType = (block) => String(block?.kind || block?.type || '').trim();
const blockItems = (block) =>
  (Array.isArray(block?.items) && block.items.length ? block.items : block?.bullets || []).filter(Boolean);

function runsToHtml(block) {
  const runs = block?.text_runs || block?.textRuns;
  if (!Array.isArray(runs) || !runs.length) return esc(block?.text || block?.body || '');
  return runs
    .map((run) =>
      run?.href ? `<a href="${esc(run.href)}">${esc(run.text)}</a>` : esc(run?.text ?? ''),
    )
    .join('');
}

function blockToHtml(block) {
  const type = blockType(block);
  if (type === 'paragraph' || type === 'text') return `<p>${runsToHtml(block)}</p>`;
  if (type === 'heading') return `<h3>${esc(block.text)}</h3>`;
  if (type === 'bullets') return `<ul>${blockItems(block).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  if (type === 'numbered_list') return `<ol>${blockItems(block).map((i) => `<li>${esc(i)}</li>`).join('')}</ol>`;
  if (type === 'quote') return `<blockquote><p>${runsToHtml(block)}</p></blockquote>`;
  if (type === 'callout') {
    const title = block.title ? `<strong>${esc(block.title)}</strong> ` : '';
    return `<blockquote><p>${title}${runsToHtml(block)}</p></blockquote>`;
  }
  if (type === 'image' || type === 'media') {
    const src = block.image_url || block.imageUrl || block.url || block.src || '';
    return src ? `<img src="${esc(src)}" alt="${esc(block.alt || '')}">` : '';
  }
  if (type === 'table' && block.table?.columns) {
    const head = `<tr>${(block.table.columns || []).map((c) => `<th>${esc(c)}</th>`).join('')}</tr>`;
    const body = (block.table.rows || [])
      .map((row) => `<tr>${(row || []).map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`)
      .join('');
    return `<table>${head}${body}</table>`;
  }
  return '';
}

/** Storage → editor HTML. Section labels become the H2s the writer edits. */
export function sectionsToHtml(sections = []) {
  return (sections || [])
    .map((section) => {
      const label = section.label ? `<h2>${esc(section.label)}</h2>` : '';
      const blocks = (section.blocks || []).filter(isEditableBlock).map(blockToHtml).filter(Boolean);
      return [label, ...blocks].join('');
    })
    .filter(Boolean)
    .join('');
}

/**
 * Landmarks the writers put in the package to separate public copy from the
 * admin-only tables. Matched on normalized text — upper-cased with punctuation
 * collapsed — so a changed dash, casing or trailing note never breaks the split.
 */
const MARKERS = {
  // "ARTICLE COPY — PASTE FROM HERE" is the older newsletter wording.
  bodyStart: ['ARTICLE BODY', 'ARTICLE COPY PASTE FROM HERE'],
  decideFirst: ['DECIDE FIRST'],
  sources: ['ADMIN SOURCE RECORDS'],
  // Everything from the first of these onwards is importer/QA instruction, never article copy.
  adminOnly: ['ADMIN SOURCE RECORDS', 'BENCHMARK IMPORT', 'RENDERER EXPECTATIONS', 'REQUIRED LIVE PROOF'],
};

/** Body copy can quote a marker phrase; a real marker is a short standalone line. */
const MARKER_MAX_LENGTH = 90;

const normalizeMarker = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

function markerIndex(nodes, phrases, from = 0) {
  for (let index = Math.max(from, 0); index < nodes.length; index += 1) {
    const text = normalizeMarker(nodes[index].textContent);
    if (!text || text.length > MARKER_MAX_LENGTH) continue;
    if (phrases.some((phrase) => text.startsWith(phrase))) return index;
  }
  return -1;
}

/** First table in a node range, with the top-level node that carries it. */
function findTable(nodes, from, to) {
  const end = to < 0 ? nodes.length : to;
  for (let index = Math.max(from, 0); index < end; index += 1) {
    const node = nodes[index];
    const table = node.tagName?.toLowerCase() === 'table' ? node : node.querySelector?.('table');
    if (table) return { table, node, index };
  }
  return null;
}

const tableRows = (table) =>
  [...table.querySelectorAll('tr')].map((row) => [...row.children].map((cell) => cell.textContent.trim()));

/**
 * The package ships with lineage that is not confirmed yet. Those placeholders are
 * the absence of a value, not a value — storing them would publish "Pending
 * verification" as if it were a date or a URL.
 */
const UNRESOLVED = /^(pending(\s+verification)?|not\s+published|tbd|n\/?a|none|unknown|[-—–])$/i;

const resolved = (value) => {
  const text = String(value ?? '').trim();
  return text && !UNRESOLVED.test(text) ? text : '';
};

function isoDate(value) {
  const text = resolved(value);
  if (!text) return '';
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : '';
}

/**
 * Both header tables the writers use: the newsletter execution table ("Deck",
 * "Read time") and the Blog OS package table ("H1", "Slug", "Meta", "Excerpt").
 */
const META_ROWS = {
  h1: 'title',
  title: 'title',
  deck: 'summary',
  excerpt: 'summary',
  slug: 'slug',
  category: 'category',
  tags: 'tags',
  'read time': 'readTimeMin',
  'seo title': 'metaTitle',
  meta: 'metaDescription',
  'seo description': 'metaDescription',
  'meta description': 'metaDescription',
  'hero alt': 'heroAlt',
  'alt text': 'heroAlt',
  'hero file': 'heroFile',
  'content type': 'contentType',
  author: 'authorName',
  'canonical url': 'canonicalUrl',
  'social image file': 'socialImageFile',
  'social image alt': 'socialImageAlt',
  'tool handoff': 'toolHandoff',
  'original platform': 'originalPlatform',
  'original url': 'originalUrl',
  'original publish date': 'originalPublishedAt',
  'last verified': 'lastVerifiedAt',
  'autounite publish date': 'autoUnitePublishedAt',
  'linkedin url': 'linkedin',
  'medium url': 'medium',
  'substack url': 'substack',
};

const DATE_FIELDS = new Set(['originalPublishedAt', 'lastVerifiedAt', 'autoUnitePublishedAt']);
const DISTRIBUTION_FIELDS = new Set(['linkedin', 'medium', 'substack']);

/** Writers separate tags with bullets, commas or pipes. */
const splitTags = (value) =>
  String(value)
    .split(/[•|,;]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

function metaFromTable(table) {
  const meta = {};
  const distribution = {};
  for (const [label, value] of tableRows(table)) {
    const field = META_ROWS[String(label || '').toLowerCase()];
    if (!field) continue;
    const text = resolved(value);
    if (!text) continue;
    if (field === 'readTimeMin') {
      const minutes = Number(/(\d+)/.exec(text)?.[1]);
      if (minutes) meta.readTimeMin = minutes;
      continue;
    }
    if (field === 'slug') {
      // Written as a path in the package; the form stores the last segment only.
      meta.slug = text.replace(/^.*\/blog\//, '').replace(/^\/+|\/+$/g, '');
      continue;
    }
    if (field === 'tags') {
      meta.tags = splitTags(text);
      continue;
    }
    if (DISTRIBUTION_FIELDS.has(field)) {
      distribution[field] = text;
      continue;
    }
    if (DATE_FIELDS.has(field)) {
      const iso = isoDate(text);
      if (iso) meta[field] = iso;
      continue;
    }
    meta[field] = text;
  }
  if (Object.keys(distribution).length) meta.distribution = distribution;
  return meta;
}

/** How many recognised rows make a table the package header rather than article data. */
const META_TABLE_MIN_ROWS = 2;

/**
 * Older packages put the title on the line above the table instead of in an H1
 * row. The file name sits above that and is written in caps, so the last
 * mixed-case line is the title.
 */
function titleAbove(nodes, tableIndex) {
  const lines = nodes
    .slice(0, tableIndex)
    .map((node) => node.textContent.trim())
    .filter(Boolean);
  return [...lines].reverse().find((text) => text !== text.toUpperCase()) || '';
}

const DECIDE_ROWS = {
  'what matters': 'whatMatters',
  'watch this': 'watchThis',
  'your next move': 'yourNextMove',
};

function decideFirstFromTable(table) {
  const decideFirst = {};
  for (const [label, value] of tableRows(table)) {
    const field = DECIDE_ROWS[String(label || '').toLowerCase()];
    const text = resolved(value);
    if (field && text) decideFirst[field] = [text];
  }
  return Object.keys(decideFirst).length ? decideFirst : null;
}

const SOURCE_COLUMNS = {
  publisher: 'sourceName',
  source: 'sourceName',
  'source name': 'sourceName',
  label: 'label',
  title: 'label',
  url: 'url',
  'full url': 'url',
  link: 'url',
  verified: 'verifiedAt',
  'verified date': 'verifiedAt',
  'verified at': 'verifiedAt',
};

function sourcesFromTable(table) {
  const [header, ...rows] = tableRows(table);
  if (!header) return [];
  const fields = header.map((column) => SOURCE_COLUMNS[String(column || '').toLowerCase()] || '');
  if (!fields.includes('url')) return [];
  return rows
    .map((cells) => {
      const source = {};
      fields.forEach((field, index) => {
        const text = resolved(cells[index]);
        if (!field || !text) return;
        source[field] = field === 'verifiedAt' ? isoDate(text) : text;
      });
      return source;
    })
    .filter((source) => source.url);
}

function entirelyBold(element) {
  const walker = element.ownerDocument.createTreeWalker(element, 0x4 /* SHOW_TEXT */);
  let sawText = false;
  let node = walker.nextNode();
  while (node) {
    if (node.nodeValue.trim()) {
      sawText = true;
      let bold = false;
      for (let parent = node.parentElement; parent && parent !== element.parentElement; parent = parent.parentElement) {
        const tag = parent.tagName.toLowerCase();
        const weight = parent.style?.fontWeight || '';
        if (tag === 'b' || tag === 'strong' || weight === 'bold' || Number(weight) >= 600) {
          bold = true;
          break;
        }
      }
      if (!bold) return false;
    }
    node = walker.nextNode();
  }
  return sawText;
}

/**
 * A bold line is only a heading when the source dropped its heading styles, and even
 * then bold is also used for pull quotes and emphasis. Two signals separate them:
 * a heading does not end in a full stop, and a pull quote opens with a quote mark.
 */
function looksLikeHeading(text) {
  if (!text || text.length > 120) return false;
  if (/^["'“‘]/.test(text)) return false;
  return !/[.,;]$/.test(text);
}

export function promoteBoldHeadings(html) {
  if (typeof window === 'undefined' || !html) return html;
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  if (doc.body.querySelector('h1, h2')) return html;

  for (const paragraph of [...doc.body.querySelectorAll('p')]) {
    const text = paragraph.textContent.trim();
    if (!looksLikeHeading(text) || !entirelyBold(paragraph)) continue;
    const heading = doc.createElement('h2');
    heading.textContent = text;
    paragraph.replaceWith(heading);
  }
  return doc.body.innerHTML;
}

/**
 * Splits a pasted package into the four things it actually carries: the public
 * body, the header metadata, the Decide First module and the source records.
 *
 * The markers decide the boundaries — the body ends at "Admin source records"
 * because everything from there on is importer and QA instruction. A plain paste
 * with no markers keeps working: it is all body, and the header table is only
 * lifted out when it really reads like one.
 */
export function parsePastedPackage(html) {
  const empty = { html: html || '', meta: {}, decideFirst: null, sources: [] };
  if (typeof window === 'undefined' || !html) return empty;

  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const nodes = [...doc.body.children];
  if (!nodes.length) return empty;

  const bodyAt = markerIndex(nodes, MARKERS.bodyStart);
  const decideAt = markerIndex(nodes, MARKERS.decideFirst);
  const sourcesAt = markerIndex(nodes, MARKERS.sources);
  const adminAt = markerIndex(nodes, MARKERS.adminOnly, Math.max(bodyAt, 0));

  const beforeBody = [decideAt, bodyAt, adminAt].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? -1;
  const metaHit = findTable(nodes, 0, beforeBody);
  const meta = metaHit ? metaFromTable(metaHit.table) : {};
  const metaIsHeader = Object.keys(meta).length >= META_TABLE_MIN_ROWS;
  if (metaIsHeader && !meta.title) {
    const title = titleAbove(nodes, metaHit.index);
    if (title) meta.title = title;
  }

  const decideHit = decideAt >= 0 ? findTable(nodes, decideAt + 1, bodyAt >= 0 ? bodyAt : -1) : null;
  const decideFirst = decideHit ? decideFirstFromTable(decideHit.table) : null;

  const sourcesHit = sourcesAt >= 0 ? findTable(nodes, sourcesAt + 1, -1) : null;
  const sources = sourcesHit ? sourcesFromTable(sourcesHit.table) : [];

  const consumed = new Set();
  if (metaIsHeader && metaHit) consumed.add(metaHit.node);
  if (decideFirst && decideHit) consumed.add(decideHit.node);

  const lastLifted = Math.max(
    metaIsHeader && metaHit ? metaHit.index : -1,
    decideFirst && decideHit ? decideHit.index : -1,
  );
  const start = bodyAt >= 0 ? bodyAt + 1 : lastLifted + 1;
  const end = adminAt >= 0 ? adminAt : nodes.length;

  const body = nodes
    .slice(start, end)
    .filter((node) => !consumed.has(node))
    .map((node) => node.outerHTML)
    .join('');

  return { html: promoteBoldHeadings(body), meta, decideFirst, sources };
}

/** Blocks the editor cannot express, kept aside so editing never drops them. */
export function preservedBlocks(sections = []) {
  const map = new Map();
  (sections || []).forEach((section, index) => {
    const kept = (section.blocks || []).filter((block) => !isEditableBlock(block));
    if (kept.length) map.set(section.section_id || section.sectionId || `section-${index + 1}`, kept);
  });
  return map;
}

function mergeRuns(runs) {
  return runs.reduce((acc, run) => {
    const last = acc[acc.length - 1];
    if (last && (last.href || '') === (run.href || '')) {
      last.text += run.text;
      return acc;
    }
    acc.push({ ...run });
    return acc;
  }, []);
}

/** Text of an element split into runs, so a linked phrase keeps its href. */
function runsFromElement(element) {
  const runs = [];
  const walk = (node, href) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        if (child.nodeValue) runs.push({ text: child.nodeValue, href });
        return;
      }
      if (child.nodeType !== 1) return;
      const tag = child.tagName.toLowerCase();
      if (tag === 'br') {
        runs.push({ text: ' ', href: '' });
        return;
      }
      walk(child, tag === 'a' ? child.getAttribute('href') || '' : href);
    });
  };
  walk(element, '');
  const merged = mergeRuns(runs.filter((run) => run.text));
  // Plain copy stays plain — runs are only worth storing when a link is present.
  return merged.some((run) => run.href) ? merged.map((run) => (run.href ? run : { text: run.text })) : [];
}

function tableFromElement(element) {
  const rows = [...element.querySelectorAll('tr')].map((tr) =>
    [...tr.children].map((cell) => cell.textContent.trim()),
  );
  if (!rows.length) return null;
  const [columns, ...rest] = rows;
  const body = rest.length ? rest : [];
  return { columns, rows: body, mobile_mode: 'stacked_rows' };
}

/**
 * Editor HTML → storage. Each H1/H2 starts a new section; anything before the
 * first heading becomes Overview so pasted copy never loses its opening.
 */
export function htmlToSections(html, preserved = new Map()) {
  if (typeof window === 'undefined') return [];
  const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');
  const sections = [];
  const usedIds = new Set();

  const startSection = (label) => {
    let id = slugifySection(label, `section-${sections.length + 1}`);
    let suffix = 2;
    while (usedIds.has(id)) id = `${slugifySection(label, 'section')}-${suffix++}`;
    usedIds.add(id);
    sections.push({ section_id: id, label: label || 'Overview', order: sections.length, blocks: [] });
    return sections[sections.length - 1];
  };

  const current = () => sections[sections.length - 1] || startSection('Overview');

  const pushBlock = (block) => {
    const section = current();
    section.blocks.push({
      ...block,
      block_id: `${section.section_id}-b${section.blocks.length + 1}`,
      order: section.blocks.length,
    });
  };

  for (const node of [...doc.body.children]) {
    const tag = node.tagName.toLowerCase();
    const text = node.textContent.trim();

    if (tag === 'h1' || tag === 'h2') {
      if (text) startSection(text);
      continue;
    }
    if (tag === 'h3' || tag === 'h4') {
      if (text) pushBlock({ kind: 'heading', type: 'heading', text });
      continue;
    }
    if (tag === 'p') {
      const image = node.querySelector('img');
      if (image) {
        pushBlock({
          kind: 'image',
          type: 'image',
          image_url: image.getAttribute('src') || '',
          alt: image.getAttribute('alt') || '',
        });
        continue;
      }
      if (!text) continue;
      const runs = runsFromElement(node);
      pushBlock({ kind: 'paragraph', type: 'paragraph', text, ...(runs.length ? { text_runs: runs } : {}) });
      continue;
    }
    if (tag === 'ul' || tag === 'ol') {
      const items = [...node.querySelectorAll(':scope > li')].map((li) => li.textContent.trim()).filter(Boolean);
      if (!items.length) continue;
      const kind = tag === 'ul' ? 'bullets' : 'numbered_list';
      pushBlock({ kind, type: kind, items, bullets: items });
      continue;
    }
    if (tag === 'blockquote') {
      if (!text) continue;
      // Word's Quote style arrives as a blockquote and is a pull quote, not a
      // callout: a callout is an editor-authored aside and carries its own title.
      const runs = runsFromElement(node);
      pushBlock({ kind: 'quote', type: 'quote', text, ...(runs.length ? { text_runs: runs } : {}) });
      continue;
    }
    if (tag === 'table') {
      const table = tableFromElement(node);
      if (table) pushBlock({ kind: 'table', type: 'table', table });
      continue;
    }
    if (tag === 'img') {
      pushBlock({
        kind: 'image',
        type: 'image',
        image_url: node.getAttribute('src') || '',
        alt: node.getAttribute('alt') || '',
      });
      continue;
    }
    if (text) pushBlock({ kind: 'paragraph', type: 'paragraph', text });
  }

  // Re-attach modules the editor cannot express (sources, related, Decide First).
  const attached = new Set();
  for (const section of sections) {
    const kept = preserved.get(section.section_id);
    if (!kept) continue;
    attached.add(section.section_id);
    section.blocks.push(...kept);
  }
  const orphans = [...preserved.entries()].filter(([id]) => !attached.has(id));
  if (orphans.length) {
    const tail = sections[sections.length - 1] || startSection('Overview');
    orphans.forEach(([, blocks]) => tail.blocks.push(...blocks));
  }

  return sections.filter((section) => section.blocks.length);
}
