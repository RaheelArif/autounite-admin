'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ScrapingPage from './scraping/page';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to scraping page as default
    router.replace('/scraping');
  }, [router]);

  return (
    <DashboardLayout>
      <ScrapingPage />
    </DashboardLayout>
  );
}
