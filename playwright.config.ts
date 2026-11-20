import { defineConfig, devices } from '@playwright/test'

// The tests run against the production build, served locally by `astro
// preview` on a dedicated port. Astro's default port (4321) is often taken by
// another local project, and a server found there could be the wrong site.
const port = Number(process.env.E2E_PORT ?? 4390)
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL,
    // sets actions and navigation timeouts to not wait the full test timeout
    // of 10s no action or navigation should take longer thant 3s
    // https://playwright.dev/docs/test-timeouts
    actionTimeout: 2 * 1000,
    navigationTimeout: 2 * 1000,
    video: 'on-first-retry',
    trace: 'on-first-retry',
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    // Build, then serve the result. The dev server is not used: it compiles
    // pages and browser scripts on demand, which made first loads exceed the
    // navigation timeout at random when four browsers run in parallel.
    //
    // --ignore-lock keeps the server in the foreground: under a coding agent
    // Astro otherwise starts it as a background process and returns at once,
    // which Playwright reads as the server having exited.
    command: `pnpm run build && pnpm run preview --port ${port} --ignore-lock`,
    url: baseURL,
    // Always build and start a fresh server, never test a stale build
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
})
