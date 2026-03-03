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
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="
            text-3xl font-bold
            bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500
            bg-clip-text text-transparent
          ">
            Blog
          </h1>
          <p className="text-slate-400 mt-1">
            Manage articles, categories, and tags
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700/50">
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
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
}
