/**
 * @file index.ts
 * @description Router-agnostic core of react-navplus. Most apps want one of the
 * ready-made entry points instead:
 *   - react-navplus/react-router
 *   - react-navplus/tanstack-router
 *   - react-navplus/wouter
 * Use `createNavPlus` here to support any other router.
 */

export { createNavPlus } from './core/createNavPlus';
export { isActive, isAbsoluteUrl, normalizePath, splitTo } from './core/matchers';

export type {
  IsActiveOptions,
  MatchMode,
  NavigateOptions,
  NavLocation,
  NavPlusOwnProps,
  NavPlusProps,
  PrefetchOptions,
  ResolvedTo,
  RouterAdapter,
} from './core/types';
