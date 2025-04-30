import { useMemo } from 'react';
import { MatchMode } from '../types';
import { isActive, isActiveWithCustomFn } from '../utils/matchers';

/**
 * Hook for determining if a link is active based on the current location,
 * with support for custom matching functions and strategies.
 * 
 * @param {string} to - The target URL for the link
 * @param {object} options - Options for determining active state
 * @param {object} options.location - Location object with pathname
 * @param {MatchMode} options.matchMode - How to match the URL ('exact', 'startsWith', 'includes', 'pattern')
 * @param {RegExp} options.matchPattern - Custom regex pattern for matching
 * @param {string} options.customActiveUrl - Custom URL to use for active state detection
 * @param {Function} options.isActiveFunc - Custom active detection function
 * @returns {boolean} - Whether the link is active
 * 
 * @example
 * // Basic usage with location from React Router
 * const location = useLocation();
 * const isActive = useIsActive('/home', { location });
 * 
 * @example
 * // With custom match mode
 * const isActive = useIsActive('/dashboard', { 
 *   location,
 *   matchMode: 'exact'
 * });
 * 
 * @example
 * // With custom function
 * const isActive = useIsActive('/products', {
 *   location,
 *   isActiveFunc: (pathname, url) => pathname.includes(url) && pathname.includes('category')
 * });
 */
export function useIsActive(
    to: string,
    options: {
        location?: Pick<Location, 'pathname'>;
        matchMode?: MatchMode;
        matchPattern?: RegExp;
        customActiveUrl?: string;
        isActiveFunc?: (pathname: string, url: string) => boolean;
    } = {}
): boolean {
    const {
        location,
        matchMode = 'includes',
        matchPattern,
        customActiveUrl,
        isActiveFunc
    } = options;

    return useMemo(() => {
        if (!location?.pathname) return false;

        const urlToMatch = customActiveUrl || to;

        if (isActiveFunc) {
            return isActiveWithCustomFn(location.pathname, urlToMatch, isActiveFunc);
        }

        return isActive(location.pathname, urlToMatch, matchMode, matchPattern);
    }, [location?.pathname, to, matchMode, matchPattern, customActiveUrl, isActiveFunc]);
}