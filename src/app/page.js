'use client';

import DashboardLayout from '@/components/DashboardLayout';
import QueriesPage from './queries/page';

export default function Home() {
  return (
    <DashboardLayout>
      <QueriesPage />
    </DashboardLayout>
  );
}
