import { forwardRef, useEffect, useRef } from 'react';
import type { FocusEvent, MouseEvent, MutableRefObject } from 'react';
import { shouldHandleClick } from './click';
import { warnOnce } from './dev';
import { isAbsoluteUrl, isActive, splitTo } from './matchers';
import { normalizePrefetch } from './prefetch';
import type {
  IsActiveOptions,
  NavigateOptions,
  NavPlusProps,
  ResolvedTo,
  RouterAdapter,
} from './types';

type Timer = MutableRefObject<ReturnType<typeof setTimeout> | undefined>;

const clear = (timer: Timer): void => {
  if (timer.current !== undefined) clearTimeout(timer.current);
  timer.current = undefined;
};

const defaultResolve = (to: string): ResolvedTo => ({ href: to, pathname: splitTo(to).pathname });
const noPrefetch = (): undefined => undefined;

/**
 * Builds `NavPlus` and `useIsActive` for a router. The adapter is read once, so create
 * the pair at module level rather than inside a component.
 */
export function createNavPlus<TNavigateOptions extends NavigateOptions = NavigateOptions>(
  adapter: RouterAdapter<TNavigateOptions>
) {
  const resolve = adapter.useResolve ?? defaultResolve;
  const usePrefetchHandler = adapter.usePrefetch ?? noPrefetch;

  function useLinkState(to: string, options: IsActiveOptions) {
    const location = adapter.useLocation();
    const external = isAbsoluteUrl(to);
    // Hooks inside `resolve` must run every render, so it is always called; external
    // URLs get a placeholder because routers cannot resolve them.
    const resolved = resolve(external ? '' : to);
    const { customActiveUrl, isActiveFunc, matchMode, matchPattern, caseSensitive } = options;

    let active = false;
    if (!external || customActiveUrl !== undefined) {
      const target = customActiveUrl ?? resolved.pathname;
      active = isActiveFunc
        ? isActiveFunc(location.pathname, target, location)
        : isActive(location.pathname, target, matchMode, matchPattern, caseSensitive);
    }
    return { location, external, resolved, active };
  }

  /** Whether `to` is active at the current location. */
  function useIsActive(to: string, options: IsActiveOptions = {}): boolean {
    return useLinkState(to, options).active;
  }

  const NavPlus = forwardRef<HTMLAnchorElement, NavPlusProps<TNavigateOptions>>(function NavPlus(
    props,
    ref
  ) {
    const {
      to: toProp,
      children,
      className = '',
      activeClassName = 'active',
      inActiveClassName = '',
      activeStyle,
      inactiveStyle,
      matchMode,
      matchPattern,
      caseSensitive,
      customActiveUrl,
      isActiveFunc,
      disabled = false,
      isExternal = false,
      replace,
      state,
      navigateOptions,
      prefetch,
      triggerEvent = 'click',
      navigationDelay = 0,
      as: Component = 'a',
      testId,
      style,
      target,
      rel,
      onClick,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      'aria-current': ariaCurrent,
      ...rest
    } = props;

    if (typeof toProp !== 'string') warnOnce('NavPlus: the "to" prop must be a string.');
    const to = typeof toProp === 'string' ? toProp : '';

    const { location, external, resolved, active } = useLinkState(to, {
      matchMode,
      matchPattern,
      caseSensitive,
      customActiveUrl,
      isActiveFunc,
    });
    const navigate = adapter.useNavigate();
    const adapterPrefetch = usePrefetchHandler();

    const clickTimer: Timer = useRef(undefined);
    const hoverTimer: Timer = useRef(undefined);
    const prefetchTimer: Timer = useRef(undefined);
    const hoverNavigated = useRef(false);
    const prefetchedTo = useRef<string | null>(null);

    // Only hover work is cancelled on unmount. A click is a committed intent: a menu
    // that closes itself on click must not swallow a delayed navigation.
    useEffect(
      () => () => {
        clear(hoverTimer);
        clear(prefetchTimer);
      },
      []
    );

    const isExternalLink = isExternal || external;

    const go = (): void => {
      navigate(to, {
        ...navigateOptions,
        ...(replace !== undefined && { replace }),
        ...(state !== undefined && { state }),
      } as TNavigateOptions);
    };

    const schedule = (timer: Timer): void => {
      clear(timer);
      if (navigationDelay > 0) timer.current = setTimeout(go, navigationDelay);
      else go();
    };

    const prefetchOptions = normalizePrefetch(prefetch);
    const runPrefetch = prefetchOptions.handler ?? adapterPrefetch;

    const schedulePrefetch = (): void => {
      if (!prefetchOptions.enabled || prefetchedTo.current === to) return;
      if (!runPrefetch) {
        warnOnce(
          `NavPlus: the "${adapter.name}" adapter has no built-in prefetch. Pass prefetch={{ handler }} to enable it.`
        );
        return;
      }
      clear(prefetchTimer);
      prefetchTimer.current = setTimeout(() => {
        prefetchedTo.current = to;
        runPrefetch(to);
      }, prefetchOptions.delay);
    };

    const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
      if (isExternalLink || !shouldHandleClick(event, { target, download: rest.download })) return;

      event.preventDefault();
      // The pointer already started this navigation when it entered the link.
      if (triggerEvent === 'hover' && hoverNavigated.current) return;
      clear(hoverTimer);
      schedule(clickTimer);
    };

    const handleMouseEnter = (event: MouseEvent<HTMLAnchorElement>): void => {
      onMouseEnter?.(event);
      if (disabled || isExternalLink) return;
      schedulePrefetch();
      if (triggerEvent === 'hover' && location.pathname !== resolved.pathname) {
        hoverNavigated.current = true;
        schedule(hoverTimer);
      }
    };

    const handleMouseLeave = (event: MouseEvent<HTMLAnchorElement>): void => {
      onMouseLeave?.(event);
      clear(prefetchTimer);
      if (triggerEvent === 'hover') {
        clear(hoverTimer);
        hoverNavigated.current = false;
      }
    };

    const handleFocus = (event: FocusEvent<HTMLAnchorElement>): void => {
      onFocus?.(event);
      if (!disabled && !isExternalLink) schedulePrefetch();
    };

    const handleBlur = (event: FocusEvent<HTMLAnchorElement>): void => {
      onBlur?.(event);
      clear(prefetchTimer);
    };

    const stateStyle = active ? activeStyle : inactiveStyle;
    const elementProps = {
      ...rest,
      ref,
      className: [className, active ? activeClassName : inActiveClassName, 'navplus-link']
        .filter(Boolean)
        .join(' '),
      style: stateStyle ? { ...style, ...stateStyle } : style,
      onClick: handleClick,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      'aria-current': ariaCurrent ?? (active ? ('page' as const) : undefined),
      'aria-disabled': disabled || undefined,
      'data-active': active ? 'true' : undefined,
      'data-testid': testId,
    };
    const content = typeof children === 'function' ? children(active) : children;

    if (disabled) {
      // No href: it cannot be followed, opened in a new tab or focused by accident.
      return (
        <Component {...elementProps} role={Component === 'a' ? 'link' : undefined} tabIndex={-1}>
          {content}
        </Component>
      );
    }

    if (isExternal) {
      return (
        <Component
          {...elementProps}
          href={to}
          target={target ?? '_blank'}
          rel={rel ?? 'noopener noreferrer'}
        >
          {content}
        </Component>
      );
    }

    return (
      <Component {...elementProps} href={external ? to : resolved.href} target={target} rel={rel}>
        {content}
      </Component>
    );
  });

  NavPlus.displayName = `NavPlus(${adapter.name})`;

  return { NavPlus, useIsActive };
}
