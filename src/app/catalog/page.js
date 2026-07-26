'use client';

import DashboardLayout from '@/components/DashboardLayout';
import CatalogVehiclesPanel from './CatalogVehiclesPanel';

export default function CatalogPage() {
  return (
    <DashboardLayout>
      <CatalogVehiclesPanel />
    </DashboardLayout>
  );
}
