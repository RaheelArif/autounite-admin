'use client';

import { Suspense, use } from 'react';
import AdminOsShell from '@/components/admin-os/AdminOsShell';
import { resolveAdminOsTab } from '@/config/adminOsTabs';

function AdminOsTabInner({ params }) {
  const resolved = use(params);
  const tab = resolveAdminOsTab(resolved?.tab);

  return <AdminOsShell tabId={tab.id} />;
}

export default function AdminOsTabPage({ params }) {
  return (
    <Suspense fallback={<div className="aos-root" style={{ minHeight: '100vh', background: '#050812' }} />}>
      <AdminOsTabInner params={params} />
    </Suspense>
  );
}
