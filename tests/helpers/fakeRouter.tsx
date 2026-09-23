import { useSyncExternalStore } from 'react';
import { splitTo } from '../../src/core/matchers';
import type { NavigateOptions, RouterAdapter } from '../../src/core/types';

/** A router in a variable: enough to observe what NavPlus asks of an adapter. */
export const createFakeRouter = (
  initialPath = '/',
  extras: Partial<RouterAdapter> = {}
) => {
  let path = initialPath;
  const listeners = new Set<() => void>();
  const navigations: { to: string; options: NavigateOptions | undefined }[] = [];

  const adapter: RouterAdapter = {
    name: 'fake',
    useLocation() {
      const current = useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => path
      );
      return splitTo(current);
    },
    useNavigate() {
      return (to, options) => {
        navigations.push({ to, options });
        path = to;
        listeners.forEach((listener) => listener());
      };
    },
    ...extras,
  };

  return {
    adapter,
    navigations,
    get path() {
      return path;
    },
  };
};
