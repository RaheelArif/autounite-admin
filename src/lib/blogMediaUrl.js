/**
 * Google Drive share links (/view) are HTML pages — browsers cannot use them as
 * <img src>. The lh3 host serves the file as an image with CORS open, which is
 * what hero/OG fields need.
 */
export function extractDriveFileId(value) {
  const url = String(value || '').trim();
  return (
    url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)?.[1] ||
    url.match(/[?&]id=([^&#]+)/)?.[1] ||
    url.match(/lh3\.googleusercontent\.com\/d\/([^/=?#]+)/)?.[1] ||
    ''
  );
}

export function isGoogleDriveUrl(value) {
  return /drive\.google\.com|drive\.usercontent\.google\.com|lh3\.googleusercontent\.com\/d\//i.test(
    String(value || ''),
  );
}

/** True when the stored URL is a Drive share/download page that will break in <img>. */
export function isBrokenDriveEmbedUrl(value) {
  const url = String(value || '');
  if (!isGoogleDriveUrl(url)) return false;
  if (/lh3\.googleusercontent\.com\/d\//i.test(url)) return false;
  return true;
}

export function normalizeMediaUrl(value) {
  const url = String(value || '').trim();
  const driveId = extractDriveFileId(url);
  if (driveId && isGoogleDriveUrl(url)) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }
  return url;
}
