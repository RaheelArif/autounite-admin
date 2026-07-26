/**
 * Turn camelCase / snake_case package codes into readable labels.
 * e.g. dynamicPlusPackage → Dynamic Plus Package
 */
export function humanizePackageCode(code) {
  const raw = String(code || '').trim();
  if (!raw) return '';

  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
    .replace(/\bPackage\b/gi, 'Package')
    .replace(/\bPkg\b/gi, 'Package');
}

/** Admin-facing enrichment status (technical source/classification stay in View). */
export function enrichStatusLabel(source, classification) {
  if (source === 'autodev') return 'Enriched';
  if (source === 'autodev_empty') {
    const c = String(classification || '').toLowerCase();
    if (c === 'vin_unresolved') return 'Source unresolved';
    if (c === 'no_usable_depth') return 'No package data';
    return 'Needs review';
  }
  return 'Pending';
}

/** @deprecated prefer enrichStatusLabel(source, classification) */
export function enrichLabel(source) {
  return enrichStatusLabel(source, null);
}

/** Human label for classification; raw code still shown in details. */
export function classificationLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  const key = raw.toLowerCase();
  if (key === 'packages_confirmed') return 'Packages confirmed';
  if (key === 'vin_unresolved') return 'Source unresolved';
  if (key === 'no_usable_depth') return 'No package data';
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function enrichBadgeClass(source) {
  if (source === 'autodev') return 'au-cat-enrich--ok';
  if (source === 'autodev_empty') return 'au-cat-enrich--empty';
  return 'au-cat-enrich--missing';
}
