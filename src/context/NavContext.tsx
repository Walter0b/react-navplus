import React, { createContext, useContext, useMemo } from 'react';
import { matchers } from '../utils/matchers';
import { defaultPrefetchOptions } from '../utils/prefetch';
import { NavLinkContextValue, PrefetchOptions, MatchMode } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Context for sharing navigation state across components
 */
export const NavLinkContext = createContext<NavLinkContextValue>({
    activeMatchers: matchers,
    prefetchDefaults: defaultPrefetchOptions,
    routerContext: undefined
});

/**
 * Props for the NavLinkProvider component
 */
interface NavLinkProviderProps {
    /**
     * Children to render inside the provider
     */
    children: React.ReactNode;

    /**
     * Optional map of active state matcher functions
     */
    activeMatchers?: Map<MatchMode, (pathname: string, url: string, pattern?: RegExp) => boolean>;

    /**
     * Default prefetch options to use for all links
     */
    prefetchDefaults?: PrefetchOptions;

    /**
     * Custom router context if not using React Router
     */
    customRouterContext?: any;

    /**
     * Whether to use React Router context automatically
     * @default true
     */
    useReactRouterContext?: boolean;
}

/**
 * Provider component for NavLinkContext
 * 
 * @component
 * @example
 * // Basic usage
 * <NavLinkProvider>
 *   <App />
 * </NavLinkProvider>
 * 
 * @example
 * // With custom prefetch defaults
 * <NavLinkProvider
 *   prefetchDefaults={{ enabled: true, delay: 100 }}
 * >
 *   <App />
 * </NavLinkProvider>
 */
export const NavLinkProvider: React.FC<NavLinkProviderProps> = ({
    children,
    activeMatchers: customMatchers,
    prefetchDefaults: customPrefetchDefaults,
    customRouterContext,
    useReactRouterContext = true
}) => {
    // Try to get React Router context if enabled
    let reactRouterContext: unknown;

    if (useReactRouterContext) {
        try {
            const navigate = useNavigate();
            const location = useLocation();
            reactRouterContext = { navigate, location };
        } catch (error) {
            // React Router hooks not available
            if (process.env.NODE_ENV !== 'production') {
                console.debug('NavLinkProvider: React Router hooks not available');
            }
        }
    }

    // Combine context values
    const contextValue = useMemo(() => ({
        activeMatchers: customMatchers || matchers,
        prefetchDefaults: {
            ...defaultPrefetchOptions,
            ...customPrefetchDefaults
        },
        routerContext: customRouterContext || reactRouterContext
    }), [customMatchers, customPrefetchDefaults, customRouterContext, reactRouterContext]);

    return (
        <NavLinkContext.Provider value={contextValue}>
            {children}
        </NavLinkContext.Provider>
    );
};

/**
 * Hook to access NavLinkContext
 * 
 * @returns {NavLinkContextValue} The current NavLink context value
 * 
 * @example
 * // Access context in a component
 * const { routerContext, prefetchDefaults } = useNavLinkContext();
 */
export const useNavLinkContext = (): NavLinkContextValue => {
    return useContext(NavLinkContext);
};