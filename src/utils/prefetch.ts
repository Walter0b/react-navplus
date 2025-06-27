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
 * Fixed: Avoid spread syntax that requires tslib helpers
 */
export const normalizePrefetchOptions = (prefetch: boolean | PrefetchOptions | undefined): PrefetchOptions => {
    if (typeof prefetch === 'boolean') {
        return {
            ...defaultPrefetchOptions,
            enabled: prefetch
        };
    }
    if (!prefetch) {
        return { ...defaultPrefetchOptions };
    }
    return {
        ...defaultPrefetchOptions,
        ...prefetch
    };
};

/**
 * Cache for created prefetch links to avoid duplicates
 */
const prefetchCache = new Set<string>();

/**
 * Creates a prefetch link element
 */
const createPrefetchLink = (url: string, rel: string, as?: string): HTMLLinkElement | null => {
    const cacheKey = `${rel}:${url}`;

    if (prefetchCache.has(cacheKey)) {
        return null;
    }

    const link = document.createElement('link');
    link.rel = rel;
    link.href = url;
    if (as) {
        link.setAttribute('as', as);
    }

    prefetchCache.add(cacheKey);
    document.head.appendChild(link);

    return link;
};

/**
 * Basic prefetch implementation using link prefetch
 */
const basicPrefetch = (url: string): void => {
    try {
        createPrefetchLink(url, 'prefetch', 'document');

        const urlObj = new URL(url, window.location.origin);
        createPrefetchLink(urlObj.origin, 'preconnect');
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Basic prefetch failed:', error);
        }
    }
};

/**
 * React Router specific prefetch implementation
 */
const prefetchReactRouter = (url: string, routerContext?: any): void => {
    basicPrefetch(url);

    if (routerContext?.preloadRoute) {
        try {
            routerContext.preloadRoute(url);
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.debug('Router preload failed, falling back to basic prefetch');
            }
        }
    }
};

/**
 * TanStack Router specific prefetch implementation
 */
const prefetchTanStackRouter = (url: string, routerContext?: any): boolean => {
    if (routerContext?.router?.preloadRoute) {
        try {
            routerContext.router.preloadRoute({ to: url });
            return true;
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.debug('TanStack Router context prefetch failed:', error);
            }
        }
    }

    if (typeof window !== 'undefined' && (window as any).TanStackRouter?.router?.preloadRoute) {
        try {
            (window as any).TanStackRouter.router.preloadRoute({ to: url });
            return true;
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.debug('TanStack Router global prefetch failed:', error);
            }
        }
    }

    basicPrefetch(url);
    return false;
};

/**
 * Implementation of prefetch logic for different router libraries
 */
export const executePrefetch = (
    url: string,
    routerType: RouterType,
    isExternal: boolean,
    routerContext?: any,
    customPrefetch?: (to: string) => void
): boolean => {
    if (isExternal) return false;

    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false;
    }

    if (routerType === 'custom' && customPrefetch) {
        try {
            customPrefetch(url);
            return true;
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Custom prefetch failed:', error);
            }
            return false;
        }
    }

    try {
        switch (routerType) {
            case 'react-router':
                prefetchReactRouter(url, routerContext);
                break;

            case 'tanstack-router':
                const success = prefetchTanStackRouter(url, routerContext);
                if (!success) {
                    console.warn('TanStack Router prefetch: router instance not found, using basic prefetch');
                }
                break;

            case 'wouter':
                basicPrefetch(url);
                break;

            default:
                basicPrefetch(url);
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

/**
 * Clear prefetch cache
 */
export const clearPrefetchCache = (): void => {
    prefetchCache.clear();
};