'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import QueriesPage from '@/app/queries/page';
import UsersPageContent from '@/app/users/UsersPageContent';
import RequestPageContent from '@/app/request/RequestPageContent';
import ScrapingPage from '@/app/scraping/page';
import BlogPage from '@/app/blog/page';
import DashboardPageContent from '@/app/DashboardPageContent';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Initialize active tab - will be updated by useEffect based on pathname
  const [activeTab, setActiveTab] = useState('scraping');

  // Update active tab based on pathname
  useEffect(() => {
    if (pathname === '/' || pathname === '/scraping') {
      setActiveTab('scraping');
    } else if (pathname === '/blog') {
      setActiveTab('blog');
    } else if (pathname === '/request') {
      setActiveTab('request');
    } else if (pathname === '/queries') {
      setActiveTab('queries');
    } else if (pathname === '/users') {
      setActiveTab('users');
    }
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle tab change and navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'scraping') {
      router.push('/scraping');
    } else if (tab === 'blog') {
      router.push('/blog');
    } else if (tab === 'users') {
      router.push('/users');
    } else if (tab === 'request') {
      router.push('/request');
    }
  };

  // Render content based on pathname
  // If children are provided (page wraps itself), use children
  // Otherwise, render based on pathname
  const renderContent = () => {
    // If children exist, use them (page has wrapped itself)
    if (children) {
      return children;
    }
    
    // Otherwise, render based on pathname (fallback)
    if (pathname === '/' || pathname === '/scraping') {
      return <ScrapingPage />;
    } else if (pathname === '/blog') {
      return <BlogPage />;
    } else if (pathname === '/request') {
      return <RequestPageContent />;
    } else if (pathname === '/queries') {
      return <QueriesPage />;
    } else if (pathname === '/users') {
      // Users page now uses DashboardPageContent with tabs
      return <DashboardPageContent />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {/* Main Content Area */}
      <div className="
        md:ml-60
        transition-all duration-300 ease-in-out
      ">
        {/* Navbar */}
        <Navbar onMenuClick={toggleSidebar} />

        {/* Content Area - Scrollable */}
        <main className="
          mt-16
          h-[calc(100vh-4rem)]
          p-4 md:p-6 lg:p-8
          overflow-y-auto
          custom-scrollbar
        ">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

