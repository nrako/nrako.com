import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('header contains main navigation links', async ({ page }) => {
    await page.goto('/')

    const header = page.getByRole('banner')

    await expect(header.getByRole('link', { name: 'Home Base' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Blog' })).toBeVisible()
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

    await expect(
      header.getByRole('link', { name: 'LinkedIn' }),
    ).toHaveAttribute('href', 'https://linkedin.com/in/nrako')

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
