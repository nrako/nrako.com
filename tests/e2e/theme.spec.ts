import { expect, test } from '@playwright/test'
import { skipWithoutFixturePosts } from './fixtures'

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
    // The not-found page: a second page that exists whatever is published
    await page.goto('/this-page-does-not-exist', { waitUntil: 'networkidle' })

    const toggleButton = page.getByRole('button', { name: 'Toggle Theme' })
    await expect(toggleButton).toBeEnabled({ timeout: 15000 })
    await toggleButton.click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.getByRole('link', { name: 'Home Base' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('respects system dark mode preference by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')

    // Without user interaction, should follow system preference
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('dark mode draws every weight thinner by the same shift', async ({
    page,
  }) => {
    const weights = () =>
      page.evaluate(() => {
        const weight = (selector: string) =>
          Number(getComputedStyle(document.querySelector(selector)!).fontWeight)
        return { text: weight('.prose p'), title: weight('.prose h1') }
      })

    // The not-found page: a prose page that exists whatever is published
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/this-page-does-not-exist')
    expect(await weights()).toEqual({ text: 400, title: 300 })

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/this-page-does-not-exist')
    await expect(page.locator('html')).toHaveClass(/dark/)
    expect(await weights()).toEqual({ text: 375, title: 275 })
  })

  test('respects system light mode preference by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    // Without user interaction, should follow system preference (no dark class)
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('code follows the chosen theme, not the system', async ({ page }) => {
    skipWithoutFixturePosts()
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/posts/fixture-post', { waitUntil: 'networkidle' })
    const code = page.locator('pre.shiki')
    const background = () =>
      code.evaluate((pre) => getComputedStyle(pre).backgroundColor)
    const darkBackground = await background()

    const toggleButton = page.getByRole('button', { name: 'Toggle Theme' })
    await expect(toggleButton).toBeEnabled({ timeout: 15000 })
    await toggleButton.click()
    await expect(page.locator('html')).toHaveClass(/light/)

    expect(await background()).not.toBe(darkBackground)
    await expect(code).toHaveCSS(
      'background-color',
      await code.evaluate((pre) => pre.style.backgroundColor),
    )
  })
})
