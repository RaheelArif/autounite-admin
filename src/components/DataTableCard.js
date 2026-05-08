'use client';

import { useMemo, useState } from 'react';

export default function DataTableCard({
  title,
  rows = [],
  columns = [],
  rowKey = '_id',
  onRefresh,
  emptyText = 'No rows found.',
  statusAccessor = (row) => row?.status || '',
  searchAccessor = null,
  rowActions = null,
  renderExpanded = null,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState(columns.find((c) => c.sortable)?.key || '');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedRowKey, setExpandedRowKey] = useState('');

  const statuses = useMemo(() => {
    const set = new Set(rows.map((r) => String(statusAccessor(r) || '').trim()).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [rows, statusAccessor]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = [...rows];
    if (statusFilter !== 'all') {
      list = list.filter((row) => String(statusAccessor(row) || '').trim() === statusFilter);
    }
    if (query) {
      list = list.filter((row) => {
        const haystack =
          typeof searchAccessor === 'function'
            ? String(searchAccessor(row) || '')
            : columns
                .map((col) =>
                  typeof col.searchValue === 'function'
                    ? String(col.searchValue(row) || '')
                    : String(row?.[col.key] || '')
                )
                .join(' ');
        return haystack.toLowerCase().includes(query);
      });
    }

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      list.sort((a, b) => {
        const av =
          typeof col?.sortValue === 'function'
            ? col.sortValue(a)
            : typeof col?.value === 'function'
              ? col.value(a)
              : a?.[sortKey];
        const bv =
          typeof col?.sortValue === 'function'
            ? col.sortValue(b)
            : typeof col?.value === 'function'
              ? col.value(b)
              : b?.[sortKey];
        const aNorm = typeof av === 'string' ? av.toLowerCase() : av ?? '';
        const bNorm = typeof bv === 'string' ? bv.toLowerCase() : bv ?? '';
        if (aNorm < bNorm) return sortDir === 'asc' ? -1 : 1;
        if (aNorm > bNorm) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [rows, search, statusFilter, sortKey, sortDir, columns, statusAccessor, searchAccessor]);

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="px-2 py-1.5 text-xs bg-slate-900/60 border border-slate-700/60 rounded text-slate-100"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 text-xs bg-slate-900/60 border border-slate-700/60 rounded text-slate-100"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All statuses' : status}
              </option>
            ))}
          </select>
          {onRefresh ? (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 text-xs bg-slate-700/70 rounded text-slate-200 hover:brightness-110 cursor-pointer"
            >
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-12 gap-3 text-[11px] uppercase tracking-wide text-slate-400 px-3">
            {columns.map((col) => (
              <div key={col.key} className={col.className || 'col-span-3'}>
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className="cursor-pointer hover:text-slate-200"
                  >
                    {col.label}
                    {sortKey === col.key ? ` ${sortDir === 'asc' ? '▲' : '▼'}` : ''}
                  </button>
                ) : (
                  col.label
                )}
              </div>
            ))}
            <div className="col-span-2">Actions</div>
          </div>

          {filteredRows.map((row) => {
            const key = String(row?.[rowKey] || '');
            const isExpanded = expandedRowKey === key;
            return (
              <div key={key} className="bg-slate-900/50 border border-slate-700/40 rounded p-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  {columns.map((col) => (
                    <div key={col.key} className={col.className || 'md:col-span-3'}>
                      <p className="md:hidden text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                        {col.label}
                      </p>
                      <div className="text-sm text-slate-200">
                        {typeof col.render === 'function'
                          ? col.render(row)
                          : typeof col.value === 'function'
                            ? col.value(row)
                            : String(row?.[col.key] ?? '—')}
                      </div>
                    </div>
                  ))}
                  <div className="md:col-span-2 flex flex-wrap gap-2">
                    {typeof rowActions === 'function' ? rowActions(row) : null}
                    {renderExpanded ? (
                      <button
                        type="button"
                        onClick={() => setExpandedRowKey((prev) => (prev === key ? '' : key))}
                        className="px-2 py-1 text-xs rounded bg-blue-600/80 text-white hover:brightness-110 cursor-pointer"
                      >
                        {isExpanded ? 'Hide' : 'Open'}
                      </button>
                    ) : null}
                  </div>
                </div>
                {renderExpanded && isExpanded ? (
                  <div className="mt-2 p-2 rounded border border-slate-700/60 bg-slate-950/60">
                    {renderExpanded(row)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
