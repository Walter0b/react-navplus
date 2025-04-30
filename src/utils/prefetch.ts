import { PrefetchOptions, RouterType } from '../types';

/**
 * Default prefetch options
 */
export const defaultPrefetchOptions: PrefetchOptions = {
    enabled: true,
    delay: 200,
    routerType: 'react-router'
};

/**
 * Normalized prefetch options from prop
 * @param {boolean | PrefetchOptions | undefined} prefetch - The prefetch prop value
 * @returns {PrefetchOptions} - Normalized prefetch options
 */
export const normalizePrefetchOptions = (prefetch: boolean | PrefetchOptions | undefined): PrefetchOptions => {
    if (typeof prefetch === 'boolean') {
        return { ...defaultPrefetchOptions, enabled: prefetch };
    }
    return { ...defaultPrefetchOptions, ...prefetch };
};

/**
 * Implementation of prefetch logic for different router libraries
 * @param {string} url - The URL to prefetch
 * @param {RouterType} routerType - The router library to use
 * @param {boolean} isExternal - Whether the URL is external
 * @param {any} routerContext - Router context for accessing router instance
 * @param {(to: string) => void} [customPrefetch] - Custom prefetch function
 * @returns {boolean} - Whether the prefetch was successful
 */
export const executePrefetch = (
    url: string,
    routerType: RouterType,
    isExternal: boolean,
    routerContext?: any,
    customPrefetch?: (to: string) => void
): boolean => {
    // For external URLs, we can't prefetch
    if (isExternal) return false;

    if (routerType === 'custom' && customPrefetch) {
        // Use custom prefetch function if provided
        customPrefetch(url);
        return true;
    }

    try {
        switch (routerType) {
            case 'react-router': {
                // React Router v6 prefetching
                // This is a simple implementation - React Router doesn't have official prefetching
                // but we can preload the component by requesting the URL in the background
                const prefetchReactRouter = () => {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = url;
                    link.as = 'document';
                    document.head.appendChild(link);

                    // Also try preconnect
                    const preconnect = document.createElement('link');
                    preconnect.rel = 'preconnect';
                    preconnect.href = new URL(url, window.location.origin).origin;
                    document.head.appendChild(preconnect);
                };

                prefetchReactRouter();
                break;
            }

            case 'tanstack-router': {
                // TanStack Router has built-in prefetching via the router instance
                // Here we're assuming the router instance is available in the routerContext
                if (routerContext?.router?.prefetch) {
                    routerContext.router.prefetch(url);
                } else if (window.TanStackRouter?.router?.prefetch) {
                    // Try to access it from global scope as fallback
                    window.TanStackRouter.router.prefetch(url);
                } else {
                    console.warn('TanStack Router prefetch: router instance not found');
                    return false;
                }
                break;
            }

            case 'wouter': {
                // Wouter doesn't have built-in prefetching, so we implement similar to React Router
                const prefetchWouter = () => {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = url;
                    link.as = 'document';
                    document.head.appendChild(link);
                };

                prefetchWouter();
                break;
            }

            default:
                // Fall back to basic prefetching for unknown router types
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = url;
                link.as = 'document';
                document.head.appendChild(link);
                break;
        }

        if (process.env.NODE_ENV !== 'production') {
            console.log(`Prefetched: ${url} using ${routerType}`);
        }

        return true;
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(`Error prefetching ${url}:`, error);
        }
        return false;
    }
};