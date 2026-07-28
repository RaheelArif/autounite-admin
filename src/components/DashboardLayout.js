'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import QueriesPage from '@/app/queries/page';
import UsersPageContent from '@/app/users/UsersPageContent';
import RequestPageContent from '@/app/request/RequestPageContent';
import CatalogVehiclesPanel from '@/app/catalog/CatalogVehiclesPanel';
import BlogPageContent from '@/app/blog/BlogPageContent';
import DashboardPageContent from '@/app/DashboardPageContent';
import AdminPageLayout from './AdminPageLayout';
import { getAdminNavTitle } from '@/config/adminNav';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('search-governance');

  useEffect(() => {
    if (pathname === '/' || pathname === '/search-governance') {
      setActiveTab('search-governance');
    } else if (pathname === '/catalog' || pathname === '/scraping') {
      setActiveTab('catalog');
    } else if (pathname === '/blog') {
      setActiveTab('blog');
    } else if (pathname === '/request') {
      setActiveTab('request');
    } else if (pathname === '/queries') {
      setActiveTab('queries');
    } else if (pathname === '/users') {
      setActiveTab('users');
    } else if (pathname === '/dealer-bootstrap') {
      setActiveTab('dealer-bootstrap');
    } else if (pathname === '/dealer-beta') {
      setActiveTab('dealer-beta');
    }
  }, [pathname]);

  // Old /scraping bookmarks → catalog v2
  useEffect(() => {
    if (pathname === '/scraping') {
      router.replace('/catalog');
    }
  }, [pathname, router]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'catalog') {
      router.push('/catalog');
    } else if (tab === 'blog') {
      router.push('/blog');
    } else if (tab === 'users') {
      router.push('/users');
    } else if (tab === 'request') {
      router.push('/request');
    } else if (tab === 'dealer-bootstrap') {
      router.push('/dealer-bootstrap');
    } else if (tab === 'dealer-beta') {
      router.push('/dealer-beta');
    } else if (tab === 'search-governance') {
      router.push('/search-governance');
    }
  };

  const renderContent = () => {
    if (children) {
      return children;
    }

    if (pathname === '/' || pathname === '/search-governance') {
      return null;
    } else if (pathname === '/catalog') {
      return <CatalogVehiclesPanel />;
    } else if (pathname === '/blog') {
      return <BlogPageContent />;
    } else if (pathname === '/request') {
      return <RequestPageContent />;
    } else if (pathname === '/queries') {
      return <QueriesPage />;
    } else if (pathname === '/users') {
      return (
        <Suspense fallback={<div className="au-dash-page p-6">Loading users…</div>}>
          <DashboardPageContent />
        </Suspense>
      );
    }
    return null;
  };

  return (
    <AdminPageLayout overlayOpacity={0.62}>
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      <div className="au-dash-main transition-all duration-300 ease-in-out">
        <Navbar pageTitle={getAdminNavTitle(activeTab)} />

        <main className="au-dash-content overflow-y-auto custom-scrollbar">
          {renderContent()}
        </main>
      </div>
    </AdminPageLayout>
  );
}
