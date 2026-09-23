import type { PrefetchOptions } from './types';

export const DEFAULT_PREFETCH_DELAY = 200;

export const normalizePrefetch = (
  prefetch: boolean | PrefetchOptions | undefined
): { enabled: boolean; delay: number; handler: ((to: string) => void) | undefined } => {
  if (typeof prefetch === 'object' && prefetch !== null) {
    return {
      enabled: prefetch.enabled ?? true,
      delay: prefetch.delay ?? DEFAULT_PREFETCH_DELAY,
      handler: prefetch.handler,
    };
  }
  return { enabled: prefetch === true, delay: DEFAULT_PREFETCH_DELAY, handler: undefined };
};
