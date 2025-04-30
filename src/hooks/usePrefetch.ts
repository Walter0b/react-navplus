import { useState, useCallback, useRef, useEffect } from 'react';
import { PrefetchOptions, RouterType } from '../types';
import { normalizePrefetchOptions, executePrefetch } from '../utils/prefetch';

/**
 * Hook for handling prefetching of link targets with timeout management
 * 
 * @param {string} to - The URL to prefetch
 * @param {object} options - Options for prefetching
 * @param {boolean | PrefetchOptions} options.prefetch - Prefetch configuration
 * @param {boolean} options.isExternal - Whether the URL is external
 * @param {boolean} options.redirection - Whether redirection is enabled
 * @param {boolean} options.disabled - Whether the link is disabled
 * @param {any} options.routerContext - Router context for accessing router instance
 * @returns {object} - Prefetch state and handlers
 * 
 * @example
 * // Basic usage
 * const { isPrefetched, handlePrefetch } = usePrefetch('/dashboard', {
 *   prefetch: true,
 *   isExternal: false
 * });
 * 
 * // When mouse enters the link
 * const handleMouseEnter = () => {
 *   handlePrefetch();
 * };
 */
export function usePrefetch(
    to: string,
    options: {
        prefetch?: boolean | PrefetchOptions;
        isExternal?: boolean;
        redirection?: boolean;
        disabled?: boolean;
        routerContext?: any;
    } = {}
) {
    const {
        prefetch = false,
        isExternal = false,
        redirection = true,
        disabled = false,
        routerContext
    } = options;

    // Track if the resource has already been prefetched
    const [isPrefetched, setIsPrefetched] = useState(false);

    // Ref for prefetch timeout
    const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Normalize prefetch options
    const prefetchOptions = normalizePrefetchOptions(prefetch);

    // Clean up timeout when unmounting
    useEffect(() => {
        return () => {
            if (prefetchTimeoutRef.current) {
                clearTimeout(prefetchTimeoutRef.current);
            }
        };
    }, []);

    /**
     * Handle prefetching of the link's target
     */
    const handlePrefetch = useCallback(() => {
        if (!prefetchOptions.enabled || isExternal || !redirection || disabled || isPrefetched) return;

        // Clear any existing prefetch timeout
        if (prefetchTimeoutRef.current) {
            clearTimeout(prefetchTimeoutRef.current);
        }

        // Set a new prefetch timeout
        prefetchTimeoutRef.current = setTimeout(() => {
            const success = executePrefetch(
                to,
                prefetchOptions.routerType || 'react-router',
                isExternal,
                routerContext,
                prefetchOptions.customPrefetch
            );

            if (success) {
                setIsPrefetched(true);
            }
        }, prefetchOptions.delay || 200);
    }, [
        prefetchOptions,
        to,
        isExternal,
        redirection,
        disabled,
        isPrefetched,
        routerContext
    ]);

    /**
     * Cancel prefetching (e.g., on mouse leave)
     */
    const cancelPrefetch = useCallback(() => {
        if (prefetchTimeoutRef.current) {
            clearTimeout(prefetchTimeoutRef.current);
        }
    }, []);

    return {
        isPrefetched,
        handlePrefetch,
        cancelPrefetch
    };
}