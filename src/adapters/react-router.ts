import { useHref, useLocation, useNavigate, useResolvedPath } from 'react-router-dom';
import type { NavigateOptions as RouterNavigateOptions } from 'react-router-dom';
import { createNavPlus } from '../core/createNavPlus';
import type { NavPlusProps as CoreNavPlusProps, RouterAdapter } from '../core/types';

/**
 * React Router has no client-side route preloader outside framework mode, so `prefetch`
 * needs a `handler` here, for example one that starts a lazy route's `import()`.
 */
export const reactRouterAdapter: RouterAdapter<RouterNavigateOptions> = {
  name: 'react-router',
  useLocation,
  useNavigate,
  useResolve(to, options) {
    const href = useHref(to, { relative: options?.relative });
    const { pathname } = useResolvedPath(to, { relative: options?.relative });
    return { href, pathname };
  },
};

export const { NavPlus, useIsActive } = createNavPlus(reactRouterAdapter);

export type NavPlusProps = CoreNavPlusProps<RouterNavigateOptions>;
export type {
  IsActiveOptions,
  MatchMode,
  NavLocation,
  PrefetchOptions,
} from '../core/types';
