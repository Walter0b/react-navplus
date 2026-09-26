import { useLocation, useRouter } from '@tanstack/react-router';
import { createNavPlus } from '../core/createNavPlus';
import { splitTo } from '../core/matchers';
import type {
  NavigateOptions,
  NavPlusProps as CoreNavPlusProps,
  RouterAdapter,
} from '../core/types';

export interface TanStackNavigateOptions extends NavigateOptions {
  resetScroll?: boolean;
  viewTransition?: boolean | { types: string[] };
  ignoreBlocker?: boolean;
}

// NavPlus takes plain string paths, so it talks to the router through the untyped part
// of its API instead of depending on the app's registered route tree.
interface LooseRouter {
  options: { parseSearch: (searchStr: string) => Record<string, unknown> };
  buildLocation: (destination: object) => { pathname: string; href: string; publicHref?: string };
  navigate: (options: object) => Promise<unknown>;
  preloadRoute: (destination: object) => Promise<unknown>;
}

// TanStack wants the path, search object and hash separately, not one string.
const toDestination = (router: LooseRouter, to: string) => {
  const { pathname, search, hash } = splitTo(to);
  return {
    to: pathname || '.',
    search: router.options.parseSearch(search),
    hash: hash.slice(1) || undefined,
  };
};

export const tanStackRouterAdapter: RouterAdapter<TanStackNavigateOptions> = {
  name: 'tanstack-router',
  useLocation() {
    const { pathname, searchStr, hash } = useLocation();
    return { pathname, search: searchStr, hash: hash ? `#${hash}` : '' };
  },
  useNavigate() {
    const router = useRouter() as unknown as LooseRouter;
    return (to, options) => {
      const { replace, state, ...routerOptions } = options ?? {};
      void router.navigate({ ...routerOptions, ...toDestination(router, to), replace, state });
    };
  },
  useResolve(to) {
    const router = useRouter() as unknown as LooseRouter;
    const built = router.buildLocation(toDestination(router, to));
    return { href: built.publicHref ?? built.href, pathname: built.pathname };
  },
  usePrefetch() {
    const router = useRouter() as unknown as LooseRouter;
    return (to) => {
      // Preloading is best effort: a failing loader must not surface from a hover.
      Promise.resolve(router.preloadRoute(toDestination(router, to))).catch(() => undefined);
    };
  },
};

export const { NavPlus, useIsActive } = createNavPlus(tanStackRouterAdapter);

export type NavPlusProps = CoreNavPlusProps<TanStackNavigateOptions>;
export type {
  IsActiveOptions,
  MatchMode,
  NavLocation,
  PrefetchOptions,
} from '../core/types';
