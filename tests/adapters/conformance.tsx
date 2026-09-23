/**
 * The behaviour every router adapter must share. Each router's test file runs this suite
 * against its own real router, so "works with X" means these tests pass with X.
 */
import type { ComponentType, ReactElement } from 'react';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import type { NavPlusProps } from '../../src/core/types';

export interface Mounted {
  location(): { pathname: string; search: string };
  /** Grows on push and stays put on replace. */
  historyLength(): number;
}

export interface Harness {
  name: string;
  NavPlus: ComponentType<NavPlusProps>;
  useIsActive: (to: string, options?: { matchMode?: 'exact' }) => boolean;
  render(ui: ReactElement, path?: string): Promise<Mounted>;
}

const link = (name: string) => screen.getByRole('link', { name });
const pathnameIs = (mounted: Mounted, pathname: string) =>
  waitFor(() => expect(mounted.location().pathname).toBe(pathname));
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

export const runConformanceSuite = ({ name, NavPlus, useIsActive, render }: Harness): void => {
  describe(`${name}: shared behaviour`, () => {
    afterEach(cleanup);

    test('renders a real href', async () => {
      await render(<NavPlus to="/about">About</NavPlus>);
      expect(link('About').getAttribute('href')).toBe('/about');
    });

    test('a click navigates in-app and stops the browser following the link', async () => {
      const mounted = await render(<NavPlus to="/about">About</NavPlus>);
      expect(fireEvent.click(link('About'))).toBe(false);
      await pathnameIs(mounted, '/about');
    });

    test('carries the query string of `to` through navigation', async () => {
      const mounted = await render(<NavPlus to="/search?q=react&page=2">Search</NavPlus>);
      fireEvent.click(link('Search'));
      await pathnameIs(mounted, '/search');
      expect(mounted.location().search).toContain('q=react');
      expect(mounted.location().search).toContain('page=2');
    });

    test('leaves modified clicks to the browser', async () => {
      const mounted = await render(<NavPlus to="/about">About</NavPlus>);
      expect(fireEvent.click(link('About'), { ctrlKey: true })).toBe(true);
      expect(fireEvent.click(link('About'), { metaKey: true })).toBe(true);
      await settle();
      expect(mounted.location().pathname).toBe('/');
    });

    test('active state follows whole path segments', async () => {
      await render(
        <>
          <NavPlus to="/">Home</NavPlus>
          <NavPlus to="/docs">Docs</NavPlus>
          <NavPlus to="/docs" matchMode="exact">DocsExact</NavPlus>
          <NavPlus to="/doc">Doc</NavPlus>
          <NavPlus to="/docs/intro" matchMode="exact">Intro</NavPlus>
          <NavPlus to="/blog">Blog</NavPlus>
        </>,
        '/docs/intro'
      );
      const current = (label: string) => link(label).getAttribute('aria-current');
      expect(current('Home')).toBeNull();
      expect(current('Docs')).toBe('page');
      expect(current('DocsExact')).toBeNull();
      expect(current('Doc')).toBeNull();
      expect(current('Intro')).toBe('page');
      expect(current('Blog')).toBeNull();
    });

    test('"/" is active only on the root', async () => {
      await render(<NavPlus to="/">Home</NavPlus>, '/');
      expect(link('Home').getAttribute('aria-current')).toBe('page');
      cleanup();
      await render(<NavPlus to="/">Home</NavPlus>, '/somewhere');
      expect(link('Home').getAttribute('aria-current')).toBeNull();
    });

    test('a query string or trailing slash in `to` does not break matching', async () => {
      await render(
        <>
          <NavPlus to="/docs?tab=2" matchMode="exact">Query</NavPlus>
          <NavPlus to="/docs/" matchMode="exact">Slash</NavPlus>
        </>,
        '/docs'
      );
      expect(link('Query').getAttribute('aria-current')).toBe('page');
      expect(link('Slash').getAttribute('aria-current')).toBe('page');
    });

    test('active state updates after navigating', async () => {
      const mounted = await render(
        <>
          <NavPlus to="/a">A</NavPlus>
          <NavPlus to="/b">B</NavPlus>
        </>,
        '/a'
      );
      expect(link('A').getAttribute('aria-current')).toBe('page');
      fireEvent.click(link('B'));
      await pathnameIs(mounted, '/b');
      await waitFor(() => expect(link('B').getAttribute('aria-current')).toBe('page'));
      expect(link('A').getAttribute('aria-current')).toBeNull();
    });

    test('useIsActive agrees with the component', async () => {
      const Probe = () => (
        <>
          <span data-testid="prefix">{String(useIsActive('/docs'))}</span>
          <span data-testid="exact">{String(useIsActive('/docs', { matchMode: 'exact' }))}</span>
        </>
      );
      await render(<Probe />, '/docs/intro');
      expect(screen.getByTestId('prefix').textContent).toBe('true');
      expect(screen.getByTestId('exact').textContent).toBe('false');
    });

    test('push adds a history entry and replace does not', async () => {
      const mounted = await render(
        <>
          <NavPlus to="/pushed">Push</NavPlus>
          <NavPlus to="/replaced" replace>Replace</NavPlus>
        </>
      );
      const before = mounted.historyLength();
      fireEvent.click(link('Push'));
      await pathnameIs(mounted, '/pushed');
      expect(mounted.historyLength()).toBe(before + 1);
      fireEvent.click(link('Replace'));
      await pathnameIs(mounted, '/replaced');
      expect(mounted.historyLength()).toBe(before + 1);
    });

    test('navigationDelay defers the navigation', async () => {
      const mounted = await render(
        <NavPlus to="/later" navigationDelay={150}>Later</NavPlus>
      );
      fireEvent.click(link('Later'));
      await settle();
      expect(mounted.location().pathname).toBe('/');
      await pathnameIs(mounted, '/later');
    });

    test('hover navigation happens once, even if the link is then clicked', async () => {
      const mounted = await render(
        <NavPlus to="/hovered" triggerEvent="hover">Hover</NavPlus>
      );
      const before = mounted.historyLength();
      fireEvent.mouseEnter(link('Hover'));
      await pathnameIs(mounted, '/hovered');
      fireEvent.click(link('Hover'));
      await settle();
      expect(mounted.historyLength()).toBe(before + 1);
    });

    test('a disabled link goes nowhere', async () => {
      const mounted = await render(<NavPlus to="/nope" disabled>Nope</NavPlus>);
      fireEvent.click(link('Nope'));
      await settle();
      expect(mounted.location().pathname).toBe('/');
    });

    test('external links are left to the browser', async () => {
      const mounted = await render(
        <NavPlus to="https://example.com/x" isExternal>Out</NavPlus>
      );
      expect(fireEvent.click(link('Out'))).toBe(true);
      await settle();
      expect(mounted.location().pathname).toBe('/');
    });
  });
};
