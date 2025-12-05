'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import QueriesPage from '@/app/queries/page';
import UsersPageContent from '@/app/users/UsersPageContent';
import RequestPageContent from '@/app/request/RequestPageContent';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('queries');

  // Update active tab based on pathname
  useEffect(() => {
    if (pathname === '/' || pathname === '/queries') {
      setActiveTab('queries');
    } else if (pathname === '/users') {
      setActiveTab('users');
    } else if (pathname === '/request') {
      setActiveTab('request');
    }
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle tab change and navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'queries') {
      router.push('/');
    } else if (tab === 'users') {
      router.push('/users');
    } else if (tab === 'request') {
      router.push('/request');
    }
  };

  // Render content based on pathname
  const renderContent = () => {
    if (pathname === '/' || pathname === '/queries') {
      return <QueriesPage />;
    } else if (pathname === '/users') {
      return <UsersPageContent />;
    } else if (pathname === '/request') {
      return <RequestPageContent />;
    }
    return children;
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

