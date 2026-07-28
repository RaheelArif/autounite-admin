'use client';

import { useEffect, useState } from 'react';
import { fetchAdminOsSummary } from '@/lib/adminOsSummaries';

/**
 * Phase 2 card drawer — live GET summary + open existing tool.
 * Never writes; never renames APIs.
 */
export default function AdminOsCardDrawer({ card, filterLabel, onClose, onOpenExisting }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!card?.summaryKey) {
      setSummary(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setSummary(null);

    fetchAdminOsSummary(card.summaryKey)
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [card?.summaryKey, card?.title]);

  const isLinked = Boolean(card?.existingHref);

  return (
    <>
      <div className="aos-overlay" onClick={onClose} aria-hidden />
      <aside className="aos-drawer" role="dialog" aria-modal="true" aria-label={card.title}>
        <div className="aos-drawer__head">
          <div>
            <div className="aos-drawer__eyebrow">Admin OS</div>
            <h2>{card.title}</h2>
          </div>
          <button type="button" className="aos-drawer__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="aos-drawer__body">
          <div className="aos-detail-block">
            <h4>Function</h4>
            <p>{card.purpose}</p>
          </div>

          <div className="aos-detail-block">
            <h4>Status</h4>
            <p>
              {card.status}
              {isLinked
                ? ' — existing admin tool (same /api/v1 routes).'
                : ' — shell card only; live workspace later.'}
            </p>
            <p>
              Filter context:{' '}
              <strong style={{ color: '#fff' }}>{filterLabel || '—'}</strong>
            </p>
          </div>

          {card.summaryKey ? (
            <div className="aos-detail-block aos-live-block">
              <h4>Live snapshot</h4>
              {loading ? (
                <p className="aos-live-state">Loading…</p>
              ) : null}
              {!loading && summary?.status === 'forbidden' ? (
                <p className="aos-live-state aos-live-state--warn">
                  Permission needed — sign in as admin, then reopen.
                  {summary.detail ? (
                    <span className="aos-live-detail">{summary.detail}</span>
                  ) : null}
                </p>
              ) : null}
              {!loading && summary?.status === 'error' ? (
                <p className="aos-live-state aos-live-state--error">
                  {summary.lines?.[0] || 'Error'}
                  {summary.detail ? (
                    <span className="aos-live-detail">{summary.detail}</span>
                  ) : null}
                </p>
              ) : null}
              {!loading && summary?.status === 'empty' ? (
                <ul className="aos-live-list">
                  {(summary.lines || ['Nothing to show yet.']).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
              {!loading && summary?.status === 'ok' ? (
                <ul className="aos-live-list">
                  {(summary.lines || []).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {isLinked ? (
            <button
              type="button"
              className="aos-drawer__cta"
              onClick={() => onOpenExisting(card.existingHref)}
            >
            Open {card.existingLabel || 'existing tool'} inside Admin OS
            </button>
          ) : (
            <p className="aos-stub-note">
              Stub only — no backend change. This card waits for a dedicated workspace in a later
              phase.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
