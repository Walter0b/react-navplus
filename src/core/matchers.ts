import type { MatchMode } from './types';

const ABSOLUTE_URL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** `https://x`, `mailto:a@b`, `//cdn.x`: anything the router must not handle. */
export const isAbsoluteUrl = (to: string): boolean => ABSOLUTE_URL.test(to);

/** Splits `/a?x=1#h` into its pathname, `?search` and `#hash` parts. */
export const splitTo = (to: string): { pathname: string; search: string; hash: string } => {
  const hashIndex = to.indexOf('#');
  const hash = hashIndex >= 0 ? to.slice(hashIndex) : '';
  const beforeHash = hashIndex >= 0 ? to.slice(0, hashIndex) : to;
  const searchIndex = beforeHash.indexOf('?');
  const search = searchIndex >= 0 ? beforeHash.slice(searchIndex) : '';
  const pathname = searchIndex >= 0 ? beforeHash.slice(0, searchIndex) : beforeHash;
  return { pathname, search, hash };
};

const safeDecode = (value: string): string => {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
};

/** Leading slash, no trailing slash, decoded, and lower-cased unless `caseSensitive`. */
export const normalizePath = (path: string, caseSensitive = false): string => {
  let normalized = safeDecode(path).replace(/\/{2,}/g, '/');
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (normalized.length > 1 && normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  return caseSensitive ? normalized : normalized.toLowerCase();
};

const segmentsOf = (path: string): string[] => (path === '/' ? [] : path.slice(1).split('/'));

const includesSegments = (path: string, target: string): boolean => {
  const haystack = segmentsOf(path);
  const needle = segmentsOf(target);
  // The root has no segments, so it can only match the root.
  if (needle.length === 0) return haystack.length === 0;
  for (let start = 0; start + needle.length <= haystack.length; start++) {
    if (needle.every((segment, offset) => haystack[start + offset] === segment)) return true;
  }
  return false;
};

/**
 * Whether `pathname` is "on" `url`. `url` may carry a query string or hash; only its
 * pathname is compared.
 */
export const isActive = (
  pathname: string,
  url: string,
  matchMode: MatchMode = 'startsWith',
  matchPattern?: RegExp,
  caseSensitive = false
): boolean => {
  if (matchMode === 'pattern') {
    if (!matchPattern) return false;
    // `test` on a global or sticky regex is stateful and would alternate between calls.
    matchPattern.lastIndex = 0;
    return matchPattern.test(pathname);
  }

  const current = normalizePath(pathname, caseSensitive);
  const target = normalizePath(splitTo(url).pathname, caseSensitive);

  switch (matchMode) {
    case 'exact':
      return current === target;
    case 'includes':
      return includesSegments(current, target);
    default:
      // Every path is under "/", but only the root link should light up there.
      return target === '/' ? current === '/' : current === target || current.startsWith(`${target}/`);
  }
};
