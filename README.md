# NavPlus

A flexible, accessible, and framework-agnostic navigation link component for React.

---

## Table of Contents

- [NavPlus](#navplus)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
    - [1. Basic Usage](#1-basic-usage)
    - [2. RouterNavLink Wrapper](#2-routernavlink-wrapper)
    - [3. Prefetch on Hover](#3-prefetch-on-hover)
    - [4. Custom Rendering \& Triggers](#4-custom-rendering--triggers)
  - [API](#api)
    - [`<NavPlus>` Props](#navplus-props)
      - [PrefetchOptions](#prefetchoptions)
  - [Usage Tips](#usage-tips)
  - [Contributing](#contributing)
  - [License](#license)

---

## Features

- **Active-state detection**
  - `exact`, `startsWith`, `includes`, or custom regex (`pattern`)
  - Override with your own `isActiveFunc` or `customActiveUrl`
- **Prefetching support**
  - Hover-triggered prefetch with configurable delay
  - Works with React Router, TanStack Router, Wouter, or your own custom prefetcher
- **Flexible rendering**
  - Renders a React Router `<Link>`, a plain `<a>`, a `<span>`, or any custom element via `as`
  - Fully controllable redirection (`redirection`), replace vs push (`replace`), and navigation delay
- **External & disabled links**
  - `isExternal` → `<a target="_blank" rel="noopener noreferrer">`
  - `disabled` → renders a `<span>` with `aria-disabled`
- **Styling & class names**
  - `className`, `activeClassName`, `inActiveClassName`
  - `activeStyle`, `inactiveStyle`
- **Dynamic children**
  - Render static React nodes or pass a function `(isActive) => ReactNode`
- **Accessibility**
  - Custom ARIA attributes via `aria` prop
  - Automatically applies `aria-current="page"` and `aria-disabled`
- **Test-friendly**
  - `data-testid` support for easy querying in Jest, React Testing Library, Cypress, etc.
- **Lightweight & Tree-shakable**
  - Written in TypeScript, no runtime dependencies beyond React

---

## Installation

Using npm:

```bash
npm install react-navplus
```

Using Yarn:

```bash
yarn add react-navplus
```

Using Bun:

```bash
bun add react-navplus
```

---

## Quick Start

### 1. Basic Usage

```tsx
import React from 'react';
import { NavPlus } from 'react-navplus';

const Nav = () => (
  <nav>
    <NavPlus to="/home">Home</NavPlus>
    <NavPlus to="/about" matchMode="exact">
      About
    </NavPlus>
    <NavPlus to="https://example.com" isExternal>
      External Site
    </NavPlus>
  </nav>
);
```

### 2. RouterNavLink Wrapper

If you’re using React Router v6, you can skip passing in `location` and `navigate` by using the built-in wrapper:

```tsx
import React from 'react';
import { RouterNavLink } from 'react-navplus';

const Nav = () => (
  <nav>
    <RouterNavLink to="/dashboard" activeClassName="active">
      Dashboard
    </RouterNavLink>
  </nav>
);
```

### 3. Prefetch on Hover

```tsx
<RouterNavLink
  to="/products"
  prefetch={{ enabled: true, delay: 150, routerType: 'tanstack-router' }}
>
  Products
</RouterNavLink>
```

### 4. Custom Rendering & Triggers

```tsx
<RouterNavLink
  to="/settings"
  as="button"
  triggerEvent="hover"
  navigationDelay={300}
>
  {(isActive) => (isActive ? <strong>Settings</strong> : <span>Settings</span>)}
</RouterNavLink>
```

---

## API

### `<NavPlus>` Props

| Prop                | Type                                                       | Default      | Description                                                                                 |
| ------------------- | ---------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| `to`                | `string`                                                   | —            | **Required.** Target URL or path.                                                           |
| `children`          | `ReactNode` \| `(isActive: boolean) => ReactNode`          | —            | Content inside the link. Can be a React node or a render function that receives `isActive`. |
| `location`          | `{ pathname: string }`                                     | `undefined`  | Current location (e.g. from `useLocation()`). If omitted, link is never active.             |
| `navigate`          | `(to: string, options?: { replace?: boolean }) => void`    | `undefined`  | Navigation function (e.g. from `useNavigate()`). If omitted, behaves like a plain `<a>`.    |
| `matchMode`         | `'exact'` \| `'startsWith'` \| `'includes'` \| `'pattern'` | `'includes'` | How to match `location.pathname` against `to` (`pattern` uses `matchPattern`).              |
| `matchPattern`      | `RegExp`                                                   | `undefined`  | Custom regex to match against current pathname (only when `matchMode="pattern"`).           |
| `customActiveUrl`   | `string`                                                   | `undefined`  | Use a different URL for active detection instead of `to`.                                   |
| `isActiveFunc`      | `(pathname: string, to: string) => boolean`                | `undefined`  | Fully custom active-detection function.                                                     |
| `prefetch`          | `boolean` \| `PrefetchOptions`                             | `false`      | Enable hover-prefetch. See **PrefetchOptions** below.                                       |
| `redirection`       | `boolean`                                                  | `true`       | If `false`, renders a `<span>` and no navigation occurs.                                    |
| `replace`           | `boolean`                                                  | `false`      | If `true`, navigation uses `history.replace` instead of `push`.                             |
| `navigationDelay`   | `number` (ms)                                              | `undefined`  | Delay before performing navigation (useful for animations).                                 |
| `triggerEvent`      | `'click'` \| `'hover'`                                     | `'click'`    | Which event triggers navigation.                                                            |
| `isExternal`        | `boolean`                                                  | `false`      | Render as external link (`<a target="_blank" rel="noopener noreferrer">`).                  |
| `disabled`          | `boolean`                                                  | `false`      | Render as a disabled `<span>` with `aria-disabled`.                                         |
| `as`                | `React.ElementType`                                        | `undefined`  | Custom element or component to render instead of `<Link>`/`<a>`/`<span>`.                   |
| `className`         | `string`                                                   | `''`         | Base class(es) applied to the link.                                                         |
| `activeClassName`   | `string`                                                   | `'active'`   | Class applied when link is active.                                                          |
| `inActiveClassName` | `string`                                                   | `''`         | Class applied when link is not active.                                                      |
| `activeStyle`       | `React.CSSProperties`                                      | `undefined`  | Inline style when active.                                                                   |
| `inactiveStyle`     | `React.CSSProperties`                                      | `undefined`  | Inline style when inactive.                                                                 |
| `id`                | `string`                                                   | `undefined`  | `id` attribute on the rendered element.                                                     |
| `aria`              | `React.AriaAttributes`                                     | `{}`         | Additional ARIA attributes.                                                                 |
| `testId`            | `string`                                                   | `undefined`  | `data-testid` for automated tests.                                                          |
| `linkProps`         | Omit<`LinkProps`, `'to'` \| `'replace'`>                   | `{}`         | Extra props to pass down when using React Router’s `<Link>`.                                |
| `routerContext`     | `any`                                                      | `undefined`  | Pass in your own router context (`{ navigate, router }`) for custom integrations.           |

#### PrefetchOptions

```ts
interface PrefetchOptions {
  enabled?: boolean; // default: true
  delay?: number; // ms, default: 200
  routerType?: 'react-router' | 'tanstack-router' | 'wouter' | 'custom'; // default: 'react-router'
  customPrefetch?: (to: string) => void;
}
```

---

## Usage Tips

- **Custom matching:** Use

  ```tsx
  matchMode="pattern"
  matchPattern={/^\/blog(\/|$)/}
  ```

  for advanced route matching.

- **Custom elements:** Pass `as="button"` or your own styled component to match your design system.
- **Global context:** The optional `NavContext` in `src/context/NavContext.tsx` can share navigation state or prefetch logic.
- **Standalone hooks:** We expose `useIsActive` and `usePrefetch` in `src/hooks/` if you need the logic outside of the component.

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/foo`)
3. Commit your changes (`git commit -am 'Add foo'`)
4. Push to the branch (`git push origin feature/foo`)
5. Open a Pull Request

Please run `npm test` and `npm run lint` before submitting.

---

## License

MIT © [Your Name or Organization]
See [LICENSE](LICENSE) for details.
