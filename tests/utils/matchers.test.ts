/**
 * @file tests/utils/matchers.test.ts
 * @description Tests for URL matching utilities
 */

import { matchers, cleanUrl, isActive, isActiveWithCustomFn } from '../../src/utils/matchers';
import { MatchMode } from '../../src/types';

describe('matchers', () => {
    test('exact matcher should match exact paths', () => {
        const exactMatcher = matchers.get('exact');
        if (!exactMatcher) throw new Error('Exact matcher not found');

        expect(exactMatcher('/home', '/home')).toBe(true);
        expect(exactMatcher('/home', '/homepage')).toBe(false);
        expect(exactMatcher('/home', '/home/details')).toBe(false);
    });

    test('startsWith matcher should match paths that start with the URL', () => {
        const startsWithMatcher = matchers.get('startsWith');
        if (!startsWithMatcher) throw new Error('startsWith matcher not found');

        expect(startsWithMatcher('/home', '/home')).toBe(true);
        expect(startsWithMatcher('/home/details', '/home')).toBe(true);
        expect(startsWithMatcher('/dashboard', '/home')).toBe(false);
    });

    test('includes matcher should match paths that include the URL', () => {
        const includesMatcher = matchers.get('includes');
        if (!includesMatcher) throw new Error('includes matcher not found');

        expect(includesMatcher('/home', '/home')).toBe(true);
        expect(includesMatcher('/my/home/page', '/home')).toBe(true);
        expect(includesMatcher('/dashboard', '/home')).toBe(false);
    });

    test('pattern matcher should match paths that match the RegExp pattern', () => {
        const patternMatcher = matchers.get('pattern');
        if (!patternMatcher) throw new Error('pattern matcher not found');

        const pattern = /^\/products\/[\w-]+$/;
        expect(patternMatcher('/products/item-123', '', pattern)).toBe(true);
        expect(patternMatcher('/products', '', pattern)).toBe(false);
        expect(patternMatcher('/products/item-123/details', '', pattern)).toBe(false);
    });
});

describe('cleanUrl', () => {
    test('should add leading slash if missing', () => {
        expect(cleanUrl('home')).toBe('/home');
        expect(cleanUrl('/home')).toBe('/home');
    });

    test('should return root path for empty input', () => {
        expect(cleanUrl('')).toBe('/');
        expect(cleanUrl(undefined as unknown as string)).toBe('/');
    });
});

describe('isActive', () => {
    test('should correctly determine active state based on match mode', () => {
        // Test exact matching
        expect(isActive('/home', '/home', 'exact')).toBe(true);
        expect(isActive('/home/details', '/home', 'exact')).toBe(false);

        // Test startsWith matching
        expect(isActive('/home/details', '/home', 'startsWith')).toBe(true);
        expect(isActive('/dashboard', '/home', 'startsWith')).toBe(false);

        // Test includes matching (default)
        expect(isActive('/my/home/page', '/home')).toBe(true);
        expect(isActive('/dashboard', '/home')).toBe(false);

        // Test pattern matching
        const pattern = /^\/products\/[\w-]+$/;
        expect(isActive('/products/item-123', '', 'pattern', pattern)).toBe(true);
        expect(isActive('/products', '', 'pattern', pattern)).toBe(false);
    });

    test('should default to includes matching if invalid match mode provided', () => {
        expect(isActive('/my/home/page', '/home', 'invalid' as MatchMode)).toBe(true);
    });
});

describe('isActiveWithCustomFn', () => {
    test('should use custom function to determine active state', () => {
        const customFn = (pathname: string, url: string) => {
            return pathname.includes(url) && pathname.endsWith('/edit');
        };

        expect(isActiveWithCustomFn('/products/123/edit', '/products', customFn)).toBe(true);
        expect(isActiveWithCustomFn('/products/123/view', '/products', customFn)).toBe(false);
    });
});