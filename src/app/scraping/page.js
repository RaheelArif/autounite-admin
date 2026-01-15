'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ScrapingDashboard from './ScrapingDashboard';
import MakesTable from './MakesTable';
import ModelsTable from './ModelsTable';
import VehiclesTable from './VehiclesTable';
import FailedItemsTable from './FailedItemsTable';

export default function ScrapingPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'makes', label: 'Makes' },
    { id: 'models', label: 'Models' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'failed', label: 'Failed Items' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ScrapingDashboard />;
      case 'makes':
        return <MakesTable />;
      case 'models':
        return <ModelsTable />;
      case 'vehicles':
        return <VehiclesTable />;
      case 'failed':
        return <FailedItemsTable />;
      default:
        return <ScrapingDashboard />;
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
            Fuel API Scraping
          </h1>
          <p className="text-slate-400 mt-1">
            Manage scraping progress, view data, and monitor failed items
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
