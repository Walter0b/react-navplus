import type { MouseEvent } from 'react';

const isModified = (event: MouseEvent): boolean =>
  event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;

export const shouldHandleClick = (
  event: MouseEvent,
  { target, download }: { target?: string | undefined; download?: unknown }
): boolean =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !isModified(event) &&
  (!target || target === '_self') &&
  (download === undefined || download === null || download === false);
