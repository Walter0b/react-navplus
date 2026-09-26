# NavPlus

One navigation link for **React Router**, **TanStack Router**, **wouter**, or any other router via an adapter.

```tsx
import { NavPlus } from 'react-navplus/react-router'; // or /tanstack-router, /wouter

<NavPlus to="/docs">Docs</NavPlus>
```

- Segment-aware active state: `/home` is not active on `/homepage`, `/` only on the root
- Real `<a href>` with the router's basename; Cmd/Ctrl/Shift-click, middle-click and `target="_blank"` still open a new tab
- Prefetch on hover and focus, using the router's preloader when it has one
- Delayed navigation (exit animations) and hover navigation
- `aria-current="page"`; disabled links are announced as disabled
- No runtime dependencies — each adapter is its own entry point

## Install

```bash
npm install react-navplus
```

`react` (>=16.14) is required. The routers are optional peers; install the one you use.

If you `require()` the wouter adapter in Node, use Node 20.19+ or 22.12+ (wouter is ESM-only).

```tsx
import { NavPlus } from 'react-navplus/react-router';     // v6 or v7
import { NavPlus } from 'react-navplus/tanstack-router';
import { NavPlus } from 'react-navplus/wouter';          // v3
```

```tsx
<nav>
  <NavPlus to="/" matchMode="exact">Home</NavPlus>
  <NavPlus to="/docs" activeClassName="is-current">Docs</NavPlus>
  <NavPlus to="/pricing">Pricing</NavPlus>
  <NavPlus to="https://github.com" isExternal>GitHub</NavPlus>
  <NavPlus to="/admin" disabled>Admin</NavPlus>
  <NavPlus to="/inbox">{(active) => (active ? <strong>Inbox</strong> : 'Inbox')}</NavPlus>
</nav>
```

`to` is a string. TanStack's native `Link` still wins if you need route-tree inference for params and search.

## Routers

|                          | React Router                         | TanStack Router                                  | wouter                                    |
| ------------------------ | ------------------------------------ | ------------------------------------------------ | ----------------------------------------- |
| Entry                    | `react-navplus/react-router`         | `react-navplus/tanstack-router`                  | `react-navplus/wouter`                    |
| Peer                     | `react-router-dom >=6`               | `@tanstack/react-router >=1`                     | `wouter >=3`                              |
| Tested against           | 7.6 (data router and `MemoryRouter`) | 1.170                                            | 3.11                                      |
| Basename / base in `href`| yes                                  | yes (`basepath`)                                 | yes (`base`, `hrefs`, `~` absolute paths) |
| Relative `to`            | yes                                  | no — use absolute paths                          | no — use absolute paths                   |
| `?search`, `#hash` in `to` | yes                                | yes, parsed into TanStack search params          | search only (wouter does not expose hash) |
| Built-in prefetch        | no — pass `prefetch={{ handler }}`   | yes, `router.preloadRoute` (runs loaders)        | no — pass `prefetch={{ handler }}`        |
| `navigateOptions`        | React Router's `NavigateOptions`     | `resetScroll`, `viewTransition`, `ignoreBlocker` | `transition`                              |

The React Router adapter only uses APIs that exist in v6; the tests run against v7.

For React Router path-relative links, set `navigateOptions={{ relative: 'path' }}`. Href, matching and navigation all use that mode. The hook takes the same options as its third argument: `useIsActive('../docs', { matchMode: 'exact' }, { relative: 'path' })`.

## Active state

A link is active when the current pathname matches `to`. Query string, hash and trailing slashes are ignored. Matching is case-insensitive unless `caseSensitive` is set.

| `matchMode`            | Active when                                         | `to="/docs"` at `/docs/intro` |
| ---------------------- | --------------------------------------------------- | ----------------------------- |
| `startsWith` (default) | the path is `to` or nested under it                 | active                        |
| `exact`                | the path equals `to`                                | not active                    |
| `includes`             | `to`'s segments appear anywhere in the path         | active                        |
| `pattern`              | `matchPattern` matches the pathname                 | depends on the regex          |

```tsx
<NavPlus to="/blog" matchMode="pattern" matchPattern={/^\/(blog|news)(\/|$)/}>Blog</NavPlus>
<NavPlus to="/shop" customActiveUrl="/products">Shop</NavPlus>
<NavPlus to="/reports" isActiveFunc={(pathname, to, location) => location.search.includes('tab=reports')}>
  Reports
</NavPlus>
```

```tsx
import { useIsActive } from 'react-navplus/react-router';

const active = useIsActive('/docs', { matchMode: 'exact' });
```

Without a router: `import { isActive } from 'react-navplus'`.

## Props

Other props (`id`, `aria-*`, `data-*`, `onFocus`, `ref`, …) go to the rendered element. While active the element also has `aria-current="page"` and `data-active="true"`. Pass `aria-current` to override.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `to` | `string` | required | Destination. May include `?search` and `#hash`. Absolute URLs (`https:`, `mailto:`, `//`) are never routed. |
| `children` | `ReactNode` or `(isActive: boolean) => ReactNode` | | Content, or a function of the active state. |
| `matchMode` | `'startsWith'` \| `'exact'` \| `'includes'` \| `'pattern'` | `'startsWith'` | How the current path is compared with `to`. |
| `matchPattern` | `RegExp` | | Used when `matchMode` is `'pattern'`. |
| `caseSensitive` | `boolean` | `false` | Compare paths case-sensitively. |
| `customActiveUrl` | `string` | | Match this path instead of `to`. |
| `isActiveFunc` | `(pathname, to, location) => boolean` | | Replaces built-in matching. `to` is the path being matched, resolved to absolute. |
| `className` | `string` | | Always applied. `navplus-link` is always added too. |
| `activeClassName` | `string` | `'active'` | Added when active. |
| `inActiveClassName` | `string` | | Added when not active. |
| `activeStyle`, `inactiveStyle` | `CSSProperties` | | Merged over `style` for each state. |
| `replace` | `boolean` | `false` | Replace the history entry instead of pushing. |
| `state` | `unknown` | | History state to navigate with. |
| `navigateOptions` | router specific | | Extra options for the router's navigate. See the table above. |
| `prefetch` | `boolean` or `PrefetchOptions` | `false` | Prefetch on hover and focus. `true` uses the defaults. |
| `triggerEvent` | `'click'` \| `'hover'` | `'click'` | `'hover'` navigates when the pointer enters the link. |
| `navigationDelay` | `number` (ms) | `0` | Wait before navigating, e.g. to finish an exit animation. |
| `disabled` | `boolean` | `false` | No `href`, `aria-disabled="true"`, `tabindex="-1"`. Nothing happens on click. |
| `isExternal` | `boolean` | `false` | `target="_blank"` and `rel="noopener noreferrer"`. |
| `as` | `ElementType` | `'a'` | Element or component to render. It receives `href`. |
| `testId` | `string` | | Rendered as `data-testid`. |

Only a plain left click is handled by the router. Modified clicks (Cmd, Ctrl, Shift, Alt), middle clicks, `target` other than `_self`, and `download` are left to the browser. If `onClick` calls `preventDefault()`, NavPlus does not navigate.

With `navigationDelay`, a second click restarts the wait. A click is committed: it still navigates if the link unmounts during the wait (a menu that closes on click). Clicking during a pending hover also commits.

`triggerEvent="hover"` navigates after `navigationDelay`. Leaving before the delay cancels it. A click after a completed hover does not navigate again; a click with no hover (touch) navigates normally. It does nothing if you are already at that path. Download links, modified pointer events, and links targeting another browsing context do not hover-navigate. `preventDefault()` in `onMouseEnter` cancels automatic hover work.

## Prefetch

```tsx
<NavPlus to="/dashboard" prefetch>Dashboard</NavPlus>
<NavPlus to="/reports" prefetch={{ delay: 100 }}>Reports</NavPlus>
<NavPlus to="/lazy" prefetch={{ handler: () => import('./pages/Lazy') }}>Lazy</NavPlus>
```

Hover or focus for `delay` ms (default 200) prefetches once per resolved destination. Leave or blur earlier and it cancels when neither hover nor focus remains. Changing `to`, disabling the link, or turning prefetch off cancels pending work. `preventDefault()` in `onFocus` cancels focus prefetching. A failed custom handler can retry on the next interaction.

```ts
interface PrefetchOptions {
  enabled?: boolean;              // default true
  delay?: number;                 // ms, default 200
  handler?: (to: string) => void; // used instead of the router's own prefetch
}
```

TanStack Router has a built-in preloader, so `prefetch` alone runs the target route's loaders. React Router and wouter have none on the client outside React Router's framework mode, so they need a `handler`. Without one, NavPlus logs a development warning and does nothing.

## Another router

`createNavPlus` is how the three entry points above are built.

```tsx
import { createNavPlus } from 'react-navplus';

export const { NavPlus, useIsActive } = createNavPlus({
  name: 'my-router',
  useLocation: () => ({ pathname, search, hash }),
  useNavigate: () => (to, options) => { /* push or replace */ },
});
```

See [Writing an adapter](docs/writing-an-adapter.md) for the full interface and a complete example.

## Upgrade from 2.x

3.0 is a breaking release: `NavPlus` lives in a per-router entry point, the default match mode is segment-aware `startsWith`, and several props and exports were removed. See [Migrating to 3.0](docs/migrating-to-3.md).

## License

MIT © [WalterOb](https://github.com/WalterOb)
