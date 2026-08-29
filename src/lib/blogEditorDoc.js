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
    .map((run) => {
      let html = esc(run?.text ?? '');
      if (run?.italic) html = `<em>${html}</em>`;
      if (run?.bold) html = `<strong>${html}</strong>`;
      if (run?.href) html = `<a href="${esc(run.href)}">${html}</a>`;
      return html;
    })
    .join('');
}

function blockToHtml(block) {
  const type = blockType(block);
  if (type === 'paragraph' || type === 'text') return `<p>${runsToHtml(block)}</p>`;
  if (type === 'heading') return `<h3>${esc(block.text)}</h3>`;
  if (type === 'bullets' || type === 'numbered_list') {
    const tag = type === 'bullets' ? 'ul' : 'ol';
    const items = blockItems(block);
    const itemRuns = block?.item_runs || block?.itemRuns || [];
    const lis = items
      .map((item, index) => {
        const runs = itemRuns[index];
        if (Array.isArray(runs) && runs.length) {
          return `<li>${runsToHtml({ text_runs: runs })}</li>`;
        }
        return `<li>${esc(item)}</li>`;
      })
      .join('');
    return `<${tag}>${lis}</${tag}>`;
  }
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
  bodyStart: ['ARTICLE BODY', 'ARTICLE COPY PASTE FROM HERE', 'ARTICLE COPY'],
  decideFirst: ['DECIDE FIRST'],
  sources: ['ADMIN SOURCE RECORDS', 'SOURCES METHODOLOGY', 'SOURCES AND METHODOLOGY'],
  // Everything from the first of these onwards is importer/QA instruction, never article copy.
  adminOnly: ['ADMIN SOURCE RECORDS', 'BENCHMARK IMPORT', 'RENDERER EXPECTATIONS', 'REQUIRED LIVE PROOF', 'RELATED CONTENT'],
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
    if (!node) continue;
    const table = node.tagName?.toLowerCase() === 'table' ? node : node.querySelector?.('table');
    if (table) {
      // If table only has header (1 row) and next node is also a table, check next node
      const rows = table.querySelectorAll('tr');
      if (rows.length < 2 && index + 1 < end) {
        const nextNode = nodes[index + 1];
        const nextTable = nextNode?.tagName?.toLowerCase() === 'table' ? nextNode : nextNode?.querySelector?.('table');
        if (nextTable && nextTable.querySelectorAll('tr').length >= 2) {
          return { table: nextTable, node: nextNode, index: index + 1 };
        }
      }
      return { table, node, index };
    }
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
  'excerpt / deck': 'summary',
  'excerpt/deck': 'summary',
  summary: 'summary',
  slug: 'slug',
  category: 'category',
  tags: 'tags',
  'read time': 'readTimeMin',
  'reading time': 'readTimeMin',
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
  for (const cells of tableRows(table)) {
    if (!cells || cells.length < 2) continue;
    const label = cells[0];
    const value = cells.slice(1).join(' | ');
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
  'reader-facing label': 'label',
  'reader facing label': 'label',
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
        source[field] = field === 'verifiedAt' ? (isoDate(text) || text) : text;
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
 * then bold is also used for pull quotes and emphasis. Signals that rule a line out:
 * opens with a quote mark, ends in sentence punctuation (including ?!), or is too long.
 */
function looksLikeHeading(text) {
  if (!text || text.length > 120) return false;
  if (/^["'“‘]/.test(text)) return false;
  return !/[.?!,;]$/.test(text);
}

function isTitleCasedHeading(text) {
  if (!text) return false;
  const str = String(text).trim();
  if (str.length < 3 || str.length > 95) return false;
  if (/^["'“‘\[(]/.test(str)) return false;
  // Exclude lines ending with sentence punctuation (. , ; :)
  if (/[.,;:]$/.test(str)) return false;
  // Exclude list bullets, numbered items, pipe tables, dividers
  if (/^([•\-*]|\d+\.|\d+\)|\/|\|)/.test(str)) return false;
  // Exclude admin markers
  const upper = str.toUpperCase();
  if (
    upper.startsWith('AUTOUNITE') ||
    upper.startsWith('ADMIN') ||
    upper.startsWith('DECIDE FIRST') ||
    upper.startsWith('ARTICLE BODY') ||
    upper.startsWith('SOURCES') ||
    upper.startsWith('RELATED') ||
    upper.startsWith('BENCHMARK') ||
    upper.startsWith('REQUIRED') ||
    upper.startsWith('END OF') ||
    upper.startsWith('METHOD NOTE')
  ) {
    return false;
  }
  const words = str.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 14) return false;
  
  const minorWords = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from',
    'by', 'vs', 'vs.', 'with', 'in', 'of', 'is', 'not', 'too', 'can', 'may', 'be',
    'as', 'if', 'into', 'out', 'up', 'down', 'over', 'than',
  ]);
  let capitalizedCount = 0;
  for (const w of words) {
    const cleanW = w.replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanW) continue;
    if (minorWords.has(cleanW.toLowerCase()) || /^[A-Z0-9]/.test(cleanW)) {
      capitalizedCount++;
    }
  }
  return (capitalizedCount / words.length) >= 0.75;
}

function isHeading2Node(node) {
  if (!node) return false;
  const tag = node.tagName?.toLowerCase() || '';
  const text = node.textContent?.trim() || '';
  if (!text) return false;

  if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') return false;
  if (/^heading\s*3\s*:/i.test(text) || /^###\s+/i.test(text)) return false;

  if (tag === 'h2' || tag === 'h1') return true;
  if (/^heading\s*2\s*:/i.test(text) || /^##\s+/i.test(text)) return true;

  const className = String(node.className || '').toLowerCase();
  if (className.includes('msoheading2') || className.includes('heading2') || className.includes('heading-2')) {
    return true;
  }
  if (className.includes('msoheading1') || className.includes('heading1') || className.includes('heading-1')) {
    return true;
  }

  if (tag === 'p' || tag === 'div') {
    if (isQuoteParagraph(node)) return false;
    if (isHeading3Node(node)) return false;
    if (isDecisionSection(text)) return true;
    if (looksLikeHeading(text) && entirelyBold(node)) {
      return true;
    }
    if (isTitleCasedHeading(text)) {
      return true;
    }
  }

  return false;
}

function isHeading3Node(node) {
  if (!node) return false;
  const tag = node.tagName?.toLowerCase() || '';
  const text = node.textContent?.trim() || '';
  if (!text) return false;

  if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') return true;
  if (/^heading\s*3\s*:/i.test(text) || /^###\s+/i.test(text)) return true;

  const className = String(node.className || '').toLowerCase();
  if (className.includes('msoheading3') || className.includes('heading3') || className.includes('heading-3')) {
    return true;
  }

  if (isKnownSubheading(text)) return true;

  return false;
}

function cleanHeadingLabel(text) {
  return String(text || '')
    .replace(/^heading\s*[23]\s*:\s*/i, '')
    .replace(/^#{1,4}\s+/, '')
    .trim();
}

export function promoteBoldHeadings(html) {
  if (typeof window === 'undefined' || !html) return html;
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');

  for (const paragraph of [...doc.body.querySelectorAll('p, div')]) {
    const text = paragraph.textContent.trim();
    if (isQuoteParagraph(paragraph)) continue;
    if (isHeading3Node(paragraph)) {
      const heading = doc.createElement('h3');
      heading.textContent = cleanHeadingLabel(text);
      paragraph.replaceWith(heading);
    } else if (isHeading2Node(paragraph)) {
      const heading = doc.createElement('h2');
      heading.textContent = cleanHeadingLabel(text);
      paragraph.replaceWith(heading);
    }
  }
  return doc.body.innerHTML;
}

function isCssNoise(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  return (
    /^[a-z0-9_#.,\s-]+\{[^}]*(?:margin|font|color|border|padding|text-decoration|display|background)[^}]*\}/i.test(t) ||
    /(?:margin:\s*0\.0px|font:\s*\d+\.\d+px\s*Times|border-collapse:\s*collapse)/i.test(t)
  );
}

export function markdownPipesToTables(text) {
  if (!text) return text;
  const lines = text.split(/\r?\n/);
  const out = [];
  let inTable = false;
  let tableRows = [];
  let tableDelim = '\t';

  const flushTable = () => {
    if (!tableRows.length) return;
    const htmlRows = tableRows
      .map((row) => {
        const cells = row
          .split(tableDelim)
          .map((c) => c.trim())
          .filter((c, idx, arr) => {
            // drop leading/trailing empty cells from outer pipes
            if (tableDelim === '|' && (idx === 0 || idx === arr.length - 1) && !c) return false;
            return true;
          });
        if (!cells.length) return '';
        const isDashes = cells.every((c) => /^[-=:]+$/.test(c));
        if (isDashes) return '';
        const tds = cells.map((cell) => `<td>${cell}</td>`).join('');
        return `<tr>${tds}</tr>`;
      })
      .filter(Boolean)
      .join('');

    if (htmlRows) {
      out.push(`<table>${htmlRows}</table>`);
    }
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isDivider = /^[-=]{3,}$/.test(line);
    if (isDivider) {
      // In markdown tables, dashed lines separate the header from data rows.
      // Do not flush the table on header separator lines.
      continue;
    }
    const hasPipe = line.includes('|');
    const hasTab = line.includes('\t');
    if ((hasPipe || hasTab) && !line.startsWith('#') && !line.startsWith('Heading')) {
      const currentDelim = hasTab ? '\t' : '|';
      if (inTable && tableDelim !== currentDelim) {
        flushTable();
      }
      inTable = true;
      tableDelim = currentDelim;
      tableRows.push(lines[i]); // preserve tabs
    } else {
      if (inTable) flushTable();
      if (line.startsWith('Heading 2:')) {
        out.push(`<h2>${line.replace(/^Heading 2:\s*/i, '').trim()}</h2>`);
      } else if (line.startsWith('Heading 3:')) {
        out.push(`<h3>${line.replace(/^Heading 3:\s*/i, '').trim()}</h3>`);
      } else if (/^##\s+/.test(line)) {
        out.push(`<h2>${line.replace(/^##\s+/, '').trim()}</h2>`);
      } else if (/^###\s+/.test(line)) {
        out.push(`<h3>${line.replace(/^###\s+/, '').trim()}</h3>`);
      } else if (line.startsWith('Quote style:')) {
        let quoteText = line.replace(/^Quote style:\s*/i, '').trim();
        if (!quoteText && i + 1 < lines.length) {
          quoteText = lines[++i].trim();
        }
        if (quoteText) out.push(`<blockquote><p>${quoteText}</p></blockquote>`);
      } else if (/^[•\-*]\s+/.test(line)) {
        out.push(`<ul><li>${line.replace(/^[•\-*]\s+/, '')}</li></ul>`);
      } else if (isKnownSubheading(line)) {
        out.push(`<h3>${line}</h3>`);
      } else if (isTitleCasedHeading(line) && !line.includes('|') && !line.includes('\t')) {
        out.push(`<h2>${line}</h2>`);
      } else if (line) {
        out.push(`<p>${line}</p>`);
      }
    }
  }
  if (inTable) flushTable();
  return out.join('\n');
}

export function sanitizeHtmlInput(html) {
  if (!html) return '';
  let str = String(html);

  // If text is plain text (no HTML tags) or contains markdown/tab tables
  const hasHtmlTags = /<\/?(?:p|div|span|h[1-6]|table|ul|ol|li|blockquote|a|b|strong|i|em)[^>]*>/i.test(str);
  if (!hasHtmlTags || ((str.includes('|') || str.includes('\t')) && !str.includes('<table'))) {
    str = str
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
      .replace(/<\/?(?:p|div|span)[^>]*>/gi, '');
    str = markdownPipesToTables(str);
  }

  // Convert markdown links [text](url) to <a> tags if present as plain text/markdown
  str = str.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\)/g, '<a href="$2">$1</a>');

  // Convert markdown bold **text** or __text__ to <strong> tags
  str = str.replace(/(\*\*|__)(?=\S)(.+?)(?<=\S)\1/g, '<strong>$2</strong>');

  // Convert markdown italic *text* or _text_ to <em> tags
  str = str.replace(/(?<!\*|\w)(\*|_)(?=\S)(.+?)(?<=\S)\1(?!\*|\w)/g, '<em>$2</em>');

  str = str
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');

  // Strip standalone CSS rules if passed as raw plain text
  str = str.replace(/[a-z0-9_#.,\s-]+\{[^}]*(?:margin|font|color|border|padding|text-decoration)[^}]*\}/gi, '');
  return str.trim();
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

  const cleaned = sanitizeHtmlInput(html);
  const doc = new DOMParser().parseFromString(`<body>${cleaned}</body>`, 'text/html');
  doc.querySelectorAll('style, script, meta, link, noscript, head, svg, iframe').forEach((e) => e.remove());
  const nodes = [...doc.body.children].filter((n) => !isCssNoise(n.textContent));
  if (!nodes.length) return empty;

  const bodyAt = markerIndex(nodes, MARKERS.bodyStart);
  const decideAt = markerIndex(nodes, MARKERS.decideFirst);
  const sourcesAt = markerIndex(nodes, MARKERS.sources);
  const adminAt = markerIndex(nodes, MARKERS.adminOnly, Math.max(bodyAt, 0));

  const beforeBody = [decideAt, bodyAt, adminAt].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? -1;
  const metaHit = findTable(nodes, 0, beforeBody >= 0 ? beforeBody : nodes.length);
  const meta = metaHit ? metaFromTable(metaHit.table) : {};
  const metaIsHeader = Object.keys(meta).length >= META_TABLE_MIN_ROWS;
  if (metaIsHeader && !meta.title) {
    const title = titleAbove(nodes, metaHit.index);
    if (title) meta.title = title;
  }

  // Fallback: package without metadata table (e.g. semantic H1 + subtitle deck, or has package markers like DECIDE FIRST / SOURCES).
  const h1Present = nodes.some((n) => n.tagName?.toLowerCase() === 'h1');
  const isPackage = metaIsHeader || h1Present || decideAt >= 0 || bodyAt >= 0 || adminAt >= 0 || nodes.length >= 2;
  if (!meta.title && isPackage) {
    const leadLimit = beforeBody >= 0 ? beforeBody : nodes.length;
    const leadNodes = nodes.slice(0, leadLimit).filter((n) => n.textContent?.trim());
    const h1Node = leadNodes.find((n) => n.tagName?.toLowerCase() === 'h1');
    if (h1Node) {
      meta.title = h1Node.textContent.trim();
      const h1Idx = leadNodes.indexOf(h1Node);
      const deckNode = leadNodes.slice(h1Idx + 1).find((n) => n.tagName?.toLowerCase() === 'p');
      if (deckNode && !meta.summary) {
        const deckText = deckNode.textContent.trim();
        if (deckText && !normalizeMarker(deckText).startsWith('DECIDE FIRST')) {
          meta.summary = deckText;
        }
      }
    } else if (leadNodes.length > 0) {
      const firstText = leadNodes[0].textContent.trim();
      if (firstText && !normalizeMarker(firstText).startsWith('DECIDE FIRST') && !/^h[1-2]$/i.test(leadNodes[0].tagName)) {
        meta.title = firstText;
        if (leadNodes.length > 1) {
          const secondText = leadNodes[1].textContent.trim();
          if (secondText && !normalizeMarker(secondText).startsWith('DECIDE FIRST') && !/^h[1-2]$/i.test(leadNodes[1].tagName)) {
            meta.summary = secondText;
          }
        }
      }
    }
  }

  const decideHit = decideAt >= 0 ? findTable(nodes, decideAt + 1, bodyAt >= 0 ? bodyAt : -1) : null;
  let decideFirst = decideHit ? decideFirstFromTable(decideHit.table) : null;

  // Fallback: Decide First authored as text paragraphs instead of a table
  if (!decideFirst && decideAt >= 0) {
    const DECIDE_KEYS = {
      'what matters': 'whatMatters',
      'watch this': 'watchThis',
      'your next move': 'yourNextMove',
    };
    decideFirst = {};
    let currentKey = null;
    const searchLimit = bodyAt >= 0 ? bodyAt : nodes.length;
    for (let i = decideAt + 1; i < searchLimit; i++) {
      const text = nodes[i].textContent.trim();
      const normalized = text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      if (DECIDE_KEYS[normalized]) {
        currentKey = DECIDE_KEYS[normalized];
      } else if (currentKey && text) {
        if (/^h[1-2]$/i.test(nodes[i].tagName) || text.toUpperCase() === 'OVERVIEW') break;
        decideFirst[currentKey] = [text];
        currentKey = null;
      }
    }
    if (!Object.keys(decideFirst).length) decideFirst = null;
  }

  const sourcesHit = sourcesAt >= 0 ? findTable(nodes, sourcesAt, -1) : null;
  let sources = sourcesHit ? sourcesFromTable(sourcesHit.table) : [];

  // Fallback: sources listed in bullet list or links under "Sources & Methodology" or "Sources" heading
  if (!sources.length) {
    const sourcesHeadingIdx = nodes.findIndex((n) =>
      /^(sources(\s*&|\s+and)?\s*methodology|sources)$/i.test(n.textContent.trim()),
    );
    if (sourcesHeadingIdx >= 0) {
      for (let i = sourcesHeadingIdx + 1; i < nodes.length; i++) {
        const node = nodes[i];
        if (/^h[1-6]$/i.test(node.tagName) || /^(related|method\s*note)/i.test(node.textContent.trim())) break;
        const links = [...node.querySelectorAll('a')];
        for (const a of links) {
          const url = a.getAttribute('href');
          const label = a.textContent.trim();
          if (url && label) {
            const parts = label.split(/—|-/).map((s) => s.trim());
            const sourceName = parts.length > 1 ? parts[0] : '';
            sources.push({ sourceName, label, url });
          }
        }
      }
    }
  }

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
    const same =
      last &&
      (last.href || '') === (run.href || '') &&
      Boolean(last.bold) === Boolean(run.bold) &&
      Boolean(last.italic) === Boolean(run.italic);
    if (same) {
      last.text += run.text;
      return acc;
    }
    acc.push({ ...run });
    return acc;
  }, []);
}

function isDecisionSection(text) {
  const norm = String(text || '').trim().toLowerCase().replace(/['"’]/g, '');
  const clean = norm.replace(/[,\s&–—-]+/g, ' ');
  const KNOWN = [
    'overview',
    'the customers question',
    'paperwork coverage inspection',
    'what the technical guidance can prove',
    'purchase price vs ownership risk',
    'responsibility mileage goodwill',
    'what to decide before delivery',
    'the repair estimate answers only one question',
    'five paths can start with the same warning light',
    'start with the vin not the estimate',
    'the contract may matter more than the sales pitch',
    'what the dealer can verify and what it cannot promise',
    'a better repair conversation',
    'the bottom line',
  ];
  return KNOWN.some((k) => clean === k || norm === k);
}

function isKnownSubheading(text) {
  const norm = String(text || '').trim().toLowerCase().replace(/['"’]/g, '').replace(/[,\s&–—-]+/g, ' ');
  const KNOWN_SUBHEADS = [
    'the customer had a fair question',
    'what as is actually means in the buying process',
    'the original chevrolet powertrain warranty was already gone by mileage',
    'an inspection is a snapshot not a promise about the future',
    'gm has published transmission diagnostic guidance for certain conditions',
    'gm has published transmission diagnostic guidance for certain suburbans',
    'the customer actually did several things right',
    'the trade off payment vs protection',
    'the finance presentation was really a risk decision',
    'the lowest out the door number can still become an expensive ownership decision',
    'then the repair bill became a dealership problem',
    'more than 10 000 miles changes the conversation',
    'the dealership still had a choice',
    'eventually the temperature came down',
    'dealers need to make this conversation better before delivery',
    'customers need a different question too',
    'diagnosis and coverage are different decisions',
    'pre authorization can change the sequence',
    'pre-authorization can change the sequence',
    'averages flatten the vehicle you are actually shopping',
  ];
  return KNOWN_SUBHEADS.some((k) => norm === k);
}

function markFromAncestors(node, stopAt) {
  let bold = false;
  let italic = false;
  for (let parent = node.parentElement; parent && parent !== stopAt; parent = parent.parentElement) {
    const tag = parent.tagName?.toLowerCase() || '';
    const weight = parent.style?.fontWeight || '';
    const style = parent.style?.fontStyle || '';
    if (weight === 'normal' || weight === '400') {
      // explicitly reset font-weight (common in Google Docs wrappers)
    } else if (tag === 'b' || tag === 'strong' || weight === 'bold' || Number(weight) >= 600) {
      bold = true;
    }
    if (tag === 'i' || tag === 'em' || style === 'italic') italic = true;
  }
  return { bold, italic };
}

/**
 * Text of an element split into runs so links, bold and italic stay attached to
 * the exact phrases the writer marked — matching the client Word package.
 */
function runsFromElement(element) {
  const runs = [];
  const walk = (node, href) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        if (!child.nodeValue) return;
        const { bold, italic } = markFromAncestors(child, element.parentElement);
        runs.push({
          text: child.nodeValue,
          href: href || undefined,
          ...(bold ? { bold: true } : {}),
          ...(italic ? { italic: true } : {}),
        });
        return;
      }
      if (child.nodeType !== 1) return;
      const tag = child.tagName.toLowerCase();
      if (tag === 'br') {
        runs.push({ text: ' ' });
        return;
      }
      walk(child, tag === 'a' ? child.getAttribute('href') || '' : href);
    });
  };
  walk(element, '');
  const merged = mergeRuns(runs.filter((run) => run.text));
  // Runs are only stored when they add a link or emphasis the plain text field cannot.
  const useful = merged.some((run) => run.href || run.bold || run.italic);
  if (!useful) return [];
  return merged.map((run) => {
    const out = { text: run.text };
    if (run.href) out.href = run.href;
    if (run.bold) out.bold = true;
    if (run.italic) out.italic = true;
    return out;
  });
}

/** Word's Quote style often pastes as a fully italic (sometimes also bold) paragraph. */
function isQuoteParagraph(element) {
  const runs = runsFromElement(element);
  if (!runs.length) return false;
  const visible = runs.filter((run) => run.text.trim());
  return visible.length > 0 && visible.every((run) => run.italic);
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
  const cleaned = sanitizeHtmlInput(html);
  const doc = new DOMParser().parseFromString(`<body>${cleaned || ''}</body>`, 'text/html');
  doc.querySelectorAll('style, script, meta, link, noscript, head, svg, iframe').forEach((e) => e.remove());
  const sections = [];
  const usedIds = new Set();

  const startSection = (label) => {
    const cleanLabel = cleanHeadingLabel(label || 'Overview').trim();
    // If we only have an initial Overview section with no blocks yet, adopt this first heading as section 1
    if (sections.length === 1 && sections[0].label.toLowerCase() === 'overview' && sections[0].blocks.length === 0) {
      const id = slugifySection(cleanLabel, 'section-1');
      sections[0].label = cleanLabel;
      sections[0].section_id = id;
      usedIds.clear();
      usedIds.add(id);
      return sections[0];
    }
    if (sections.length === 1 && sections[0].label.toLowerCase() === 'overview' && cleanLabel.toLowerCase() === 'overview') {
      return sections[0];
    }
    let id = slugifySection(cleanLabel, `section-${sections.length + 1}`);
    let suffix = 2;
    while (usedIds.has(id)) id = `${slugifySection(cleanLabel, 'section')}-${suffix++}`;
    usedIds.add(id);
    sections.push({ section_id: id, label: cleanLabel, order: sections.length, blocks: [] });
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

  const validNodes = [...doc.body.children].filter((n) => !isCssNoise(n.textContent));
  for (const node of validNodes) {
    const tag = node.tagName.toLowerCase();
    const text = node.textContent.trim();
    if (!text && !node.querySelector('img') && tag !== 'table') continue;

    const normUpper = normalizeMarker(text);
    if (
      normUpper.startsWith('ADMIN SOURCE RECORDS') ||
      normUpper.startsWith('SOURCES METHODOLOGY') ||
      normUpper === 'SOURCES' ||
      normUpper.startsWith('SOURCES AND METHODOLOGY') ||
      normUpper.startsWith('RELATED NEXT DECISION') ||
      normUpper.startsWith('BENCHMARK IMPORT') ||
      normUpper.startsWith('REQUIRED LIVE PROOF')
    ) {
      break;
    }

    if (isHeading2Node(node)) {
      startSection(text);
      continue;
    }
    if (isHeading3Node(node)) {
      pushBlock({ kind: 'heading', type: 'heading', text: cleanHeadingLabel(text) });
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
      const runs = runsFromElement(node);
      // Client Quote style often arrives as <p><b><i>…</i></b></p>, not <blockquote>.
      if (isQuoteParagraph(node)) {
        pushBlock({ kind: 'quote', type: 'quote', text, ...(runs.length ? { text_runs: runs } : {}) });
        continue;
      }
      pushBlock({ kind: 'paragraph', type: 'paragraph', text, ...(runs.length ? { text_runs: runs } : {}) });
      continue;
    }
    if (tag === 'ul' || tag === 'ol') {
      const lis = [...node.querySelectorAll(':scope > li')];
      const items = lis.map((li) => li.textContent.trim()).filter(Boolean);
      if (!items.length) continue;
      const kind = tag === 'ul' ? 'bullets' : 'numbered_list';
      const itemRuns = lis.map((li) => runsFromElement(li));
      const hasMarks = itemRuns.some((runs) => runs.length);
      pushBlock({
        kind,
        type: kind,
        items,
        bullets: items,
        ...(hasMarks ? { item_runs: itemRuns } : {}),
      });
      continue;
    }
    if (tag === 'blockquote') {
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
    pushBlock({ kind: 'paragraph', type: 'paragraph', text });
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
