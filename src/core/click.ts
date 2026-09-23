import type { MouseEvent } from 'react';

const isModified = (event: MouseEvent): boolean =>
  event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;

/**
 * Whether a click should be routed instead of left to the browser. Plain left clicks
 * only: modified clicks open a new tab or window, and `target` or `download` links
 * are not navigations of this page.
 */
export const shouldHandleClick = (
  event: MouseEvent,
  { target, download }: { target?: string | undefined; download?: unknown }
): boolean =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !isModified(event) &&
  (!target || target === '_self') &&
  download === undefined;
