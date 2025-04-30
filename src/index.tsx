/**
 * @file index.ts
 * @description Main entry point for the react-navplus package
 */

export { NavPlus, RouterNavLink } from './NavPlus';
export { NavLinkProvider, useNavLinkContext } from './context/NavContext';

export { useIsActive } from './hooks/useIsActive';
export { usePrefetch } from './hooks/usePrefetch';

export { matchers, cleanUrl, isActive, isActiveWithCustomFn } from './utils/matchers';
export {
    defaultPrefetchOptions,
    normalizePrefetchOptions,
    executePrefetch
} from './utils/prefetch';

export type {
    MatchMode,
    NavLinkChildren,
    RouterType,
    PrefetchOptions,
    TanStackRouterGlobal,
    RouterContext,
    NavLinkContextValue,
    NavPlusProps
} from './types';