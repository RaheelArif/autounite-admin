# Admin Dashboard API – Registered Users & Stats

Base URL: `https://autounite-api.onrender.com/api/v1` (or your API base).

All endpoints below require **admin** access: send a valid JWT in the header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 1. List registered users (for admin panel)

Get paginated list of all users who have registered (with filters and sort).

**Request**

- **Method:** `GET`
- **Path:** `/api/v1/users`
- **Headers:** `Authorization: Bearer <token>` (admin JWT)
- **Query parameters:**

| Query       | Type   | Default   | Description                                      |
|------------|--------|-----------|--------------------------------------------------|
| `page`     | number | 1         | Page number                                      |
| `limit`    | number | 10        | Items per page (1–100)                           |
| `search`   | string | —         | Search in email, firstName, lastName             |
| `role`     | string | —         | Filter: `user` or `admin`                        |
| `isActive` | string | —         | Filter: `true` or `false`                        |
| `isVerified` | string | —       | Filter: `true` (verified) or `false` (not verified) |
| `sortBy`   | string | createdAt | Sort field: createdAt, updatedAt, email, firstName, lastName, role, isVerified |
| `sortOrder`| string | desc      | `asc` or `desc`                                  |

**Example**

```
GET /api/v1/users?page=1&limit=50&sortBy=createdAt&sortOrder=desc
GET /api/v1/users?page=1&limit=20&isVerified=false
GET /api/v1/users?search=john&role=user
```

**Success (200)**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "email": "user@example.com",
        "firstName": "Jane",
        "lastName": "Doe",
        "role": "user",
        "isActive": true,
        "isVerified": true,
        "createdAt": "2025-02-03T12:00:00.000Z",
        "updatedAt": "2025-02-03T12:05:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 48,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "search": null,
      "role": null,
      "isActive": null,
      "isVerified": null,
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

**Errors**

| Status | Meaning |
|--------|--------|
| 400 | Invalid page/limit or query params |
| 401 | Missing or invalid token |
| 403 | Not admin |
| 500 | Server error |

---

## 2. Registered users stats (for dashboard)

Get counts for the admin dashboard: total users, verified, unverified, today, this week.

**Request**

- **Method:** `GET`
- **Path:** `/api/v1/users/stats`
- **Headers:** `Authorization: Bearer <token>` (admin JWT)

**Example**

```
GET /api/v1/users/stats
```

**Success (200)**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 120,
      "verifiedUsers": 95,
      "unverifiedUsers": 25,
      "registeredToday": 3,
      "registeredThisWeek": 12
    }
  }
}
```

| Field                | Description                                      |
|----------------------|--------------------------------------------------|
| `totalUsers`         | All registered users                             |
| `verifiedUsers`      | Users who verified their email                    |
| `unverifiedUsers`    | Users who registered but did not verify email    |
| `registeredToday`    | Users who registered today (UTC day)              |
| `registeredThisWeek` | Users who registered since start of week (Monday UTC) |

**Errors**

| Status | Meaning |
|--------|--------|
| 401 | Missing or invalid token |
| 403 | Not admin |
| 500 | Server error |

---

## 3. Get a single user (admin)

**Request**

- **Method:** `GET`
- **Path:** `/api/v1/users/:id`
- **Headers:** `Authorization: Bearer <token>` (admin JWT)

**Success (200)**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "isVerified": true,
      "createdAt": "2025-02-03T12:00:00.000Z",
      "updatedAt": "2025-02-03T12:05:00.000Z"
    }
  }
}
```

---

## 4. User requests (waitlist / demo requests)

Existing endpoints you can use alongside the users dashboard:

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/user-requests?page=1&limit=50&sortBy=createdAt&sortOrder=desc` | List user requests (waitlist/demo signups). Requires auth + admin. |
| `GET /api/v1/user-requests/stats` | Stats for user requests (total, pending, contacted, registered, ignored, recent, by source). Requires auth + admin. |

---

## 5. Dashboard page usage (frontend)

**Dashboard overview**

1. Call `GET /api/v1/users/stats` once to show:
   - Total registered users
   - Verified vs unverified
   - Registered today
   - Registered this week
2. Optionally call `GET /api/v1/user-requests/stats` for waitlist/demo stats on the same page.

**Registered users table**

1. Call `GET /api/v1/users?page=1&limit=50&sortBy=createdAt&sortOrder=desc` for the first page.
2. Use `pagination.currentPage`, `pagination.totalPages`, `pagination.totalUsers` for UI.
3. Filter by verification: `?isVerified=false` to show only “did not verify email”.
4. Use `search`, `role`, `isActive` as needed.

**Example dashboard layout**

- Card: Total users → `stats.totalUsers`
- Card: Verified → `stats.verifiedUsers`
- Card: Not verified → `stats.unverifiedUsers`
- Card: Registered today → `stats.registeredToday`
- Card: This week → `stats.registeredThisWeek`
- Table: List from `GET /api/v1/users` with columns email, name, role, isVerified, createdAt.

All dates (e.g. “today”, “this week”) are in **UTC**.
