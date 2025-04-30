import React from 'react';
import { LinkProps } from 'react-router-dom';

/**
 * Defines how the active state of the link is determined based on URL matching
 * @typedef {'exact' | 'startsWith' | 'includes' | 'pattern'} MatchMode
 * @property {string} exact - The pathname must exactly match the link's 'to' prop
 * @property {string} startsWith - The pathname must start with the link's 'to' prop
 * @property {string} includes - The pathname must include the link's 'to' prop
 * @property {string} pattern - Uses a custom regex pattern provided in matchPattern prop
 */
export type MatchMode = 'exact' | 'startsWith' | 'includes' | 'pattern';

/**
 * Function or React node as children
 * @typedef {React.ReactNode | ((isActive: boolean) => React.ReactNode)} NavLinkChildren
 */
export type NavLinkChildren = React.ReactNode | ((isActive: boolean) => React.ReactNode);

/**
 * Supported router libraries for prefetching
 * @typedef {'react-router' | 'tanstack-router' | 'wouter' | 'custom'} RouterType
 */
export type RouterType = 'react-router' | 'tanstack-router' | 'wouter' | 'custom';

/**
 * Prefetch options for controlling prefetching behavior
 * @interface PrefetchOptions
 */
export interface PrefetchOptions {
    /**
     * Whether to enable prefetching
     * @default false
     */
    enabled?: boolean;

    /**
     * Delay before prefetching on hover (ms)
     * @default 200
     */
    delay?: number;

    /**
     * Which router library to use for prefetching
     * @default 'react-router'
     */
    routerType?: RouterType;

    /**
     * Custom prefetch function to use when routerType is 'custom'
     * @param {string} to - The URL to prefetch
     * @returns {void}
     */
    customPrefetch?: (to: string) => void;
}

/**
 * Interface for TanStack Router global type
 */
export interface TanStackRouterGlobal {
    router?: {
        prefetch?: (url: string) => void;
    };
}

/**
 * Extend Window interface to include TanStackRouter
 */
declare global {
    interface Window {
        TanStackRouter?: TanStackRouterGlobal;
    }
}

/**
 * Router context interface
 */
export interface RouterContext {
    navigate?: (to: string, options?: { replace?: boolean }) => void;
    location?: {
        pathname: string;
    };
}

/**
 * NavLink context value interface
 */
export interface NavLinkContextValue {
    activeMatchers?: Map<MatchMode, (pathname: string, url: string, pattern?: RegExp) => boolean>;
    prefetchDefaults?: PrefetchOptions;
    routerContext?: RouterContext;
}

/**
 * Props for the NavPlus component
 * @interface NavPlusProps
 */
export interface NavPlusProps extends Omit<Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick' | 'className'>, 'children'> {
    /**
     * The target URL for the link
     */
    to: string;

    /**
     * Content to render inside the link
     * Can be a React node or a function that returns a React node based on active state
     */
    children: NavLinkChildren;

    /**
     * Current location object - used to determine if link is active
     * Can be passed from React Router's useLocation or manually
     */
    location?: Pick<Location, 'pathname'>;

    /**
     * Navigation function - used for programmatic navigation
     * Can be passed from React Router's useNavigate or manually
     */
    navigate?: (to: string, options?: { replace?: boolean }) => void;

    /**
     * If true, clicking the link will navigate to the target URL
     * If false, the link will be rendered as a span with no navigation
     * @default true
     */
    redirection?: boolean;

    /**
     * ID attribute for the link element
     */
    id?: string;

    /**
     * Class name to apply when the link is not active
     * @default ''
     */
    inActiveClassName?: string;

    /**
     * Base class name to apply to the link regardless of active state
     * @default ''
     */
    className?: string;

    /**
     * Class name to apply when the link is active
     * @default 'active'
     */
    activeClassName?: string;

    /**
     * Function to call when the link is clicked
     */
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;

    /**
     * How to match the current URL to determine if the link is active
     * @default 'includes'
     */
    matchMode?: MatchMode;

    /**
     * Custom regex pattern to use for matching when matchMode is 'pattern'
     */
    matchPattern?: RegExp;

    /**
     * If true, clicking the link will replace the current history entry instead of adding a new one
     * @default false
     */
    replace?: boolean;

    /**
     * If true, the link will be rendered as an external link with target="_blank" and rel="noopener noreferrer"
     * @default false
     */
    isExternal?: boolean;

    /**
     * ARIA attributes for accessibility
     * @default {}
     */
    aria?: React.AriaAttributes;

    /**
     * Data-testid attribute for testing
     */
    testId?: string;

    /**
     * If true, the link will be disabled and clicking it will have no effect
     * @default false
     */
    disabled?: boolean;

    /**
     * Styles to apply when the link is active
     */
    activeStyle?: React.CSSProperties;

    /**
     * Styles to apply when the link is not active
     */
    inactiveStyle?: React.CSSProperties;

    /**
     * Custom URL to use for active state detection instead of the 'to' prop
     */
    customActiveUrl?: string;

    /**
     * Additional props to pass to the Link component when using React Router
     */
    linkProps?: Omit<LinkProps, 'to' | 'replace'>;

    /**
     * Function to determine if the link is active
     * If provided, this will override the default active state detection
     */
    isActiveFunc?: (pathname: string, to: string) => boolean;

    /**
     * Delay in milliseconds before navigating to the target URL
     * Useful for allowing animations to complete before navigation
     */
    navigationDelay?: number;

    /**
     * Event to trigger navigation - 'click' or 'hover'
     * @default 'click'
     */
    triggerEvent?: 'click' | 'hover';

    /**
     * Prefetch configuration for the link
     * Can be a boolean or an object with detailed options
     * If true, will use default prefetch settings
     * @default false
     */
    prefetch?: boolean | PrefetchOptions;

    /**
     * Custom element tag to use for rendering the link
     * @default undefined - will use Link or 'a' or 'span' based on other props
     */
    as?: React.ElementType;

    /**
     * Router context if available - can be passed from router context providers
     * This allows the component to access router features without explicit props
     */
    routerContext?: any;
}