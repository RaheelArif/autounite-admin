'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  FaSearch, 
  FaUsers, 
  FaPaperPlane,
  FaTimes 
} from 'react-icons/fa';

const menuItems = [
  { id: 'queries', label: 'Queries', icon: FaSearch },
  { id: 'users', label: 'Users', icon: FaUsers },
  { id: 'request', label: 'Request', icon: FaPaperPlane },
];

export default function Sidebar({ isOpen, onClose, activeTab, setActiveTab }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleItemClick = (itemId) => {
    setActiveTab(itemId);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800/50
          z-50 transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          w-60 md:w-60
          shadow-2xl shadow-blue-500/10
          flex flex-col
        `}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center justify-center">
            <div className="
              p-3 rounded-xl 
          
              transition-all duration-300 ease-in-out
            ">
              <Image
                src="/logo.png"
                alt="Logo"
                width={160}
                height={60}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Header - Mobile Only */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/50 md:hidden">
          <h2 className="text-lg font-bold text-blue-400">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 transition-all duration-300 hover:scale-110"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col gap-2 p-4 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isHovered = hoveredItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-300 ease-in-out
                  group
                  ${isActive 
                    ? 'bg-black text-blue-400' 
                    : 'text-slate-400 hover:text-blue-300'
                  }
                  ${isHovered && !isActive ? 'bg-slate-800/50' : ''}
                  active:scale-95
                `}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full" />
                )}

                {/* Icon with glow effect */}
                <Icon
                  className={`
                    w-5 h-5 transition-all duration-300 ease-in-out
                    ${isActive 
                      ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]' 
                      : 'text-slate-400 group-hover:text-blue-300 group-hover:drop-shadow-[0_0_6px_rgba(96,165,250,0.4)]'
                    }
                    ${isHovered && !isActive ? 'scale-110' : ''}
                  `}
                />

                {/* Label */}
                <span className={`
                  font-medium transition-all duration-300
                  ${isActive ? 'text-blue-400' : 'text-slate-300 group-hover:text-blue-300'}
                `}>
                  {item.label}
                </span>

                {/* Hover Glow Effect */}
                {isHovered && !isActive && (
                  <div className="absolute inset-0 rounded-lg bg-blue-500/10 blur-xl opacity-50 -z-10 transition-opacity duration-300" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer - Optional decorative element */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50">
          <div className="text-xs text-slate-500 text-center">
            Dashboard v1.0
          </div>
        </div>
      </aside>
    </>
  );
}

