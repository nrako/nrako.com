import { expect, test } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays the site name as the main heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'nrako' }),
    ).toBeVisible()
  })

  test('has no posts section when nothing is published', async ({ page }) => {
    test.skip(
      (await page.getByRole('article').count()) > 0,
      'a post is published',
    )

    await expect(page.getByRole('heading', { name: 'Posts' })).toHaveCount(0)
  })

  test('lists posts that link to their page', async ({ page }) => {
    test.skip(
      (await page.getByRole('article').count()) === 0,
      'no post is published',
    )

    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible()

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
