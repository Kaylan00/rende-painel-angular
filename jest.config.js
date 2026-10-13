/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  // motion anima com Web Animations/IntersectionObserver, que o jsdom não tem: usamos um mock.
  moduleNameMapper: {
    '^motion$': '<rootDir>/testing/motion.mock.ts',
  },
};
