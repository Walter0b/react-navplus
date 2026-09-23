import type { ComponentType, ReactElement } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes, useLocation } from 'react-router-dom';
import { NavPlus, useIsActive } from '../../src/adapters/react-router';
import type { NavPlusProps } from '../../src/core/types';
import { runConformanceSuite } from './conformance';
import type { Mounted } from './conformance';

const mountInDataRouter = async (ui: ReactElement, path = '/'): Promise<Mounted> => {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: [path] });
  let lastKey = router.state.location.key;
  let length = 1;
  router.subscribe((state) => {
    if (state.location.key === lastKey) return;
    lastKey = state.location.key;
    if (state.historyAction === 'PUSH') length += 1;
  });
  const { container } = render(<RouterProvider router={router} />);
  await waitFor(() => expect(container.firstElementChild).not.toBeNull());
  return {
    location: () => ({ pathname: router.state.location.pathname, search: router.state.location.search }),
    historyLength: () => length,
  };
};

runConformanceSuite({
  name: 'react-router',
  NavPlus: NavPlus as ComponentType<NavPlusProps>,
  useIsActive,
  render: mountInDataRouter,
});

describe('react-router: specifics', () => {
  afterEach(cleanup);

  const LocationProbe = () => {
    const location = useLocation();
    return (
      <output data-testid="location">
        {location.pathname}|{location.search}|{location.hash}|{JSON.stringify(location.state)}
      </output>
    );
  };
  const currentLocation = () => screen.getByTestId('location').textContent;

  test('resolves a relative `to` against the current route', () => {
    render(
      <MemoryRouter initialEntries={['/settings/profile']}>
        <Routes>
          <Route path="settings">
            <Route
              path="profile"
              element={
                <>
                  <NavPlus to="." matchMode="exact">Here</NavPlus>
                  <NavPlus to="../billing" matchMode="exact">Billing</NavPlus>
                </>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    const here = screen.getByRole('link', { name: 'Here' });
    expect(here.getAttribute('href')).toBe('/settings/profile');
    expect(here.getAttribute('aria-current')).toBe('page');
    const billing = screen.getByRole('link', { name: 'Billing' });
    expect(billing.getAttribute('href')).toBe('/settings/billing');
    expect(billing.getAttribute('aria-current')).toBeNull();
  });

  test('includes the basename in the href but not in matching', () => {
    render(
      <MemoryRouter basename="/app" initialEntries={['/app/docs/intro']}>
        <NavPlus to="/docs">Docs</NavPlus>
        <NavPlus to="/blog">Blog</NavPlus>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('href')).toBe('/app/docs');
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Blog' }).getAttribute('aria-current')).toBeNull();
  });

  test('path-relative navigation agrees with the href and active-state hook', async () => {
    const Probe = () => (
      <output data-testid="active">
        {String(useIsActive('../profile', { matchMode: 'exact' }, { relative: 'path' }))}
      </output>
    );
    render(
      <MemoryRouter initialEntries={['/settings/profile']}>
        <LocationProbe />
        <Routes>
          <Route path="settings/:tab" element={
            <>
              <Probe />
              <NavPlus to="../profile" navigateOptions={{ relative: 'path' }}>Here</NavPlus>
              <NavPlus to="../billing" navigateOptions={{ relative: 'path' }}>Billing</NavPlus>
            </>
          } />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('active').textContent).toBe('true');
    expect(screen.getByRole('link', { name: 'Here' }).getAttribute('aria-current')).toBe('page');
    const billing = screen.getByRole('link', { name: 'Billing' });
    expect(billing.getAttribute('href')).toBe('/settings/billing');
    fireEvent.click(billing);
    await waitFor(() => expect(currentLocation()).toBe('/settings/billing|||null'));
  });

  test('navigates to hash, search and state exactly as written', async () => {
    render(
      <MemoryRouter>
        <LocationProbe />
        <NavPlus to="/page?x=1#section" state={{ from: 'nav' }}>Go</NavPlus>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('link', { name: 'Go' }));
    await waitFor(() => expect(currentLocation()).toBe('/page|?x=1|#section|{"from":"nav"}'));
  });

  test("forwards React Router's own navigate options", async () => {
    const scrolls: unknown[] = [];
    const router = createMemoryRouter(
      [{ path: '*', element: (
        <NavPlus to="/b" navigateOptions={{ preventScrollReset: true }}>B</NavPlus>
      ) }],
      { initialEntries: ['/'] }
    );
    router.subscribe((state) => scrolls.push(state.preventScrollReset));
    render(<RouterProvider router={router} />);
    fireEvent.click(await screen.findByRole('link', { name: 'B' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/b'));
    expect(scrolls).toContain(true);
  });

  test('prefetch needs a handler, since React Router has no built-in preloader', async () => {
    const handler = jest.fn();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <MemoryRouter>
        <NavPlus to="/lazy" prefetch={{ delay: 0, handler }}>Lazy</NavPlus>
        <NavPlus to="/other" prefetch={{ delay: 0 }}>Other</NavPlus>
      </MemoryRouter>
    );
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Lazy' }));
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Other' }));
    await act(async () => void (await new Promise((resolve) => setTimeout(resolve, 20))));
    expect(handler).toHaveBeenCalledWith('/lazy');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('react-router'));
    warn.mockRestore();
  });
});
