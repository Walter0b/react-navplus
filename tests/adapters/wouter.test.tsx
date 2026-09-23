import type { ComponentProps, ComponentType, ReactElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { NavPlus, useIsActive } from '../../src/adapters/wouter';
import { splitTo } from '../../src/core/matchers';
import type { NavPlusProps } from '../../src/core/types';
import { runConformanceSuite } from './conformance';
import type { Mounted } from './conformance';

const mountRouter = (
  ui: ReactElement,
  path = '/',
  routerProps: Partial<ComponentProps<typeof Router>> = {}
) => {
  const { hook, searchHook, history } = memoryLocation({ path, record: true });
  render(
    <Router hook={hook} searchHook={searchHook} {...routerProps}>
      {ui}
    </Router>
  );
  return history;
};

const mountForConformance = async (ui: ReactElement, path = '/'): Promise<Mounted> => {
  const history = mountRouter(ui, path);
  return {
    location: () => {
      const { pathname, search } = splitTo(history[history.length - 1] ?? '/');
      return { pathname, search };
    },
    historyLength: () => history.length,
  };
};

runConformanceSuite({
  name: 'wouter',
  NavPlus: NavPlus as ComponentType<NavPlusProps>,
  useIsActive,
  render: mountForConformance,
});

describe('wouter: specifics', () => {
  afterEach(cleanup);

  test('adds the router base to the href and matches against the base-relative location', () => {
    mountRouter(
      <>
        <NavPlus to="/docs">Docs</NavPlus>
        <NavPlus to="/blog">Blog</NavPlus>
      </>,
      '/app/docs/intro',
      { base: '/app' }
    );
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('href')).toBe('/app/docs');
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Blog' }).getAttribute('aria-current')).toBeNull();
  });

  test('navigates under the base', async () => {
    const history = mountRouter(<NavPlus to="/docs">Docs</NavPlus>, '/app', { base: '/app' });
    fireEvent.click(screen.getByRole('link', { name: 'Docs' }));
    await waitFor(() => expect(history[history.length - 1]).toBe('/app/docs'));
  });

  test('a "~" link is absolute: it ignores the base for href, navigation and matching', async () => {
    const history = mountRouter(
      <>
        <NavPlus to="~/other">Other</NavPlus>
        <NavPlus to="~/app/docs" matchMode="exact">Inside</NavPlus>
        <NavPlus to="~/elsewhere/docs" matchMode="exact">Outside</NavPlus>
      </>,
      '/app/docs',
      { base: '/app' }
    );
    expect(screen.getByRole('link', { name: 'Other' }).getAttribute('href')).toBe('/other');
    expect(screen.getByRole('link', { name: 'Inside' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Outside' }).getAttribute('aria-current')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Other' }));
    await waitFor(() => expect(history[history.length - 1]).toBe('/other'));
  });

  test("uses the router's `hrefs` to build the anchor href (hash routing)", () => {
    mountRouter(<NavPlus to="/docs">Docs</NavPlus>, '/', { hrefs: (href) => `#${href}` });
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('href')).toBe('#/docs');
  });

  test('passes history state to wouter', async () => {
    const { hook, searchHook } = memoryLocation({ path: '/', record: true });
    const seen: unknown[] = [];
    const spyHook = ((...args: Parameters<typeof hook>) => {
      const [path, navigate] = hook(...args);
      return [
        path,
        (to: string, options?: { state?: unknown }) => {
          seen.push(options?.state);
          navigate(to, options);
        },
      ];
    }) as typeof hook;
    render(
      <Router hook={spyHook} searchHook={searchHook}>
        <NavPlus to="/a" state={{ from: 'nav' }}>A</NavPlus>
      </Router>
    );
    fireEvent.click(screen.getByRole('link', { name: 'A' }));
    await waitFor(() => expect(seen).toEqual([{ from: 'nav' }]));
  });

  test('prefetch needs a handler, since wouter has no built-in preloader', async () => {
    const handler = jest.fn();
    mountRouter(<NavPlus to="/lazy" prefetch={{ delay: 0, handler }}>Lazy</NavPlus>);
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Lazy' }));
    await waitFor(() => expect(handler).toHaveBeenCalledWith('/lazy'));
  });
});
