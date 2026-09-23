/**
 * A router written from scratch on `window.history`. This is the example in
 * docs/writing-an-adapter.md, so the documented way of supporting another router is
 * held to the same suite as the built-in adapters.
 */
import { useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement } from 'react';
import { render, waitFor } from '@testing-library/react';
import { createNavPlus, splitTo } from '../../src';
import type { NavPlusProps, RouterAdapter } from '../../src';
import { runConformanceSuite } from './conformance';
import type { Mounted } from './conformance';

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
};
const getUrl = () => window.location.pathname + window.location.search + window.location.hash;

const adapter: RouterAdapter = {
  name: 'history',
  useLocation() {
    return splitTo(useSyncExternalStore(subscribe, getUrl, () => '/'));
  },
  useNavigate() {
    return (to, { replace, state } = {}) => {
      window.history[replace ? 'replaceState' : 'pushState'](state ?? null, '', to);
      listeners.forEach((listener) => listener());
    };
  },
};

const { NavPlus, useIsActive } = createNavPlus(adapter);

const mount = async (ui: ReactElement, path = '/'): Promise<Mounted> => {
  window.history.replaceState(null, '', path);
  const { container } = render(ui);
  await waitFor(() => expect(container.firstElementChild).not.toBeNull());
  return {
    location: () => ({ pathname: window.location.pathname, search: window.location.search }),
    historyLength: () => window.history.length,
  };
};

runConformanceSuite({
  name: 'custom adapter (window.history)',
  NavPlus: NavPlus as ComponentType<NavPlusProps>,
  useIsActive,
  render: mount,
});
