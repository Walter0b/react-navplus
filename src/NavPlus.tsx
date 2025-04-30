/**
 * @file NavPlus.tsx
 * @description A flexible and accessible navigation link component that can be used with multiple router libraries,
 * supporting various active state detection methods, prefetching, and rendering options.
 * @author Original author + Enhanced by Claude
 * @version 1.1.0
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, LinkProps, useNavigate } from 'react-router-dom';
import { useIsActive } from './hooks/useIsActive';
import { usePrefetch } from './hooks/usePrefetch';
import { useNavLinkContext } from './context/NavContext';
import { NavPlusProps } from './types';

/**
 * NavPlus Component - A flexible navigation link component with active state detection
 * that works with multiple router libraries.
 * 
 * @component
 * @example
 * // Basic usage with React Router
 * <NavPlus to="/home">Home</NavPlus>
 * 
 * @example
 * // With active state function as children
 * <NavPlus to="/dashboard" matchMode="exact">
 *   {isActive => isActive ? <strong>Dashboard</strong> : 'Dashboard'}
 * </NavPlus>
 * 
 * @example
 * // With prefetching enabled
 * <NavPlus to="/products" prefetch={true}>Products</NavPlus>
 * 
 * @example
 * // With custom prefetch options
 * <NavPlus 
 *   to="/blog"
 *   prefetch={{
 *     enabled: true,
 *     delay: 100,
 *     routerType: 'tanstack-router'
 *   }}
 * >
 *   Blog
 * </NavPlus>
 * 
 * @example
 * // External link
 * <NavPlus to="https://example.com" isExternal>External Link</NavPlus>
 * 
 * @example
 * // Disabled link
 * <NavPlus to="/settings" disabled>Settings</NavPlus>
 */
export const NavPlus = React.memo<NavPlusProps>(({
  to,
  children,
  location,
  navigate: navigateProp,
  redirection = true,
  id,
  inActiveClassName = '',
  className = '',
  activeClassName = 'active',
  onClick,
  matchMode = 'includes',
  matchPattern,
  replace = false,
  isExternal = false,
  aria = {},
  testId,
  disabled = false,
  activeStyle,
  inactiveStyle,
  customActiveUrl,
  linkProps = {},
  isActiveFunc,
  navigationDelay,
  triggerEvent = 'click',
  prefetch = false,
  as,
  routerContext: propRouterContext,
  ...restProps
}: NavPlusProps) => {

  // Get context values
  const context = useNavLinkContext();

  // Refs for timeouts
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const linkRef = useRef<HTMLAnchorElement | null>(null);

  // Combine router context from props and context
  const routerContext = propRouterContext || context.routerContext;

  // Try to get navigate from props or context if not provided directly
  const navigate = navigateProp || routerContext?.navigate;

  // Early return for invalid 'to' prop
  if (!to) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('NavPlus: "to" prop is required and should not be empty');
    }
    return null;
  }

  // Determine if the link is active
  const isActive = useIsActive(to, {
    location: location || routerContext?.location,
    matchMode,
    matchPattern,
    customActiveUrl,
    isActiveFunc
  });

  // Handle prefetching
  const { isPrefetched, handlePrefetch, cancelPrefetch } = usePrefetch(to, {
    prefetch,
    isExternal,
    redirection,
    disabled,
    routerContext
  });

  // Ensure the component cleans up any timeouts when unmounting
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle navigation based on the navigationDelay
   */
  const navigateWithDelay = useCallback((targetUrl: string, shouldReplace = false) => {
    if (!navigate) return;

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    if (navigationDelay && navigationDelay > 0) {
      navigationTimeoutRef.current = setTimeout(() => {
        navigate(targetUrl, { replace: shouldReplace });
      }, navigationDelay);
    } else {
      navigate(targetUrl, { replace: shouldReplace });
    }
  }, [navigate, navigationDelay]);

  /**
   * Click handler that uses the passed navigate function
   */
  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    // Call user-provided onClick handler
    if (onClick) {
      onClick(e);
    }

    // Handle navigation if not external and redirection is enabled
    if (!isExternal && redirection && navigate && !e.defaultPrevented) {
      e.preventDefault();
      navigateWithDelay(to, replace);
    }
  }, [disabled, onClick, isExternal, redirection, navigate, to, replace, navigateWithDelay]);

  /**
   * Mouse enter handler for hover navigation or prefetching
   */
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
    // Handle prefetching
    handlePrefetch();

    // Handle hover navigation
    if (triggerEvent === 'hover' && !disabled && redirection && navigate) {
      e.preventDefault();
      navigateWithDelay(to, replace);
    }

    // Call user-provided onMouseEnter
    if (restProps.onMouseEnter) {
      restProps.onMouseEnter(e as React.MouseEvent<HTMLAnchorElement>);
    }
  }, [
    handlePrefetch,
    triggerEvent,
    disabled,
    redirection,
    navigate,
    to,
    replace,
    navigateWithDelay,
    restProps
  ]);

  /**
   * Mouse leave handler to cancel prefetching
   */
  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    // Cancel prefetching
    cancelPrefetch();

    // Call user-provided onMouseLeave
    if (restProps.onMouseLeave) {
      restProps.onMouseLeave(e as React.MouseEvent<HTMLAnchorElement>);
    }
  }, [cancelPrefetch, restProps]);

  /**
   * Build up the className based on active state and provided classes
   */
  const computedClassName = useMemo(() => {
    const classes = [
      className,
      isActive ? activeClassName : inActiveClassName,
      'pure-nav-link' // Base class for styling
    ].filter(Boolean);
    return classes.join(' ').trim();
  }, [className, isActive, activeClassName, inActiveClassName]);

  /**
   * Decide how to render children based on whether it's a function or React element
   */
  const renderChildren = useMemo(() => {
    if (typeof children === 'function') {
      return children(isActive);
    }

    if (React.isValidElement(children) && typeof children.type !== 'string') {
      return React.cloneElement(
        children,
        children.props ? { ...children.props, isActive } : { isActive }
      );
    }

    return children;
  }, [children, isActive]);

  /**
   * Computed ARIA attributes for better accessibility
   */
  const computedAria = useMemo(() => {
    const ariaAttrs = { ...aria };

    // Add current attribute for active links (for screen readers)
    if (isActive) {
      ariaAttrs['aria-current'] = 'page';
    }

    // Add disabled attribute
    if (disabled) {
      ariaAttrs['aria-disabled'] = true;
    }

    return ariaAttrs;
  }, [aria, isActive, disabled]);

  /**
   * Common props for the final element
   */
  const commonProps = useMemo(() => ({
    id,
    className: computedClassName,
    onClick: triggerEvent === 'click' ? handleClick : undefined,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    ref: linkRef,
    style: isActive ? activeStyle : inactiveStyle,
    'data-testid': testId,
    'data-active': isActive ? 'true' : 'false',
    'data-prefetched': isPrefetched ? 'true' : 'false',
    ...computedAria,
    ...restProps
  }), [
    id,
    computedClassName,
    triggerEvent,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    isActive,
    activeStyle,
    inactiveStyle,
    testId,
    isPrefetched,
    computedAria,
    restProps
  ]);

  // If a custom component type is specified, use that
  if (as) {
    const Component = as;
    return (
      <Component
        {...commonProps}
        {...(redirection && !disabled ? { href: to } : {})}
      >
        {renderChildren}
      </Component>
    );
  }

  // If it's disabled or there's no redirection, render a span
  if (!redirection || disabled) {
    return <span {...commonProps}>{renderChildren}</span>;
  }

  // If it's an external link, render an anchor
  if (isExternal) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        {...commonProps}
      >
        {renderChildren}
      </a>
    );
  }

  // Otherwise, render a React Router Link
  return (
    <Link
      to={to}
      replace={replace}
      {...commonProps}
      {...linkProps}
    >
      {renderChildren}
    </Link>
  );
});

NavPlus.displayName = 'NavPlus';

/**
 * Wrapper component that injects router context automatically
 * This makes it easier to use NavPlus without manually passing router props
 */
export const RouterNavLink: React.FC<Omit<NavPlusProps, 'location' | 'navigate'>> = (props) => {
  // We'll try to use React Router hooks if available
  let routerContext: any = {};

  try {
    // Import from React Router dynamically if needed
    const navigate = useNavigate();
    routerContext.navigate = navigate;
  } catch (error) {
    // React Router hooks not available or not in context
    if (process.env.NODE_ENV !== 'production') {
      console.debug('RouterNavLink: React Router hooks not available');
    }
  }

  return <NavPlus {...props} routerContext={routerContext} />;
};

RouterNavLink.displayName = 'RouterNavLink';