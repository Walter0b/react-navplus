import { isAbsoluteUrl, isActive, normalizePath, splitTo } from '../../src/core/matchers';

describe('splitTo', () => {
  test('splits pathname, search and hash', () => {
    expect(splitTo('/a/b?x=1&y=2#top')).toEqual({ pathname: '/a/b', search: '?x=1&y=2', hash: '#top' });
    expect(splitTo('/a#top?notsearch')).toEqual({ pathname: '/a', search: '', hash: '#top?notsearch' });
    expect(splitTo('/a')).toEqual({ pathname: '/a', search: '', hash: '' });
    expect(splitTo('?q=1')).toEqual({ pathname: '', search: '?q=1', hash: '' });
  });
});

describe('isAbsoluteUrl', () => {
  test.each(['https://a.com', 'http://a.com/x', 'mailto:a@b.c', 'tel:123', '//cdn.a.com/x'])(
    '%s is absolute',
    (url) => expect(isAbsoluteUrl(url)).toBe(true)
  );
  test.each(['/a', 'a/b', '?q=1', '#top', '', './x', '../x'])('%s is not absolute', (url) =>
    expect(isAbsoluteUrl(url)).toBe(false)
  );
});

describe('normalizePath', () => {
  test('adds a leading slash, drops trailing ones and collapses repeats', () => {
    expect(normalizePath('about')).toBe('/about');
    expect(normalizePath('/about/')).toBe('/about');
    expect(normalizePath('//a///b//')).toBe('/a/b');
    expect(normalizePath('')).toBe('/');
    expect(normalizePath('/')).toBe('/');
  });
  test('ignores case unless told otherwise', () => {
    expect(normalizePath('/About')).toBe('/about');
    expect(normalizePath('/About', true)).toBe('/About');
  });
  test('decodes percent-encoding and survives malformed input', () => {
    expect(normalizePath('/caf%C3%A9')).toBe('/café');
    expect(normalizePath('/100%')).toBe('/100%');
  });
});

describe('isActive', () => {
  describe('startsWith (the default)', () => {
    test('matches the path itself and anything nested under it', () => {
      expect(isActive('/docs', '/docs')).toBe(true);
      expect(isActive('/docs/intro', '/docs')).toBe(true);
      expect(isActive('/docs/a/b', '/docs/a')).toBe(true);
    });
    test('compares whole segments, not characters', () => {
      expect(isActive('/homepage', '/home')).toBe(false);
      expect(isActive('/docs-old', '/docs')).toBe(false);
    });
    test('"/" is only active at the root', () => {
      expect(isActive('/', '/')).toBe(true);
      expect(isActive('/about', '/')).toBe(false);
    });
  });

  describe('exact', () => {
    test('requires equal pathnames', () => {
      expect(isActive('/docs', '/docs', 'exact')).toBe(true);
      expect(isActive('/docs/intro', '/docs', 'exact')).toBe(false);
    });
    test('ignores trailing slashes, the query string and the hash of the target', () => {
      expect(isActive('/about', '/about/', 'exact')).toBe(true);
      expect(isActive('/about/', '/about', 'exact')).toBe(true);
      expect(isActive('/a', '/a?tab=1#x', 'exact')).toBe(true);
    });
  });

  describe('includes', () => {
    test('finds the target segments anywhere in the path', () => {
      expect(isActive('/my/home/page', '/home', 'includes')).toBe(true);
      expect(isActive('/a/b/c/d', '/b/c', 'includes')).toBe(true);
    });
    test('still compares whole segments and keeps their order', () => {
      expect(isActive('/my/homepage', '/home', 'includes')).toBe(false);
      expect(isActive('/a/c/b', '/b/c', 'includes')).toBe(false);
    });
    test('"/" only matches the root', () => {
      expect(isActive('/', '/', 'includes')).toBe(true);
      expect(isActive('/x', '/', 'includes')).toBe(false);
    });
  });

  describe('pattern', () => {
    test('tests the regex against the current pathname', () => {
      const pattern = /^\/products\/[\w-]+$/;
      expect(isActive('/products/item-1', '', 'pattern', pattern)).toBe(true);
      expect(isActive('/products', '', 'pattern', pattern)).toBe(false);
    });
    test('is never active without a pattern', () => {
      expect(isActive('/a', '/a', 'pattern')).toBe(false);
    });
    test('gives the same answer every time for a global or sticky regex', () => {
      const global = /^\/a/g;
      expect([1, 2, 3, 4].map(() => isActive('/a', '', 'pattern', global))).toEqual([true, true, true, true]);
      const sticky = /^\/a/y;
      expect([1, 2, 3].map(() => isActive('/a', '', 'pattern', sticky))).toEqual([true, true, true]);
    });
  });

  test('is case-insensitive unless caseSensitive is set', () => {
    expect(isActive('/About', '/about')).toBe(true);
    expect(isActive('/About', '/about', 'exact', undefined, true)).toBe(false);
  });

  test('matches encoded and decoded forms of the same path', () => {
    expect(isActive('/caf%C3%A9', '/café', 'exact')).toBe(true);
  });

  test('falls back to startsWith for an unknown mode', () => {
    expect(isActive('/a/b', '/a', 'nope' as never)).toBe(true);
    expect(isActive('/ab', '/a', 'nope' as never)).toBe(false);
  });
});
