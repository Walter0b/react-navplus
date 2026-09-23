module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.(ts|tsx)'],
  // Type checking is `npm run typecheck`; jest only transpiles. The routers are ESM-only in
  // parts, so wouter and its dependencies are transpiled too.
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        diagnostics: false,
        tsconfig: { jsx: 'react-jsx', module: 'commonjs', esModuleInterop: true, allowJs: true },
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!(wouter|regexparam|mitt)/)'],
};
