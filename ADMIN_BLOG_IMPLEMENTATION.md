# Admin Panel – Blog Implementation Guide

> **Target:** autounite-admin.vercel.app  
> **Purpose:** Blog management (Categories, Tags, Articles) ke liye admin UI implement karna

---

## BLOG_BASE_URL – Kahan Use Hota Hai?

| Platform | Use | Required? |
|----------|-----|-----------|
| **Frontend Website** | Sitemap XML ke andar article URLs (SEO) | Haan – `.env` mein add karein |
| **Admin Panel** | Nahi use hota | Nahi |

**Conclusion:** `BLOG_BASE_URL` sirf frontend / backend sitemap ke liye hai. Admin panel isse use nahi karta.

---

# Admin Panel Structure

## 1. Sidebar

Sidebar mein ek naya item add karein:

```
📁 Dashboard
📁 Users
📁 Blog          ← NEW
   └── /admin/blog  (ya jo route ho)
```

**Route:** `/blog` ya `/admin/blog` (admin routing ke hisaab se)

---

## 2. Blog Page Layout – Tabs

Blog page par **3 tabs** honge. Active tab ke hisaab se us entity ka CRUD dikhega.

```
┌─────────────────────────────────────────────────────────────┐
│  Blog                                                       │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│  Articles   │  Categories │  Tags       │                   │
│  (active)   │             │             │                   │
├─────────────┴─────────────┴─────────────┴───────────────────┤
│                                                             │
│  [Active tab ka content – table + CRUD actions]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tab Order (Suggested)

1. **Articles** – Main content, sabse zyada use
2. **Categories** – Articles ke topics (Buying Guide, Financing, etc.)
3. **Tags** – Articles ke tags (comparison, trim, etc.)

---

## 3. Auth (Har API Call Pe)

Sab blog admin APIs ko ye headers chahiye:

```
x-api-key: <INTERNAL_API_KEY>
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

- **Base URL:** `https://autounite-api.onrender.com` (ya jo API URL ho)
- **Prefix:** `/api/v1/admin/blog`

---

# Tab 1: Categories

## UI Flow

- **List view:** Table – columns: Name, Slug, Description, Sort Order, Active, Actions (Edit, Delete)
- **Create:** "Add Category" button → form/modal
- **Edit:** Row pe Edit → form/modal with prefilled data
- **Delete:** Soft delete (isActive = false)

## APIs

### List Categories

```
GET /api/v1/admin/blog/categories?page=1&limit=20&isActive=true
```

**Query params:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| page | number | 1 | |
| limit | number | 20 | Max 100 |
| isActive | boolean | — | `true` / `false` filter |

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "...",
        "name": "Buying Guide",
        "slug": "buying-guide",
        "description": "Articles about buying cars",
        "sortOrder": 0,
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "total": 25,
      "limit": 20
    }
  }
}
```

### Create Category

```
POST /api/v1/admin/blog/categories
```

**Body:**
```json
{
  "name": "Buying Guide",
  "slug": "buying-guide",
  "description": "Articles about buying cars",
  "sortOrder": 0
}
```

| Field | Required | Notes |
|-------|----------|-------|
| name | ✅ | |
| slug | ✅ | URL-safe, unique |
| description | | |
| sortOrder | | Number, default 0 |

### Get One Category

```
GET /api/v1/admin/blog/categories/:id
```

`:id` = MongoDB `_id` ya `slug`

### Update Category

```
PUT /api/v1/admin/blog/categories/:id
```

**Body:** Sirf jo fields update karni hon (partial update allowed)
```json
{
  "name": "Buying Guide (Updated)",
  "description": "New description"
}
```

### Delete Category (Soft)

```
DELETE /api/v1/admin/blog/categories/:id
```

Sets `isActive: false`. Hard delete nahi.

---

# Tab 2: Tags

## UI Flow

- **List view:** Table – Name, Slug, Active, Actions
- **Create / Edit / Delete:** Categories jaisa

## APIs

### List Tags

```
GET /api/v1/admin/blog/tags?page=1&limit=20&isActive=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "_id": "...",
        "name": "comparison",
        "slug": "comparison",
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": { "currentPage": 1, "totalPages": 1, "total": 5, "limit": 20 }
  }
}
```

### Create Tag

```
POST /api/v1/admin/blog/tags
```

**Body:**
```json
{
  "name": "comparison",
  "slug": "comparison"
}
```

### Get One Tag

```
GET /api/v1/admin/blog/tags/:id
```

### Update Tag

```
PUT /api/v1/admin/blog/tags/:id
```

### Delete Tag (Soft)

```
DELETE /api/v1/admin/blog/tags/:id
```

---

# Tab 3: Articles

## UI Flow

- **List view:** Table – Title, Slug, Type, Status, Category, Updated, Actions (Edit, Delete, Publish/Unpublish)
- **Create:** "Add Article" → full form (multiple sections possible)
- **Edit:** Same form, prefilled
- **Delete:** Hard delete
- **Publish / Unpublish:** Quick action button

## Article Type Options

| Value | Label |
|-------|-------|
| guide | Guide |
| comparison | Comparison |
| explainer | Explainer |
| checklist | Checklist |
| news_brief | News Brief |
| opinion | Opinion |

## Reading Level Options

| Value | Label |
|-------|-------|
| beginner | Beginner |
| intermediate | Intermediate |
| advanced | Advanced |

## APIs

### List Articles

```
GET /api/v1/admin/blog/articles?page=1&limit=20&status=published&type=guide&categorySlug=buying-guide&search=trim
```

**Query params:**

| Param | Type | Notes |
|-------|------|-------|
| page | number | Default 1 |
| limit | number | Default 20, max 100 |
| status | string | `draft` \| `published` |
| type | string | guide, comparison, etc. |
| categorySlug | string | Filter by category |
| search | string | Search in title, slug, summary |

**Response:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "_id": "...",
        "article_id": "art_2026_000001",
        "slug": "how-to-compare-trims",
        "title": "How to compare trims",
        "summary": "...",
        "type": "guide",
        "tags": ["comparison", "trim"],
        "categorySlug": "buying-guide",
        "reading_level": "intermediate",
        "hero_image_url": "https://...",
        "status": "published",
        "published_at": "2026-02-15T10:00:00.000Z",
        "read_time_min": 5,
        "seo": { "..." },
        "sections": [ "..." ],
        "related_article_ids": []
      }
    ],
    "pagination": { "currentPage": 1, "totalPages": 3, "total": 45, "limit": 20 }
  }
}
```

### Create Article

```
POST /api/v1/admin/blog/articles
```

**Body (full example):**
```json
{
  "title": "How to compare trims",
  "slug": "how-to-compare-trims",
  "summary": "Short summary for cards.",
  "type": "guide",
  "tags": ["comparison", "trim"],
  "categorySlug": "buying-guide",
  "reading_level": "intermediate",
  "hero_image_url": "https://cdn.example.com/hero.jpg",
  "author_name": "",
  "status": "draft",
  "read_time_min": 5,
  "badge": "",
  "seo": {
    "canonical_url": "https://autounite.com/blog/how-to-compare-trims",
    "meta_title": "How to Compare Car Trims | AutoUnite",
    "meta_description": "Learn how to compare trim levels.",
    "og_image_url": "https://cdn.example.com/og.jpg",
    "robots": "index,follow",
    "schema_org_type": "Article"
  },
  "sections": [
    {
      "section_id": "overview",
      "label": "Overview",
      "blocks": [
        { "kind": "text", "text": "Key points...", "clamp_lines_default": 4 },
        { "kind": "bullets", "bullets": ["Point 1", "Point 2"], "clamp_items_default": 5 }
      ]
    },
    {
      "section_id": "details",
      "label": "Details",
      "blocks": [
        { "kind": "text", "text": "More details...", "clamp_lines_default": 6 }
      ]
    }
  ],
  "related_article_ids": []
}
```

| Field | Required | Notes |
|-------|----------|-------|
| title | ✅ | |
| slug | ✅ | URL-safe, unique |
| summary | ✅ | |
| type | ✅ | guide, comparison, etc. |
| status | | default `draft` |
| tags | | Array of strings |
| categorySlug | | Category ka slug |
| hero_image_url | | **Abhi URL use karein** (upload baad mein) |
| seo.og_image_url | | Same – URL |
| sections | | Array of section objects |
| article_id | | Auto-generated, bhejne ki zaroorat nahi |

**Block kinds:** `text`, `bullets`, `tile_row`, `table`, `link_list`

**Section IDs (fixed):** `overview`, `details`, `examples`, `compare`, `related`, `sources`

### Get One Article

```
GET /api/v1/admin/blog/articles/:id
```

`:id` = `_id`, `article_id`, ya `slug`

### Update Article

```
PUT /api/v1/admin/blog/articles/:id
```

**Body:** Partial – sirf changed fields bhejein.

### Delete Article

```
DELETE /api/v1/admin/blog/articles/:id
```

Hard delete.

### Publish Article

```
PATCH /api/v1/admin/blog/articles/:id/publish
```

Sets `status: "published"` aur `published_at: now`. Body empty.

### Unpublish Article

```
PATCH /api/v1/admin/blog/articles/:id/unpublish
```

Sets `status: "draft"`. Body empty.

---

# Implementation Order (Admin Panel)

| Step | Kaam |
|------|------|
| 1 | Sidebar mein "Blog" link add karein |
| 2 | Blog page route + layout (3 tabs) |
| 3 | **Categories tab** – list, create, edit, delete |
| 4 | **Tags tab** – list, create, edit, delete |
| 5 | **Articles tab** – list, filters, create form (basic) |
| 6 | Articles – sections/blocks editor (optional: simple text first) |
| 7 | Articles – Publish / Unpublish buttons |
| 8 | Articles – full form (SEO, sections, related) |

---

# Quick Reference – All Endpoints

| Method | Endpoint | Tab |
|--------|----------|-----|
| GET | /api/v1/admin/blog/categories | Categories |
| POST | /api/v1/admin/blog/categories | Categories |
| GET | /api/v1/admin/blog/categories/:id | Categories |
| PUT | /api/v1/admin/blog/categories/:id | Categories |
| DELETE | /api/v1/admin/blog/categories/:id | Categories |
| GET | /api/v1/admin/blog/tags | Tags |
| POST | /api/v1/admin/blog/tags | Tags |
| GET | /api/v1/admin/blog/tags/:id | Tags |
| PUT | /api/v1/admin/blog/tags/:id | Tags |
| DELETE | /api/v1/admin/blog/tags/:id | Tags |
| GET | /api/v1/admin/blog/articles | Articles |
| POST | /api/v1/admin/blog/articles | Articles |
| GET | /api/v1/admin/blog/articles/:id | Articles |
| PUT | /api/v1/admin/blog/articles/:id | Articles |
| DELETE | /api/v1/admin/blog/articles/:id | Articles |
| PATCH | /api/v1/admin/blog/articles/:id/publish | Articles |
| PATCH | /api/v1/admin/blog/articles/:id/unpublish | Articles |

---

# Notes

- **Image:** Abhi `hero_image_url` aur `og_image_url` mein **URL paste** karein. Upload API baad mein.
- **Slug:** Name se auto-generate kar sakte ho (lowercase, spaces → hyphens).
- **article_id:** Backend khud `art_YYYY_NNNNNN` generate karta hai.
- **Categories & Tags:** Articles se pehle create karein taake dropdowns mein aa jayein.

---

*Admin panel implement hone ke baad frontend website (autounite.com) ke liye BACKEND_BLOG_OS_APIS.md use karein.*
