import { expect, test } from '@playwright/test'

test.describe('Navigation', () => {
  test('header contains main navigation links', async ({ page }) => {
    await page.goto('/')

    const header = page.getByRole('banner')

    await expect(header.getByRole('link', { name: 'Home Base' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Blog' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'About Me' })).toBeVisible()
  })

  test('the header fits on one line on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    const boxes = await page
      .getByRole('banner')
      .getByRole('link')
      .evaluateAll((links) =>
        links.map((link) => {
          const box = link.getBoundingClientRect()
          return { right: box.right, height: box.height }
        }),
      )

    // No link is pushed out of the viewport and no label wraps
    for (const box of boxes) {
      expect(box.right).toBeLessThanOrEqual(375)
      expect(box.height).toBeLessThan(45)
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(375)
  })

  test('navigates to posts page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Blog' }).click()

    await expect(page).toHaveURL('/posts')
  })

  test('home link returns to homepage', async ({ page }) => {
    await page.goto('/posts')

    await page.getByRole('link', { name: 'Home Base' }).click()

    await expect(page).toHaveURL('/')
  })

  test('social links have correct destinations', async ({ page }) => {
    await page.goto('/')

    const header = page.getByRole('banner')

    await expect(header.getByRole('link', { name: 'Social' })).toHaveAttribute(
      'href',
      'https://bsky.app/profile/nrako.com',
    )

    await expect(header.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/nrako',
    )
  })

  test('footer contains feed links', async ({ page }) => {
    await page.goto('/')

    const footer = page.getByRole('contentinfo')

    await expect(footer.getByRole('link', { name: 'Atom' })).toHaveAttribute(
      'href',
      '/feed/atom',
    )
    await expect(footer.getByRole('link', { name: 'JSON' })).toHaveAttribute(
      'href',
      '/feed/json',
    )
    await expect(footer.getByRole('link', { name: 'RSS' })).toHaveAttribute(
      'href',
      '/feed/rss',
    )
  })

  test('footer contains source link', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: 'Source' }),
    ).toHaveAttribute('href', 'https://github.com/nrako/nrako.com')
  })
})
