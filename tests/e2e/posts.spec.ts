import { expect, test, type Page } from '@playwright/test'

// The tests about posts only apply once a post is published. Call this after
// loading /posts.
async function skipWithoutPosts(page: Page) {
  test.skip(
    (await page.getByRole('article').count()) === 0,
    'no post is published',
  )
}

test.describe('Posts listing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts')
  })

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Posts | nrako.com')
  })

  test('says so when nothing is published', async ({ page }) => {
    test.skip(
      (await page.getByRole('article').count()) > 0,
      'a post is published',
    )

    await expect(page.getByText('No posts yet.')).toBeVisible()
  })

  test('displays post cards with titles', async ({ page }) => {
    await skipWithoutPosts(page)

    const articles = page.getByRole('article')

    await expect(articles.first()).toBeVisible()
    await expect(articles.first().getByRole('heading')).toBeVisible()
  })

  test('post cards are links to individual posts', async ({ page }) => {
    await skipWithoutPosts(page)

    const firstPostLink = page.locator('.post-entry').first()

    await expect(firstPostLink).toHaveAttribute('href', /^\/posts\//)
  })

  test('clicking a post navigates to the post page', async ({ page }) => {
    await skipWithoutPosts(page)

    const firstPost = page.getByRole('article').first()
    const postTitle = await firstPost.getByRole('heading').textContent()

    await firstPost.click()

    await expect(page).toHaveURL(/\/posts\//)
    await expect(page.getByRole('heading', { name: postTitle! })).toBeVisible()
  })
})

test.describe('Individual post', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts')
    await skipWithoutPosts(page)

    // Navigate to first post
    await page.getByRole('article').first().click()
  })

  test('displays post content', async ({ page }) => {
    // Post should have a main heading
    const mainContent = page.getByRole('main')
    await expect(mainContent.getByRole('heading').first()).toBeVisible()

    // Post should have article content
    await expect(page.locator('.post-content')).toBeVisible()
  })

  test('displays post metadata', async ({ page }) => {
    // Should have a time element for the date
    await expect(page.locator('time').first()).toBeVisible()

    // Should have reading time
    await expect(page.getByText(/min read|Less than a minute/)).toBeVisible()
  })
})

test.describe('Post versions', () => {
  test('an older version is served as its own page', async ({ page }) => {
    await page.goto('/posts')
    await skipWithoutPosts(page)

    await page.getByRole('article').first().click()
    await expect(page.locator('.post-content')).toBeVisible()

    // Version history comes from the GitHub API and needs GITHUB_TOKEN.
    const versionLinks = page.locator('#versions-popover a')
    test.skip(
      (await versionLinks.count()) < 2,
      'no version history (GITHUB_TOKEN not set?)',
    )

    // The first entry is the latest version and links to the post itself
    await expect(versionLinks.first()).toHaveAttribute(
      'href',
      /^\/posts\/[^/]+$/,
    )

    const oldestHref = await versionLinks.last().getAttribute('href')
    expect(oldestHref).toMatch(/^\/posts\/[^/]+\/[0-9a-f]{7}$/)

    await page.goto(oldestHref!)

    await expect(page.getByText('You are looking at version')).toBeVisible()
    await expect(page.locator('.post-content')).toBeVisible()
  })
})

test.describe('Not found', () => {
  test('unknown addresses get the 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')

    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { name: 'Page not found' }),
    ).toBeVisible()
  })

  test('the unpublished first post is gone', async ({ page }) => {
    const response = await page.goto('/posts/hello_web')

    expect(response?.status()).toBe(404)
  })
})
