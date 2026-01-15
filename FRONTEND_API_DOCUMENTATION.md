# Fuel API Scraper - Frontend API Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Scraping Process Flow](#scraping-process-flow)
3. [API Endpoints](#api-endpoints)
4. [Response Structures](#response-structures)
5. [Admin Panel Integration](#admin-panel-integration)
6. [Data Models](#data-models)
7. [Status Tracking](#status-tracking)

---

## 🎯 Overview

This API manages vehicle data scraping from Fuel API and Fueleconomy API. The scraping happens in 3 steps:
1. **Step 1**: Fetch Years & Makes (One-time setup)
2. **Step 2**: Fetch Models (One-time setup)
3. **Step 3**: Fetch & Save Vehicles (Ongoing process)

All progress is tracked in `ScrapingProgress` collection with status: `pending`, `in_progress`, `completed`, `failed`.

---

## 🔄 Scraping Process Flow

```
Years → Makes → Models → Vehicles → Completed
  ↓       ↓        ↓         ↓
pending pending pending  pending
```

### Step Status Flow
```
pending → in_progress → completed
              ↓
           failed → (retry) → pending
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3002/api/v1
```

### Authentication
All endpoints require `x-api-key` header:
```
x-api-key: YOUR_INTERNAL_API_KEY
```

---

## 1. Scraping Progress & Statistics

### 1.1 Get Overall Summary
```
GET /api/v1/scraping/summary
```

**Response:**
```json
{
  "success": true,
  "scraping": {
    "byStep": [
      {
        "_id": "makes",
        "total": 282,
        "pending": 0,
        "completed": 282,
        "failed": 0
      },
      {
        "_id": "models",
        "total": 2851,
        "pending": 2845,
        "completed": 6,
        "failed": 0
      },
      {
        "_id": "vehicles",
        "total": 6,
        "pending": 0,
        "completed": 6,
        "failed": 0
      }
    ]
  },
  "vehicles": {
    "total": 33,
    "withFueleconomy": 2,
    "withoutFueleconomy": 31,
    "coverage": "6.06"
  },
  "recent": [
    {
      "_id": "6968d7205b3f6a21d354ef3c",
      "year": "2020",
      "makeName": "BMW",
      "modelName": "X3 M",
      "step": "vehicles",
      "status": "completed",
      "updatedAt": "2026-01-15T12:43:26.339Z"
    }
  ]
}
```

**Use Cases:**
- Dashboard overview cards
- Progress bars
- Statistics display

---

### 1.2 Get Progress by Filter
```
GET /api/v1/scraping/progress?step=vehicles&status=pending&year=2024
```

**Query Parameters:**
- `step`: `makes`, `models`, `vehicles` (optional)
- `status`: `pending`, `in_progress`, `completed`, `failed` (optional)
- `year`: Year filter (optional)

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 2845,
    "pending": 2845,
    "inProgress": 0,
    "completed": 6,
    "failed": 0
  },
  "breakdown": {
    "byStep": [
      {
        "_id": "models",
        "count": 2845
      }
    ],
    "byYear": [
      {
        "_id": "2024",
        "count": 500
      },
      {
        "_id": "2023",
        "count": 450
      }
    ]
  }
}
```

**Use Cases:**
- Filtered progress tables
- Year-wise breakdown charts
- Status-wise filtering

---

### 1.3 Get Pending Items
```
GET /api/v1/scraping/pending?step=vehicles&limit=20
```

**Query Parameters:**
- `step`: `makes`, `models`, `vehicles` (optional)
- `limit`: Number of items (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "_id": "6968ddd1284c31b96f2f7b03",
      "year": "2026",
      "makeId": "36",
      "makeName": "Genesis",
      "modelId": "8534",
      "modelName": "G80",
      "step": "models",
      "status": "pending",
      "totalMakes": 0,
      "totalModels": 0,
      "totalVehicles": 0,
      "processedVehicles": 0,
      "vehiclesWithFueleconomy": 0,
      "startedAt": null,
      "completedAt": null,
      "lastProcessedAt": null,
      "error": null,
      "retryCount": 0,
      "priority": 0,
      "createdAt": "2026-01-15T12:30:09.763Z",
      "updatedAt": "2026-01-15T12:30:09.763Z"
    }
  ]
}
```

**Use Cases:**
- Pending items table
- Queue management
- Processing list

---

### 1.4 Get Failed Items
```
GET /api/v1/scraping/failed?step=vehicles&limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "year": "2024",
      "makeName": "Toyota",
      "modelName": "Camry",
      "step": "vehicles",
      "status": "failed",
      "error": "Network timeout",
      "retryCount": 2,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Use Cases:**
- Error log table
- Retry management
- Debugging

---

### 1.5 Retry Failed Items
```
POST /api/v1/scraping/retry
Content-Type: application/json

{
  "step": "vehicles",
  "ids": ["id1", "id2"]  // Optional: specific IDs, omit for all
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reset 5 failed items to pending",
  "modifiedCount": 5
}
```

**Use Cases:**
- Retry button
- Bulk retry
- Error recovery

---

## 2. Vehicle Data APIs

### 2.1 Get All Vehicles (with filters)
```
GET /api/v1/vehicles?page=1&limit=20&year=2024&make=BMW&minMpg=20
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)
- `search`: Fuzzy search (make, model, trim)
- `year`: Exact year filter
- `make`: Fuzzy make filter
- `model`: Fuzzy model filter
- `bodyType`: Fuzzy body type filter
- `drivetrain`: Fuzzy drivetrain filter
- `fuelType`: Fuzzy fuel type filter
- `isElectric`: Boolean (true/false)
- `minMpg`: Minimum combined MPG
- `maxMpg`: Maximum combined MPG
- `hasFueleconomy`: Boolean (true/false)
- `sortBy`: Sort field (year, make, model, metrics.combinedMpg, etc.)
- `sortOrder`: asc or desc (default: desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6968e0ed0d9bad1460f6d7a9",
      "fuelApiVehicleId": "37176",
      "fueleconomyVehicleId": "41666",
      "year": "2020",
      "make": "BMW",
      "model": "X3 M",
      "trim": "X3 M",
      "bodyType": "SUV",
      "drivetrain": "AWD",
      "numDoors": "4",
      "metrics": {
        "cityMpg": 14,
        "highwayMpg": 19,
        "combinedMpg": 16,
        "fuelType": "Premium",
        "isElectric": false,
        "electricRange": null,
        "annualFuelCost": 3650,
        "co2Emissions": 546
      },
      "dataSource": {
        "fuelApi": true,
        "fueleconomy": true
      },
      "fuelApi": {
        "id": "37176",
        "trim": "X3 M",
        "num_doors": "4",
        "drivetrain": "AWD",
        "bodytype": "SUV",
        "model": {
          "id": "6360",
          "name": "X3 M",
          "year": "2020",
          "make": {
            "id": "1",
            "name": "BMW"
          }
        },
        "products": [
          {
            "id": "6",
            "name": "Exterior Spin",
            "type": "images",
            "formats_count": 20
          }
        ]
      },
      "fueleconomy": {
        "city08": "14",
        "highway08": "19",
        "comb08": "16",
        "fuelType": "Premium",
        "drive": "All-Wheel Drive",
        "fuelCost08": "3650",
        "co2": "546"
      },
      "isActive": true,
      "createdAt": "2026-01-15T12:43:25.673Z",
      "updatedAt": "2026-01-15T12:43:25.673Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalVehicles": 100,
    "limit": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "search": null,
    "year": "2024",
    "make": "BMW",
    "model": null,
    "bodyType": null,
    "drivetrain": null,
    "fuelType": null,
    "isElectric": null,
    "minMpg": 20,
    "maxMpg": null,
    "hasFueleconomy": null
  }
}
```

**Use Cases:**
- Vehicle listing page
- Search results
- Filtered research queries

---

### 2.2 Get Vehicle Statistics
```
GET /api/v1/vehicles/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 33,
    "active": 33,
    "withFueleconomy": 2,
    "withoutFueleconomy": 31,
    "coverage": "6.06"
  },
  "breakdown": {
    "byYear": [
      {
        "_id": "2024",
        "count": 15
      },
      {
        "_id": "2023",
        "count": 10
      }
    ],
    "byMake": [
      {
        "_id": "BMW",
        "count": 9
      },
      {
        "_id": "Toyota",
        "count": 5
      }
    ]
  },
  "recent": [
    {
      "_id": "6968e0ed0d9bad1460f6d7a9",
      "year": "2020",
      "make": "BMW",
      "model": "X3 M",
      "trim": "X3 M",
      "createdAt": "2026-01-15T12:43:25.673Z"
    }
  ]
}
```

**Use Cases:**
- Dashboard statistics cards
- Charts (year breakdown, make breakdown)
- Coverage percentage

---

### 2.3 Get Single Vehicle
```
GET /api/v1/vehicles/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Same structure as vehicle object in list response
  }
}
```

---

### 2.4 Get Vehicle by Fuel API ID
```
GET /api/v1/vehicles/fuel-api/:fuelApiVehicleId
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Same structure as vehicle object
  }
}
```

---

### 2.5 Get Vehicle Images
```
GET /api/v1/vehicles/:id/images
GET /api/v1/vehicles/fuel-api/:fuelApiVehicleId/images
```

**Response:**
```json
{
  "success": true,
  "vehicleId": "6968e0ed0d9bad1460f6d7a9",
  "fuelApiVehicleId": "37176",
  "availableProducts": [
    {
      "id": "6",
      "name": "Exterior Spin",
      "type": "images",
      "formats": [
        {
          "id": "14",
          "name": "Exterior JPG Spin Frames 640",
          "code": "exterior_036_spinframes_0640",
          "width": "640",
          "height": "480",
          "assetsCount": 0,
          "assets": []
        }
      ]
    }
  ],
  "totalProducts": 3,
  "productsWithImages": 0
}
```

**Note:** If `assetsCount` is 0, images are not available for that vehicle.

---

## 📊 Admin Panel Integration Guide

### Dashboard Page

#### Overview Cards
Use `/api/v1/scraping/summary`:
- **Total Makes**: `scraping.byStep.find(s => s._id === 'makes').total`
- **Total Models**: `scraping.byStep.find(s => s._id === 'models').total`
- **Total Vehicles**: `vehicles.total`
- **Fueleconomy Coverage**: `vehicles.coverage + '%'`

#### Progress Bars
```javascript
// Makes Progress
const makes = scraping.byStep.find(s => s._id === 'makes');
const makesProgress = (makes.completed / makes.total) * 100;

// Models Progress
const models = scraping.byStep.find(s => s._id === 'models');
const modelsProgress = (models.completed / models.total) * 100;

// Vehicles Progress
const vehicles = scraping.byStep.find(s => s._id === 'vehicles');
const vehiclesProgress = (vehicles.completed / vehicles.total) * 100;
```

---

### Makes Table Page

#### API Call
```
GET /api/v1/scraping/progress?step=makes&status=completed
```

#### Table Columns
- Year
- Make Name
- Status (Badge: Completed/Pending/Failed)
- Total Models
- Created At
- Updated At

#### Filters
- Year dropdown
- Status filter (pending/completed/failed)
- Search by make name

---

### Models Table Page

#### API Call
```
GET /api/v1/scraping/pending?step=models&limit=50
```

#### Table Columns
- Year
- Make Name
- Model Name
- Status
- Total Vehicles
- Processed Vehicles
- Vehicles with Fueleconomy
- Created At
- Updated At

#### Filters
- Year
- Make
- Status
- Search

---

### Vehicles Table Page

#### API Call
```
GET /api/v1/vehicles?page=1&limit=50&sortBy=createdAt&sortOrder=desc
```

#### Table Columns
- Year
- Make
- Model
- Trim
- Body Type
- MPG (Combined)
- Fuel Type
- Has Fueleconomy (Badge)
- Created At

#### Filters
- Year
- Make
- Model
- Body Type
- Fuel Type
- Has Fueleconomy (Yes/No)
- MPG Range

---

### Failed Items Page

#### API Call
```
GET /api/v1/scraping/failed?step=vehicles&limit=50
```

#### Table Columns
- Year
- Make Name
- Model Name
- Step
- Error Message
- Retry Count
- Failed At
- Actions (Retry button)

#### Actions
- Retry Single: `POST /api/v1/scraping/retry` with `{ ids: [id] }`
- Retry All: `POST /api/v1/scraping/retry` with `{ step: "vehicles" }`

---

### Statistics Page

#### Charts Data

**1. Progress by Step (Pie Chart)**
```javascript
const progressData = scraping.byStep.map(step => ({
  name: step._id,
  completed: step.completed,
  pending: step.pending,
  failed: step.failed
}));
```

**2. Progress by Year (Bar Chart)**
```javascript
const yearData = scraping.breakdown.byYear.map(year => ({
  year: year._id,
  count: year.count
}));
```

**3. Vehicle Coverage (Gauge Chart)**
```javascript
const coverage = parseFloat(vehicles.coverage);
// Show as percentage gauge
```

**4. Vehicles by Make (Donut Chart)**
```javascript
const makeData = vehicles.breakdown.byMake.map(make => ({
  name: make._id,
  value: make.count
}));
```

---

## 📋 Data Models

### ScrapingProgress Model
```typescript
interface ScrapingProgress {
  _id: string;
  year: string;
  makeId: string | null;
  makeName: string | null;
  modelId: string | null;
  modelName: string | null;
  step: "years" | "makes" | "models" | "vehicles" | "completed";
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  totalMakes: number;
  totalModels: number;
  totalVehicles: number;
  processedVehicles: number;
  vehiclesWithFueleconomy: number;
  startedAt: Date | null;
  completedAt: Date | null;
  lastProcessedAt: Date | null;
  error: string | null;
  retryCount: number;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Vehicle Model
```typescript
interface Vehicle {
  _id: string;
  fuelApiVehicleId: string;
  fueleconomyVehicleId: string | null;
  year: string;
  make: string;
  model: string;
  trim: string;
  bodyType: string;
  drivetrain: string;
  numDoors: string;
  metrics: {
    cityMpg: number | null;
    highwayMpg: number | null;
    combinedMpg: number | null;
    fuelType: string | null;
    isElectric: boolean;
    electricRange: number | null;
    annualFuelCost: number | null;
    co2Emissions: number | null;
  };
  dataSource: {
    fuelApi: boolean;
    fueleconomy: boolean;
  };
  fuelApi: {
    id: string;
    trim: string;
    num_doors: string;
    drivetrain: string;
    bodytype: string;
    model: {
      id: string;
      name: string;
      year: string;
      make: {
        id: string;
        name: string;
      };
    };
    products: Array<{
      id: string;
      name: string;
      type: string;
      formats_count: number;
    }>;
  };
  fueleconomy: object | null; // Complete fueleconomy data
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🎨 UI Component Examples

### Status Badge Component
```typescript
const getStatusBadge = (status: string) => {
  const badges = {
    pending: { color: 'yellow', text: 'Pending' },
    in_progress: { color: 'blue', text: 'In Progress' },
    completed: { color: 'green', text: 'Completed' },
    failed: { color: 'red', text: 'Failed' }
  };
  return badges[status] || { color: 'gray', text: status };
};
```

### Progress Bar Component
```typescript
const ProgressBar = ({ completed, total }) => {
  const percentage = (completed / total) * 100;
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${percentage}%` }} />
      <span>{completed} / {total} ({percentage.toFixed(1)}%)</span>
    </div>
  );
};
```

---

## 🔄 Real-time Updates

### Polling Strategy
For admin panel, poll these endpoints every 30 seconds:
```
GET /api/v1/scraping/summary
GET /api/v1/scraping/pending?step=vehicles&limit=10
```

### WebSocket (Future Enhancement)
Consider adding WebSocket for real-time updates when scraping completes.

---

## 📝 Example API Calls

### Get Dashboard Data
```javascript
const getDashboardData = async () => {
  const response = await fetch('/api/v1/scraping/summary', {
    headers: { 'x-api-key': API_KEY }
  });
  return await response.json();
};
```

### Get Pending Models
```javascript
const getPendingModels = async (page = 1, limit = 50) => {
  const response = await fetch(
    `/api/v1/scraping/pending?step=models&limit=${limit}`,
    { headers: { 'x-api-key': API_KEY } }
  );
  return await response.json();
};
```

### Retry Failed Items
```javascript
const retryFailed = async (step, ids = null) => {
  const response = await fetch('/api/v1/scraping/retry', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ step, ids })
  });
  return await response.json();
};
```

---

## ✅ Checklist for Frontend

- [ ] Dashboard page with summary cards
- [ ] Makes table with filters
- [ ] Models table with filters
- [ ] Vehicles table with filters
- [ ] Failed items table with retry
- [ ] Progress bars/charts
- [ ] Status badges
- [ ] Pagination
- [ ] Search functionality
- [ ] Real-time updates (polling)

---

**Last Updated**: 2026-01-15
