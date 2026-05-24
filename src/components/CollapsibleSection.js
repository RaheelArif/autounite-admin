'use client';

import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

export default function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  summary,
  badge,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-700/20 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon ? <Icon className="w-4 h-4 text-blue-400 shrink-0" /> : null}
          <span className="font-semibold text-slate-200">{title}</span>
          {badge ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 shrink-0">
              {badge}
            </span>
          ) : null}
        </div>
        <FaChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {!open && summary ? (
        <p className="px-4 pb-3 text-xs text-slate-500 truncate">{summary}</p>
      ) : null}
      {open ? <div className="px-4 pb-4 pt-1 border-t border-slate-700/40">{children}</div> : null}
    </div>
  );
}
