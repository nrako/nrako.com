module.exports = {
  preset: 'jest-puppeteer',
  setupTestFrameworkScriptFile: './__tests__/.support/setupTestFramework.js',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/.support'],
  testRegex: './*\\.spec\\.js$',
}
