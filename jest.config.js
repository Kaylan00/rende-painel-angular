/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  // motion anima com Web Animations/IntersectionObserver, que o jsdom não tem: usamos um mock.
  // GSAP, ScrollTrigger e Lenis também dependem de layout e rolagem reais: mocks simples.
  moduleNameMapper: {
    '^motion$': '<rootDir>/testing/motion.mock.ts',
    '^gsap$': '<rootDir>/testing/gsap.mock.ts',
    '^gsap/ScrollTrigger$': '<rootDir>/testing/gsap.mock.ts',
    '^lenis$': '<rootDir>/testing/lenis.mock.ts',
  },
};
