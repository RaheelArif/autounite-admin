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
 * Newsletter packages carry platform-only copy (launch post, first comment) above
 * a marker the writers already use. Everything above it belongs to LinkedIn, not
 * the blog, so the paste starts where the article starts.
 */
const ARTICLE_COPY_MARKER = /ARTICLE\s+COPY\s*[—–-]?\s*PASTE\s+FROM\s+HERE/i;

export function trimToArticleCopy(html) {
  if (typeof window === 'undefined' || !html) return html;
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const children = [...doc.body.children];
  const markerIndex = children.findIndex((node) => ARTICLE_COPY_MARKER.test(node.textContent || ''));
  if (markerIndex < 0) return html;
  children.slice(0, markerIndex + 1).forEach((node) => node.remove());
  return doc.body.innerHTML;
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
};

/** Writers separate tags with bullets, commas or pipes. */
const splitTags = (value) =>
  String(value)
    .split(/[•|,;]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

export function metaFromPastedHtml(html) {
  if (typeof window === 'undefined' || !html) return {};
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const table = doc.body.querySelector('table');
  if (!table) return {};

  const meta = {};
  for (const row of table.querySelectorAll('tr')) {
    const [label, value] = [...row.children].map((cell) => cell.textContent.trim());
    const field = META_ROWS[String(label || '').toLowerCase()];
    if (!field || !value) continue;
    if (field === 'readTimeMin') {
      const minutes = Number(/(\d+)/.exec(value)?.[1]);
      if (minutes) meta.readTimeMin = minutes;
      continue;
    }
    if (field === 'slug') {
      // Written as a path in the package; the form stores the last segment only.
      meta.slug = value.replace(/^.*\/blog\//, '').replace(/^\/+|\/+$/g, '');
      continue;
    }
    if (field === 'tags') {
      meta.tags = splitTags(value);
      continue;
    }
    meta[field] = value;
  }

  // The public title is the last real line above the table; the file name above it
  // is written in caps and is not part of the article.
  const before = [];
  for (const node of [...doc.body.children]) {
    if (node === table || node.contains(table)) break;
    const text = node.textContent.trim();
    if (text) before.push(text);
  }
  const title = [...before].reverse().find((text) => text !== text.toUpperCase());
  if (title && !meta.title) meta.title = title;

  return meta;
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

function promoteBoldHeadings(html) {
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

/** What the editor runs on every paste. */
export function transformPastedHtml(html) {
  return promoteBoldHeadings(trimToArticleCopy(html));
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
      const runs = runsFromElement(node);
      pushBlock({ kind: 'callout', type: 'callout', tone: 'note', text, ...(runs.length ? { text_runs: runs } : {}) });
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
