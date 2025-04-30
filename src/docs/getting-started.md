# Getting Started with NavPlus

Welcome to **NavPlus**, a lightweight, framework-agnostic React component for building accessible, high-performance navigation links. This guide walks you through everything from installation to advanced customization, so you can get up and running quickly.

---

## Table of Contents

- [Getting Started with NavPlus](#getting-started-with-NavPlus)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick “Hello World”](#quick-hello-world)
  - [React Router v6 Integration](#react-router-v6-integration)
  - [Hover-Triggered Prefetching](#hover-triggered-prefetching)
  - [Custom Active-State Rules](#custom-active-state-rules)
  - [Custom Elements \& Navigation Triggers](#custom-elements--navigation-triggers)
  - [Styling \& Theming](#styling--theming)
  - [Accessibility Best Practices](#accessibility-best-practices)
  - [Testing Your Links](#testing-your-links)
  - [Advanced: Hooks \& Context](#advanced-hooks--context)
  - [Next Steps](#next-steps)

---

## Prerequisites

- **React** ≥ 16.8 (hooks support)
- **TypeScript** (optional, but recommended for type safety)
- **React Router v6** if you want the convenient `<RouterNavLink>` wrapper (otherwise NavPlus works standalone)

---

## Installation

Choose your package manager:

```bash
# npm
npm install pure-navlink

# yarn
yarn add pure-navlink

# bun
bun add pure-navlink
```

---

## Quick “Hello World”

Render a basic link that highlights when the URL contains `/home`:

```tsx
import React from 'react';
import { NavPlus } from 'pure-navlink';

export function AppNav() {
  return (
    <nav>
      <NavPlus to="/home">Home</NavPlus>
      <NavPlus to="/about">About</NavPlus>
    </nav>
  );
}
```

- By default, `matchMode="includes"` ⇒ the link whose `to` is a substring of `location.pathname` gets the `.active` class.
- If you don’t supply `location`/`navigate`, it behaves like a plain `<a>` (no SPA navigation or active state) — see the Router integration next.

---

## React Router v6 Integration

To avoid manually passing in `location` and `navigate`, use the `<RouterNavLink>` wrapper:

```tsx
import React from 'react';
import { RouterNavLink } from 'pure-navlink';

export function Sidebar() {
  return (
    <ul>
      <li>
        <RouterNavLink to="/dashboard" activeClassName="active">
          Dashboard
        </RouterNavLink>
      </li>
      <li>
        <RouterNavLink to="/settings" matchMode="exact">
          Settings
        </RouterNavLink>
      </li>
    </ul>
  );
}
```

Under the hood, `RouterNavLink` calls React Router’s `useLocation()` and `useNavigate()`. No extra props needed!

---

## Hover-Triggered Prefetching

Speed up perceived navigation by preloading pages on hover:

```tsx
<RouterNavLink
  to="/products"
  prefetch={{ enabled: true, delay: 150, routerType: 'tanstack-router' }}
>
  Products
</RouterNavLink>
```

- **`prefetch`**: `boolean` or `PrefetchOptions`
- **`routerType`**: `'react-router' | 'tanstack-router' | 'wouter' | 'custom'`
- **`delay`**: milliseconds before firing prefetch (default `200ms`)

---

## Custom Active-State Rules

Fine-tune when a link is considered “active”:

```tsx
// Exact match
<NavPlus to="/profile" matchMode="exact">
  Profile
</NavPlus>

// Regex pattern
<NavPlus
  to="/blog"
  matchMode="pattern"
  matchPattern={/^\/blog(\/|$)/}
>
  Blog
</NavPlus>

// Custom callback
<NavPlus
  to="/special"
  isActiveFunc={(pathname, to) =>
    pathname.startsWith(to) && pathname.endsWith('/featured')
  }
>
  Featured
</NavPlus>
```

- `matchMode='exact' | 'startsWith' | 'includes' | 'pattern'`
- `matchPattern`: a `RegExp` used when `pattern` mode is selected
- `isActiveFunc`: full control — return `true` when you want the link highlighted

---

## Custom Elements & Navigation Triggers

Render your link as a `<button>`, trigger on hover, or delay navigation for animations:

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

- **`as`**: any React element or component
- **`triggerEvent`**: `'click' | 'hover'`
- **`navigationDelay`**: ms before calling `navigate()`

---

## Styling & Theming

All links include a base `.pure-nav-link` class:

```css
.pure-nav-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  text-decoration: none;
  transition: color 0.2s ease;
}

.pure-nav-link.active {
  color: #0070f3;
  font-weight: bold;
}
```

Or override on a per-link basis:

```tsx
<NavPlus
  to="/contact"
  className="my-link"
  activeClassName="my-link--active"
  inactiveClassName="my-link--inactive"
  activeStyle={{ borderBottom: '2px solid #000' }}
  inactiveStyle={{ opacity: 0.6 }}
>
  Contact
</NavPlus>
```

---

## Accessibility Best Practices

- **`aria` prop**: pass any ARIA attributes:

  ```tsx
  <NavPlus to="/help" aria={{ 'aria-label': 'Help Center' }}>
    Help
  </NavPlus>
  ```

- Automatically applies:
  - `aria-current="page"` on active links
  - `aria-disabled="true"` on disabled links

---

## Testing Your Links

Use `data-testid` to target in React Testing Library or Cypress:

```tsx
<NavPlus to="/login" testId="login-link">
  Login
</NavPlus>
```

```ts
// React Testing Library example
import { render, screen } from '@testing-library/react';
render(<AppNav />);
expect(screen.getByTestId('login-link')).toHaveAttribute('href', '/login');
```

---

## Advanced: Hooks & Context

If you prefer hook-based usage, NavPlus exports:

- `useIsActive(to, options?)` → `boolean`
- `usePrefetch(to, options?)` → `{ handlePrefetch: () => void; isPrefetched: boolean }`

And an optional `NavContext` for sharing navigation/prefetch logic across many links.

---

## Next Steps

- Dive into the full [API Reference](./api-reference.md)
- Explore real-world examples in the `examples/` directory
- Check out the [Migration Guide](./migrating.md) if you’re coming from React Router’s `<NavLink>` or other libraries
- Read the source in `src/hooks/` to see how `useIsActive` and `usePrefetch` work under the hood
