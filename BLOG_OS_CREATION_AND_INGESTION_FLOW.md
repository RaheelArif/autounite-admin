# AutoUnite Blog OS — Complete Ingestion, Publishing & Architecture Flow

## 1. Executive Summary
AutoUnite Blog OS implements an automated, structured content pipeline that allows writers to author in **Microsoft Word (.docx)**, **Google Docs**, or standard rich text without manual reformatting. When article content is pasted into **Admin OS > Content**, the system automatically extracts metadata, separates structured modules (*Decide First*, *Sources*), preserves inline links/formatting, and builds the canonical *On This Page (TOC)* navigation while enforcing strict publication safety gates.

---

## 2. End-to-End Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CONTENT AUTHORING                                        │
│    Writer drafts in Word (.docx) or Google Docs with:       │
│    - Title / Subtitle Deck                                  │
│    - Decide First (What Matters / Watch This / Next Move)   │
│    - Semantic H2 Sections (TOC) & H3 Subheadings            │
│    - Inline Links, Bold, Italic & Bullet Lists              │
│    - Sources & Citations list at the bottom                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ (Cmd+A -> Copy all)
┌─────────────────────────────────────────────────────────────┐
│ 2. ADMIN OS INGESTION                                       │
│    Editor opens Admin OS > Content > "+ Add Article"        │
│    Pastes full document into the "Body" Editor Box          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ (Automatic Parser Pipeline)
┌─────────────────────────────────────────────────────────────┐
│ 3. AUTOMATED EXTRACTION & MODULE MAPPING                    │
│    ├─ Title & Deck    ──► Auto-fills Title, Candidate Slug  │
│    │                      & Summary (QA oracle compares     │
│    │                      against Expected Admin Values)    │
│    ├─ Decide First    ──► Extracted to Structured JSON      │
│    ├─ H2 Headings     ──► Mapped to On This Page (TOC)      │
│    ├─ Inline Links    ──► Preserved in text_runs / item_runs│
│    ├─ Quotes/Asides   ──► Semantic Quote/blockquote style   │
│    ├─ Sources List    ──► Extracted to Trust Sources Module │
│    └─ Safety Lock     ──► Set to Draft + Private + noindex  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. MEDIA & EDITORIAL ENRICHMENT                             │
│    - Select approved 16:9 Editorial Hero image + Alt Text   │
│    - Select approved 1200x630 Social / OG image             │
│    - Assign Category (Buying / Money / Market / Ownership)  │
│    - Resolve to verified Kenny Smith author entity          │
│    - Set Lineage state (Pending lineage hidden publicly)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. COMPLETE LIFECYCLE & MULTI-STAGE APPROVAL                │
│    Draft ──► SEO Setup ──► Review ──► Approved ──►          │
│    Scheduled / Published ──► Updated ──►                    │
│    Unpublished ──► Archived                                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. PRODUCTION SSR, ELIGIBILITY & CWV PERFORMANCE            │
│    - Public Eligibility: Published + Public + Approved      │
│    - Search Indexing Gate: Evaluated independently          │
│    - Core Web Vitals Targets: LCP ≤2.5s, INP ≤200ms,        │
│      CLS ≤0.10 with preloaded LCP hero                      │
│    - Self-canonical URL derived from route authority        │
│    - BlogPosting & BreadcrumbList JSON-LD structured data   │
│    - Synchronized desktop right-rail (240–260px) / compact  │
│      mobile On This Page control                            │
│    - Related Reads: Evaluated against Published + Public    │
│      + Approved eligibility for target article              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Supported Package Formats

The ingestion engine supports both established AutoUnite authoring formats:

### Format A: Full Package Table (e.g., Test 01 Benchmark)
- Features an upfront metadata table (*H1, Meta Description, Category, Tags, Author, Lineage, Hero Alt*).
- Explicit *Decide First* table.
- Dedicated *Admin Source Records* table.
- **Behavior:** The parser directly maps each table key into Admin OS form fields and lifts modules out of the public body.

### Format B: Pure Semantic Long-Form (e.g., Test 02 Benchmark)
- Clean document layout starting with Title, Subtitle, *Decide First* list, and standard H2/H3 article prose.
- Sources placed at the end under *Sources & Methodology*.
- **Behavior:** The parser automatically derives Title, Summary, and candidate Slug; extracts *Decide First* and *Sources*; maps all H2s into canonical *On This Page* anchors; and retains H3s inside the body. For QA verification, final slug is compared against the expected locked slug (`90000-miles-eight-months-later-needed-transmission`) and canonical is derived strictly from route authority.

---

## 4. Automatic Extraction & Normalization Breakdown

| Article Component | Word / Source Pattern | Admin OS Extracted Field | Public Render Target |
|---|---|---|---|
| **Title** | `<h1>` or metadata table row | `formData.title` | `<title>` + Page H1 |
| **Slug** | Candidate derived or exact QA slug | `formData.slug` | Route `/blog/[slug]` (canonical derived from route) |
| **Deck / Subtitle** | Lead paragraph under Title | `formData.summary` | Article Deck & Meta Description |
| **Decide First** | *What Matters / Watch This / Your Next Move* | `formData.decide_first` | Structured `BlogDecideFirst` module (placed before Hero) |
| **On This Page (TOC)** | Semantic `<h2>` headings | `sections[].label` | Synchronized Desktop Rail (240–260px) / Mobile TOC |
| **Subheadings** | Semantic `<h3>` / `<h4>` headings | `blocks[kind='heading']` | Sub-sections within the article body |
| **Inline Links** | `<a href="...">anchor text</a>` | `text_runs[].href` | Crawlable anchor tags with anchor text |
| **Bullet Lists** | `<ul><li>` with bold lead-ins | `item_runs` | Rich styled lists with preserved bold tags |
| **Pull Quotes** | Semantic Quote / `<blockquote>` style | `blocks[kind='quote']` | Stylized editorial `<blockquote>` |
| **Sources & Citations** | *Sources & Methodology* / TSB links | `formData.sources[]` | Canonical `BlogSources` module + Trust badge count (7/7) |
| **Related Reads** | *Related / Next Decision* footer | Internal relation lookup | Rendered via `BlogRelated` (only if target is **Published + Public + Approved**) |

---

## 5. Trust, Privacy & Safety Safeguards

1. **Initial Draft Lock:** Every newly imported article defaults to **Draft + Private + noindex**. It is excluded from public feeds, search indexing, sitemaps, and Ask corpus until approved.
2. **Lineage Privacy:** When historical origin (e.g., LinkedIn Newsletter) is marked **Pending**, platform names, external URLs, and past dates remain completely hidden from the public page. AutoUnite is presented as canonical.
3. **Cross-Article Dependency Gate:** Related article recommendations will only render on the public site if the referenced article is **Published + Public + Approved**. Public resolver independently verifies this gate.
4. **Media Validation:** Unapproved or placeholder media assets are blocked from being published. If no hero is selected, the media region collapses cleanly without placeholders.
5. **Subscription Form Isolation:** Decision Guide subscription inputs are strictly isolated from cross-user or authenticated developer emails.

---

## 6. Live SEO, Performance & Structured Data

When an article completes its lifecycle (**Draft → SEO Setup → Review → Approved → Published**):
- **Core Web Vitals:** Production performance targets: **LCP ≤ 2.5s**, **INP ≤ 200ms**, **CLS ≤ 0.10** with preloaded LCP hero image (`fetchPriority="high"`).
- **Public Eligibility & Indexability:** Public eligibility requires `Published + Public + Approved`. Search indexing is governed by a separate environment indexability gate (`ALLOW_INDEXING`).
- **Structured Data:** Automated `BlogPosting` JSON-LD schema with Person author (`Kenny Smith`), Publisher (`AutoUnite`), ISO 8601 timestamps, and high-resolution Open Graph image.
- **Breadcrumb Hierarchy:** `BreadcrumbList` schema connecting `Home > Blog > Ownership > Article`.
- **Indexing Authority:** Automated canonical URL based strictly on route authority (`https://www.autounite.com/blog/[slug]`).
