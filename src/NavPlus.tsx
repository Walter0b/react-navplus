/**
 * @file NavPlus.tsx
 * @description A clean, flexible navigation link component
 * @version 2.1.0
 */

import React, { useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';

// Types
export type MatchMode = 'exact' | 'startsWith' | 'includes' | 'pattern';

export interface NavPlusProps {
  to: string;
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  className?: string;
  activeClassName?: string;
  inActiveClassName?: string;
  activeStyle?: React.CSSProperties;
  inactiveStyle?: React.CSSProperties;
  disabled?: boolean;
  isExternal?: boolean;
  matchMode?: MatchMode;
  matchPattern?: RegExp;
  customActiveUrl?: string;
  prefetch?: boolean;
  replace?: boolean;
  triggerEvent?: 'click' | 'hover';
  navigationDelay?: number;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  as?: React.ElementType;
  testId?: string;
  linkProps?: Record<string, any>;
  [key: string]: any;
}

// Utility functions
const matchers = {
  exact: (pathname: string, url: string) => pathname === url,
  startsWith: (pathname: string, url: string) => pathname.startsWith(url),
  includes: (pathname: string, url: string) => pathname.includes(url),
  pattern: (pathname: string, _url: string, pattern?: RegExp) => pattern ? pattern.test(pathname) : false
};

/**
 * Determine if a link is active based on the current pathname, URL, and match mode.
 * @param {string} pathname - Current pathname
 * @param {string} url - URL to match against
 * @param {MatchMode} [matchMode='includes'] - How to match the URL
 * @param {RegExp} [matchPattern] - Optional regex pattern for matching
 * @returns {boolean} - Whether the link is active
 */
const isActive = (
  pathname: string,
  url: string,
  matchMode: MatchMode = 'includes',
  matchPattern?: RegExp
): boolean => {
  const matchFn = matchers[matchMode] || matchers.includes;
  return matchFn(pathname, url, matchPattern);
};

const buildClassName = (
  baseClassName: string,
  isActive: boolean,
  activeClassName: string,
  inActiveClassName: string
): string => {
  const classes = [
    baseClassName,
    isActive ? activeClassName : inActiveClassName,
    'navplus-link'
  ].filter(Boolean);
  return classes.join(' ').trim();
};

// Simple prefetch implementation
const prefetchCache = new Set<string>();

const simplePrefetch = (url: string): void => {
  if (prefetchCache.has(url) || typeof window === 'undefined') return;

  try {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
    prefetchCache.add(url);
  } catch (error) {
    console.warn('Prefetch failed:', error);
  }
};

/**
 * NavPlus Component - A flexible navigation link component
 */
export const NavPlus = React.memo<NavPlusProps>(({
  to,
  children,
  className = '',
  activeClassName = 'active',
  inActiveClassName = '',
  disabled = false,
  isExternal = false,
  matchMode = 'includes',
  matchPattern,
  customActiveUrl,
  activeStyle,
  inactiveStyle,
  prefetch = false,
  replace = false,
  triggerEvent = 'click',
  navigationDelay,
  onClick,
  onMouseEnter,
  onMouseLeave,
  as: Component,
  testId,
  linkProps = {},
  ...restProps
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Early validation
  if (!to) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('NavPlus: "to" prop is required');
    }
    return null;
  }

  // Determine if link is active
  const linkIsActive = useMemo(() => {
    if (!location?.pathname) return false;
    const urlToMatch = customActiveUrl || to;
    return isActive(location.pathname, urlToMatch, matchMode, matchPattern);
  }, [location?.pathname, customActiveUrl, to, matchMode, matchPattern]);

  // Handle navigation with optional delay
  const handleNavigation = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (disabled || isExternal) return;

    e.preventDefault();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const navigateToUrl = () => navigate(to, { replace });

    if (navigationDelay && navigationDelay > 0) {
      timeoutRef.current = setTimeout(navigateToUrl, navigationDelay);
    } else {
      navigateToUrl();
    }
  }, [disabled, isExternal, navigate, to, replace, navigationDelay]);

  // Event handlers
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    onClick?.(e);

    if (triggerEvent === 'click' && !e.defaultPrevented) {
      handleNavigation(e);
    }
  }, [disabled, onClick, triggerEvent, handleNavigation]);

  const handleMouseEnterEvent = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Handle prefetch
    if (prefetch && !isExternal && !disabled) {
      simplePrefetch(to);
    }

    // Handle hover navigation
    if (triggerEvent === 'hover') {
      handleNavigation(e);
    }

    onMouseEnter?.(e);
  }, [prefetch, isExternal, disabled, to, triggerEvent, handleNavigation, onMouseEnter]);

  const handleMouseLeaveEvent = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    onMouseLeave?.(e);
  }, [onMouseLeave]);

  // Computed props
  const computedClassName = useMemo(() =>
    buildClassName(className, linkIsActive, activeClassName, inActiveClassName),
    [className, linkIsActive, activeClassName, inActiveClassName]
  );

  const computedStyle = useMemo(() =>
    linkIsActive ? activeStyle : inactiveStyle,
    [linkIsActive, activeStyle, inactiveStyle]
  );

  const commonProps = useMemo(() => ({
    className: computedClassName,
    style: computedStyle,
    onClick: handleClick,
    onMouseEnter: handleMouseEnterEvent,
    onMouseLeave: handleMouseLeaveEvent,
    'data-testid': testId,
    'data-active': linkIsActive,
    'aria-current': linkIsActive ? 'page' as 'page' : undefined,
    'aria-disabled': disabled,
    ...restProps
  }), [
    computedClassName,
    computedStyle,
    handleClick,
    handleMouseEnterEvent,
    handleMouseLeaveEvent,
    testId,
    linkIsActive,
    disabled,
    restProps
  ]);

  // Render children
  const renderChildren = useMemo(() => {
    if (typeof children === 'function') {
      return children(linkIsActive);
    }
    return children;
  }, [children, linkIsActive]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Render based on conditions
  if (Component) {
    return (
      <Component {...commonProps} href={to}>
        {renderChildren}
      </Component>
    );
  }

  if (disabled) {
    return <span {...commonProps}>{renderChildren}</span>;
  }

  if (isExternal) {
    return (
      <a
        {...commonProps}
        href={to}
        target="_blank"
        rel="noopener noreferrer"
      >
        {renderChildren}
      </a>
    );
  }

  return (
    <Link to={to} replace={replace} {...commonProps} {...linkProps}>
      {renderChildren}
    </Link>
  );
});

NavPlus.displayName = 'NavPlus';

// Export everything
export default NavPlus;