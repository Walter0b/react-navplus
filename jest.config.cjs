module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.(ts|tsx)'],
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
