# Admin Panel Integration Guide

## 🎯 Overview

This guide helps frontend developers integrate the scraping system into the admin panel. It includes component structures, API calls, and UI examples.

---

## 📊 Dashboard Page Structure

### Page: `/admin/scraping/dashboard`

#### API Endpoint
```
GET /api/v1/scraping/summary
```

#### Component Structure
```typescript
interface DashboardData {
  scraping: {
    byStep: Array<{
      _id: string;
      total: number;
      pending: number;
      completed: number;
      failed: number;
    }>;
  };
  vehicles: {
    total: number;
    withFueleconomy: number;
    withoutFueleconomy: number;
    coverage: string;
  };
  recent: Array<ScrapingProgress>;
}
```

#### UI Layout
```
┌─────────────────────────────────────────────────┐
│  SCRAPING DASHBOARD                            │
├─────────────────────────────────────────────────┤
│  [Card] Makes: 282/282 (100%)                   │
│  [Card] Models: 6/2851 (0.21%)                  │
│  [Card] Vehicles: 33 Total                      │
│  [Card] Coverage: 6.06%                         │
├─────────────────────────────────────────────────┤
│  [Progress Chart] Makes/Models/Vehicles          │
│  [Year Breakdown Chart]                         │
│  [Recent Activity Table]                         │
└─────────────────────────────────────────────────┘
```

---

## 📋 Makes Table Page

### Page: `/admin/scraping/makes`

#### API Endpoint
```
GET /api/v1/scraping/progress?step=makes&status=completed
GET /api/v1/scraping/progress?step=makes&status=pending
```

#### Table Structure
| Year | Make Name | Status | Total Models | Created At | Updated At |
|------|-----------|--------|--------------|------------|------------|
| 2024 | Toyota | ✅ Completed | 15 | 2026-01-15 | 2026-01-15 |
| 2024 | BMW | ⏳ Pending | 0 | 2026-01-15 | 2026-01-15 |

#### Filters
- Year dropdown: `?year=2024`
- Status filter: `?status=pending`
- Search: Client-side filter by makeName

#### Code Example
```typescript
const MakesTable = () => {
  const [makes, setMakes] = useState([]);
  const [filters, setFilters] = useState({ year: '', status: 'all' });

  useEffect(() => {
    const fetchMakes = async () => {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.status !== 'all') params.append('status', filters.status);
      
      const response = await fetch(
        `/api/v1/scraping/progress?step=makes&${params}`,
        { headers: { 'x-api-key': API_KEY } }
      );
      const data = await response.json();
      setMakes(data.breakdown.byYear || []);
    };
    fetchMakes();
  }, [filters]);

  return (
    <Table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Make</th>
          <th>Status</th>
          <th>Models</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {makes.map(make => (
          <tr key={make._id}>
            <td>{make.year}</td>
            <td>{make.makeName}</td>
            <td><StatusBadge status={make.status} /></td>
            <td>{make.totalModels}</td>
            <td>{formatDate(make.updatedAt)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
```

---

## 🚗 Models Table Page

### Page: `/admin/scraping/models`

#### API Endpoint
```
GET /api/v1/scraping/pending?step=models&limit=50
GET /api/v1/scraping/progress?step=models&status=completed
```

#### Table Structure
| Year | Make | Model | Status | Vehicles | Processed | With Fueleconomy | Updated |
|------|------|-------|--------|----------|-----------|------------------|---------|
| 2024 | Toyota | Camry | ⏳ Pending | 0 | 0 | 0 | 2026-01-15 |
| 2020 | BMW | X3 M | ✅ Completed | 9 | 9 | 1 | 2026-01-15 |

#### Filters
- Year
- Make
- Status
- Search (model name)

#### Actions
- View Details (modal)
- Retry (if failed)

---

## 🚙 Vehicles Table Page

### Page: `/admin/scraping/vehicles`

#### API Endpoint
```
GET /api/v1/vehicles?page=1&limit=50&sortBy=createdAt&sortOrder=desc
```

#### Table Structure
| Year | Make | Model | Trim | Body Type | MPG | Fuel Type | Fueleconomy | Actions |
|------|------|-------|------|-----------|-----|-----------|-------------|---------|
| 2020 | BMW | X3 M | X3 M | SUV | 16 | Premium | ✅ Yes | View |
| 2024 | Toyota | Grand Highlander | Platinum | SUV | - | - | ❌ No | View |

#### Filters Panel
```
┌─────────────────────────┐
│ Filters                  │
├─────────────────────────┤
│ Year: [2024 ▼]           │
│ Make: [All ▼]            │
│ Model: [Search...]        │
│ Body Type: [All ▼]       │
│ Fuel Type: [All ▼]       │
│ MPG Range: [Min] - [Max] │
│ Has Fueleconomy: [All ▼] │
│ [Apply Filters]          │
└─────────────────────────┘
```

#### Code Example
```typescript
const VehiclesTable = () => {
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50 });
  const [filters, setFilters] = useState({});

  const fetchVehicles = async () => {
    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    });
    
    const response = await fetch(
      `/api/v1/vehicles?${params}`,
      { headers: { 'x-api-key': API_KEY } }
    );
    const data = await response.json();
    setVehicles(data.data);
    setPagination(data.pagination);
  };

  useEffect(() => {
    fetchVehicles();
  }, [pagination.page, filters]);

  return (
    <>
      <FiltersPanel filters={filters} onChange={setFilters} />
      <Table>
        {/* Table rows */}
      </Table>
      <Pagination {...pagination} onChange={setPagination} />
    </>
  );
};
```

---

## ❌ Failed Items Page

### Page: `/admin/scraping/failed`

#### API Endpoint
```
GET /api/v1/scraping/failed?step=vehicles&limit=50
```

#### Table Structure
| Year | Make | Model | Step | Error | Retries | Failed At | Actions |
|------|------|-------|------|-------|---------|-----------|---------|
| 2024 | Toyota | Camry | vehicles | Network timeout | 2 | 2026-01-15 | [Retry] |

#### Actions
- **Retry Single**: Button per row
- **Retry All**: Bulk action button
- **View Details**: Error message modal

#### Code Example
```typescript
const FailedItemsTable = () => {
  const [failed, setFailed] = useState([]);

  const retryItem = async (id) => {
    const response = await fetch('/api/v1/scraping/retry', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: [id] })
    });
    if (response.ok) {
      // Refresh table
      fetchFailed();
    }
  };

  const retryAll = async () => {
    const response = await fetch('/api/v1/scraping/retry', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ step: 'vehicles' })
    });
    if (response.ok) {
      fetchFailed();
    }
  };

  return (
    <>
      <Button onClick={retryAll}>Retry All Failed</Button>
      <Table>
        {failed.map(item => (
          <tr key={item._id}>
            <td>{item.year} {item.makeName} {item.modelName}</td>
            <td><ErrorBadge>{item.error}</ErrorBadge></td>
            <td>{item.retryCount}</td>
            <td>
              <Button onClick={() => retryItem(item._id)}>
                Retry
              </Button>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
};
```

---

## 📈 Statistics & Charts Page

### Page: `/admin/scraping/statistics`

#### Charts Needed

**1. Progress by Step (Pie/Donut Chart)**
```javascript
const progressData = [
  { name: 'Makes', completed: 282, pending: 0 },
  { name: 'Models', completed: 6, pending: 2845 },
  { name: 'Vehicles', completed: 6, pending: 0 }
];
```

**2. Progress Timeline (Line Chart)**
- X-axis: Date
- Y-axis: Count
- Lines: Completed, Pending, Failed

**3. Vehicles by Year (Bar Chart)**
```javascript
const yearData = [
  { year: '2024', count: 15 },
  { year: '2023', count: 10 }
];
```

**4. Vehicles by Make (Donut Chart)**
```javascript
const makeData = [
  { name: 'BMW', value: 9 },
  { name: 'Toyota', value: 5 }
];
```

**5. Fueleconomy Coverage (Gauge Chart)**
```javascript
const coverage = 6.06; // Percentage
```

---

## 🎨 UI Components

### Status Badge Component
```typescript
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    pending: { color: 'yellow', icon: '⏳', text: 'Pending' },
    in_progress: { color: 'blue', icon: '🔄', text: 'In Progress' },
    completed: { color: 'green', icon: '✅', text: 'Completed' },
    failed: { color: 'red', icon: '❌', text: 'Failed' }
  };

  const { color, icon, text } = config[status] || config.pending;

  return (
    <span className={`badge badge-${color}`}>
      {icon} {text}
    </span>
  );
};
```

### Progress Bar Component
```typescript
const ProgressBar = ({ 
  completed, 
  total, 
  label 
}: { 
  completed: number; 
  total: number; 
  label: string;
}) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <span>{label}</span>
        <span>{completed} / {total} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
```

### Stats Card Component
```typescript
const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon?: string;
}) => {
  return (
    <div className="stats-card">
      <div className="stats-header">
        <span className="stats-icon">{icon}</span>
        <span className="stats-title">{title}</span>
      </div>
      <div className="stats-value">{value}</div>
      {subtitle && <div className="stats-subtitle">{subtitle}</div>}
    </div>
  );
};
```

---

## 🔄 Real-time Updates

### Polling Hook
```typescript
const usePolling = (url: string, interval: number = 30000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url, {
          headers: { 'x-api-key': API_KEY }
        });
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [url, interval]);

  return { data, loading };
};

// Usage
const Dashboard = () => {
  const { data, loading } = usePolling('/api/v1/scraping/summary', 30000);
  
  if (loading) return <Loading />;
  return <DashboardContent data={data} />;
};
```

---

## 📱 Responsive Design

### Mobile View
- Stack cards vertically
- Collapsible filters
- Horizontal scroll for tables
- Simplified charts

### Tablet View
- 2-column card layout
- Sidebar filters
- Full table with pagination

### Desktop View
- 4-column card layout
- Full filters panel
- All charts visible
- Expanded tables

---

## 🎯 Page Routes Structure

```
/admin/scraping/
├── /dashboard          → Overview & statistics
├── /makes             → Makes table
├── /models            → Models table
├── /vehicles          → Vehicles table
├── /failed            → Failed items & retry
└── /statistics        → Charts & analytics
```

---

## ✅ Implementation Checklist

### Dashboard Page
- [ ] Summary cards (4 cards)
- [ ] Progress bars (3 bars)
- [ ] Recent activity table
- [ ] Auto-refresh (30s polling)

### Makes Page
- [ ] Table with pagination
- [ ] Year filter
- [ ] Status filter
- [ ] Search functionality
- [ ] Export button

### Models Page
- [ ] Table with pagination
- [ ] Multiple filters
- [ ] Status badges
- [ ] View details modal
- [ ] Retry failed button

### Vehicles Page
- [ ] Table with pagination
- [ ] Advanced filters panel
- [ ] Sort functionality
- [ ] View vehicle details
- [ ] View images button

### Failed Items Page
- [ ] Failed items table
- [ ] Error message display
- [ ] Retry single button
- [ ] Retry all button
- [ ] Filter by step

### Statistics Page
- [ ] Progress pie chart
- [ ] Year breakdown bar chart
- [ ] Make breakdown donut chart
- [ ] Coverage gauge
- [ ] Timeline chart

---

## 🚀 Quick Start Example

```typescript
// AdminScrapingDashboard.tsx
import { useEffect, useState } from 'react';

const AdminScrapingDashboard = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await fetch('/api/v1/scraping/summary', {
        headers: { 'x-api-key': process.env.REACT_APP_API_KEY }
      });
      const data = await response.json();
      setSummary(data);
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 30000); // Poll every 30s
    
    return () => clearInterval(interval);
  }, []);

  if (!summary) return <Loading />;

  const makes = summary.scraping.byStep.find(s => s._id === 'makes');
  const models = summary.scraping.byStep.find(s => s._id === 'models');
  const vehicles = summary.scraping.byStep.find(s => s._id === 'vehicles');

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatsCard 
          title="Makes" 
          value={`${makes.completed}/${makes.total}`}
          subtitle={`${(makes.completed/makes.total*100).toFixed(1)}% Complete`}
          icon="🏭"
        />
        <StatsCard 
          title="Models" 
          value={`${models.completed}/${models.total}`}
          subtitle={`${(models.completed/models.total*100).toFixed(1)}% Complete`}
          icon="🚗"
        />
        <StatsCard 
          title="Vehicles" 
          value={summary.vehicles.total}
          subtitle={`${summary.vehicles.coverage}% with fueleconomy`}
          icon="📊"
        />
        <StatsCard 
          title="Coverage" 
          value={`${summary.vehicles.coverage}%`}
          subtitle={`${summary.vehicles.withFueleconomy} with data`}
          icon="✅"
        />
      </div>

      <div className="progress-section">
        <ProgressBar 
          label="Makes Progress" 
          completed={makes.completed} 
          total={makes.total} 
        />
        <ProgressBar 
          label="Models Progress" 
          completed={models.completed} 
          total={models.total} 
        />
        <ProgressBar 
          label="Vehicles Progress" 
          completed={vehicles.completed} 
          total={vehicles.total} 
        />
      </div>

      <RecentActivityTable data={summary.recent} />
    </div>
  );
};
```

---

**Last Updated**: 2026-01-15
