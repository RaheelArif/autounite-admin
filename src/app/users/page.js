'use client';

import { Suspense } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardPageContent from '../DashboardPageContent';

export default function Users() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="au-dash-page p-6">Loading users…</div>}>
        <DashboardPageContent />
      </Suspense>
    </DashboardLayout>
  );
}
