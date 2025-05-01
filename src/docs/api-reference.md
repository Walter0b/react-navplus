# API Reference

Detailed reference for all public APIs in **NavPlus**.

---

## Components

### `NavPlus`

A flexible, accessible navigation link component that works with multiple router libraries and supports active-state detection, prefetching, external/disabled links, custom rendering, ARIA attributes, styling, and more.

```tsx
import { NavPlus } from 'react-navplus';
```

#### Props

| Name                | Type                                                                                    | Default      | Description                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `to`                | `string`                                                                                | —            | **Required.** URL or path to navigate to (internal or external).                                                               |
| `children`          | `React.ReactNode` \| `(isActive: boolean) => React.ReactNode`                           | —            | Content inside the link. Can be a React node or a render function that receives the active state.                              |
| `location`          | `{ pathname: string }`                                                                  | `undefined`  | Current location (e.g. from React Router’s `useLocation()`). Used to compute `isActive`.                                       |
| `navigate`          | `(to: string, options?: { replace?: boolean }) => void`                                 | `undefined`  | Navigation function (e.g. from React Router’s `useNavigate()`). If omitted, behaves like a plain `<a>`.                        |
| `redirection`       | `boolean`                                                                               | `true`       | If `false`, renders a `<span>` and disables navigation.                                                                        |
| `replace`           | `boolean`                                                                               | `false`      | If `true`, navigation uses `history.replace` instead of `push`.                                                                |
| `matchMode`         | `'exact'` \| `'startsWith'` \| `'includes'` \| `'pattern'`                              | `'includes'` | How to match the current pathname against `to`. Use `'pattern'` with `matchPattern`.                                           |
| `matchPattern`      | `RegExp`                                                                                | `undefined`  | Custom regex for matching when `matchMode="pattern"`.                                                                          |
| `customActiveUrl`   | `string`                                                                                | `undefined`  | Alternate URL to use for active-state detection instead of `to`.                                                               |
| `isActiveFunc`      | `(pathname: string, to: string) => boolean`                                             | `undefined`  | Override default matching with a custom function.                                                                              |
| `prefetch`          | `boolean` \| [`PrefetchOptions`](#prefetchoptions)                                      | `false`      | Enable hover-based prefetch; configure via the `PrefetchOptions` object.                                                       |
| `navigationDelay`   | `number` (milliseconds)                                                                 | `undefined`  | Delay before performing navigation (useful for exit animations).                                                               |
| `triggerEvent`      | `'click'` \| `'hover'`                                                                  | `'click'`    | Which event fires the navigation handler.                                                                                      |
| `isExternal`        | `boolean`                                                                               | `false`      | If `true`, renders an `<a>` with `target="_blank"` and `rel="noopener noreferrer"`.                                            |
| `disabled`          | `boolean`                                                                               | `false`      | Renders a `<span>` with `aria-disabled="true"`, preventing interaction.                                                        |
| `as`                | `React.ElementType`                                                                     | `undefined`  | Render a custom element or component instead of `<Link>`, `<a>`, or `<span>`.                                                  |
| `className`         | `string`                                                                                | `''`         | Base CSS class(es) applied to the link.                                                                                        |
| `activeClassName`   | `string`                                                                                | `'active'`   | CSS class applied when the link is active.                                                                                     |
| `inActiveClassName` | `string`                                                                                | `''`         | CSS class applied when the link is inactive.                                                                                   |
| `activeStyle`       | `React.CSSProperties`                                                                   | `undefined`  | Inline style object applied when the link is active.                                                                           |
| `inactiveStyle`     | `React.CSSProperties`                                                                   | `undefined`  | Inline style object applied when the link is inactive.                                                                         |
| `id`                | `string`                                                                                | `undefined`  | `id` attribute on the rendered element.                                                                                        |
| `aria`              | `React.AriaAttributes`                                                                  | `{}`         | Additional ARIA attributes (e.g. `aria-label`, `aria-expanded`). `aria-current` and `aria-disabled` are applied automatically. |
| `testId`            | `string`                                                                                | `undefined`  | `data-testid` attribute for testing.                                                                                           |
| `linkProps`         | `Omit<LinkProps, 'to' \| 'replace'>`                                                    | `{}`         | Extra props passed to React Router’s `<Link>` when used.                                                                       |
| `routerContext`     | `{ navigate?: (to:string,options?)=>void; router?: { prefetch?: (url:string)=>void } }` | `undefined`  | Internal use: allows injecting custom navigation/prefetch context (e.g. from other routers).                                   |

> **Note:** If you omit `location` or `navigate`, the component never becomes “active” or navigable unless wrapped by [`RouterNavLink`](#routernavlink).

---

### `RouterNavLink`

A convenience wrapper for **React Router v6** that auto-injects `location` and `navigate` from React Router’s hooks.

```tsx
import { RouterNavLink } from 'react-navplus';
```

#### Props

All props of `NavPlus`, **except**:

- `location`
- `navigate`

---

## Types

### `MatchMode`

```ts
type MatchMode = 'exact' | 'startsWith' | 'includes' | 'pattern';
```

- `'exact'` — pathname must exactly equal the URL
- `'startsWith'` — pathname must start with the URL
- `'includes'` — pathname must contain the URL
- `'pattern'` — use `matchPattern: RegExp`

---

### `RouterType`

```ts
type RouterType = 'react-router' | 'tanstack-router' | 'wouter' | 'custom';
```

Selects which router’s prefetch logic to invoke.

---

### `PrefetchOptions`

```ts
interface PrefetchOptions {
  /** Enable hover-based prefetch */
  enabled?: boolean; // default: true
  /** Delay (ms) before prefetch runs */
  delay?: number; // default: 200
  /** Router type to use */
  routerType?: RouterType; // default: 'react-router'
  /** Custom prefetch function (if routerType==='custom') */
  customPrefetch?: (to: string) => void;
}
```

---

### `NavLinkChildren`

```ts
type NavLinkChildren =
  | React.ReactNode
  | ((isActive: boolean) => React.ReactNode);
```

---

## Hooks

> These hooks are also available under `react-navplus/src/hooks/`

### `useIsActive`

Compute active state in isolation.

```ts
function useIsActive(
  to: string,
  options?: {
    matchMode?: MatchMode;
    matchPattern?: RegExp;
    customActiveUrl?: string;
    isActiveFunc?: (pathname: string, to: string) => boolean;
    location?: { pathname: string };
  }
): boolean;
```

- **to** — target URL
- **options.location** — supply `{ pathname }` (defaults to React Router’s `useLocation()` if omitted and used inside `RouterNavLink`)
- Returns `true` if the current location matches according to the provided rules.

---

### `usePrefetch`

Encapsulates the prefetch logic.

```ts
function usePrefetch(
  to: string,
  options?: {
    prefetch?: boolean | PrefetchOptions;
    isExternal?: boolean;
    redirection?: boolean;
    disabled?: boolean;
    routerContext?: any;
  }
): {
  handlePrefetch: () => void;
  isPrefetched: boolean;
};
```

- Call `handlePrefetch()` (e.g. in `onMouseEnter`) to trigger a delayed prefetch.
- `isPrefetched` indicates if the URL has already been prefetched.

---

## Utilities

> Exposed under `react-navplus/src/utils/`

### `matchers`

A `Map<MatchMode, (pathname: string, url: string, pattern?: RegExp) => boolean>` of matching functions.

### `cleanUrl(url: string): string`

Ensures the URL starts with `/`.

### Prefetch Helpers

Low-level functions used by the component; most users should prefer `usePrefetch`.

---

> **End of API Reference**
