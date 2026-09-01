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

// Client Quote style pastes as italic (often also bold) — that is a pull quote, not a section.
const wordQuote = htmlToSections('<h2>Rates</h2><p><b><i>How in the world is that a good approval?</i></b></p><p>That reaction makes sense.</p>');
assert.equal(wordQuote[0].blocks[0].kind, 'quote', 'italic paragraph becomes a quote block');
assert.equal(wordQuote[0].blocks[0].text_runs[0].italic, true);
assert.equal(wordQuote[0].blocks[1].kind, 'paragraph');

// Bold and italic inside a paragraph are kept on the exact words.
const emphasized = htmlToSections('<h2>Credit</h2><p>A <strong>high APR</strong> can still be a <em>strong</em> approval.</p>');
const emphRuns = emphasized[0].blocks[0].text_runs;
assert.ok(emphRuns.some((run) => run.text === 'high APR' && run.bold), 'bold phrase kept');
assert.ok(emphRuns.some((run) => run.text === 'strong' && run.italic), 'italic phrase kept');

// Client list items are bold in Word — preserve that emphasis.
const boldList = htmlToSections('<h2>Lender</h2><ul><li><b>Your income.</b></li><li><b>The term.</b></li></ul>');
assert.equal(boldList[0].blocks[0].kind, 'bullets');
assert.deepEqual(boldList[0].blocks[0].items, ['Your income.', 'The term.']);
assert.equal(boldList[0].blocks[0].item_runs[0][0].bold, true, 'list bold preserved');

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

// ---------------------------------------------------------------------------
// Test Package 02 (Newsletter 06 — 90,000 Miles transmission story)
// ---------------------------------------------------------------------------
const test02Html = readFileSync(fileURLToPath(new URL('./__fixtures__/blog-article-test02.html', import.meta.url)), 'utf8');
const pkg02 = parsePastedPackage(test02Html);
assert.equal(pkg02.meta.title, '90,000 Miles. Eight Months Later, It Needed a Transmission.');
assert.match(pkg02.meta.summary, /^The customer got the out-the-door number he wanted/);
assert.deepEqual(Object.keys(pkg02.decideFirst), ['whatMatters', 'watchThis', 'yourNextMove']);
assert.match(pkg02.decideFirst.whatMatters[0], /^A low out-the-door number does not remove the ownership risk/);
assert.equal(pkg02.sources.length, 7, 'all 7 sources extracted from Sources & Methodology');

const sections02 = htmlToSections(pkg02.html);
assert.equal(sections02.length, 7, '7 decision-level sections for On This Page');
assert.equal(sections02[0].label, 'Overview');
assert.equal(sections02[1].label, 'The Customer’s Question');
assert.equal(sections02[2].label, 'Paperwork, Coverage & Inspection');
assert.equal(sections02[3].label, 'What the Technical Guidance Can Prove');
assert.equal(sections02[4].label, 'Purchase Price vs. Ownership Risk');
assert.equal(sections02[5].label, 'Responsibility, Mileage & Goodwill');
assert.equal(sections02[6].label, 'What to Decide Before Delivery');

// ---------------------------------------------------------------------------
// macOS / Word Style Tags Sanitization Test
// ---------------------------------------------------------------------------
const wordClipboardWithStyles = `
<style type="text/css">
p.p1 {margin: 0.0px 0.0px 0.0px; font: 12.0px Times}
p.p2 {margin: 0.0px 0.0px 0.0px; font: 9.0px Times; color: #704aff}
span.s1 {text-decoration: underline}
</style>
<p class="p1"><b>90,000 Miles. Eight Months Later, It Needed a Transmission.</b></p>
<p class="p2">The customer got the out-the-door number he wanted. The repair risk was a separate decision.</p>
<h2>Overview</h2>
<p class="p1">The customer got the out-the-door number he wanted.</p>
`;
const pkgWithStyles = parsePastedPackage(wordClipboardWithStyles);
assert.equal(pkgWithStyles.meta.title, '90,000 Miles. Eight Months Later, It Needed a Transmission.');
assert.ok(!pkgWithStyles.html.includes('margin: 0.0px'), 'raw CSS is stripped from HTML');
assert.ok(!pkgWithStyles.meta.title.includes('p.p1'), 'CSS is not treated as title');

// ---------------------------------------------------------------------------
// Test Package 07 (July Incentives / Market)
// ---------------------------------------------------------------------------
const test07Html = readFileSync(fileURLToPath(new URL('./__fixtures__/blog-article-test07.html', import.meta.url)), 'utf8');
const pkg07 = parsePastedPackage(test07Html);
assert.equal(pkg07.meta.title, '6.4% Is the Average. Your Vehicle May Be in a Different Market.');
assert.equal(pkg07.meta.slug, '64-percent-average-your-vehicle-different-market');
assert.equal(pkg07.sources.length, 4, 'all 4 sources extracted');

const sections07 = htmlToSections(pkg07.html);
console.log('Test 07 parsed sections count:', sections07.length);
sections07.forEach((s, idx) => console.log(`   [${idx}]: ${s.label} (${s.blocks.length} blocks)`));

assert.equal(sections07.length, 6, '6 canonical H2 sections');
assert.equal(sections07[0].label, 'Overview');
assert.equal(sections07[1].label, 'The Average Is Not the Offer');
assert.equal(sections07[2].label, 'Inventory Is Moving, Not Just Sitting');
assert.equal(sections07[3].label, 'Incentive Type Matters Too');
assert.equal(sections07[4].label, 'Why Two Sources Can Show Different Percentages');
assert.equal(sections07[5].label, 'What to Research on the Exact Vehicle');

const h3Blocks = sections07.flatMap((s) => s.blocks).filter((b) => b.kind === 'heading');
assert.equal(h3Blocks.length, 1, '1 Heading 3 block inside parent section');
assert.equal(h3Blocks[0].text, 'Averages flatten the vehicle you are actually shopping');

const links07 = sections07.flatMap((s) => s.blocks).flatMap((b) => b.text_runs || []).filter((r) => r.href);
console.log('Test 07 inline body links count:', links07.length);
links07.forEach((l) => console.log(`   -> ${l.text} => ${l.href}`));
assert.equal(links07.length, 4, '4 inline body links preserved');

const rawPlainText = `AUTOUNITE BLOG OS ARTICLE
ADMIN METADATA
Field	Value
H1	6.4% Is the Average. Your Vehicle May Be in a Different Market.
SEO title	Car Incentives Vary by Segment: July 2026 | AutoUnite
Slug	64-percent-average-your-vehicle-different-market
Meta	July incentives averaged 6.4% of ATP, while pickups reached 8.6%, compact SUVs 7.8% and midsize SUVs 6.8%. See why averages can mislead.
Category	Market
Content type	Insight
Author	Kenny Smith
Tags	incentives, new car prices, inventory, days supply, market
Excerpt / Deck	July 2026 incentive spending averaged 6.4% of ATP. That industry number hides meaningful differences by segment, inventory position, program type and eligibility.
Read time	7 min
Hero file	Hero.png
Hero alt	Dark data-driven market graphic showing July 2026 incentive percentages, with 6.4 percent industry average beside higher full-size pickup, compact SUV and midsize SUV figures.
Social image file	Blog Social Image.png
Social image alt	Social market graphic comparing July 2026 industry incentive spending with pickup and SUV segment incentive percentages.
Original platform	AutoUnite Native
Original URL	Pending
Original publish date	Pending
Updated	Pending
Last verified	2026-08-28
Lineage verification	Pending
LinkedIn URL	Pending
Medium URL	Pending
Substack URL	Pending
Tool handoff	Research

DECIDE FIRST
Field	Guidance
What Matters	The industry incentive average is market context, not a quote for the exact vehicle you want. Segment, brand, model, region, eligibility and program type can move the real offer materially.
Watch This	Do not compare percentages from different sources without checking the denominator and measurement period. An incentive percentage of ATP is not automatically the same measure as a forecast expressed against MSRP.
Your Next Move	Identify the exact vehicle and segment, check current local inventory, verify the manufacturer program and eligibility, then compare the actual cash or APR choices available today.

ARTICLE BODY
The headline number for July was 6.4%.
Kelley Blue Book reported that average new-vehicle incentive spending fell to 6.4% of average transaction price. If you stop there, you can walk into the market expecting every vehicle to behave like the average.
It does not.
Overview
The July market had healthier inventory than the shortage years, but the numbers were moving in different directions at the same time. Cox Automotive reported 2.73 million new vehicles available at the start of August and 75 days of supply. Inventory fell 3.5% from the prior month as July sales increased 8.5% from June.
July 2026 metric	Value	What it tells you
Available new vehicles	2.73M	National choice is broad, but supply is not equal by brand or model.
Days of supply	75	Inventory relative to the recent selling pace, not VIN age.
Average transaction price	$49,855	National sales-weighted average paid for new vehicles.
Average incentive spending	6.4% of ATP	Industry average, not a guaranteed discount.

The Cox Automotive July inventory report and Kelley Blue Book July pricing report are talking about the same national market from different angles.
The Average Is Not the Offer
The industry average was 6.4% of ATP, but KBB reported higher incentive spending in several major segments.
Segment	July incentive spending	Difference vs. 6.4% industry average
Full-size pickups	8.6% of ATP	+2.2 percentage points
Compact SUVs	7.8% of ATP	+1.4 percentage points
Midsize SUVs	6.8% of ATP	+0.4 percentage points

That does not mean every full-size pickup had 8.6% off the window sticker. It means the segment-level average incentive spending was higher than the overall industry average.
Averages flatten the vehicle you are actually shopping
One brand may have tight supply. Another may be carrying more inventory. One model may have cash support. Another may have a subsidized APR. A loyalty or conquest program may apply to one household and not another.
Cox specifically noted that Toyota, Lexus and Honda remained among the tightest inventory positions while Stellantis continued working through comparatively elevated supply. That is a clear reminder that a national average cannot price one rooftop or one VIN.
Inventory Is Moving, Not Just Sitting
The July inventory number also needs context. Inventory was down 3.5% month over month while sales were up 8.5% from June. Days of supply moved from a revised 82 days at the beginning of July to 75 days entering August.
Movement	July result	Interpretation
Inventory	-3.5% month over month	Available units fell.
Sales	+8.5% from June	Demand absorbed inventory faster.
Days of supply	82 to 75	Supply tightened relative to sales pace.

Cox's market snapshot defines days of supply using the daily sales rate for the most recent 30-day period. That is useful market context, but it still does not tell you whether the exact VIN on the ground is two days old or 160 days old.
Incentive Type Matters Too
A percentage average also hides the form of the incentive.
Customer cash: a direct reduction when the shopper and vehicle qualify.
Loyalty or conquest: eligibility tied to current or prior ownership conditions.
Promotional APR: lower borrowing cost that may replace or interact with a cash offer.
Model-specific support: a program tied to a particular vehicle, trim, model year or region.
J.D. Power's July 2026 deals roundup documented that more than half of new-car brands were advertising 0% financing on at least one model in July, while cash, loyalty and conquest offers varied by brand and model. The point is the structure, not a promise that any July offer is still available today.
Why Two Sources Can Show Different Percentages
Market research can use different denominators, timing windows and forecast versus completed transaction data. That makes two percentages look contradictory when they are measuring different things.
For importer testing, this section matters because the Blog renderer needs to preserve the source label, date and surrounding qualification. The system should not flatten every number into one unlabeled statistic.
What to Research on the Exact Vehicle
Confirm the exact model, trim, powertrain and model year.
Check how many real comparables exist locally and how long the exact VIN has been available.
Verify the manufacturer program for the shopper's region and eligibility on the day of the deal.
Compare cash and promotional-APR paths using the full transaction, not only the headline discount.
Use Research when the answer depends on current market conditions rather than carrying July averages forward as if they never change.
The average is useful. The exact vehicle is where the decision happens.
ADMIN SOURCE RECORDS - PARSE AS SOURCE DATA, NOT ARTICLE BODY
Publisher	Reader-facing label	Full URL	Verified date
Cox Automotive	July New-Vehicle Inventory Declines as Stronger Sales Outpace Replenishment	https://www.coxautoinc.com/insights/july-2026-new-vehicle-inventory/	2026-08-28
Kelley Blue Book	New-Vehicle Prices Trend Higher in July as Incentives Decline and Sales Pace Slows	https://mediaroom.kbb.com/2026-08-11-Kelley-Blue-Book-Report-New-Vehicle-Prices-Trend-Higher-in-July-as-Incentives-Decline-and-Sales-Pace-Slows	2026-08-28
Cox Automotive	Auto Market Snapshot	https://www.coxautoinc.com/market-snapshot/	2026-08-28
J.D. Power	Best Car Deals in July 2026	https://www.jdpower.com/cars/shopping-guides/best-car-deals-in-july-2026	2026-08-28

Method note: Market figures are time-sensitive. This article uses July 2026 national data verified August 28, 2026. Segment averages are not guaranteed discounts on any specific vehicle. Current local programs must be re-verified before a shopper acts.
RELATED CONTENT - PARSE AS RELATION DATA, NOT ARTICLE BODY
Title	Article slug
Inventory Is Back. That Doesn’t Mean Every Deal Is Better.	inventory-is-back-that-doesnt-mean-every-deal-is-better
How a $32,500 Car Deal Became $39,800	how-a-32500-car-deal-became-39800

END OF BLOG ARTICLE PACKAGE`;

const plainPkg = parsePastedPackage(rawPlainText);
const plainSections = htmlToSections(plainPkg.html);
console.log('Plain text paste parsed sections count:', plainSections.length);
plainSections.forEach((s, idx) => console.log(`   [${idx}]: ${s.label} (${s.blocks.length} blocks)`));
assert.equal(plainSections.length, 6, 'Plain text paste yields all 6 H2 sections');

const relatedPkg = parsePastedPackage(rawPlainText);
console.log('Related parsed from package:', relatedPkg.related);
assert.equal(relatedPkg.related.length, 2, 'Package related content has 2 rows');
assert.equal(relatedPkg.related[0].slug, 'inventory-is-back-that-doesnt-mean-every-deal-is-better');
assert.equal(relatedPkg.related[1].slug, 'how-a-32500-car-deal-became-39800');

// Test markdown bold and italic parsing
const sampleMd = 'The headline number for July was **6.4%** and *market context*.';
const mdPkg = parsePastedPackage(`ARTICLE BODY\n${sampleMd}\nEND OF BLOG ARTICLE PACKAGE`);
const mdSections = htmlToSections(mdPkg.html);
const pRuns = mdSections[0]?.blocks[0]?.text_runs || [];
console.log('Markdown runs parsed:', pRuns);
assert.ok(pRuns.some((r) => r.text === '6.4%' && r.bold), 'Markdown bold parsed to bold run');
assert.ok(pRuns.some((r) => r.text === 'market context' && r.italic), 'Markdown italic parsed to italic run');

console.log('blogEditorDoc.test.mjs — all OK');
