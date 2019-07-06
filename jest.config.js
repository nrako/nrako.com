module.exports = {
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: ['./__tests__/.support/setupTestFramework.js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/.support'],
  testRegex: './*\\.spec\\.js$',
}
