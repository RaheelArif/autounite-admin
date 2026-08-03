'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FaCar,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaPlus,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaSync,
  FaTimes,
} from 'react-icons/fa';
import {
  checkNewInMarket,
  getCatalogMakes,
  getCatalogModels,
  getCatalogVehicleById,
  getCatalogVehicles,
  getCatalogYears,
  ingestMarketGaps,
} from '@/lib/catalog';
import {
  classificationLabel,
  enrichBadgeClass,
  enrichStatusLabel,
  humanizePackageCode,
} from '@/lib/humanizePackage';

const GAP_ADD_TOTAL_MAX = 50;
/** 1 = live status after each vehicle (clearer progress in admin). */
const GAP_ADD_CHUNK = 1;

function enrichBadge(source, classification) {
  return {
    label: enrichStatusLabel(source, classification),
    className: enrichBadgeClass(source),
  };
}

function canonicalBadge(isCanonical) {
  if (isCanonical === false) {
    return { label: 'Dup Fuel ID', className: 'au-cat-badge au-cat-badge--warn' };
  }
  if (isCanonical === true) {
    return { label: 'Shopper', className: 'au-cat-badge au-cat-badge--ok' };
  }
  return { label: 'Unique', className: 'au-cat-badge au-cat-badge--muted' };
}

function groupMissingModels(models) {
  const map = new Map();
  for (const row of models || []) {
    const makeName = row.make || 'Other';
    if (!map.has(makeName)) map.set(makeName, []);
    map.get(makeName).push(row.model);
  }
  return [...map.entries()]
    .map(([makeName, list]) => [makeName, list.sort((a, b) => a.localeCompare(b))])
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

export default function CatalogVehiclesPanel() {
  const [years, setYears] = useState([]);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [enrichStatus, setEnrichStatus] = useState('');
  /** shopper = same as research (hide non-canonical); all = every Fuel ID row */
  const [canonicalScope, setCanonicalScope] = useState('shopper');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortBy, setSortBy] = useState('trim');
  const [sortOrder, setSortOrder] = useState('asc');

  const [yearsLoading, setYearsLoading] = useState(true);
  const [makesLoading, setMakesLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [error, setError] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [marketMsg, setMarketMsg] = useState('');
  const [marketMsgTone, setMarketMsgTone] = useState('warn'); // ok | warn | info | error
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketProgress, setMarketProgress] = useState('');
  const [marketResults, setMarketResults] = useState([]);
  const [gapIngestLoadingYear, setGapIngestLoadingYear] = useState(null);
  /** Live / final status for Add missing (max 50). */
  const [gapIngestRun, setGapIngestRun] = useState(null);

  const autoCheckYears = () => {
    const cy = new Date().getFullYear();
    return [String(cy), String(cy + 1)];
  };

  const makesTotalVehicles = makes.reduce((sum, row) => sum + (row.vehicleCount || 0), 0);
  const modelsTotalVehicles = models.reduce((sum, row) => sum + (row.vehicleCount || 0), 0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setYearsLoading(true);
      setError('');
      try {
        const res = await getCatalogYears();
        if (!cancelled) setYears(res.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load years');
      } finally {
        if (!cancelled) setYearsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!year) {
      setMakes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setMakesLoading(true);
      setError('');
      try {
        const res = await getCatalogMakes(year, { canonicalScope });
        if (!cancelled) setMakes(res.data || []);
      } catch (err) {
        if (!cancelled) {
          setMakes([]);
          setError(err.message || 'Failed to load makes');
        }
      } finally {
        if (!cancelled) setMakesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year, canonicalScope]);

  useEffect(() => {
    if (!year || !make) {
      setModels([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setModelsLoading(true);
      setError('');
      try {
        const res = await getCatalogModels({ year, make, canonicalScope });
        if (!cancelled) setModels(res.data || []);
      } catch (err) {
        if (!cancelled) {
          setModels([]);
          setError(err.message || 'Failed to load models');
        }
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year, make, canonicalScope]);

  const fetchVehicles = useCallback(async () => {
    if (!year || !make) {
      setVehicles([]);
      setPagination(null);
      return;
    }
    setVehiclesLoading(true);
    setError('');
    try {
      const res = await getCatalogVehicles({
        year,
        make,
        model: model || undefined,
        page,
        limit,
        search: searchApplied || undefined,
        enrichStatus: enrichStatus || undefined,
        canonicalScope,
        sortBy,
        sortOrder,
      });
      setVehicles(res.data || []);
      setPagination(res.pagination || null);
    } catch (err) {
      setVehicles([]);
      setPagination(null);
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setVehiclesLoading(false);
    }
  }, [year, make, model, page, limit, searchApplied, enrichStatus, canonicalScope, sortBy, sortOrder]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleYearChange = (value) => {
    setYear(value);
    setMake('');
    setModel('');
    setSearch('');
    setSearchApplied('');
    setPage(1);
    setVehicles([]);
    setPagination(null);
    setMarketMsg('');
    setMarketResults([]);
    setMarketProgress('');
  };

  const handleMakeChange = (value) => {
    setMake(value);
    setModel('');
    setPage(1);
    setMarketMsg('');
    setMarketResults([]);
    setMarketProgress('');
  };

  const handleModelChange = (value) => {
    setModel(value);
    setPage(1);
  };

  const handleApplySearch = () => {
    setSearchApplied(search.trim());
    setPage(1);
  };

  const handleClearFilters = () => {
    setYear('');
    setMake('');
    setModel('');
    setMakes([]);
    setModels([]);
    setVehicles([]);
    setPagination(null);
    setSearch('');
    setSearchApplied('');
    setEnrichStatus('');
    setCanonicalScope('shopper');
    setPage(1);
    setLimit(50);
    setSortBy('trim');
    setSortOrder('asc');
    setError('');
    setMarketMsg('');
    setMarketResults([]);
    setMarketProgress('');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="w-3.5 h-3.5 au-dash-text-subtle" />;
    return sortOrder === 'asc' ? (
      <FaSortUp className="w-3.5 h-3.5 au-dash-text-strong" />
    ) : (
      <FaSortDown className="w-3.5 h-3.5 au-dash-text-strong" />
    );
  };

  const openDetail = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await getCatalogVehicleById(id);
      setDetail(res.data || null);
    } catch (err) {
      setDetail({ error: err.message || 'Failed to load detail' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCheckMarket = async () => {
    const yearsToCheck = autoCheckYears();
    setMarketMsg('');
    setMarketMsgTone('warn');
    setMarketResults([]);
    setGapIngestRun(null);
    setMarketProgress(`Starting scan for ${yearsToCheck.join(' + ')}…`);
    setMarketLoading(true);

    const collected = [];
    try {
      for (let i = 0; i < yearsToCheck.length; i++) {
        const y = yearsToCheck[i];
        setMarketProgress(`Scanning ${y} models vs DB (${i + 1}/${yearsToCheck.length})…`);
        const res = await checkNewInMarket({
          year: y,
          depth: 'models',
        });
        collected.push(res.data || { year: y, hasGaps: false, missingMakes: [], missingModels: [] });
        setMarketResults([...collected]);
      }

      const totalMissingMakes = collected.reduce((n, r) => n + (r.missingMakeCount || 0), 0);
      const totalMissingModels = collected.reduce((n, r) => n + (r.missingModelCount || 0), 0);
      const hasGaps = totalMissingMakes > 0 || totalMissingModels > 0;
      setMarketMsgTone(hasGaps ? 'warn' : 'ok');
      setMarketMsg(
        hasGaps
          ? `Auto-check ${yearsToCheck.join(' + ')}: ${totalMissingMakes} missing make(s), ${totalMissingModels} missing model(s). Nothing written.`
          : `Auto-check ${yearsToCheck.join(' + ')}: no make/model gaps vs Fuel. Nothing written.`
      );
      setMarketProgress('');
    } catch (err) {
      setMarketMsgTone('error');
      setMarketMsg(err.message || 'Market check failed');
      setMarketProgress('');
      if (collected.length) setMarketResults(collected);
    } finally {
      setMarketLoading(false);
    }
  };

  const handleAddMissing = async (result) => {
    const year = result?.year;
    const targets = (result?.missingModels || [])
      .map((row) => ({ make: row.make, model: row.model }))
      .filter((t) => t.make && t.model);

    if (!year || !targets.length) {
      setMarketMsgTone('warn');
      setMarketMsg('No missing models to add for this year.');
      return;
    }

    const ok = window.confirm(
      `Add up to ${GAP_ADD_TOTAL_MAX} missing vehicles for ${year}?\n\n` +
        `${targets.length} missing model(s) queued · writes to DB · may take several minutes.\n` +
        `Live progress updates after each vehicle (cap ${GAP_ADD_TOTAL_MAX}).`
    );
    if (!ok) return;

    setGapIngestLoadingYear(year);
    setMarketMsg('');
    setMarketMsgTone('info');

    let writtenTotal = 0;
    /** Unique make|model that had nothing new to write (not cumulative re-scans). */
    const skippedModels = new Set();
    /** Unique fuel ids skipped by canonical / process guard. */
    const skippedFuelIds = new Set();
    let workingTargets = [...targets];
    const recent = [];

    const pushRecent = (label) => {
      recent.unshift(label);
      if (recent.length > 6) recent.pop();
    };

    const skippedDisplayCount = () => skippedModels.size + skippedFuelIds.size;

    const paint = (partial) => {
      const remaining = Math.max(0, GAP_ADD_TOTAL_MAX - writtenTotal);
      const skipped = skippedDisplayCount();
      const run = {
        year,
        status: 'running',
        written: writtenTotal,
        skipped,
        skippedModels: skippedModels.size,
        target: GAP_ADD_TOTAL_MAX,
        remaining,
        pct: Math.round((writtenTotal / GAP_ADD_TOTAL_MAX) * 100),
        recent: [...recent],
        ...partial,
      };
      setGapIngestRun(run);
      setMarketProgress(
        `Adding ${year}: ${writtenTotal}/${GAP_ADD_TOTAL_MAX} written · ${remaining} left` +
          (skipped ? ` · ${skipped} models already covered` : '') +
          (partial?.phase === 'writing' ? ` · writing #${writtenTotal + 1}…` : '')
      );
    };

    paint({ phase: 'starting' });

    try {
      while (writtenTotal < GAP_ADD_TOTAL_MAX) {
        if (!workingTargets.length) break;
        const remaining = GAP_ADD_TOTAL_MAX - writtenTotal;
        const chunkMax = Math.min(GAP_ADD_CHUNK, remaining);
        paint({ phase: 'writing' });

        const res = await ingestMarketGaps({
          year,
          targets: workingTargets,
          max: chunkMax,
          perModel: 2,
        });
        const data = res.data || {};
        const chunkWritten = data.writtenCount || 0;
        writtenTotal += chunkWritten;

        // Track unique exhausted models (do not sum the same skips every chunk)
        const exhaustedKeys = new Set();
        if (Array.isArray(data.skipped)) {
          for (const s of data.skipped) {
            const key = `${s.make || ''}|${s.model || ''}`.toLowerCase();
            const reason = String(s.reason || '');
            if (
              reason === 'no_new_fuel_vehicles' ||
              reason === 'make_not_in_fuel' ||
              reason === 'model_not_in_fuel'
            ) {
              if (key !== '|') {
                skippedModels.add(key);
                exhaustedKeys.add(key);
              }
            } else if (s.fuelId != null) {
              skippedFuelIds.add(String(s.fuelId));
            } else if (key !== '|') {
              skippedModels.add(key);
            }
          }
        }

        // Drop exhausted targets so next chunk does not re-walk them
        if (exhaustedKeys.size) {
          workingTargets = workingTargets.filter(
            (t) => !exhaustedKeys.has(`${t.make}|${t.model}`.toLowerCase())
          );
        }

        if (Array.isArray(data.written)) {
          for (const w of data.written) {
            pushRecent(`${w.make} ${w.model}${w.trim ? ` ${w.trim}` : ''}`.trim());
          }
        }

        paint({ phase: 'chunk_done' });

        // No new writes this chunk → nothing left to pull from Fuel for these targets
        if (chunkWritten === 0) break;
      }

      const remaining = Math.max(0, GAP_ADD_TOTAL_MAX - writtenTotal);
      const skipped = skippedDisplayCount();
      const doneRun = {
        year,
        status: 'done',
        written: writtenTotal,
        skipped,
        skippedModels: skippedModels.size,
        target: GAP_ADD_TOTAL_MAX,
        remaining,
        pct: Math.round((writtenTotal / GAP_ADD_TOTAL_MAX) * 100),
        recent: [...recent],
        phase: 'done',
      };
      setGapIngestRun(doneRun);

      setMarketMsgTone(writtenTotal > 0 ? 'ok' : 'warn');
      setMarketMsg(
        writtenTotal > 0
          ? `Batch complete for ${year}: ${writtenTotal}/${GAP_ADD_TOTAL_MAX} added` +
              (skipped
                ? ` · ${skipped} queued model(s) already covered / no new Fuel rows`
                : '') +
              (remaining > 0 && writtenTotal < GAP_ADD_TOTAL_MAX
                ? ` · stopped early (no more new Fuel rows for queued models)`
                : writtenTotal >= GAP_ADD_TOTAL_MAX
                  ? ` · cap reached`
                  : '') +
              '. Re-run Check market gaps to refresh the missing list.'
          : `No new vehicles written for ${year}` +
              (skipped
                ? ` (${skipped} model(s) already covered or blocked by canonical guard)`
                : '') +
              '.'
      );
      setMarketProgress('');
    } catch (err) {
      setGapIngestRun({
        year,
        status: 'error',
        written: writtenTotal,
        skipped: skippedDisplayCount(),
        skippedModels: skippedModels.size,
        target: GAP_ADD_TOTAL_MAX,
        remaining: Math.max(0, GAP_ADD_TOTAL_MAX - writtenTotal),
        pct: Math.round((writtenTotal / GAP_ADD_TOTAL_MAX) * 100),
        recent: [...recent],
        phase: 'error',
        error: err.message || 'ingest failed',
      });
      setMarketMsgTone('error');
      setMarketMsg(
        `Add missing stopped for ${year} after ${writtenTotal}/${GAP_ADD_TOTAL_MAX} written: ${err.message || 'ingest failed'}`
      );
      setMarketProgress('');
    } finally {
      setGapIngestLoadingYear(null);
    }
  };

  const totalPages = pagination?.totalPages || 0;
  const totalVehicles = pagination?.total ?? 0;
  const checkYearsLabel = autoCheckYears().join(' + ');

  return (
    <div className="au-cat-page">
      <div className="au-cat-hero">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="au-cat-hero__title">
              <FaCar className="w-5 h-5 au-cat-hero__title-icon" />
              Vehicle catalog
            </h2>
            <p className="au-cat-hero__sub">
              Browse inventory by year → make → model. Use Check market gaps anytime — manually
              triggered, detect-only (nothing written). Default years: current + next.
            </p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-1.5">
            <button
              type="button"
              onClick={handleCheckMarket}
              disabled={marketLoading}
              className="au-cat-btn-primary"
            >
              <FaSync className={`w-3.5 h-3.5 ${marketLoading ? 'animate-spin' : ''}`} />
              {marketLoading ? 'Checking…' : 'Check market gaps'}
            </button>
            <span className="au-cat-btn-hint">Market check: {checkYearsLabel.replace(' + ', '–')}</span>
          </div>
        </div>

        {marketProgress ? <div className="au-cat-banner au-cat-banner--info mt-3">{marketProgress}</div> : null}

        {marketMsg ? (
          <div
            className={`au-cat-banner mt-3 ${
              marketMsgTone === 'ok'
                ? 'au-cat-banner--ok'
                : marketMsgTone === 'error'
                  ? 'au-cat-banner--error'
                  : marketMsgTone === 'info'
                    ? 'au-cat-banner--info'
                    : 'au-cat-banner--warn'
            }`}
          >
            {marketMsg}
          </div>
        ) : null}

        {gapIngestRun ? (
          <div
            className={`au-cat-ingest-status mt-3 ${
              gapIngestRun.status === 'done'
                ? 'au-cat-ingest-status--done'
                : gapIngestRun.status === 'error'
                  ? 'au-cat-ingest-status--error'
                  : 'au-cat-ingest-status--running'
            }`}
          >
            <div className="au-cat-ingest-status__head">
              <strong>
                {gapIngestRun.status === 'running'
                  ? `Adding missing · ${gapIngestRun.year}`
                  : gapIngestRun.status === 'done'
                    ? `Batch complete · ${gapIngestRun.year}`
                    : `Stopped · ${gapIngestRun.year}`}
              </strong>
              <span>
                {gapIngestRun.written}/{gapIngestRun.target} written · {gapIngestRun.remaining} left
                {gapIngestRun.skipped
                  ? ` · ${gapIngestRun.skipped} already covered`
                  : ''}
              </span>
            </div>
            <div className="au-cat-ingest-bar" aria-hidden>
              <div
                className="au-cat-ingest-bar__fill"
                style={{ width: `${Math.min(100, gapIngestRun.pct || 0)}%` }}
              />
            </div>
            {gapIngestRun.phase === 'writing' ? (
              <p className="au-cat-ingest-status__note">
                Writing vehicle #{(gapIngestRun.written || 0) + 1} of {gapIngestRun.target}… (Fuel + EPA + enrich)
              </p>
            ) : null}
            {gapIngestRun.recent?.length ? (
              <ul className="au-cat-ingest-status__recent">
                {gapIngestRun.recent.map((label, idx) => (
                  <li key={`${idx}-${label}`}>{label}</li>
                ))}
              </ul>
            ) : null}
            {gapIngestRun.error ? (
              <p className="au-cat-ingest-status__note">{gapIngestRun.error}</p>
            ) : null}
          </div>
        ) : null}

        {marketResults.length > 0 ? (
          <div className="au-cat-gap-grid mt-4">
            {marketResults.map((result) => {
              const modelGroups = groupMissingModels(result.missingModels);
              return (
                <div
                  key={result.year}
                  className={`au-cat-gap-card ${result.hasGaps ? 'au-cat-gap-card--warn' : 'au-cat-gap-card--ok'}`}
                >
                  <div className="au-cat-gap-card__head">
                    <h3 className="au-cat-gap-card__year">{result.year}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`au-cat-badge ${result.hasGaps ? 'au-cat-badge--warn' : 'au-cat-badge--ok'}`}>
                        {result.hasGaps ? 'Gaps found' : 'In sync'}
                      </span>
                      {result.hasGaps && (result.missingModelCount || 0) > 0 ? (
                        <button
                          type="button"
                          className="au-cat-btn-primary"
                          style={{ minHeight: '2rem', padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                          disabled={
                            marketLoading ||
                            gapIngestLoadingYear != null ||
                            !(result.missingModels || []).length
                          }
                          onClick={() => handleAddMissing(result)}
                          title={`Write up to ${GAP_ADD_TOTAL_MAX} new Fuel vehicles for missing models`}
                        >
                          <FaPlus className={`w-3 h-3 ${gapIngestLoadingYear === result.year ? 'animate-spin' : ''}`} />
                          {gapIngestLoadingYear === result.year
                            ? `${gapIngestRun?.written ?? 0}/${GAP_ADD_TOTAL_MAX}…`
                            : `Add missing (max ${GAP_ADD_TOTAL_MAX})`}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="au-cat-metrics">
                    <div className="au-cat-metric au-cat-metric--amber">
                      <div className="au-cat-metric__label">Missing makes</div>
                      <div className="au-cat-metric__value">{result.missingMakeCount ?? 0}</div>
                    </div>
                    <div className="au-cat-metric au-cat-metric--copper">
                      <div className="au-cat-metric__label">Missing models</div>
                      <div className="au-cat-metric__value">{result.missingModelCount ?? 0}</div>
                    </div>
                    <div className="au-cat-metric au-cat-metric--purple">
                      <div className="au-cat-metric__label">Scanned</div>
                      <div className="au-cat-metric__value" style={{ fontSize: '1rem' }}>
                        {result.makesScannedForModels ?? 0}
                      </div>
                      <div className="au-cat-metric__sub">{result.fuelModelCount ?? 0} Fuel models</div>
                    </div>
                  </div>

                  {result.missingMakes?.length ? (
                    <div>
                      <div className="au-cat-section-label">Missing makes</div>
                      <ul className="au-cat-chip-row">
                        {result.missingMakes.map((row) => (
                          <li key={`${result.year}-${row.fuelMakeId || row.make}`} className="au-cat-chip au-cat-chip--make">
                            {row.make}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {modelGroups.length ? (
                    <div>
                      <div className="au-cat-section-label">
                        Missing models by make ({result.missingModelCount})
                      </div>
                      <div className="au-cat-model-groups">
                        {modelGroups.map(([makeName, modelNames]) => (
                          <div key={`${result.year}-${makeName}`} className="au-cat-model-group">
                            <div className="au-cat-model-group__head">
                              <span className="au-cat-model-group__make">{makeName}</span>
                              <span className="au-cat-model-group__count">{modelNames.length} models</span>
                            </div>
                            <ul className="au-cat-chip-row" style={{ maxHeight: '4.5rem' }}>
                              {modelNames.map((modelName) => (
                                <li key={`${result.year}-${makeName}-${modelName}`} className="au-cat-chip au-cat-chip--model">
                                  {modelName}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <p className="au-cat-footer-note">
                    Check = detect only · Add missing = controlled write (max {GAP_ADD_TOTAL_MAX}) ·{' '}
                    {result.lastCheckedAt ? new Date(result.lastCheckedAt).toLocaleString() : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="au-cat-stats mt-4">
          <div className="au-cat-stat au-cat-stat--purple">
            <div className="au-cat-stat__label">Years in DB</div>
            <div className="au-cat-stat__value">{yearsLoading ? '…' : years.length}</div>
            <div className="au-cat-stat__hint">
              {years.length ? `${years[years.length - 1]}–${years[0]}` : '—'}
            </div>
          </div>
          <div className="au-cat-stat au-cat-stat--amber">
            <div className="au-cat-stat__label">{year ? `Makes · ${year}` : 'Makes'}</div>
            <div className="au-cat-stat__value">{!year ? '—' : makesLoading ? '…' : makes.length}</div>
            <div className="au-cat-stat__hint">{year ? `${makesTotalVehicles} vehicles` : 'Pick a year'}</div>
          </div>
          <div className="au-cat-stat au-cat-stat--info">
            <div className="au-cat-stat__label">{make ? `Models · ${make}` : 'Models'}</div>
            <div className="au-cat-stat__value">{!make ? '—' : modelsLoading ? '…' : models.length}</div>
            <div className="au-cat-stat__hint">{make ? `${modelsTotalVehicles} vehicles` : 'Pick a make'}</div>
          </div>
          <div className="au-cat-stat au-cat-stat--success">
            <div className="au-cat-stat__label">Table rows</div>
            <div className="au-cat-stat__value">{!year || !make ? '—' : vehiclesLoading ? '…' : totalVehicles}</div>
            <div className="au-cat-stat__hint">
              {pagination ? `Page ${pagination.page}/${pagination.totalPages || 1}` : 'After year + make'}
            </div>
          </div>
        </div>

        <div className="au-cat-filters">
          <div className="au-cat-filters__label">
            <FaFilter className="w-3.5 h-3.5" />
            Browse filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
            <div>
              <label className="au-cat-field-label">Year *</label>
              <select
                value={year}
                onChange={(e) => handleYearChange(e.target.value)}
                disabled={yearsLoading}
                className="w-full px-3 py-2 rounded-lg au-dash-input au-dash-text-strong focus:outline-none focus:ring-2 focus:ring-[rgba(124,58,237,0.45)]"
              >
                <option value="">Select year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="au-cat-field-label">Make *</label>
              <select
                value={make}
                onChange={(e) => handleMakeChange(e.target.value)}
                disabled={!year || makesLoading}
                className="w-full px-3 py-2 rounded-lg au-dash-input au-dash-text-strong focus:outline-none focus:ring-2 focus:ring-[rgba(124,58,237,0.45)]"
              >
                <option value="">{!year ? 'Select year first' : makesLoading ? 'Loading…' : 'Select make'}</option>
                {makes.map((row) => (
                  <option key={row.make} value={row.make}>{row.make} ({row.vehicleCount})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="au-cat-field-label">Model</label>
              <select
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={!make || modelsLoading}
                className="w-full px-3 py-2 rounded-lg au-dash-input au-dash-text-strong focus:outline-none focus:ring-2 focus:ring-[rgba(124,58,237,0.45)]"
              >
                <option value="">{!make ? 'Select make first' : modelsLoading ? 'Loading…' : 'All models'}</option>
                {models.map((row) => (
                  <option key={row.model} value={row.model}>{row.model} ({row.vehicleCount})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="au-cat-field-label">Enrichment status</label>
              <select
                value={enrichStatus}
                onChange={(e) => { setEnrichStatus(e.target.value); setPage(1); }}
                disabled={!make}
                className="w-full px-3 py-2 rounded-lg au-dash-input au-dash-text-strong focus:outline-none focus:ring-2 focus:ring-[rgba(124,58,237,0.45)]"
              >
                <option value="">All</option>
                <option value="autodev">Enriched</option>
                <option value="autodev_empty">Needs review / no package data</option>
                <option value="missing">Pending</option>
              </select>
            </div>
            <div>
              <label className="au-cat-field-label">Catalog view</label>
              <select
                value={canonicalScope}
                onChange={(e) => { setCanonicalScope(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg au-dash-input au-dash-text-strong focus:outline-none focus:ring-2 focus:ring-[rgba(124,58,237,0.45)]"
              >
                <option value="shopper">Shopper view (1 per trim)</option>
                <option value="all">All Fuel IDs (incl. dups)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="au-cat-field-label">Search</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplySearch(); }}
                    disabled={!make}
                    placeholder="Make, model, trim, Fuel API id…"
                    className="w-full px-3 py-2 rounded-lg au-dash-input au-dash-text-strong placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[rgba(124,58,237,0.45)]"
                  />
                </div>
                <button type="button" onClick={handleApplySearch} disabled={!make} className="au-cat-btn-primary disabled:opacity-40" style={{ minHeight: '2.5rem', padding: '0.5rem 0.85rem' }}>
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={!make && !year}
                  className="px-3 py-2 rounded-lg border text-sm disabled:opacity-40"
                  style={{ borderColor: 'var(--au-cat-amber-border)', background: 'var(--au-cat-amber-soft)', color: 'var(--au-cat-amber-light)' }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm flex items-start gap-2">
          <FaExclamationTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="au-cat-table-shell">
        <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm au-dash-text">
            {!year || !make ? (
              <span className="au-dash-text-muted">Select a year and make to load vehicles.</span>
            ) : (
              <>
                Matching vehicles:{' '}
                <span className="au-dash-text-strong font-semibold">{vehicles.length}</span> of{' '}
                <span className="au-dash-text-strong font-semibold">{totalVehicles}</span>
                {model ? (
                  <>
                    {' '}
                    for <span className="au-dash-text-strong">{year} {make} {model}</span>
                  </>
                ) : (
                  <>
                    {' '}
                    for <span className="au-dash-text-strong">{year} {make}</span>
                  </>
                )}
                <span className="au-dash-text-muted">
                  {' '}
                  · {canonicalScope === 'all' ? 'all Fuel IDs' : 'shopper view'}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs au-dash-text-muted">Per page</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              disabled={!make}
              className="px-2 py-1.5 rounded-lg au-dash-input text-sm au-dash-text-strong"
            >
              {[25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left au-dash-text-muted">
                {[
                  ['year', 'Year'],
                  ['make', 'Make'],
                  ['model', 'Model'],
                  ['trim', 'Trim'],
                ].map(([field, label]) => (
                  <th key={field} className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort(field)}
                      className="inline-flex items-center gap-1.5 hover:text-white"
                    >
                      {label}
                      {getSortIcon(field)}
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Body</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Fuel ID</th>
                <th className="px-4 py-3 font-medium">Shopper</th>
                <th className="px-4 py-3 font-medium">EPA</th>
                <th className="px-4 py-3 font-medium">Enrichment</th>
                <th className="px-4 py-3 font-medium">Packages</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('updatedAt')}
                    className="inline-flex items-center gap-1.5 hover:text-white"
                  >
                    Updated
                    {getSortIcon('updatedAt')}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehiclesLoading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center au-dash-text-muted">
                    Loading vehicles…
                  </td>
                </tr>
              ) : !year || !make ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center au-dash-text-muted">
                    Choose year and make to browse the catalog.
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center au-dash-text-muted">
                    No vehicles match these filters.
                  </td>
                </tr>
              ) : (
                vehicles.map((row) => {
                  const badge = enrichBadge(row.enrich?.source, row.enrich?.classification);
                  const shopper = canonicalBadge(row.isCanonical);
                  return (
                    <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 au-dash-text-strong whitespace-nowrap">{row.year}</td>
                      <td className="px-4 py-3 au-dash-text">{row.make}</td>
                      <td className="px-4 py-3 au-dash-text">{row.model}</td>
                      <td className="px-4 py-3 au-dash-text-muted">{row.trim || '—'}</td>
                      <td className="px-4 py-3 au-dash-text-muted">
                        <div>{row.bodyType || '—'}</div>
                        {row.fuelApiBodyType &&
                        String(row.fuelApiBodyType).toLowerCase() !== String(row.bodyType || '').toLowerCase() ? (
                          <div className="text-[10px] au-dash-text-subtle mt-0.5" title="Raw Fuel API bodytype">
                            Fuel: {row.fuelApiBodyType}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 au-dash-text-strong font-mono text-xs whitespace-nowrap">
                        {row.fuelApiVehicleId || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={shopper.className}>{shopper.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {row.dataSource?.fueleconomy ? (
                          <FaCheckCircle className="w-4 h-4 text-emerald-400" title="EPA mapped" />
                        ) : (
                          <span className="au-dash-text-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex text-xs px-2 py-0.5 rounded ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 au-dash-text-strong">{row.enrich?.packageFlags ?? 0}</td>
                      <td className="px-4 py-3 au-dash-text-muted whitespace-nowrap text-xs">
                        {formatDate(row.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openDetail(row.id)}
                          className="au-cat-btn-ghost"
                        >
                          <FaEye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {year && make && totalPages > 1 ? (
          <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1 || vehiclesLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-sm disabled:opacity-40 au-dash-text"
            >
              <FaChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <div className="text-sm au-dash-text-muted">
              Page {page} of {totalPages}
            </div>
            <button
              type="button"
              disabled={page >= totalPages || vehiclesLoading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-sm disabled:opacity-40 au-dash-text"
            >
              Next
              <FaChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      {detailOpen ? (
        <div className="au-cat-modal-backdrop" onClick={() => setDetailOpen(false)}>
          <div
            className="au-cat-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Vehicle detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="au-cat-modal__head">
              <h3 className="au-cat-modal__title">Vehicle detail</h3>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="au-cat-modal__close"
                aria-label="Close"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <div className="au-cat-modal__body">
              {detailLoading ? (
                <p className="au-dash-text-muted text-sm">Loading…</p>
              ) : detail?.error ? (
                <p className="text-red-300 text-sm">{detail.error}</p>
              ) : detail ? (
                <>
                  <h4 className="au-cat-modal__vehicle">
                    {[detail.year, detail.make, detail.model, detail.trim].filter(Boolean).join(' ')}
                  </h4>

                  <div className="au-cat-modal__meta">
                    <span
                      className={`au-cat-modal__pill ${
                        detail.enrich?.source === 'autodev'
                          ? 'au-cat-modal__pill--ok'
                          : detail.enrich?.source === 'autodev_empty'
                            ? 'au-cat-modal__pill--warn'
                            : 'au-cat-modal__pill--info'
                      }`}
                    >
                      {enrichStatusLabel(detail.enrich?.source, detail.enrich?.classification)}
                    </span>
                    {detail.enrich?.classification ? (
                      <span className="au-cat-modal__pill au-cat-modal__pill--purple">
                        {classificationLabel(detail.enrich.classification)}
                      </span>
                    ) : null}
                    {detail.dataSource?.fueleconomy ? (
                      <span className="au-cat-modal__pill au-cat-modal__pill--info">EPA mapped</span>
                    ) : null}
                    <span
                      className={`au-cat-modal__pill ${
                        detail.isCanonical === false
                          ? 'au-cat-modal__pill--warn'
                          : 'au-cat-modal__pill--ok'
                      }`}
                    >
                      {canonicalBadge(detail.isCanonical).label}
                    </span>
                    <span className="au-cat-modal__pill au-cat-modal__pill--warn">
                      {(detail.packages?.count ?? 0)} packages
                    </span>
                  </div>

                  <div className="au-cat-modal__grid">
                    <div className="au-cat-modal__field">
                      <span className="au-cat-modal__field-label">Fuel API id</span>
                      <span className="au-cat-modal__field-value">{detail.fuelApiVehicleId || '—'}</span>
                    </div>
                    <div className="au-cat-modal__field">
                      <span className="au-cat-modal__field-label">EPA id</span>
                      <span className="au-cat-modal__field-value">{detail.fueleconomyVehicleId || '—'}</span>
                    </div>
                    <div className="au-cat-modal__field">
                      <span className="au-cat-modal__field-label">Identity key</span>
                      <span className="au-cat-modal__field-value" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                        {detail.vehicleIdentityKey || '—'}
                      </span>
                    </div>
                    <div className="au-cat-modal__field">
                      <span className="au-cat-modal__field-label">Body (stored)</span>
                      <span className="au-cat-modal__field-value">{detail.bodyType || '—'}</span>
                    </div>
                    <div className="au-cat-modal__field">
                      <span className="au-cat-modal__field-label">Body (Fuel raw)</span>
                      <span className="au-cat-modal__field-value">{detail.fuelApiBodyType || '—'}</span>
                    </div>
                    <div className="au-cat-modal__field">
                      <span className="au-cat-modal__field-label">Drivetrain</span>
                      <span className="au-cat-modal__field-value">{detail.drivetrain || '—'}</span>
                    </div>
                    <div className="au-cat-modal__field">
                      <span className="au-cat-modal__field-label">Technical enrich reason</span>
                      <span className="au-cat-modal__field-value" style={{ fontSize: '0.75rem' }}>
                        {[detail.enrich?.source || 'none', detail.enrich?.classification || '—']
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                    <div className="au-cat-modal__field">
                      <span className="au-cat-modal__field-label">Enriched at</span>
                      <span className="au-cat-modal__field-value">
                        {formatDate(detail.enrich?.enrichedAt)}
                      </span>
                    </div>
                    <div className="au-cat-modal__field">
                      <span className="au-cat-modal__field-label">Updated</span>
                      <span className="au-cat-modal__field-value">{formatDate(detail.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="au-cat-modal__packages">
                    <div className="au-cat-modal__packages-head">
                      <h5 className="au-cat-modal__packages-title">Packages</h5>
                      <span className="au-cat-modal__packages-count">
                        {detail.packages?.count ?? 0}
                      </span>
                    </div>
                    {detail.packages?.codes?.length ? (
                      <ul className="au-cat-package-list">
                        {detail.packages.codes.map((code) => (
                          <li key={code} className="au-cat-package-card">
                            <span className="au-cat-package-card__name">
                              {humanizePackageCode(code)}
                            </span>
                            <span className="au-cat-package-card__code">{code}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="au-cat-package-empty">No package flags on this vehicle.</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
