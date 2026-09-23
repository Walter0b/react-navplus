# Migrating to 3.0

3.0 turns NavPlus into a router-agnostic core with one adapter per router. Most apps need two changes: the import path, and a look at active matching.

## 1. Change the import

```diff
- import { NavPlus } from 'react-navplus';
+ import { NavPlus } from 'react-navplus/react-router';
```

Use `react-navplus/tanstack-router` or `react-navplus/wouter` for those routers. The root entry point (`react-navplus`) no longer exports `NavPlus`; it holds the router-agnostic core (`createNavPlus`, `isActive`, types).

## 2. Active matching changed

- **The default `matchMode` is now `'startsWith'`, not `'includes'`.**
- **Matching compares whole path segments.** `/home` no longer matches `/homepage`, and `/` only matches the root. Previously `to="/"` was active on every page.
- **`to` may have a query string, hash or trailing slash** and still match.
- **`to` is resolved by the router**, so relative paths work with React Router.
- Regexes with the `g` or `y` flag no longer give alternating results in `pattern` mode.

If you relied on substring matching, use `matchMode="includes"`, which now matches whole segments anywhere in the path.

## 3. Props

| 2.x                                           | 3.0 |
| --------------------------------------------- | --- |
| `RouterNavLink`                               | Removed. `NavPlus` reads the router itself. |
| `location`, `navigate`                        | Removed. Read from the router. |
| `routerContext`                               | Removed. |
| `redirection={false}`                         | Use `disabled`. |
| `aria={{ ... }}`                              | Pass `aria-*` props directly. |
| `linkProps={{ ... }}`                         | Use `navigateOptions` for the router's navigate options. Other props go straight on `NavPlus`. |
| `isActiveFunc(pathname, to)`                  | Works now (it was ignored in 2.1). It receives `(pathname, to, location)`. |
| `prefetch={{ routerType, customPrefetch }}`   | `routerType` is gone, the adapter decides. Use `handler` in place of `customPrefetch`. |
| `disabled` rendered a `<span>`                | Renders an `<a>` without `href`, with `role="link"`, `aria-disabled="true"` and `tabindex="-1"`. |
| `data-active="false"` when inactive           | The attribute is only present, as `"true"`, while active. |
| `aria-disabled="false"` on enabled links      | Only present when disabled. |
| `state`                                       | New: history state to navigate with. |

## 4. Behaviour

- **Modified clicks work.** Cmd/Ctrl/Shift-click no longer navigate in the same tab. NavPlus used to call `preventDefault()` on every click.
- **`triggerEvent="hover"`** now cancels when the pointer leaves before `navigationDelay`, and a click after a hover no longer navigates a second time. With `as="a"`, clicks no longer cause a full page load.
- **Prefetch** no longer inserts `<link rel="prefetch">` tags: for a single-page app they fetched the HTML shell, not the route. TanStack Router now uses its real preloader. React Router and wouter need a `handler`.
- **`prefetch={{ enabled: false }}` and `delay`** are honoured. In 2.1 any object enabled prefetching immediately.
- **Hooks order.** `NavPlus` no longer returns early before its hooks, so `to` changing between empty and set no longer throws.
- **Refs.** `NavPlus` forwards its `ref` to the element.
- **Types.** Props are exactly the documented ones plus anchor attributes. A misspelled prop is now a type error.

## 5. Removed exports

`NavLinkProvider`, `useNavLinkContext`, `usePrefetch`, `executePrefetch`, `normalizePrefetchOptions`, `defaultPrefetchOptions`, `matchers`, `cleanUrl` and `isActiveWithCustomFn`, along with the types that only they used (`NavLinkChildren`, `RouterType`, `TanStackRouterGlobal`, `RouterContext`, `NavLinkContextValue`). None of them affected `NavPlus` in 2.1.

`useIsActive` is now exported by each router entry point. It no longer takes a `location` option, because it reads the location from the router; `isActiveFunc` receives `(pathname, to, location)`.

`isActive(pathname, url, matchMode?, matchPattern?, caseSensitive?)` is still exported from `react-navplus`, with the new default and segment-aware matching.

## 6. Packaging

- The package is ESM-first (`"type": "module"`) with a CommonJS build. Imports work in Node without a bundler.
- Deep imports such as `react-navplus/dist/cjs/...` no longer exist. Use the four entry points.
- `react-router-dom`, `@tanstack/react-router` and `wouter` are optional peer dependencies. `react-dom` is no longer a peer dependency, and `react` needs to be 16.14 or later.
