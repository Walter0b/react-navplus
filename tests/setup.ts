import { TextDecoder, TextEncoder } from 'util';
import 'whatwg-fetch';

// React Router 7 needs these, and jsdom does not provide them.
Object.assign(globalThis, { TextEncoder, TextDecoder });

// TanStack Router restores scroll on navigation, and jsdom's scrollTo is a stub that logs.
window.scrollTo = () => undefined;

// Several tests deliberately let the browser handle a click (modified clicks, external
// links). jsdom then reports that it cannot navigate, which is the expected outcome.
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  const message = first instanceof Error ? first.message : String(first);
  if (message.includes('Not implemented: navigation')) return;
  originalError(...args);
};
