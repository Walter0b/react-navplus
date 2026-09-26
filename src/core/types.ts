import type { AnchorHTMLAttributes, CSSProperties, ElementType, ReactNode } from 'react';

/**
 * How a link decides it is active. All modes except `pattern` compare whole path
 * segments, so `/home` never matches `/homepage`.
 * - `exact`: the pathnames are equal
 * - `startsWith`: the current path is the link's path or is nested under it
 * - `includes`: the link's segments appear anywhere inside the current path
 * - `pattern`: `matchPattern` is tested against the current pathname
 */
export type MatchMode = 'exact' | 'startsWith' | 'includes' | 'pattern';

export interface NavLocation {
  pathname: string;
  /** Includes the leading `?`, or `''`. */
  search: string;
  /** Includes the leading `#`, or `''`. */
  hash: string;
}

export interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}

export interface ResolvedTo {
  /** Value for the anchor's `href`: basename-aware, so "open in new tab" works. */
  href: string;
  /** Absolute pathname used for active matching, in the same space as `NavLocation.pathname`. */
  pathname: string;
}

/**
 * Everything NavPlus needs from a router. Every member except `name` is a React
 * hook, called on each render in a fixed order, so an adapter must be a constant
 * for the lifetime of the components created from it.
 */
export interface RouterAdapter<TNavigateOptions extends NavigateOptions = NavigateOptions> {
  name: string;
  useLocation(): NavLocation;
  useNavigate(): (to: string, options?: TNavigateOptions) => void;
  /** Defaults to using `to` as the href and its pathname for matching. */
  useResolve?(to: string, options?: Omit<TNavigateOptions, 'replace' | 'state'>): ResolvedTo;
  /** The router's native route preloader, if it has one. */
  usePrefetch?(): ((to: string) => void) | undefined;
}

export interface PrefetchOptions {
  /** @default true */
  enabled?: boolean;
  /** Milliseconds the pointer or focus must stay before prefetching. @default 200 */
  delay?: number;
  /** Runs instead of the router's native prefetch. Required for routers without one. */
  handler?: (to: string) => void;
}

export interface IsActiveOptions {
  /** @default 'startsWith' */
  matchMode?: MatchMode;
  matchPattern?: RegExp;
  /** @default false */
  caseSensitive?: boolean;
  /** Match against this path instead of `to`. */
  customActiveUrl?: string;
  /**
   * Replaces the built-in matching. Receives the current pathname, the path being
   * matched (`customActiveUrl`, or `to` resolved to an absolute pathname) and the location.
   */
  isActiveFunc?: (pathname: string, to: string, location: NavLocation) => boolean;
}

export interface NavPlusOwnProps<TNavigateOptions extends NavigateOptions = NavigateOptions>
  extends IsActiveOptions {
  to: string;
  children?: ReactNode | ((isActive: boolean) => ReactNode);
  className?: string;
  /** @default 'active' */
  activeClassName?: string;
  inActiveClassName?: string;
  activeStyle?: CSSProperties;
  inactiveStyle?: CSSProperties;
  /** Renders without `href` or navigation, with `aria-disabled`. */
  disabled?: boolean;
  /** Renders a plain anchor with `target="_blank" rel="noopener noreferrer"`. Absolute URLs are never routed either way. */
  isExternal?: boolean;
  replace?: boolean;
  state?: unknown;
  navigateOptions?: Omit<TNavigateOptions, 'replace' | 'state'>;
  /** Prefetch on hover and focus. `true` uses the defaults. */
  prefetch?: boolean | PrefetchOptions;
  /** With `'hover'`, entering the link navigates and leaving before `navigationDelay` cancels it. @default 'click' */
  triggerEvent?: 'click' | 'hover';
  /** Milliseconds to wait before navigating, e.g. to let an exit animation finish. */
  navigationDelay?: number;
  as?: ElementType;
  testId?: string;
  'data-testid'?: string;
}

export type NavPlusProps<TNavigateOptions extends NavigateOptions = NavigateOptions> =
  NavPlusOwnProps<TNavigateOptions> &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NavPlusOwnProps | 'href'>;
