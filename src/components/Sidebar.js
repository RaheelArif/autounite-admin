'use client';

import Image from 'next/image';
import {
  FaUsers,
  FaDatabase,
  FaBook,
  FaStore,
  FaSearch,
} from 'react-icons/fa';
import { ADMIN_NAV_ITEMS } from '@/config/adminNav';

const NAV_ICONS = {
  'search-governance': FaSearch,
  blog: FaBook,
  users: FaUsers,
  'dealer-bootstrap': FaStore,
  scraping: FaDatabase,
};

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="au-dash-sidebar fixed top-0 left-0 h-full z-50 flex flex-col">
      <div className="au-dash-sidebar__brand">
        <Image
          src="/logo.png"
          alt="Logo"
          width={140}
          height={40}
          className="object-contain h-9 w-auto max-w-[9.5rem]"
          priority
        />
      </div>

      <nav className="flex flex-col gap-2 p-4 flex-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.id];
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`au-dash-nav-item ${isActive ? 'au-dash-nav-item--active' : ''}`}
            >
              {Icon ? <Icon className="w-5 h-5 shrink-0" aria-hidden /> : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t au-dash-divider">
        <div className="text-xs au-dash-text-subtle text-center">Dashboard v1.0</div>
      </div>
    </aside>
  );
}
