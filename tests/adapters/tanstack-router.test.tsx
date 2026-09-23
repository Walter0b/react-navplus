import type { ComponentType, ReactElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';
import { NavPlus, useIsActive } from '../../src/adapters/tanstack-router';
import type { NavPlusProps } from '../../src/core/types';
import { runConformanceSuite } from './conformance';
import type { Mounted } from './conformance';

// Route generics are irrelevant to what is tested, so the scaffolding opts out of them.
const childRoute = (parent: unknown, path: string, options: object = {}): AnyRoute =>
  createRoute({ getParentRoute: () => parent, path, ...options } as never) as unknown as AnyRoute;

interface MountOptions {
  basepath?: string;
  routes?: (parent: unknown) => AnyRoute[];
}

const mountRouter = async (ui: ReactElement, path = '/', options: MountOptions = {}) => {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        {ui}
        <Outlet />
      </>
    ),
  });
  // The layout renders `ui` for every URL, so these only make each URL resolve.
  const routes = [
    childRoute(rootRoute, '/'),
    childRoute(rootRoute, '$'),
    ...(options.routes?.(rootRoute) ?? []),
  ];
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    history,
    ...(options.basepath ? { basepath: options.basepath } : {}),
  });
  await router.load();
  const { container } = render(<RouterProvider router={router} />);
  await waitFor(() => expect(container.firstElementChild).not.toBeNull());
  return { router, history };
};

const mountForConformance = async (ui: ReactElement, path = '/'): Promise<Mounted> => {
  const { router, history } = await mountRouter(ui, path);
  return {
    location: () => ({
      pathname: router.state.location.pathname,
      search: router.state.location.searchStr,
    }),
    historyLength: () => history.length,
  };
};

runConformanceSuite({
  name: 'tanstack-router',
  NavPlus: NavPlus as ComponentType<NavPlusProps>,
  useIsActive,
  render: mountForConformance,
});

describe('tanstack-router: specifics', () => {
  afterEach(cleanup);

  test('parses the query string of `to` into TanStack search params', async () => {
    const { router } = await mountRouter(<NavPlus to="/search?tab=2&q=hello">Go</NavPlus>);
    fireEvent.click(screen.getByRole('link', { name: 'Go' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/search'));
    expect(router.state.location.search).toEqual({ tab: 2, q: 'hello' });
  });

  test('carries the hash and history state through', async () => {
    const { router } = await mountRouter(
      <NavPlus to="/page#section" state={{ from: 'nav' }}>Go</NavPlus>
    );
    fireEvent.click(screen.getByRole('link', { name: 'Go' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/page'));
    expect(router.state.location.hash).toBe('section');
    expect(router.state.location.state).toMatchObject({ from: 'nav' });
  });

  test('includes the basepath in the href but not in matching', async () => {
    await mountRouter(
      <>
        <NavPlus to="/docs">Docs</NavPlus>
        <NavPlus to="/blog">Blog</NavPlus>
      </>,
      '/app/docs/intro',
      { basepath: '/app' }
    );
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('href')).toBe('/app/docs');
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Blog' }).getAttribute('aria-current')).toBeNull();
  });

  test('navigates under the basepath', async () => {
    const { router, history } = await mountRouter(<NavPlus to="/docs">Docs</NavPlus>, '/app', {
      basepath: '/app',
    });
    fireEvent.click(screen.getByRole('link', { name: 'Docs' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/docs'));
    expect(history.location.pathname).toBe('/app/docs');
  });

  test('forwards TanStack navigate options', async () => {
    const { router } = await mountRouter(
      <NavPlus to="/b" navigateOptions={{ resetScroll: false }}>B</NavPlus>
    );
    const navigate = jest.spyOn(router, 'navigate');
    fireEvent.click(screen.getByRole('link', { name: 'B' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/b'));
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ to: '/b', resetScroll: false }));
  });

  test('prefetch preloads the route through the router (runs its loader)', async () => {
    const loader = jest.fn(() => ({ ready: true }));
    await mountRouter(<NavPlus to="/dashboard" prefetch={{ delay: 0 }}>Dash</NavPlus>, '/', {
      routes: (parent) => [childRoute(parent, '/dashboard', { loader })],
    });
    expect(loader).not.toHaveBeenCalled();
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Dash' }));
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    // Hovering again does not preload a second time.
    fireEvent.mouseLeave(screen.getByRole('link', { name: 'Dash' }));
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Dash' }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(loader).toHaveBeenCalledTimes(1);
  });

  test('a failing preload does not surface from the hover', async () => {
    const loader = jest.fn(() => {
      throw new Error('boom');
    });
    await mountRouter(<NavPlus to="/broken" prefetch={{ delay: 0 }}>Broken</NavPlus>, '/', {
      routes: (parent) => [childRoute(parent, '/broken', { loader })],
    });
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Broken' }));
    await waitFor(() => expect(loader).toHaveBeenCalled());
    expect(screen.getByRole('link', { name: 'Broken' })).toBeTruthy();
  });
});
