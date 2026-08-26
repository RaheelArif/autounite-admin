/**
 * Paste → storage mapping tests.
 * Run: node src/lib/blogEditorDoc.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<body></body>');
global.window = dom.window;
global.DOMParser = dom.window.DOMParser;

const source = readFileSync(fileURLToPath(new URL('./blogEditorDoc.js', import.meta.url)), 'utf8');
const { htmlToSections, parsePastedPackage, preservedBlocks, promoteBoldHeadings, sectionsToHtml } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);

// A Word/Docs paste: real headings, a linked phrase, a list and a table.
const wordPaste = `
  <h1>A 19.42% Car Loan. And It Was a Good Approval.</h1>
  <p>Sometimes the customer sees 19.42%.</p>
  <h1>First, where did 19.42% come from?</h1>
  <p>According to <a href="https://www.experian.com/blogs/ask-experian/used-car-loan-rates/">Experian&rsquo;s Q1 2026 data</a>, the band average was 19.42%.</p>
  <ul><li>Credit score</li><li>Amount financed</li></ul>
  <table><tr><th>Band</th><th>Average</th></tr><tr><td>501-600</td><td>19.42%</td></tr></table>
`;

const sections = htmlToSections(wordPaste);
assert.equal(sections.length, 2, 'each heading opens a section');
assert.equal(sections[0].section_id, 'a-19-42-car-loan-and-it-was-a-good-approval');
assert.equal(sections[1].label, 'First, where did 19.42% come from?');

const [paragraph, list, table] = sections[1].blocks;
assert.equal(paragraph.kind, 'paragraph');
assert.equal(paragraph.text_runs.length, 3, 'linked phrase splits the paragraph into runs');
assert.match(paragraph.text_runs[1].href, /experian\.com/);
assert.equal(paragraph.text_runs[0].href, undefined, 'plain runs carry no href');
assert.equal(paragraph.text, paragraph.text_runs.map((run) => run.text).join(''), 'text matches its runs');
assert.equal(list.kind, 'bullets');
assert.deepEqual(list.items, ['Credit score', 'Amount financed']);
assert.equal(table.kind, 'table');
assert.deepEqual(table.table.columns, ['Band', 'Average']);
assert.deepEqual(table.table.rows, [['501-600', '19.42%']]);
assert.equal(paragraph.block_id, 'first-where-did-19-42-come-from-b1', 'block ids follow their section');

// Copy without links stays plain — runs are only stored when they add something.
const plain = htmlToSections('<h2>Overview</h2><p>No links here.</p>');
assert.equal(plain[0].blocks[0].text_runs, undefined, 'plain paragraph has no runs');

// Copy before the first heading is not lost.
const orphan = htmlToSections('<p>Opening line.</p><h2>Later</h2><p>Body.</p>');
assert.equal(orphan[0].label, 'Overview');
assert.equal(orphan[0].blocks[0].text, 'Opening line.');

// Sources / Decide First blocks survive a round trip through the editor.
const withModule = [
  {
    section_id: 'overview',
    label: 'Overview',
    blocks: [
      { kind: 'paragraph', text: 'Editable copy.' },
      { kind: 'source_note', links: [{ label: 'CFPB', url: 'https://www.consumerfinance.gov/' }] },
    ],
  },
];
const preserved = preservedBlocks(withModule);
assert.equal(preserved.get('overview').length, 1, 'module block set aside');
const roundTripped = htmlToSections(sectionsToHtml(withModule), preserved);
assert.equal(roundTripped[0].blocks.length, 2, 'module block re-attached after editing');
assert.equal(roundTripped[0].blocks[1].kind, 'source_note');

// A source that drops heading styles still yields sections from its bold lines.
const boldOnly = '<p><b>Where did 19.42% come from</b></p><p>Body copy that is not bold.</p>';
const promoted = promoteBoldHeadings(boldOnly);
assert.match(promoted, /<h2>Where did 19\.42% come from<\/h2>/);
assert.equal(htmlToSections(promoted).length, 1);
assert.equal(
  promoteBoldHeadings('<h2>Real heading</h2><p><b>Bold lead-in.</b></p>'),
  '<h2>Real heading</h2><p><b>Bold lead-in.</b></p>',
  'real headings present → nothing is guessed',
);

// Bold also marks pull quotes and emphasis lines. Those must stay paragraphs, or the
// article ends up with sections called "No." and "550 = 19.42%." in On This Page.
const boldNonHeadings = [
  '550 = 19.42%.',
  'No.',
  'This may actually be the approval I have available today.',
  '“My score is 620. Why isn’t my rate better?”',
  'How in the world is that a good approval?',
];
for (const line of boldNonHeadings) {
  const out = promoteBoldHeadings(`<p><b>${line}</b></p><p>Body copy.</p>`);
  assert.ok(!out.includes('<h2>'), `bold emphasis is not a heading: ${line}`);
}
for (const line of ['19.42% APR', 'Sometimes those four hours are ugly', 'Negative equity makes this even harder']) {
  const out = promoteBoldHeadings(`<p><b>${line}</b></p><p>Body copy.</p>`);
  assert.ok(out.includes(`<h2>${line}</h2>`), `a real heading is still promoted: ${line}`);
}

// A newsletter package: file name, public title, execution table, LinkedIn-only
// copy, then the marker where the article actually starts.
const packagePaste = `
  <h1>01 LINKEDIN NEWSLETTER</h1>
  <p>A 19.42% Car Loan. And It Was a Good Approval.</p>
  <table>
    <tr><td>Publish</td><td>Wednesday, August 19, 2026 — 9:00 AM ET</td></tr>
    <tr><td>Deck</td><td>Why an expensive rate can still be a strong approval.</td></tr>
    <tr><td>Read time</td><td>11 min read</td></tr>
    <tr><td>SEO title</td><td>19.42% Car Loan: Why It Can Be a Good Approval</td></tr>
    <tr><td>SEO description</td><td>A 19.42% APR is expensive. See how lender criteria still produce a strong approval.</td></tr>
    <tr><td>Hero</td><td>Hero.png</td></tr>
  </table>
  <h1>Newsletter launch post</h1>
  <p>Platform-only copy that must not reach the blog.</p>
  <h1>ARTICLE COPY — PASTE FROM HERE</h1>
  <h1>First, where did 19.42% come from?</h1>
  <p>I didn&rsquo;t pick that number because it makes a good headline.</p>
`;

const { meta, html: trimmed } = parsePastedPackage(packagePaste);
assert.equal(meta.title, 'A 19.42% Car Loan. And It Was a Good Approval.', 'public title read, file name skipped');
assert.equal(meta.summary, 'Why an expensive rate can still be a strong approval.');
assert.equal(meta.readTimeMin, 11, '"11 min read" becomes a number');
assert.equal(meta.metaTitle, '19.42% Car Loan: Why It Can Be a Good Approval');
assert.match(meta.metaDescription, /^A 19\.42% APR is expensive/);

assert.ok(!trimmed.includes('LINKEDIN NEWSLETTER'), 'file name dropped');
assert.ok(!trimmed.includes('Read time'), 'execution table dropped');
assert.ok(!trimmed.includes('Platform-only copy'), 'launch post dropped');
assert.ok(!trimmed.includes('PASTE FROM HERE'), 'marker itself dropped');
assert.ok(trimmed.includes('where did 19.42% come from'), 'article copy kept');

const packageSections = htmlToSections(trimmed);
assert.equal(packageSections.length, 1, 'only the article body becomes sections');
assert.equal(packageSections[0].label, 'First, where did 19.42% come from?');

// The Blog OS package table uses its own labels for the same fields.
const blogOsPackage = `
  <p>QUEUED, DO NOT PUBLISH</p>
  <table>
    <tr><td>H1</td><td>A 19.42% Car Loan. And It Was a Good Approval.</td></tr>
    <tr><td>SEO title</td><td>19.42% Used Car APR: Why the Approval Can Still Be Good</td></tr>
    <tr><td>Slug</td><td>/blog/19-42-used-car-apr-good-approval</td></tr>
    <tr><td>Meta</td><td>A 19.42% APR is expensive. Learn how credit and LTV still matter.</td></tr>
    <tr><td>Category</td><td>Car Financing</td></tr>
    <tr><td>Tags</td><td>Auto Loans • APR • Credit Scores</td></tr>
    <tr><td>Excerpt</td><td>The rate is the number a shopper sees.</td></tr>
  </table>
`;

const blogOsMeta = parsePastedPackage(blogOsPackage).meta;
assert.equal(blogOsMeta.title, 'A 19.42% Car Loan. And It Was a Good Approval.', 'H1 row wins over the line above');
assert.equal(blogOsMeta.slug, '19-42-used-car-apr-good-approval', 'slug path reduced to its last segment');
assert.equal(blogOsMeta.metaTitle, '19.42% Used Car APR: Why the Approval Can Still Be Good');
assert.match(blogOsMeta.metaDescription, /^A 19\.42% APR is expensive/);
assert.deepEqual(blogOsMeta.tags, ['Auto Loans', 'APR', 'Credit Scores'], 'bullet-separated tags split');
assert.equal(blogOsMeta.summary, 'The rate is the number a shopper sees.');
assert.equal(blogOsMeta.category, 'Car Financing', 'category is reported, and mapped by the form only if it is one of ours');

// No marker → nothing is trimmed.
const plainPaste = parsePastedPackage('<h2>Plain</h2><p>Copy.</p>');
assert.equal(plainPaste.html, '<h2>Plain</h2><p>Copy.</p>');
assert.deepEqual(plainPaste.meta, {}, 'no table → no meta');
assert.equal(plainPaste.decideFirst, null);
assert.deepEqual(plainPaste.sources, []);

// A data table inside body copy is not a header table and stays in the body.
const bodyTable = parsePastedPackage('<h2>Rates</h2><table><tr><th>Band</th><th>APR</th></tr><tr><td>501-600</td><td>19.42%</td></tr></table>');
assert.deepEqual(bodyTable.meta, {}, 'unrecognised labels → not a header table');
assert.ok(bodyTable.html.includes('<table>'), 'body table kept');

// ---------------------------------------------------------------------------
// The client's benchmark package, converted from the .docx exactly as Word puts
// it on the clipboard. Everything the importer promises is asserted here.
// ---------------------------------------------------------------------------
const benchmark = readFileSync(fileURLToPath(new URL('./__fixtures__/blog-article-benchmark.html', import.meta.url)), 'utf8');
const pkg = parsePastedPackage(benchmark);

assert.equal(pkg.meta.title, 'A 19.42% Car Loan. And It Was a Good Approval.');
assert.equal(pkg.meta.slug, '19-42-used-car-apr-good-approval');
assert.equal(pkg.meta.metaTitle, '19.42% Car Loan: Why It Can Be a Good Approval');
assert.equal(pkg.meta.category, 'Money');
assert.equal(pkg.meta.readTimeMin, 11);
assert.equal(pkg.meta.authorName, 'Kenny Smith');
assert.equal(pkg.meta.contentType, 'Newsletter');
assert.equal(pkg.meta.heroFile, 'Hero.png');
assert.equal(pkg.meta.socialImageFile, 'Blog Social Image.png');
assert.equal(pkg.meta.canonicalUrl, 'https://www.autounite.com/blog/19-42-used-car-apr-good-approval');
assert.equal(pkg.meta.tags.length, 6);
assert.match(pkg.meta.heroAlt, /^Car shopper reviews a loan agreement/);
assert.equal(pkg.meta.lastVerifiedAt, new Date('August 25, 2026').toISOString());

// "Pending verification" and "Not published" are the absence of a value.
assert.equal(pkg.meta.originalUrl, undefined, 'pending lineage URL is not stored');
assert.equal(pkg.meta.originalPublishedAt, undefined, 'pending lineage date is not stored');
assert.equal(pkg.meta.autoUnitePublishedAt, undefined, '"Not published" is not a date');
assert.equal(pkg.meta.distribution, undefined, 'all three channel URLs are still pending');

assert.deepEqual(Object.keys(pkg.decideFirst), ['whatMatters', 'watchThis', 'yourNextMove']);
assert.match(pkg.decideFirst.whatMatters[0], /^A high APR can still be/);

assert.equal(pkg.sources.length, 6, 'every admin source record is lifted out');
assert.equal(pkg.sources[0].sourceName, 'Experian');
assert.match(pkg.sources[0].url, /^https:\/\/www\.experian\.com/);
assert.equal(pkg.sources[0].verifiedAt, new Date('2026-08-25').toISOString());

const benchmarkSections = htmlToSections(pkg.html);
assert.equal(benchmarkSections.length, 12, 'Overview plus the eleven H2s');
assert.equal(benchmarkSections[0].label, 'Overview');
assert.equal(benchmarkSections[1].label, 'First, where did 19.42% come from?');
assert.equal(benchmarkSections[11].label, 'That’s the gap AutoUnite is being built to close');

const benchmarkBlocks = benchmarkSections.flatMap((section) => section.blocks);
const dump = JSON.stringify(benchmarkSections);
for (const leak of ['Renderer item', 'Publisher', 'Rich Results Test', 'Verified date', 'Decide First', 'Read time']) {
  assert.ok(!dump.includes(leak), `admin-only copy stays out of the body: ${leak}`);
}
assert.equal(
  benchmarkBlocks.filter((block) => block.kind === 'table').length,
  1,
  'only the APR table is article content',
);
assert.equal(benchmarkBlocks.filter((block) => block.kind === 'quote').length, 12, 'Quote style stays a pull quote');
assert.equal(benchmarkBlocks.filter((block) => block.kind === 'callout').length, 0, 'no quote is downgraded to a callout');
assert.ok(benchmarkBlocks.some((block) => block.kind === 'bullets'), 'bullet lists survive');
// The package's only numbered list is the release-proof checklist, which is admin-only.
assert.equal(
  benchmarkBlocks.filter((block) => block.kind === 'numbered_list').length,
  0,
  'the live-proof checklist never becomes article copy',
);

const benchmarkLinks = benchmarkBlocks.flatMap((block) => block.text_runs || []).filter((run) => run.href);
assert.equal(benchmarkLinks.length, 10, 'every inline source link is preserved');
assert.ok(
  benchmarkLinks.every((run) => /^https:\/\//.test(run.href) && run.text.trim()),
  'each link keeps its anchor text',
);

console.log('blogEditorDoc.test.mjs — all OK');
