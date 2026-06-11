'use client';

import { useRouter } from 'next/navigation';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { logout, getUser } from '@/lib/auth';
import { useState, useEffect } from 'react';

export default function Navbar({ pageTitle }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="au-dash-navbar">
      <div className="flex items-center justify-between h-full px-3 md:px-4 gap-3 min-w-0">
        <h1 className="au-dash-navbar-title truncate">{pageTitle}</h1>

        <div className="flex items-center gap-3 shrink-0">
          {user?.email ? (
            <span className="au-dash-user-chip hidden sm:block">{user.email}</span>
          ) : null}

          <button
            type="button"
            className="au-dash-icon-btn"
            aria-label="User profile"
            title={user?.email || 'User profile'}
          >
            <FaUserCircle className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="au-dash-icon-btn au-dash-icon-btn--danger"
            aria-label="Logout"
            title="Logout"
          >
            <FaSignOutAlt className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
