import { MatchMode } from '../types';

/**
 * A map of matcher functions that determine if a link is active based on the current URL
 * @type {Map<MatchMode, (pathname: string, url: string, pattern?: RegExp) => boolean>}
 */
export const matchers = new Map<MatchMode, (pathname: string, url: string, pattern?: RegExp) => boolean>([
    ['exact', (pathname, url) => pathname === url],
    ['startsWith', (pathname, url) => pathname.startsWith(url)],
    ['includes', (pathname, url) => pathname.includes(url)],
    ['pattern', (pathname, url, pattern) => pattern ? pattern.test(pathname) : false]
]);

/**
 * Cleans up a URL by ensuring it starts with a forward slash
 * @param {string} url - The URL to clean
 * @returns {string} - The cleaned URL
 */
export const cleanUrl = (url: string): string => {
    if (!url) return '/';
    return url.startsWith('/') ? url : `/${url}`;
};

/**
 * Determine if a link is active based on the location, URL, match mode, and optional pattern
 * @param {string} pathname - Current pathname
 * @param {string} url - URL to match against
 * @param {MatchMode} matchMode - How to match the URL
 * @param {RegExp} [matchPattern] - Optional regex pattern for matching
 * @returns {boolean} - Whether the link is active
 */
export const isActive = (
    pathname: string,
    url: string,
    matchMode: MatchMode = 'includes',
    matchPattern?: RegExp
): boolean => {
    const matchFn = matchers.get(matchMode) || matchers.get('includes');
    return matchFn!(pathname, url, matchPattern);
};

/**
 * Determine if a link is active with a custom function
 * @param {string} pathname - Current pathname
 * @param {string} url - URL to match against
 * @param {(pathname: string, url: string) => boolean} isActiveFunc - Custom active detection function
 * @returns {boolean} - Whether the link is active
 */
export const isActiveWithCustomFn = (
    pathname: string,
    url: string,
    isActiveFunc: (pathname: string, url: string) => boolean
): boolean => {
    return isActiveFunc(pathname, url);
};