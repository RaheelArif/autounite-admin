# AutoUnite Blog OS — Universal Writer Template v1.0
*Canonical authoring format for Word, Google Docs and structured text*

> **Kenny:** The story itself can be any length or Blog type. Please keep this outer structure consistent so Admin OS can import metadata, Decide First, article sections, links, tables, sources and related content without manual restructuring.

This is the canonical Blog OS authoring format, verified against the current importer test set for DOCX, Google Docs and structured text/Markdown. Following this structure is the verified canonical path for one-click import into **Admin OS > Content**.

---

## 1. Quick Copy-Paste Universal Template

Copy everything in the box below into your Google Doc, Word Document (.docx), or Plain-Text draft as your starter blueprint:

```text
AUTOUNITE BLOG OS ARTICLE
============================================================

ADMIN METADATA

Field | Value
------------------------------------------------------------
H1 | [Your Compelling Full Article Headline Here]
SEO title | [Search Engine Title | AutoUnite]
Slug | [kebab-case-url-slug]
Meta | [150-160 character concise search description]
Category | [Buying | Money | Market | Ownership]
Content type | [Article | Guide | Explainer | Newsletter | Insight]
Author | Kenny Smith
Tags | [tag 1, tag 2, tag 3, tag 4, tag 5]
Excerpt / Deck | [1-2 sentence executive summary of the story/decision]
Read time | [e.g. 5 min]
Hero file | [Hero.png | None]
Hero alt | [Required only when Hero file is supplied]
Social image file | [Blog Social Image.png | None]
Social image alt | [Required only when Social image file is supplied]
Original platform | [AutoUnite Native | LinkedIn | Pending]
Original URL | [Pending or Full HTTPS URL]
Original publish date | [Pending or YYYY-MM-DD]
Updated | [Pending or YYYY-MM-DD]
Last verified | [Pending or YYYY-MM-DD]
LinkedIn URL | [Pending or Full URL]
Medium URL | [Pending or Full URL]
Substack URL | [Pending or Full URL]
Tool handoff | [None | Research | Calculator OS | Cars Near Me]

DECIDE FIRST

Field | Guidance
------------------------------------------------------------
What Matters | [2-3 sentences identifying the core reality, stakes, or decision upfront]
Watch This | [The main trap, hidden paperwork detail, calculation catch, or misconception]
Your Next Move | [Actionable advice the reader should execute before signing or deciding]


ARTICLE BODY
============================================================

[Opening direct-answer or narrative context paragraph introducing the dilemma.]

[Optional second context paragraph before the first section.]


Heading 2: Overview

[Opening overview paragraphs discussing the dilemma, numbers, and background.]

Quote style:
[Important customer takeaway, rule of thumb, or key quote formatted as a pull quote.]


Heading 2: [First Major Decision Section Name]

[Body copy discussing paperwork, facts, or numbers.]

Things worth checking include:

• Bullet point 1 with details
• Bullet point 2 with key takeaways
• Bullet point 3 with **bold emphasis words**

Heading 3: [In-Article Subheading Here]

[Subheading copy explaining a specific nuance. This does not clutter the table of contents.]

[Example of inline link: Readers can review federal rules directly at the FTC Guide (https://www.ftc.gov/business-guidance/resources/dealers-guide-used-car-rule).]


Heading 2: [Second Major Decision Section Name]

[Body copy introducing a comparison or breakdown.]

| What to check | Why it matters | What to ask |
| Selling price | Base agreed vehicle figure | Is this the final agreed vehicle price? |
| Dealer fees | Processing & documentation costs | Which dealer fees are non-negotiable? |
| Total OTD | Complete amount required to purchase | What is the final out-the-door number? |


Heading 2: [Third Major Decision Section Name]

[Body paragraphs...]


Heading 2: What to Decide Before [Signing / Buying / Delivery]

[Actionable decision checklist and final verification before completing transaction.]

1. First decision question to confirm
2. Second decision question to confirm
3. Third decision question to confirm

Heading 3: The Bottom Line

[Concluding synthesis and final summary of the lesson.]

Decide first.
Submit later.


ADMIN SOURCE RECORDS — PARSE AS SOURCE DATA, NOT ARTICLE BODY
============================================================

Publisher | Reader-facing label | Full URL | Verified date
------------------------------------------------------------
Federal Trade Commission | Buying a Used Car From a Dealer | https://consumer.ftc.gov/articles/buying-used-car-dealer | Pending
Consumer Financial Protection Bureau | Auto Loan Tools & Resources | https://www.consumerfinance.gov/consumer-tools/auto-loans/ | Pending

Method note:
[Contextual explanation clarifying that technical documents, bulletins, or regulations are general context, not individual vehicle diagnosis or legal advice.]


RELATED CONTENT — PARSE AS RELATION DATA, NOT ARTICLE BODY
============================================================

Title | Article slug
------------------------------------------------------------
A 19.42% Car Loan. And It Was a Good Approval. | 19-42-used-car-apr-good-approval
What to Check Before You Say Yes to a Car Deal | what-to-check-before-you-say-yes-to-a-car-deal


END OF BLOG ARTICLE PACKAGE
```

---

## 2. Complete Field Reference & Auto-Populate Rules

Every field in the `ADMIN METADATA` table maps directly to Admin OS form inputs:

| Field Name | Accepted Values / Format | Description | Required? |
| :--- | :--- | :--- | :--- |
| **H1** | Text | The main headline displayed on the article page and card. | **Yes** |
| **SEO title** | `[Title] \| AutoUnite` | Custom `<title>` meta tag for search engines. | Optional |
| **Slug** | `kebab-case-slug` | Clean URL path segment (e.g. `lower-car-payment-total-cost`). | **Yes** |
| **Meta** | 150–160 chars | Meta description used by Google and social share cards. | Optional |
| **Category** | `Buying`, `Money`, `Market`, `Ownership` | Primary category. AutoUnite uses 4 locked categories. | **Compulsory** |
| **Content type** | `Article`, `Guide`, `Explainer`, `Newsletter`, `Insight` | Story format type. Locked to canonical 5 types. | **Yes** |
| **Author** | `Kenny Smith` | Author profile assigned to the post. | **Yes** |
| **Tags** | Comma-separated | 3 to 6 search and filtering tags. | **Yes** |
| **Excerpt / Deck** | 1–2 sentences | Subtitle summary appearing under the headline. | Optional |
| **Read time** | `5 min` / `8 min` | Estimated reading duration in minutes. | Auto / Recalculated |
| **Hero file** | `Hero.png` or `None` | Topic-relevant hero image filename. | Optional |
| **Hero alt** | Descriptive sentence | Accessibility & SEO alt text. | **Required when Hero exists** |
| **Social image file** | `Blog Social Image.png` or `None` | Social / OG share image filename. | Optional |
| **Social image alt** | Descriptive sentence | Accessibility alt text for Twitter/LinkedIn share cards. | **Required when Social image file exists** |
| **Original platform** | `AutoUnite Native`, `LinkedIn`, `Medium`, `Substack` | Lineage tracking. Set to `AutoUnite Native` for original pieces. | Optional |
| **Tool handoff** | `None`, `Research`, `Calculator OS`, `Cars Near Me` | Relevant interactive tool destination. | Optional |
| **Lineage dates / URLs**| `Pending` or valid URL / date | Origin verification for repurposed content. | Optional |

---

## 3. Formatting & Content Rules

### A. Headings & On This Page (TOC) Navigation
The Blog OS automatically builds the sticky **On This Page (TOC)** sidebar rail from your headings:
- **`H1` / Article Headline:** Appears only once at the very top.
- **`H2` / `Heading 2: [Title]`:** Becomes an **On This Page (TOC) Rail Anchor**. Target **5 to 8** main decision sections per article. Keep them concise (e.g. `Overview`, `Start With the Amount Financed`, `What to Decide Before Signing`).
- **`H3` / `Heading 3: [Title]`:** In-article subheadings. These provide internal structure inside a section **without** cluttering the TOC rail.

### B. Adding Links (Inline Links)
You can include links in any paragraph, list, or table.
1. **In Google Docs / Word:** Select the anchor words, press `Ctrl+K` (or `Cmd+K`), and insert the full HTTPS URL (e.g. `https://www.consumerfinance.gov/...`).
2. **In Markdown / Plain Text:** Write `[Anchor Words](https://full-url.com)` or `Anchor Words (https://full-url.com)`.
3. **Internal Links:** Use `/blog/[slug]` for Blog articles. For AutoUnite tools or OS handoffs, use only the approved current route from the AutoUnite route registry; do not invent or hard-code an unverified tool route.

### C. Formatting Quotes (Pull Quotes)
- In Word / Google Docs: Use the native **Quote / Blockquote** paragraph style.
- In Plain Text / Markdown: Start the line with `Quote style:` or `>` on a dedicated line.

### D. Adding Tables
- In Word / Google Docs: Insert a standard table (`Table > Insert Table`).
- In Plain Text / Markdown: Use standard pipe syntax (`| Column 1 | Column 2 | Column 3 |`).

### E. Bullet & Numbered Lists
- Use standard bullet points (`•`, `*`, `-`) or numbered lists (`1.`, `2.`, `3.`).
- You can make the lead words **bold** for scannability.

---

## 4. Structured Modules

### 1. `DECIDE FIRST` (3-Card Decision Bar)
Appears directly above the Hero image for immediate shopper value. Provide 3 rows in the table:
1. **What Matters:** The core decision reality or financial risk.
2. **Watch This:** The catch, hidden calculation, or dealer paperwork detail.
3. **Your Next Move:** Specific action the reader must take before signing.

### 2. `ADMIN SOURCE RECORDS` (Trust & Transparency Module)
Appears at the footer of the article. List each credible external authority:
- **Publisher:** (e.g. `Federal Trade Commission`, `CFPB`, `NHTSA`)
- **Reader-facing label:** Descriptive title of the referenced guide or law.
- **Full URL:** Valid `https://...` link.
- **Verified date:** `YYYY-MM-DD` or `Pending`. Pending is allowed during Draft import. A required source must satisfy the Blog OS source-verification/publish gate before the article can become public.
- **Method note:** (Optional) Contextual disclaimer clarifying that data/bulletins are illustrative.

### 3. `RELATED CONTENT` (Recommended Next Reads)
List 1 to 2 related AutoUnite articles by title and slug. Related content displays only when the target article is Published + Public + Approved. The public resolver rechecks eligibility before rendering.

---

## 5. Media & Image Architecture

The Blog OS handles hero media with clean fallback rules:
- **Approved Topic-Relevant Hero supplied:** Renders priority 16:9 hero photo.
- **No Hero supplied (`None`):** Hero region collapses cleanly with no empty frame or broken placeholder. Runtime CLS remains part of technical verification.

1. **Editorial Hero Image (`Hero.png`):**
   - **Ratio:** 16:9 widescreen (1920×1080 or 1280×720).
   - **Format:** High-resolution JPG or PNG.
   - **Alt Text:** Required whenever a hero image is provided.
2. **Social / OG Image (`Blog Social Image.png`):**
   - **Ratio:** 1.91:1 (1200×630).
   - **Format:** JPG or PNG. Used for Facebook, LinkedIn, Twitter, and iMessage previews.
