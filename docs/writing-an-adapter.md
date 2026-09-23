# Writing an adapter

NavPlus does not know about any router. Everything it needs comes from a `RouterAdapter`, and `createNavPlus(adapter)` returns a `NavPlus` component and a `useIsActive` hook bound to it. The React Router, TanStack Router and wouter entry points are each just an adapter, in [src/adapters/](../src/adapters).

## The interface

```ts
interface RouterAdapter<TNavigateOptions extends NavigateOptions = NavigateOptions> {
  name: string;
  useLocation(): NavLocation;
  useNavigate(): (to: string, options?: TNavigateOptions) => void;
  useResolve?(to: string, options?: Omit<TNavigateOptions, 'replace' | 'state'>): ResolvedTo;
  usePrefetch?(): ((to: string) => void) | undefined;
}

interface NavLocation {
  pathname: string;
  search: string; // includes the leading "?", or ""
  hash: string;   // includes the leading "#", or ""
}

interface NavigateOptions { replace?: boolean; state?: unknown }

interface ResolvedTo {
  href: string;     // for the anchor's href
  pathname: string; // absolute, in the same space as NavLocation.pathname
}
```

| Member        | Required | What it does |
| ------------- | -------- | ------------ |
| `name`        | yes      | Shown in the component's display name and in warnings. |
| `useLocation` | yes      | Returns the current location and re-renders the link when it changes. Only `pathname` is used for matching. |
| `useNavigate` | yes      | Returns a function that navigates. `to` is the string the user wrote, so let the router resolve it. `options` has `replace`, `state` and anything in `navigateOptions`. |
| `useResolve`  | no       | Turns `to` into an `href` (add the basename or base here) and the pathname to match. Receives `navigateOptions` so options such as relative resolution agree with navigation. Without it, `to` is used for both. |
| `usePrefetch` | no       | Returns the router's preloader, or `undefined`. Without it, `prefetch` needs a `handler`. |

Every member except `name` is a React hook. NavPlus calls them on every render in a fixed order, so an adapter is a constant: create it, and the component, once at module level.

`useResolve` is never called with an absolute URL; it gets `''` so its hooks still run.

## Example: a router on `window.history`

This is a complete adapter. It is also a test: [tests/adapters/custom.test.tsx](../tests/adapters/custom.test.tsx) runs it through the same suite as the built-in routers.

```tsx
import { useSyncExternalStore } from 'react';
import { createNavPlus, splitTo } from 'react-navplus';
import type { RouterAdapter } from 'react-navplus';

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
};
const getUrl = () => window.location.pathname + window.location.search + window.location.hash;

const adapter: RouterAdapter = {
  name: 'history',
  useLocation() {
    return splitTo(useSyncExternalStore(subscribe, getUrl, () => '/'));
  },
  useNavigate() {
    return (to, { replace, state } = {}) => {
      window.history[replace ? 'replaceState' : 'pushState'](state ?? null, '', to);
      listeners.forEach((listener) => listener());
    };
  },
};

export const { NavPlus, useIsActive } = createNavPlus(adapter);
```

`splitTo` splits `'/a?x=1#top'` into `{ pathname, search, hash }`. Annotate the adapter as `RouterAdapter` (as above) rather than passing it inline: it fixes the navigate options type, which lets a callback default like `= {}` type-check.

## Router-specific navigate options

Give the adapter a type for its extra options and they become type-checked `navigateOptions` on the component:

```ts
import type { NavigateOptions, RouterAdapter } from 'react-navplus';

interface MyOptions extends NavigateOptions { scroll?: boolean }

const adapter: RouterAdapter<MyOptions> = { /* ... */ };
export const { NavPlus } = createNavPlus(adapter);
// <NavPlus to="/a" navigateOptions={{ scroll: false }} />
```

## Checking your adapter

The shared suite is in [tests/adapters/conformance.tsx](../tests/adapters/conformance.tsx). It needs a harness that renders a UI inside your router and reports the current location and history length; the four existing test files show how.
