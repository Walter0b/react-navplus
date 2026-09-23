import { defineConfig } from 'tsup';

// Peer dependencies (react and the routers) are external by default.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react-router': 'src/adapters/react-router.ts',
    'tanstack-router': 'src/adapters/tanstack-router.ts',
    wouter: 'src/adapters/wouter.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2018',
});
