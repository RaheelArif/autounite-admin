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

export function enrichLabel(source) {
  if (source === 'autodev') return 'Enriched';
  if (source === 'autodev_empty') return 'Empty closed';
  return source || 'Missing';
}

export function classificationLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}
