'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import CategoriesTab from './CategoriesTab';
import TagsTab from './TagsTab';
import ArticlesTab from './ArticlesTab';

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState('articles');

  const tabs = [
    { id: 'articles', label: 'Articles' },
    { id: 'categories', label: 'Categories' },
    { id: 'tags', label: 'Tags' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'articles':
        return <ArticlesTab />;
      case 'categories':
        return <CategoriesTab />;
      case 'tags':
        return <TagsTab />;
      default:
        return <ArticlesTab />;
    }
  };

  return (
    <DashboardLayout>
      <div className="au-dash-page">
        {/* Tabs */}
        <div className="au-dash-tabs-underline">
          <nav className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
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
    </DashboardLayout>
  );
}
