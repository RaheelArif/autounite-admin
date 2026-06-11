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
    <div className="au-dash-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon ? <Icon className="w-4 h-4 au-dash-text-strong shrink-0" /> : null}
          <span className="font-semibold au-dash-text-strong">{title}</span>
          {badge ? <span className="au-dash-badge shrink-0">{badge}</span> : null}
        </div>
        <FaChevronDown
          className={`w-4 h-4 au-dash-text-subtle shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {!open && summary ? (
        <p className="px-4 pb-3 text-xs au-dash-text-subtle truncate">{summary}</p>
      ) : null}
      {open ? (
        <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'var(--au-dash-border-subtle)' }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
