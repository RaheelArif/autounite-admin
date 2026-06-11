'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaExternalLinkAlt,
  FaBook,
  FaLanguage,
  FaTimes,
} from 'react-icons/fa';
import DashboardLayout from '@/components/DashboardLayout';
import CollapsibleSection from '@/components/CollapsibleSection';
import {
  getSearchGovernanceLogs,
  getSearchGovernanceStats,
} from '@/lib/searchGovernance';
import {
  listSearchSynonyms,
  createSearchSynonym,
  deleteSearchSynonym,
  toggleSearchSynonym,
} from '@/lib/searchSynonyms';
import { getUser, isAdmin } from '@/lib/auth';
import {
  buildConsumerSearchUrl,
  getConsumerOpenLabel,
  getConsumerBaseUrl,
} from '@/lib/consumerLinks';

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildFilterSummary({ surface, routeMismatch, noResults, weakResult, q }) {
  const parts = [];
  if (surface) parts.push(`Surface: ${surface}`);
  if (routeMismatch === 'true') parts.push('Route mismatch');
  if (noResults === 'true') parts.push('No results');
  if (weakResult === 'true') parts.push('Weak result');
  if (q.trim()) parts.push(`Query: “${q.trim()}”`);
  return parts.length ? parts.join(' · ') : 'No filters applied — click to expand';
}

const PAGE_SIZE = 10;

function DetailLine({ label, value }) {
  if (value == null || value === '' || value === false) return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-[rgba(255,255,255,0.1)] last:border-0">
      <span className="au-dash-text-subtle shrink-0 w-36">{label}</span>
      <span className="au-dash-text break-all">
        {Array.isArray(value) ? value.join(', ') : String(value)}
      </span>
    </div>
  );
}

function GovernanceRowDetail({ row }) {
  const f = row.filters || {};
  const rawQuery = f.raw_query || row.rawQuery || '—';
  const codes = row.governanceCodes || [];
  const warnings = row.intentWarnings || [];
  const isOtdOnResearch = codes.includes('OTD_ON_RESEARCH');
  const isPaymentOnResearch = codes.includes('PAYMENT_ON_RESEARCH');
  const isNearMeOnResearch = codes.includes('NEAR_ME_ON_RESEARCH');
  const ruleSignals = f.rule_signals || {};
  const diagnostics = f.diagnostics || {};

  const parsedFields = [
    ['Residual search text', f.residual_search || f.search],
    ['Make', f.make],
    ['Model', f.model],
    ['Year', f.year],
    ['Year range', f.minYear && f.maxYear ? `${f.minYear}–${f.maxYear}` : f.minYear || f.maxYear],
    ['Body type', f.bodyType || ruleSignals.bodyType],
    ['Fuel type', f.fuelType || ruleSignals.fuelType],
    ['Max price', f.maxPrice ?? ruleSignals.maxPrice],
    ['Min price', f.minPrice ?? ruleSignals.minPrice],
    ['Condition', f.condition],
    ['Drivetrain', f.drivetrain],
    ['Compare mode', f.compare ? 'yes' : null],
    ['Use-case tags', ruleSignals.useCaseTags?.length ? ruleSignals.useCaseTags : null],
    ['Near me (rules)', ruleSignals.localNearMe ? 'yes' : null],
    ['Quality tier', row.qualityTier || diagnostics.quality_tier],
    ['Weak result', row.weakResult || diagnostics.weak_result ? 'yes' : null],
    ['Widened', diagnostics.widened ? 'yes' : null],
    ['No-result reason', diagnostics.no_result_reason],
  ];

  const hasParsed = parsedFields.some(([, v]) => v != null && v !== '' && v !== false);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <p className="font-semibold au-dash-text mb-2">Query</p>
        <p className="au-dash-text-strong bg-[rgba(8,10,18,0.45)] p-2 rounded mb-3 break-words">{rawQuery}</p>
        <p className="font-semibold au-dash-text mb-1">Parsed filters</p>
        {hasParsed ? (
          <div className="bg-[rgba(8,10,18,0.45)] p-2 rounded">
            {parsedFields.map(([label, value]) => (
              <DetailLine key={label} label={label} value={value} />
            ))}
          </div>
        ) : (
          <p className="au-dash-text-subtle text-xs bg-[rgba(8,10,18,0.45)] p-2 rounded">
            Broad research query — parser kept text in search rules (body type, price caps, etc.)
            rather than locking make/model. Re-run a new search after API update for a richer snapshot.
          </p>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <p className="font-semibold au-dash-text mb-1">Governance codes</p>
          {codes.length ? (
            <>
              {(isOtdOnResearch || isPaymentOnResearch || isNearMeOnResearch) && (
                <p className="au-dash-text-subtle text-xs mb-2 leading-relaxed">
                  {isOtdOnResearch &&
                    'OTD / out-the-door queries should run on Cars Near Me (ZIP + listings), not Research inventory.'}
                  {isPaymentOnResearch &&
                    'Monthly payment / lease budget queries should run on Cars Near Me or calculator, not Research.'}
                  {isNearMeOnResearch &&
                    '“Near me” / local inventory belongs on Cars Near Me, not Research.'}
                  {' '}
                  <strong className="au-dash-text-muted">Route</strong> = where it ran;{' '}
                  <strong className="au-dash-text-muted">Expected</strong> = where governance says it should go.
                </p>
              )}
              <ul className="bg-[rgba(8,10,18,0.45)] p-2 rounded space-y-1">
                {codes.map((code) => (
                  <li key={code} className="text-amber-200 font-mono text-xs">
                    {code}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="au-dash-text-subtle text-xs">None — route matched expected target.</p>
          )}
        </div>
        <div>
          <p className="font-semibold au-dash-text mb-1">Intent warnings</p>
          {warnings.length ? (
            <pre className="bg-[rgba(8,10,18,0.45)] p-2 rounded overflow-auto max-h-40 text-xs">
              {JSON.stringify(warnings, null, 2)}
            </pre>
          ) : (
            <p className="au-dash-text-subtle text-xs">None for this query.</p>
          )}
        </div>
        {row.zip ? (
          <DetailLine label="ZIP (CNM)" value={row.zip} />
        ) : null}
      </div>
    </div>
  );
}

export default function SearchGovernancePage() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const [surface, setSurface] = useState('');
  const [routeMismatch, setRouteMismatch] = useState('');
  const [noResults, setNoResults] = useState('');
  const [weakResult, setWeakResult] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [synonyms, setSynonyms] = useState([]);
  const [synFrom, setSynFrom] = useState('');
  const [synTo, setSynTo] = useState('');
  const [synNote, setSynNote] = useState('');
  const [synError, setSynError] = useState('');
  const [synLoading, setSynLoading] = useState(false);
  const [testGuideOpen, setTestGuideOpen] = useState(false);

  const userRole = getUser()?.role || 'user';

  const loadSynonyms = useCallback(async () => {
    try {
      const res = await listSearchSynonyms();
      setSynonyms(res.data || []);
    } catch (err) {
      setSynError(err.message || 'Failed to load synonyms');
    }
  }, []);

  useEffect(() => {
    loadSynonyms();
  }, [loadSynonyms]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setExpandedId(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        getSearchGovernanceLogs({
          surface: surface || undefined,
          routeMismatch: routeMismatch || undefined,
          noResults: noResults || undefined,
          weakResult: weakResult || undefined,
          q: q.trim() || undefined,
          page,
          limit: PAGE_SIZE,
        }),
        getSearchGovernanceStats(),
      ]);
      setRows(listRes.data || []);
      setPagination(listRes.pagination || null);
      setStats(statsRes.stats || null);
    } catch (err) {
      setError(err.message || 'Failed to load');
      setRows([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [surface, routeMismatch, noResults, weakResult, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = () => {
    if (page === 1) load();
    else setPage(1);
  };

  const handleClear = () => {
    setSurface('');
    setRouteMismatch('');
    setNoResults('');
    setWeakResult('');
    setQ('');
    setPage(1);
    setExpandedId(null);
  };

  const selectClass =
    'au-dash-input';

  const filterSummary = buildFilterSummary({
    surface,
    routeMismatch,
    noResults,
    weakResult,
    q,
  });
  const activeSynonymCount = synonyms.filter((s) => s.isActive).length;

  return (
    <DashboardLayout>
      <div className="au-dash-page">
        {!isAdmin() && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-200 text-sm">
            Admin role required. Current role: <strong>{userRole}</strong>
          </div>
        )}

        {testGuideOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setTestGuideOpen(false)}
            role="presentation"
          >
            <div
              className="au-dash-modal w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="search-qa-test-guide-title"
            >
              <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)] sticky top-0 au-dash-modal z-10">
                <h2
                  id="search-qa-test-guide-title"
                  className="text-lg font-semibold au-dash-text-strong flex items-center gap-2"
                >
                  <FaBook className="w-4 h-4 au-dash-text-strong" />
                  How to test (S6)
                </h2>
                <button
                  type="button"
                  onClick={() => setTestGuideOpen(false)}
                  className="p-2 rounded-lg au-dash-text-subtle hover:au-dash-text hover:au-dash-badge"
                  aria-label="Close"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <ol className="list-decimal list-inside space-y-3 text-sm au-dash-text-muted">
                  <li>
                    Start <strong>API</strong> (:3002), <strong>consumer</strong> (:3000),{' '}
                    <strong>admin</strong> (:3001) — admin login with admin role.
                  </li>
                  <li>
                    On consumer: <code className="au-dash-text">/research</code> or{' '}
                    <code className="au-dash-text">/cars-near-me</code> — run a search (chip or type + enter).
                  </li>
                  <li>
                    Refresh this page — new row in the table below. <strong>Total logged</strong> should increase.
                  </li>
                  <li>
                    <strong>FLAGS</strong> empty = healthy (no mismatch / zero results / weak). Bad cases show colored pills.
                  </li>
                  <li>
                    Click a row for detail. Use <strong>Open → Research/CNM</strong> to replay the query on the site.
                  </li>
                  <li>
                    Expand <strong>Filters</strong> to find problem searches (e.g. Route mismatch = Yes).
                  </li>
                  <li>
                    Expand <strong>Synonyms</strong> — add a mapping, then repeat the same query on consumer to verify.
                  </li>
                </ol>
                <p className="text-xs au-dash-text-subtle mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                  Open links use <code className="au-dash-text">{getConsumerBaseUrl()}</code>. For local dev, set{' '}
                  <code className="au-dash-text">NEXT_PUBLIC_CONSUMER_BASE_URL=http://localhost:3000</code> in admin{' '}
                  <code className="au-dash-text">.env</code>.
                </p>
                <button
                  type="button"
                  onClick={() => setTestGuideOpen(false)}
                  className="mt-4 w-full au-dash-btn text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 min-w-[min(100%,16rem)]">
              <div className="au-dash-card p-3">
                <div className="text-xs au-dash-text-subtle">Total logged</div>
                <div className="text-xl font-bold au-dash-text-strong mt-0.5">{stats.total ?? 0}</div>
              </div>
              <div className="au-dash-card p-3">
                <div className="text-xs au-dash-text-subtle">Route mismatch</div>
                <div className="text-xl font-bold text-red-400 mt-0.5">{stats.routeMismatch ?? 0}</div>
              </div>
              <div className="au-dash-card p-3">
                <div className="text-xs au-dash-text-subtle">No results</div>
                <div className="text-xl font-bold text-orange-400 mt-0.5">{stats.noResults ?? 0}</div>
              </div>
              <div className="au-dash-card p-3">
                <div className="text-xs au-dash-text-subtle">Weak result</div>
                <div className="text-xl font-bold text-yellow-400 mt-0.5">{stats.weakResult ?? 0}</div>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setTestGuideOpen(true)}
            className="au-dash-btn au-dash-btn--sm shrink-0"
          >
            <FaBook className="w-4 h-4" />
            How to test
          </button>
        </div>

        <CollapsibleSection
          title="Filters"
          icon={FaFilter}
          defaultOpen={false}
          summary={filterSummary}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm au-dash-text-muted mb-2">Surface</label>
              <select value={surface} onChange={(e) => setSurface(e.target.value)} className={selectClass}>
                <option value="">All</option>
                <option value="research">Research</option>
                <option value="cars_near_me">Cars Near Me</option>
              </select>
            </div>
            <div>
              <label className="block text-sm au-dash-text-muted mb-2">Route mismatch</label>
              <select
                value={routeMismatch}
                onChange={(e) => setRouteMismatch(e.target.value)}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm au-dash-text-muted mb-2">No results</label>
              <select value={noResults} onChange={(e) => setNoResults(e.target.value)} className={selectClass}>
                <option value="">All</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm au-dash-text-muted mb-2">Weak result</label>
              <select value={weakResult} onChange={(e) => setWeakResult(e.target.value)} className={selectClass}>
                <option value="">All</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm au-dash-text-muted mb-2">Query contains</label>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. grand cherokee"
                className={`${selectClass} placeholder-slate-500`}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleApply}
              className="au-dash-btn text-sm font-medium"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="au-dash-btn au-dash-btn--sm text-sm"
            >
              Clear
            </button>
          </div>
        </CollapsibleSection>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-200 text-sm">{error}</div>
        )}

        <div className="au-dash-card overflow-hidden">
          {loading ? (
            <p className="p-8 text-center au-dash-text-subtle">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center au-dash-text-subtle">
              <FaSearch className="w-10 h-10 mx-auto mb-2 opacity-50" />
              No logs yet — run a search on Research or CNM, then refresh.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="au-dash-table-head au-dash-text-subtle uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Surface</th>
                    <th className="px-4 py-3 min-w-[14rem] w-[28%]">Query</th>
                    <th className="px-4 py-3">Intent</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Expected</th>
                    <th className="px-4 py-3">Count</th>
                    <th className="px-4 py-3">Flags</th>
                    <th className="px-4 py-3">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                  {rows.map((row) => (
                    <Fragment key={row._id}>
                      <tr
                        className="hover:bg-white/8 cursor-pointer"
                        onClick={() =>
                          setExpandedId(expandedId === row._id ? null : row._id)
                        }
                      >
                        <td className="px-4 py-3 au-dash-text-muted whitespace-nowrap align-top">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="px-4 py-3 au-dash-text-muted align-top">{row.surface}</td>
                        <td className="px-4 py-3 au-dash-text min-w-[14rem] max-w-md whitespace-normal break-words align-top leading-snug">
                          {row.rawQuery || '—'}
                        </td>
                        <td className="px-4 py-3 au-dash-text-subtle align-top">{row.intent || '—'}</td>
                        <td className="px-4 py-3 au-dash-text-subtle align-top">{row.routeTarget || '—'}</td>
                        <td className="px-4 py-3 au-dash-text-subtle align-top">{row.expectedRoute || '—'}</td>
                        <td className="px-4 py-3 au-dash-text-muted align-top">{row.resultCount ?? 0}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-1">
                            {(row.governanceCodes || []).includes('OTD_ON_RESEARCH') && (
                              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-xs">
                                OTD ON RESEARCH
                              </span>
                            )}
                            {(row.governanceCodes || []).includes('PAYMENT_ON_RESEARCH') && (
                              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-xs">
                                PAYMENT ON RESEARCH
                              </span>
                            )}
                            {(row.governanceCodes || []).includes('NEAR_ME_ON_RESEARCH') && (
                              <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 text-xs">
                                NEAR ME
                              </span>
                            )}
                            {row.routeMismatch &&
                              !(row.governanceCodes || []).some((c) =>
                                ['OTD_ON_RESEARCH', 'PAYMENT_ON_RESEARCH', 'NEAR_ME_ON_RESEARCH'].includes(c)
                              ) && (
                              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-xs">
                                MISMATCH
                              </span>
                            )}
                            {row.noResults && (
                              <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 text-xs">
                                NO RESULTS
                              </span>
                            )}
                            {row.weakResult && (
                              <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-200 text-xs">
                                WEAK
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {(() => {
                            const href = buildConsumerSearchUrl({
                              surface: row.surface,
                              rawQuery: row.rawQuery,
                              zip: row.zip,
                            });
                            if (!href) return <span className="au-dash-text-subtle">—</span>;
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={href}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-xs au-dash-text-strong hover:au-dash-text whitespace-nowrap"
                              >
                                <FaExternalLinkAlt className="w-3 h-3 shrink-0" />
                                {row.surface === 'cars_near_me' ? 'CNM' : 'Research'}
                              </a>
                            );
                          })()}
                        </td>
                      </tr>
                      {expandedId === row._id && (
                        <tr className="bg-[rgba(8,10,18,0.35)]">
                          <td colSpan={9} className="px-4 py-4 text-xs au-dash-text-muted">
                            {(() => {
                              const openUrl = buildConsumerSearchUrl({
                                surface: row.surface,
                                rawQuery: row.rawQuery,
                                zip: row.zip,
                              });
                              return openUrl ? (
                                <a
                                  href={openUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="au-dash-btn au-dash-btn--sm mb-4"
                                >
                                  <FaExternalLinkAlt />
                                  {getConsumerOpenLabel(row.surface)}
                                </a>
                              ) : null;
                            })()}
                            <GovernanceRowDetail row={row} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && pagination && pagination.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[rgba(255,255,255,0.1)] bg-[rgba(8,10,18,0.28)]">
              <span className="au-dash-text-subtle text-sm">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} · {PAGE_SIZE} per page
              </span>
              <div className="flex items-center gap-2">
                <span className="au-dash-text-subtle text-sm mr-1">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="au-dash-btn au-dash-btn--sm disabled:opacity-40 disabled:pointer-events-none au-dash-text flex items-center gap-1 text-sm"
                >
                  <FaChevronLeft /> Prev
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="au-dash-btn au-dash-btn--sm disabled:opacity-40 disabled:pointer-events-none au-dash-text flex items-center gap-1 text-sm"
                >
                  Next <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>

        <CollapsibleSection
          title="Search synonyms"
          icon={FaLanguage}
          defaultOpen={false}
          badge={String(synonyms.length)}
          summary={
            synonyms.length
              ? `${activeSynonymCount} active · ${synonyms.length} total`
              : 'No synonyms — click to add'
          }
        >
          <p className="au-dash-text-subtle text-sm mb-4">
            Replaces phrases in Research and CNM before parsing (e.g.{' '}
            <code className="au-dash-text">3 series</code> → <code className="au-dash-text">3-series</code>).
          </p>
          {synError && (
            <p className="text-red-300 text-sm mb-3">{synError}</p>
          )}
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              placeholder="From phrase"
              value={synFrom}
              onChange={(e) => setSynFrom(e.target.value)}
              className={selectClass}
            />
            <input
              type="text"
              placeholder="To phrase"
              value={synTo}
              onChange={(e) => setSynTo(e.target.value)}
              className={selectClass}
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={synNote}
              onChange={(e) => setSynNote(e.target.value)}
              className={selectClass}
            />
          </div>
          <button
            type="button"
            disabled={synLoading || !synFrom.trim() || !synTo.trim()}
            onClick={async () => {
              setSynLoading(true);
              setSynError('');
              try {
                await createSearchSynonym({
                  from: synFrom.trim(),
                  to: synTo.trim(),
                  note: synNote.trim(),
                });
                setSynFrom('');
                setSynTo('');
                setSynNote('');
                await loadSynonyms();
              } catch (err) {
                setSynError(err.message || 'Create failed');
              } finally {
                setSynLoading(false);
              }
            }}
            className="au-dash-btn au-dash-btn--sm mb-4 text-sm"
          >
            Add synonym
          </button>
          {synonyms.length === 0 ? (
            <p className="au-dash-text-subtle text-sm">No synonyms yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {synonyms.map((row) => (
                <li
                  key={row._id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-[rgba(255,255,255,0.1)]/40"
                >
                  <span className={row.isActive ? 'au-dash-text' : 'au-dash-text-subtle line-through'}>
                    <strong>{row.from}</strong> → <strong>{row.to}</strong>
                    {row.note ? <span className="au-dash-text-subtle ml-2">({row.note})</span> : null}
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs au-dash-text-subtle hover:text-white"
                      onClick={async () => {
                        try {
                          await toggleSearchSynonym(row._id, !row.isActive);
                          await loadSynonyms();
                        } catch (err) {
                          setSynError(err.message || 'Update failed');
                        }
                      }}
                    >
                      {row.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-400 hover:text-red-300"
                      onClick={async () => {
                        if (!window.confirm('Delete this synonym?')) return;
                        try {
                          await deleteSearchSynonym(row._id);
                          await loadSynonyms();
                        } catch (err) {
                          setSynError(err.message || 'Delete failed');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      </div>
    </DashboardLayout>
  );
}
