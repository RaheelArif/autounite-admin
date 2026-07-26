'use client';

import Image from 'next/image';
import {
  FaUsers,
  FaBook,
  FaStore,
  FaSearch,
  FaHandshake,
  FaCar,
} from 'react-icons/fa';
import { ADMIN_NAV_ITEMS } from '@/config/adminNav';

const NAV_ICONS = {
  'search-governance': FaSearch,
  blog: FaBook,
  users: FaUsers,
  'dealer-beta': FaHandshake,
  'dealer-bootstrap': FaStore,
  catalog: FaCar,
};

/** Soft divider before ops / vehicles section. */
function withDividers(items) {
  const out = [];
  for (const item of items) {
    if (item.id === 'catalog' || item.id === 'dealer-beta') {
      out.push({ type: 'divider', id: `div-before-${item.id}` });
    }
    out.push(item);
  }
  return out;
}

export default function Sidebar({ activeTab, setActiveTab }) {
  const entries = withDividers(ADMIN_NAV_ITEMS);

  return (
    <aside className="os-sidebar au-admin-sidebar" aria-label="Admin navigation">
      <div className="os-sidebar-logo">
        <Image
          src="/au-mark-white.png"
          alt="AutoUnite"
          width={140}
          height={57}
          className="os-sidebar-logo-img"
          priority
        />
      </div>

      <nav className="os-sidebar-nav">
        {entries.map((entry) => {
          if (entry.type === 'divider') {
            return (
              <div
                key={entry.id}
                className="os-sidebar-divider"
                role="separator"
                aria-hidden="true"
              />
            );
          }

          const Icon = NAV_ICONS[entry.id];
          const isActive = activeTab === entry.id;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setActiveTab(entry.id)}
              className={`os-nav-link${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {Icon ? <Icon className="os-nav-icon" aria-hidden /> : null}
              <span className="os-nav-label">{entry.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="os-sidebar-footer">
        <p className="os-sidebar-follow-label">Admin</p>
      </div>
    </aside>
  );
}
