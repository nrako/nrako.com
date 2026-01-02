import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays hero greeting', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: "Hello, I'm Nicholas." }),
    ).toBeVisible()
  })

  test('displays recent posts section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Recent Posts' }),
    ).toBeVisible()
  })

  test('recent posts are clickable and navigate to post', async ({ page }) => {
    const firstPost = page.getByRole('article').first()
    const postTitle = await firstPost.getByRole('heading').textContent()

    await firstPost.click()

    await expect(page).toHaveURL(/\/posts\//)
    await expect(page.getByRole('heading', { name: postTitle! })).toBeVisible()
  })

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('nrako.com')
  })

  test('has meta description', async ({ page }) => {
    const description = page.locator('meta[name="description"]')
    await expect(description).toHaveAttribute(
      'content',
      "nrako's personal website",
    )
  })
})
