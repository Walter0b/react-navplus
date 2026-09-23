# NavPlus

One navigation link for React, whatever router you use. Works with **React Router**, **TanStack Router** and **wouter**, and with any other router through a small adapter.

```tsx
import { NavPlus } from 'react-navplus/react-router'; // or /tanstack-router, /wouter

<NavPlus to="/docs">Docs</NavPlus>
```

- **Active state that is correct.** Compares whole path segments, so `/home` is not active on `/homepage`, and `/` is only active on the root.
- **A real link.** Renders an `<a href>` that respects the router's basename or base. Cmd/Ctrl/Shift-click, middle-click and `target="_blank"` still open a new tab.
- **Prefetching.** On hover and focus, using the router's own preloader where it has one.
- **Delayed and hover navigation.** Wait for an exit animation, or navigate when the pointer settles on a link.
- **Accessible.** `aria-current="page"`, and a disabled state that is announced as disabled.
- **Small.** No runtime dependencies. Each router's adapter is its own entry point, so you only ship the one you use.

## Install

```bash
npm install react-navplus
```

`react` is required. The router packages are optional peer dependencies: install the one you already use.

## Quick start

Import `NavPlus` from the entry point for your router.

```tsx
// React Router (v6 or v7)
import { NavPlus } from 'react-navplus/react-router';

// TanStack Router
import { NavPlus } from 'react-navplus/tanstack-router';

// wouter (v3)
import { NavPlus } from 'react-navplus/wouter';
```

Then use it inside your router, like any link:

```tsx
function Nav() {
  return (
    <nav>
      <NavPlus to="/" matchMode="exact">Home</NavPlus>
      <NavPlus to="/docs" activeClassName="is-current">Docs</NavPlus>
      <NavPlus to="/pricing" prefetch>Pricing</NavPlus>
      <NavPlus to="https://github.com" isExternal>GitHub</NavPlus>
      <NavPlus to="/admin" disabled>Admin</NavPlus>
    </nav>
  );
}
```

Children can be a function of the active state:

```tsx
<NavPlus to="/inbox">{(active) => (active ? <strong>Inbox</strong> : 'Inbox')}</NavPlus>
```

## Router support

|                          | React Router                      | TanStack Router                                  | wouter                                    |
| ------------------------ | --------------------------------- | ------------------------------------------------ | ----------------------------------------- |
| Entry point              | `react-navplus/react-router`      | `react-navplus/tanstack-router`                  | `react-navplus/wouter`                    |
| Peer range               | `react-router-dom >=6`            | `@tanstack/react-router >=1`                     | `wouter >=3`                              |
| Tested against           | 7.6 (data router and `MemoryRouter`) | 1.170                                         | 3.11                                      |
| Basename / base in `href`| yes                               | yes (`basepath`)                                 | yes (`base`, `hrefs`, `~` absolute paths) |
| Relative `to`            | yes                               | not supported, use absolute paths                | not supported, use absolute paths         |
| `?search`, `#hash` in `to` | yes                             | yes, parsed into TanStack search params          | search only, wouter does not expose the hash |
| Built-in prefetch        | no, pass `prefetch={{ handler }}` | yes, `router.preloadRoute` (runs loaders)        | no, pass `prefetch={{ handler }}`         |
| `navigateOptions`        | React Router's `NavigateOptions`  | `resetScroll`, `viewTransition`, `ignoreBlocker` | `transition`                              |

The React Router adapter only uses APIs that exist in v6, but the test suite runs against v7.

## Active state

A link is active when the current pathname matches its `to`. The query string and hash of `to` are ignored, as are trailing slashes and letter case (set `caseSensitive` to change that).

| `matchMode`            | Active when                                              | `to="/docs"` at `/docs/intro` |
| ---------------------- | -------------------------------------------------------- | ----------------------------- |
| `startsWith` (default) | the path is `to` or nested under it                      | active                        |
| `exact`                | the path equals `to`                                     | not active                    |
| `includes`             | `to`'s segments appear anywhere in the path              | active                        |
| `pattern`              | `matchPattern` matches the pathname                      | depends on the regex          |

```tsx
<NavPlus to="/blog" matchMode="pattern" matchPattern={/^\/(blog|news)(\/|$)/}>Blog</NavPlus>
<NavPlus to="/shop" customActiveUrl="/products">Shop</NavPlus>
<NavPlus to="/reports" isActiveFunc={(pathname, to, location) => location.search.includes('tab=reports')}>
  Reports
</NavPlus>
```

Outside a link, use the hook from the same entry point:

```tsx
import { useIsActive } from 'react-navplus/react-router';

const active = useIsActive('/docs', { matchMode: 'exact' });
```

The matcher is also available on its own, with no router: `import { isActive } from 'react-navplus'`.

## Props

All other props (`id`, `aria-*`, `data-*`, `onFocus`, `ref`, ...) go to the rendered element.

| Prop                | Type                                              | Default        | Description |
| ------------------- | ------------------------------------------------- | -------------- | ----------- |
| `to`                | `string`                                          | required       | Destination. May include `?search` and `#hash`. An absolute URL (`https:`, `mailto:`, `//`) is never routed. |
| `children`          | `ReactNode` or `(isActive: boolean) => ReactNode` |                | Content, or a function of the active state. |
| `matchMode`         | `'startsWith'`, `'exact'`, `'includes'`, `'pattern'` | `'startsWith'` | How the current path is compared with `to`. |
| `matchPattern`      | `RegExp`                                          |                | Used when `matchMode` is `'pattern'`. |
| `caseSensitive`     | `boolean`                                         | `false`        | Compare paths case-sensitively. |
| `customActiveUrl`   | `string`                                          |                | Match against this path instead of `to`. |
| `isActiveFunc`      | `(pathname, to, location) => boolean`             |                | Replaces the built-in matching. `to` is the path being matched, resolved to absolute. |
| `className`         | `string`                                          |                | Always applied. `navplus-link` is always added too. |
| `activeClassName`   | `string`                                          | `'active'`     | Added when active. |
| `inActiveClassName` | `string`                                          |                | Added when not active. |
| `activeStyle`, `inactiveStyle` | `CSSProperties`                        |                | Merged over `style` for each state. |
| `replace`           | `boolean`                                         | `false`        | Replace the history entry instead of pushing one. |
| `state`             | `unknown`                                         |                | History state to navigate with. |
| `navigateOptions`   | router specific                                   |                | Extra options for the router's own navigate function. See the table above. |
| `prefetch`          | `boolean` or `PrefetchOptions`                    | `false`        | Prefetch on hover and focus. |
| `triggerEvent`      | `'click'` or `'hover'`                            | `'click'`      | `'hover'` navigates when the pointer enters the link. |
| `navigationDelay`   | `number` (ms)                                     | `0`            | Wait before navigating, for example to finish an exit animation. |
| `disabled`          | `boolean`                                         | `false`        | Renders without an `href`, with `aria-disabled="true"` and `tabindex="-1"`. Nothing happens on click. |
| `isExternal`        | `boolean`                                         | `false`        | Renders a plain link with `target="_blank"` and `rel="noopener noreferrer"`. |
| `as`                | `ElementType`                                     | `'a'`          | Element or component to render. It receives `href`. |
| `testId`            | `string`                                          |                | Rendered as `data-testid`. |

The rendered element also carries `aria-current="page"` and `data-active="true"` while active. Pass your own `aria-current` to override it.

### Click behaviour

Only a plain left click is handled by the router. Modified clicks (Cmd, Ctrl, Shift, Alt), middle clicks, links with `target` other than `_self`, and links with `download` are left to the browser. If `onClick` calls `preventDefault()`, NavPlus does not navigate.

With `navigationDelay`, a second click restarts the wait, so the navigation happens once. A click is a committed intent: it still navigates if the link unmounts during the wait, for example a menu that closes on click.

### Hover navigation

`triggerEvent="hover"` navigates when the pointer enters the link, after `navigationDelay`. Leaving before the delay cancels it. A click after a hover does not navigate a second time, and a click with no hover (touch) navigates normally. It does nothing if you are already at the link's path.

## Prefetch

```tsx
<NavPlus to="/dashboard" prefetch>Dashboard</NavPlus>
<NavPlus to="/reports" prefetch={{ delay: 100 }}>Reports</NavPlus>
<NavPlus to="/lazy" prefetch={{ handler: () => import('./pages/Lazy') }}>Lazy</NavPlus>
```

Hovering or focusing the link for `delay` milliseconds (default 200) prefetches it once. Leaving or blurring earlier cancels it.

```ts
interface PrefetchOptions {
  enabled?: boolean;              // default true
  delay?: number;                 // ms, default 200
  handler?: (to: string) => void; // used instead of the router's own prefetch
}
```

TanStack Router has a built-in preloader, so `prefetch` alone runs the target route's loaders and loads its code. React Router and wouter have no client-side preloader outside of React Router's framework mode, so they need a `handler`; without one NavPlus logs a development warning and does nothing.

## Another router

`createNavPlus` builds the same component from a small adapter. This is how the three entry points above are made.

```tsx
import { createNavPlus } from 'react-navplus';

export const { NavPlus, useIsActive } = createNavPlus({
  name: 'my-router',
  useLocation: () => ({ pathname, search, hash }),
  useNavigate: () => (to, options) => { /* push or replace */ },
});
```

See [Writing an adapter](docs/writing-an-adapter.md) for the full interface and a complete example.

## Upgrading from 2.x

3.0 is a breaking release: `NavPlus` now lives in a per-router entry point, the default match mode is segment-aware `startsWith`, and several props and exports were removed. See [Migrating to 3.0](docs/migrating-to-3.md).

## Development

```bash
npm test          # jest, against real React Router, TanStack Router and wouter
npm run typecheck
npm run lint
npm run build     # tsup: ESM, CJS and type declarations for every entry point
```

The behaviour every adapter must share is one suite, [tests/adapters/conformance.tsx](tests/adapters/conformance.tsx), which runs against each router.

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/foo`)
3. Add tests, and run `npm test`, `npm run typecheck` and `npm run lint`
4. Open a pull request

## License

MIT © [WalterOb](https://github.com/WalterOb)
