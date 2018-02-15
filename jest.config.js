module.exports = {
  globalSetup: './__tests__/.support/setup.js',
  globalTeardown: './__tests__/.support/teardown.js',
  setupTestFrameworkScriptFile: './__tests__/.support/setupTestFramework.js',
  testEnvironment: './__tests__/.support/puppeteer_environment.js',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/.support']
}
