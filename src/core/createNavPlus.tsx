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

  function useLinkState(
    to: string,
    options: IsActiveOptions,
    navigateOptions?: Omit<TNavigateOptions, 'replace' | 'state'>
  ) {
    const location = adapter.useLocation();
    const external = isAbsoluteUrl(to);
    // Hooks inside `resolve` must run every render, so it is always called; external
    // URLs get a placeholder because routers cannot resolve them.
    const resolved = resolve(external ? '' : to, navigateOptions);
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

  function useIsActive(
    to: string,
    options: IsActiveOptions = {},
    navigateOptions?: Omit<TNavigateOptions, 'replace' | 'state'>
  ): boolean {
    return useLinkState(to, options, navigateOptions).active;
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
      'data-testid': dataTestId,
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
    }, navigateOptions);
    const navigate = adapter.useNavigate();
    const adapterPrefetch = usePrefetchHandler();

    const clickTimer: Timer = useRef(undefined);
    const hoverTimer: Timer = useRef(undefined);
    const prefetchTimer: Timer = useRef(undefined);
    const hoverNavigated = useRef(false);
    const prefetchedTo = useRef<string | null>(null);
    const hovered = useRef(false);
    const focused = useRef(false);
    const isExternalLink = isExternal || external;
    const prefetchOptions = normalizePrefetch(prefetch);
    const runPrefetch = prefetchOptions.handler ?? adapterPrefetch;

    // Only hover work is cancelled on unmount. A click is a committed intent: a menu
    // that closes itself on click must not swallow a delayed navigation.
    useEffect(
      () => () => {
        clear(hoverTimer);
        clear(prefetchTimer);
      },
      [to, resolved.href, disabled, isExternalLink, triggerEvent, navigationDelay, target, rest.download]
    );

    useEffect(() => {
      hoverNavigated.current = false;
    }, [to, resolved.href, disabled, isExternalLink, triggerEvent]);

    useEffect(() => () => clear(prefetchTimer), [
      prefetchOptions.enabled,
      prefetchOptions.delay,
      prefetchOptions.handler,
    ]);

    const go = (): void => {
      navigate(to, {
        ...navigateOptions,
        ...(replace !== undefined && { replace }),
        ...(state !== undefined && { state }),
      } as TNavigateOptions);
    };

    const schedule = (timer: Timer, callback = go): void => {
      clear(timer);
      if (navigationDelay > 0) {
        timer.current = setTimeout(() => {
          timer.current = undefined;
          callback();
        }, navigationDelay);
      } else callback();
    };

    const schedulePrefetch = (): void => {
      if (!prefetchOptions.enabled || prefetchedTo.current === resolved.href) return;
      if (!runPrefetch) {
        warnOnce(
          `NavPlus: the "${adapter.name}" adapter has no built-in prefetch. Pass prefetch={{ handler }} to enable it.`
        );
        return;
      }
      if (prefetchTimer.current !== undefined) return;
      prefetchTimer.current = setTimeout(() => {
        prefetchTimer.current = undefined;
        prefetchedTo.current = resolved.href;
        const onFailure = (): void => {
          if (prefetchedTo.current === resolved.href) prefetchedTo.current = null;
          warnOnce(`NavPlus: prefetch failed for "${resolved.href}". It will retry on the next interaction.`);
        };
        try {
          // Custom handlers often return import() promises, even though their return
          // value is unused. A failed speculative load must not be an unhandled rejection.
          Promise.resolve(runPrefetch(to)).catch(onFailure);
        } catch {
          onFailure();
        }
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
      // Only a completed hover suppresses a click. Pending hover work becomes a
      // committed click so leaving or unmounting cannot cancel the navigation.
      if (triggerEvent === 'hover' && hoverNavigated.current) return;
      clear(hoverTimer);
      schedule(clickTimer);
    };

    const handleMouseEnter = (event: MouseEvent<HTMLAnchorElement>): void => {
      onMouseEnter?.(event);
      hovered.current = true;
      if (disabled || isExternalLink || event.defaultPrevented) return;
      schedulePrefetch();
      if (
        triggerEvent === 'hover' &&
        location.pathname !== resolved.pathname &&
        shouldHandleClick(event, { target, download: rest.download }) &&
        clickTimer.current === undefined
      ) {
        schedule(hoverTimer, () => {
          hoverNavigated.current = true;
          go();
        });
      }
    };

    const handleMouseLeave = (event: MouseEvent<HTMLAnchorElement>): void => {
      onMouseLeave?.(event);
      hovered.current = false;
      if (!focused.current) clear(prefetchTimer);
      if (triggerEvent === 'hover') {
        clear(hoverTimer);
        hoverNavigated.current = false;
      }
    };

    const handleFocus = (event: FocusEvent<HTMLAnchorElement>): void => {
      onFocus?.(event);
      focused.current = true;
      if (!disabled && !isExternalLink && !event.defaultPrevented) schedulePrefetch();
    };

    const handleBlur = (event: FocusEvent<HTMLAnchorElement>): void => {
      onBlur?.(event);
      focused.current = false;
      if (!hovered.current) clear(prefetchTimer);
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
      'data-testid': testId ?? dataTestId,
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
