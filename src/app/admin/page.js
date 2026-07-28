'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Admin OS Phase 1 entry → Dealers tab */
export default function AdminOsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dealers');
  }, [router]);

  return null;
}
