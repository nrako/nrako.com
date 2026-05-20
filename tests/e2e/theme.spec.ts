import { expect, test } from '@playwright/test'

test.describe('Theme toggle', () => {
  test('theme toggle button is visible', async ({ page }) => {
    await page.goto('/')

    const toggleButton = page.getByRole('button', { name: 'Toggle Theme' })
    await expect(toggleButton).toBeVisible()
  })

  test('clicking toggle switches theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/', { waitUntil: 'networkidle' })

    const toggleButton = page.getByRole('button', { name: 'Toggle Theme' })
    await expect(toggleButton).toBeEnabled({ timeout: 15000 })

    await toggleButton.click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await toggleButton.click()
    await expect(page.locator('html')).toHaveClass(/light/)
  })

  test('theme preference persists across page navigation', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/', { waitUntil: 'networkidle' })

    const toggleButton = page.getByRole('button', { name: 'Toggle Theme' })
    await expect(toggleButton).toBeEnabled({ timeout: 15000 })
    await toggleButton.click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.getByRole('link', { name: 'Blog' }).click()

    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('respects system dark mode preference by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')

    // Without user interaction, should follow system preference
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('respects system light mode preference by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    // Without user interaction, should follow system preference (no dark class)
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})
