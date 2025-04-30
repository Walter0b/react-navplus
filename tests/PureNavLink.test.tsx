/**
 * @file tests/utils/prefetch.test.ts
 * @description Tests for prefetching utilities
 */

import { defaultPrefetchOptions, normalizePrefetchOptions, executePrefetch } from "../src/utils/prefetch";



describe('defaultPrefetchOptions', () => {
    test('should have default values', () => {
        expect(defaultPrefetchOptions).toEqual({
            enabled: true,
            delay: 200,
            routerType: 'react-router'
        });
    });
});

describe('normalizePrefetchOptions', () => {
    test('should handle boolean prefetch value', () => {
        expect(normalizePrefetchOptions(true)).toEqual({
            enabled: true,
            delay: 200,
            routerType: 'react-router'
        });

        expect(normalizePrefetchOptions(false)).toEqual({
            enabled: false,
            delay: 200,
            routerType: 'react-router'
        });
    });

    test('should merge custom options with defaults', () => {
        const customOptions = {
            delay: 100,
            routerType: 'tanstack-router' as const
        };

        expect(normalizePrefetchOptions(customOptions)).toEqual({
            enabled: true,
            delay: 100,
            routerType: 'tanstack-router'
        });
    });

    test('should handle undefined', () => {
        expect(normalizePrefetchOptions(undefined)).toEqual(defaultPrefetchOptions);
    });
});

describe('executePrefetch', () => {
    beforeEach(() => {
        // Mock createElement and appendChild
        jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
            return {
                tagName,
                rel: '',
                href: '',
                as: ''
            } as unknown as HTMLElement;
        });

        jest.spyOn(document.head, 'appendChild').mockImplementation(() => null as unknown as Node);

        // Clear console mocks between tests
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should return false for external URLs', () => {
        const result = executePrefetch('/dashboard', 'react-router', true);
        expect(result).toBe(false);
        expect(document.createElement).not.toHaveBeenCalled();
    });

    test('should use custom prefetch function if provided and routerType is custom', () => {
        const customPrefetch = jest.fn();
        const result = executePrefetch('/dashboard', 'custom', false, undefined, customPrefetch);

        expect(result).toBe(true);
        expect(customPrefetch).toHaveBeenCalledWith('/dashboard');
        expect(document.createElement).not.toHaveBeenCalled();
    });

    test('should create link elements for react-router prefetching', () => {
        const result = executePrefetch('/dashboard', 'react-router', false);

        expect(result).toBe(true);
        expect(document.createElement).toHaveBeenCalledWith('link');
        expect(document.head.appendChild).toHaveBeenCalledTimes(2); // prefetch + preconnect
    });

    test('should use TanStack Router prefetch if available in context', () => {
        const mockContext = {
            router: {
                prefetch: jest.fn()
            }
        };

        const result = executePrefetch('/dashboard', 'tanstack-router', false, mockContext);

        expect(result).toBe(true);
        expect(mockContext.router.prefetch).toHaveBeenCalledWith('/dashboard');
        expect(document.createElement).not.toHaveBeenCalled();
    });

    test('should try global TanStack Router if not in context', () => {
        // Mock global TanStackRouter
        (window as any).TanStackRouter = {
            router: {
                prefetch: jest.fn()
            }
        };

        const result = executePrefetch('/dashboard', 'tanstack-router', false);

        expect(result).toBe(true);
        expect((window as any).TanStackRouter.router.prefetch).toHaveBeenCalledWith('/dashboard');
        expect(document.createElement).not.toHaveBeenCalled();

        // Clean up
        delete (window as any).TanStackRouter;
    });
});