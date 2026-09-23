import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);

for (const suffix of ['', '/react-router', '/tanstack-router', '/wouter']) {
  for (const format of ['import', 'require']) {
    test(`${format} react-navplus${suffix}`, async () => {
      const entry = `react-navplus${suffix}`;
      const exports = format === 'import' ? await import(entry) : require(entry);
      if (suffix) {
        assert.ok(exports.NavPlus);
        assert.equal(typeof exports.useIsActive, 'function');
      } else {
        assert.equal(typeof exports.createNavPlus, 'function');
        assert.equal(exports.isActive('/docs/intro', '/docs'), true);
        assert.equal(exports.isActive('/docstring', '/docs'), false);
      }
    });
  }
}
