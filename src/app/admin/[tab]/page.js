'use client';

import AdminOsShell from '@/components/admin-os/AdminOsShell';
import { resolveAdminOsTab } from '@/config/adminOsTabs';
import { use } from 'react';

export default function AdminOsTabPage({ params }) {
  const resolved = use(params);
  const tab = resolveAdminOsTab(resolved?.tab);

  return <AdminOsShell tabId={tab.id} />;
}
