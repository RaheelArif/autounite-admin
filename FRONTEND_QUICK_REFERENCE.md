# Frontend Quick Reference - Scraping API

## 🔑 Authentication
All endpoints require header:
```
x-api-key: YOUR_INTERNAL_API_KEY
```

---

## 📊 Dashboard APIs

### Summary (Main Dashboard)
```
GET /api/v1/scraping/summary
```
**Response:** Complete overview with stats, progress, recent activity

### Progress by Filter
```
GET /api/v1/scraping/progress?step=vehicles&status=pending
```
**Response:** Filtered progress stats

---

## 📋 Table APIs

### Pending Items
```
GET /api/v1/scraping/pending?step=models&limit=50
```
**Use:** Models/Vehicles pending table

### Failed Items
```
GET /api/v1/scraping/failed?step=vehicles&limit=50
```
**Use:** Failed items table with retry

### Retry Failed
```
POST /api/v1/scraping/retry
Body: { "step": "vehicles", "ids": ["id1"] }
```
**Use:** Retry button functionality

---

## 🚗 Vehicle APIs

### Get Vehicles (with filters)
```
GET /api/v1/vehicles?page=1&limit=20&year=2024&make=BMW&minMpg=20
```
**Response:** Paginated vehicle list with filters

### Get Vehicle Stats
```
GET /api/v1/vehicles/stats
```
**Response:** Vehicle statistics for charts

### Get Single Vehicle
```
GET /api/v1/vehicles/:id
GET /api/v1/vehicles/fuel-api/:fuelApiVehicleId
```

### Get Vehicle Images
```
GET /api/v1/vehicles/:id/images
GET /api/v1/vehicles/fuel-api/:fuelApiVehicleId/images
```

---

## 🎨 UI Components Data

### Status Badge Colors
- `pending`: Yellow ⏳
- `in_progress`: Blue 🔄
- `completed`: Green ✅
- `failed`: Red ❌

### Progress Calculation
```javascript
const progress = (completed / total) * 100;
```

### Coverage Calculation
```javascript
const coverage = (withFueleconomy / total) * 100;
```

---

## 📈 Chart Data Sources

### Pie Chart (Progress by Step)
```javascript
scraping.byStep.map(step => ({
  name: step._id,
  completed: step.completed,
  pending: step.pending
}))
```

### Bar Chart (By Year)
```javascript
scraping.breakdown.byYear
// OR
vehicles.breakdown.byYear
```

### Donut Chart (By Make)
```javascript
vehicles.breakdown.byMake
```

---

## 🔄 Polling Intervals

- Dashboard: 30 seconds
- Tables: 60 seconds
- Failed items: 30 seconds

---

## 📱 Key Endpoints Summary

| Page | Endpoint | Purpose |
|------|----------|---------|
| Dashboard | `/scraping/summary` | Overview stats |
| Makes Table | `/scraping/progress?step=makes` | Makes list |
| Models Table | `/scraping/pending?step=models` | Pending models |
| Vehicles Table | `/vehicles` | Vehicle list |
| Failed Items | `/scraping/failed` | Failed items |
| Statistics | `/scraping/summary` + `/vehicles/stats` | Charts data |

---

**For complete documentation, see:**
- `FRONTEND_API_DOCUMENTATION.md` - Complete API docs
- `ADMIN_PANEL_GUIDE.md` - UI integration guide
