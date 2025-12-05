# API Documentation

Complete guide for using the AutoUnite API endpoints.

## Table of Contents

1. [Authentication](#authentication)
2. [Users API (Admin)](#users-api-admin)
3. [User Requests API](#user-requests-api)
4. [Query Management API (Admin)](#query-management-api-admin)

---

## Authentication

All admin endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Register User

**POST** `/api/v1/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### Login

**POST** `/api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

---

## Users API (Admin)

All user management endpoints require admin authentication.

### 1. Get All Users

**GET** `/api/v1/users`

Get a paginated list of all users with filtering options.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 100)
- `search` (optional): Search in email, firstName, lastName (case-insensitive)
- `role` (optional): Filter by role - `"user"` or `"admin"`
- `isActive` (optional): Filter by active status - `"true"` or `"false"`
- `sortBy` (optional): Field to sort by (default: `"createdAt"`)
  - Allowed: `"createdAt"`, `"updatedAt"`, `"email"`, `"firstName"`, `"lastName"`, `"role"`
- `sortOrder` (optional): Sort order - `"asc"` or `"desc"` (default: `"desc"`)

**Example Request:**
```
GET /api/v1/users?page=1&limit=10&search=john&role=user&isActive=true&sortBy=createdAt&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user_id",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "search": "john",
      "role": "user",
      "isActive": true,
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

**Filter Examples:**

1. **Search by name:**
   ```
   GET /api/v1/users?search=john
   ```

2. **Filter by role:**
   ```
   GET /api/v1/users?role=admin
   ```

3. **Filter active users:**
   ```
   GET /api/v1/users?isActive=true
   ```

4. **Combined filters:**
   ```
   GET /api/v1/users?search=john&role=user&isActive=true&page=1&limit=20
   ```

5. **Sort by email:**
   ```
   GET /api/v1/users?sortBy=email&sortOrder=asc
   ```

### 2. Get User by ID

**GET** `/api/v1/users/:id`

Get a specific user's details by ID.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Example Request:**
```
GET /api/v1/users/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## User Requests API

### Public Endpoints (No Authentication Required)

### 1. Submit Demo Request

**POST** `/api/v1/user-requests`

Submit an email request for demo/early access. This endpoint is public and does not require authentication.

**Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "source": "website",
  "metadata": {}
}
```

**Fields:**
- `email` (required): User's email address
- `firstName` (optional): User's first name
- `lastName` (optional): User's last name
- `source` (optional): Source of request (default: `"website"`)
- `metadata` (optional): Additional metadata object

**Response (New Request):**
```json
{
  "success": true,
  "message": "Thank you for your interest! We'll be in touch soon.",
  "data": {
    "request": {
      "id": "request_id",
      "email": "user@example.com",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Response (Duplicate Email):**
```json
{
  "success": true,
  "message": "Thank you! We already have your email. We'll be in touch soon.",
  "data": {
    "request": {
      "id": "existing_request_id",
      "email": "user@example.com",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Example Request:**
```javascript
fetch('http://localhost:3000/api/v1/user-requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe'
  })
})
```

---

### Admin Endpoints (Requires Admin Authentication)

### 1. Get All User Requests

**GET** `/api/v1/user-requests`

Get a paginated list of all user requests with filtering options.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Query Parameters:**
- `status` (optional): Filter by status
  - Values: `"pending"`, `"contacted"`, `"registered"`, `"ignored"`
- `source` (optional): Filter by source (e.g., `"website"`, `"api"`)
- `search` (optional): Search in email, firstName, lastName (case-insensitive)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)
- `sortBy` (optional): Field to sort by (default: `"createdAt"`)
  - Allowed: `"createdAt"`, `"updatedAt"`, `"email"`, `"status"`
- `sortOrder` (optional): Sort order - `"asc"` or `"desc"` (default: `"desc"`)

**Example Request:**
```
GET /api/v1/user-requests?status=pending&page=1&limit=50&sortBy=createdAt&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "request_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "source": "website",
      "status": "pending",
      "notes": "",
      "metadata": {},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "status": "pending",
    "source": null,
    "search": null,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

**Filter Examples:**

1. **Filter by status:**
   ```
   GET /api/v1/user-requests?status=pending
   GET /api/v1/user-requests?status=contacted
   GET /api/v1/user-requests?status=registered
   GET /api/v1/user-requests?status=ignored
   ```

2. **Filter by source:**
   ```
   GET /api/v1/user-requests?source=website
   ```

3. **Search by email or name:**
   ```
   GET /api/v1/user-requests?search=john
   GET /api/v1/user-requests?search=user@example.com
   ```

4. **Combined filters:**
   ```
   GET /api/v1/user-requests?status=pending&source=website&search=john&page=1&limit=20
   ```

5. **Sort by email:**
   ```
   GET /api/v1/user-requests?sortBy=email&sortOrder=asc
   ```

### 2. Get User Request Statistics

**GET** `/api/v1/user-requests/stats`

Get statistics about user requests.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalRequests": 1000,
    "pendingRequests": 250,
    "contactedRequests": 400,
    "registeredRequests": 300,
    "ignoredRequests": 50,
    "recentRequests": 150,
    "requestsBySource": {
      "website": 800,
      "api": 200
    }
  }
}
```

### 3. Get User Request by ID

**GET** `/api/v1/user-requests/:id`

Get a specific user request by ID.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Example Request:**
```
GET /api/v1/user-requests/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "request_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "source": "website",
    "status": "pending",
    "notes": "",
    "metadata": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Update User Request

**PATCH** `/api/v1/user-requests/:id`

Update a user request (status, notes).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "contacted",
  "notes": "Sent welcome email on 2024-01-15"
}
```

**Fields:**
- `status` (optional): Update status - `"pending"`, `"contacted"`, `"registered"`, `"ignored"`
- `notes` (optional): Add or update notes

**Example Request:**
```
PATCH /api/v1/user-requests/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "message": "User request updated successfully",
  "data": {
    "_id": "request_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "source": "website",
    "status": "contacted",
    "notes": "Sent welcome email on 2024-01-15",
    "metadata": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Update Examples:**

1. **Mark as contacted:**
   ```json
   {
     "status": "contacted",
     "notes": "Sent welcome email"
   }
   ```

2. **Mark as registered:**
   ```json
   {
     "status": "registered",
     "notes": "User created account on 2024-01-15"
   }
   ```

3. **Add notes only:**
   ```json
   {
     "notes": "Follow up needed - interested in premium features"
   }
   ```

### 5. Delete User Request

**DELETE** `/api/v1/user-requests/:id`

Delete a user request.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Example Request:**
```
DELETE /api/v1/user-requests/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "message": "User request deleted successfully"
}
```

---

## Query Management API (Admin)

### 1. Get All Queries

**GET** `/api/v1/queries`

Get all queries with filtering options.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `hasResults` (optional): Filter by whether results were returned - `"true"` or `"false"`
- `searchAttempted` (optional): Filter by whether search was attempted - `"true"` or `"false"`
- `userEmail` (optional): Filter by user email (case-insensitive search)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)
- `sortBy` (optional): Sort field (default: `"createdAt"`)
- `sortOrder` (optional): Sort order - `"asc"` or `"desc"` (default: `"desc"`)

**Example:**
```
GET /api/v1/queries?hasResults=false&searchAttempted=true&page=1&limit=50
```

### 2. Get Queries Without Results

**GET** `/api/v1/queries/no-results`

Get queries that did not return results from AutoDev (for AI training).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Example:**
```
GET /api/v1/queries/no-results?page=1&limit=50
```

### 3. Get Query Statistics

**GET** `/api/v1/queries/stats`

Get statistics about queries.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalQueries": 1000,
    "queriesWithResults": 750,
    "queriesWithoutResults": 200,
    "queriesNoSearch": 50,
    "loggedInQueries": 600,
    "anonymousQueries": 400,
    "averageResultsCount": 15
  }
}
```

### 4. Get Query by ID

**GET** `/api/v1/queries/:id`

Get a specific query by ID.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions - admin required)
- `404` - Not Found
- `500` - Internal Server Error

---

## Base URL

- **Local Development:** `http://localhost:3000`
- **Production:** `https://www.autounite.com` (or your production URL)

---

## Postman Collection Example

### Users API

```json
{
  "name": "Get All Users",
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{admin_token}}"
      }
    ],
    "url": {
      "raw": "http://localhost:3000/api/v1/users?page=1&limit=10&search=john&role=user",
      "protocol": "http",
      "host": ["localhost"],
      "port": "3000",
      "path": ["api", "v1", "users"],
      "query": [
        {"key": "page", "value": "1"},
        {"key": "limit", "value": "10"},
        {"key": "search", "value": "john"},
        {"key": "role", "value": "user"}
      ]
    }
  }
}
```

### User Requests API

```json
{
  "name": "Submit Demo Request",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"email\": \"user@example.com\",\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\"\n}"
    },
    "url": {
      "raw": "http://localhost:3000/api/v1/user-requests",
      "protocol": "http",
      "host": ["localhost"],
      "port": "3000",
      "path": ["api", "v1", "user-requests"]
    }
  }
}
```

---

## Quick Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/users` | GET | Admin | Get all users with filters |
| `/api/v1/users/:id` | GET | Admin | Get user by ID |
| `/api/v1/user-requests` | POST | Public | Submit demo request |
| `/api/v1/user-requests` | GET | Admin | Get all requests with filters |
| `/api/v1/user-requests/stats` | GET | Admin | Get request statistics |
| `/api/v1/user-requests/:id` | GET | Admin | Get request by ID |
| `/api/v1/user-requests/:id` | PATCH | Admin | Update request |
| `/api/v1/user-requests/:id` | DELETE | Admin | Delete request |
| `/api/v1/queries` | GET | Admin | Get all queries with filters |
| `/api/v1/queries/no-results` | GET | Admin | Get queries without results |
| `/api/v1/queries/stats` | GET | Admin | Get query statistics |

