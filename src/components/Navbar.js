'use client';

import { useRouter } from 'next/navigation';
import { FaBars, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { logout, getUser } from '@/lib/auth';
import { useState, useEffect } from 'react';

export default function Navbar({ onMenuClick }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  return (
    <nav className="
      fixed top-0 left-0 right-0 h-16
      bg-slate-900/80 backdrop-blur-md
      border-b border-slate-800/50
      z-30
      shadow-lg shadow-blue-500/5
    ">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left Side - Hamburger & Title */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button (Mobile) */}
          <button
            onClick={onMenuClick}
            className="
              md:hidden
              p-2 rounded-lg
              text-slate-400 hover:text-blue-400
              hover:bg-slate-800/50
              transition-all duration-300 ease-in-out
              active:scale-95
              hover:shadow-lg hover:shadow-blue-500/20
            "
            aria-label="Toggle menu"
          >
            <FaBars className="w-5 h-5" />
          </button>

          {/* Dashboard Title */}
          <h1 className="
            text-xl md:text-2xl font-bold
            bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500
            bg-clip-text text-transparent
            drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]
          ">
            Dashboard
          </h1>
        </div>

        {/* Right Side - User Profile & Logout */}
        <div className="flex items-center gap-3">
          {/* User Email (Desktop) */}
          {user?.email && (
            <span className="
              hidden md:block
              text-sm text-slate-400
              px-3 py-1
              rounded-lg
              bg-slate-800/50
            ">
              {user.email}
            </span>
          )}

          {/* User Profile Icon */}
          <button
            className="
              p-2 rounded-lg
              text-slate-400 hover:text-blue-400
              hover:bg-slate-800/50
              transition-all duration-300 ease-in-out
              active:scale-95
              hover:shadow-lg hover:shadow-blue-500/20
              group
            "
            aria-label="User profile"
            title={user?.email || 'User profile'}
          >
            <FaUserCircle className="
              w-6 h-6
              transition-all duration-300
              group-hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]
            " />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="
              p-2 rounded-lg
              text-slate-400 hover:text-red-400
              hover:bg-slate-800/50
              transition-all duration-300 ease-in-out
              active:scale-95
              hover:shadow-lg hover:shadow-red-500/20
              group
            "
            aria-label="Logout"
            title="Logout"
          >
            <FaSignOutAlt className="
              w-5 h-5
              transition-all duration-300
              group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]
            " />
          </button>
        </div>
      </div>
    </nav>
  );
}

