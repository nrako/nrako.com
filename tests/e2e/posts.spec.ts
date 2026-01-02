import { test, expect } from '@playwright/test'

test.describe('Posts listing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts')
  })

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Posts | nrako.com')
  })

  test('displays post cards with titles', async ({ page }) => {
    const articles = page.getByRole('article')

    await expect(articles.first()).toBeVisible()
    await expect(articles.first().getByRole('heading')).toBeVisible()
  })

  test('post cards are links to individual posts', async ({ page }) => {
    const firstPostLink = page.locator('.freshBlog-postCard').first()

    await expect(firstPostLink).toHaveAttribute('href', /^\/posts\//)
  })

  test('clicking a post navigates to the post page', async ({ page }) => {
    const firstPost = page.getByRole('article').first()
    const postTitle = await firstPost.getByRole('heading').textContent()

    await firstPost.click()

    await expect(page).toHaveURL(/\/posts\//)
    await expect(page.getByRole('heading', { name: postTitle! })).toBeVisible()
  })
})

test.describe('Individual post', () => {
  test('displays post content', async ({ page }) => {
    await page.goto('/posts')

    // Navigate to first post
    await page.getByRole('article').first().click()

    // Post should have a main heading
    const mainContent = page.getByRole('main')
    await expect(mainContent.getByRole('heading').first()).toBeVisible()

    // Post should have article content
    await expect(page.locator('.freshBlog-post-content')).toBeVisible()
  })

  test('displays post metadata', async ({ page }) => {
    await page.goto('/posts')
    await page.getByRole('article').first().click()

    // Should have a time element for the date
    await expect(page.locator('time').first()).toBeVisible()

    // Should have reading time
    await expect(page.getByText(/min read|Less than a minute/)).toBeVisible()
  })
})
