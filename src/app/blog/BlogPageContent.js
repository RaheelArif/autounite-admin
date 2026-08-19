'use client';

import { useState, useEffect } from 'react';
import CategoriesTab from '@/app/blog/CategoriesTab';
import TagsTab from '@/app/blog/TagsTab';
import ArticlesTab from '@/app/blog/ArticlesTab';
import MediaTab from '@/app/blog/MediaTab';
import AuthorsTab from '@/app/blog/AuthorsTab';
import DistributionTab from '@/app/blog/DistributionTab';
import ReportsTab from '@/app/blog/ReportsTab';

const TABS = [
  { id: 'articles', label: 'Articles' },
  { id: 'categories', label: 'Categories' },
  { id: 'tags', label: 'Tags' },
  { id: 'media', label: 'Media' },
  { id: 'authors', label: 'Authors' },
  { id: 'distribution', label: 'Distribution' },
  { id: 'reports', label: 'Reports' },
];

/** Blog admin panel — no DashboardLayout (safe for Admin OS embed). */
export default function BlogPageContent({ initialTab } = {}) {
  const [activeTab, setActiveTab] = useState(initialTab && TABS.some((t) => t.id === initialTab) ? initialTab : 'articles');

  useEffect(() => {
    if (initialTab && TABS.some((t) => t.id === initialTab)) {
      setActiveTab(initialTab);
      return;
    }
    if (typeof window === 'undefined') return;
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
  }, [initialTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'articles':
        return <ArticlesTab />;
      case 'categories':
        return <CategoriesTab />;
      case 'tags':
        return <TagsTab />;
      case 'media':
        return <MediaTab />;
      case 'authors':
        return <AuthorsTab />;
      case 'distribution':
        return <DistributionTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <ArticlesTab />;
    }
  };

  return (
    <div className="au-dash-page">
      <div className="au-dash-tabs-underline">
        <nav className="flex space-x-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                  px-6 py-3 text-sm font-medium
                  border-b-2 transition-all duration-300
                  whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'au-dash-tab-underline--active'
                      : 'au-dash-tab-underline'
                  }
                `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {renderContent()}
    </div>
  );
}
