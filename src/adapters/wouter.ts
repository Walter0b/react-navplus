import { useLocation, useRouter, useSearch } from 'wouter';
import { createNavPlus } from '../core/createNavPlus';
import { splitTo } from '../core/matchers';
import type {
  NavigateOptions,
  NavPlusProps as CoreNavPlusProps,
  RouterAdapter,
} from '../core/types';

export interface WouterNavigateOptions extends NavigateOptions {
  transition?: boolean;
}

// wouter reports locations relative to the router's base; this undoes that for `~` links.
const OUTSIDE_BASE = '/\u0000';
const relativeToBase = (base: string, pathname: string): string => {
  if (!base) return pathname;
  if (pathname === base) return '/';
  return pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : OUTSIDE_BASE;
};

/** wouter does not expose the hash, so `NavLocation.hash` is always empty. */
export const wouterAdapter: RouterAdapter<WouterNavigateOptions> = {
  name: 'wouter',
  useLocation() {
    const [pathname] = useLocation();
    const search = useSearch();
    return { pathname, search: search ? `?${search}` : '', hash: '' };
  },
  useNavigate() {
    const [, navigate] = useLocation();
    return (to, options) => navigate(to, options);
  },
  useResolve(to) {
    const router = useRouter();
    // A leading "~" means an absolute path that ignores the router's base.
    const absolute = to.startsWith('~');
    const path = absolute ? to.slice(1) : to;
    const { pathname } = splitTo(path);
    return {
      // `hrefs` is how wouter adapts hrefs for hash routing and similar hooks.
      href: router.hrefs(absolute ? path : router.base + path, router),
      pathname: absolute ? relativeToBase(router.base, pathname) : pathname,
    };
  },
};

export const { NavPlus, useIsActive } = createNavPlus(wouterAdapter);

export type NavPlusProps = CoreNavPlusProps<WouterNavigateOptions>;
export type {
  IsActiveOptions,
  MatchMode,
  NavLocation,
  PrefetchOptions,
} from '../core/types';
