module.exports = {
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  env: {
    jest: true,
  },
  globals: {
    page: true,
    browser: true,
    context: true,
    jestPuppeteer: true,
  },
}
