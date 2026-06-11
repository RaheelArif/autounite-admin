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
