import { expect, test } from '@playwright/test'
import { skipWithoutFixturePosts, usesFixturePosts } from './fixtures'

test.describe('Assets', () => {
  test('fonts and stylesheets are served by the site itself', async ({
    page,
    baseURL,
  }) => {
    const pages = ['/', '/posts', '/this-page-does-not-exist']
    if (usesFixturePosts) pages.push('/posts/fixture-post')

    const elsewhere: string[] = []
    page.on('request', (request) => {
      const type = request.resourceType()
      if (type !== 'font' && type !== 'stylesheet') return
      if (new URL(request.url()).origin !== new URL(baseURL!).origin) {
        elsewhere.push(request.url())
      }
    })

    for (const url of pages) {
      await page.goto(url, { waitUntil: 'networkidle' })
    }

    expect(elsewhere).toEqual([])
  })

  test('only a post with math loads the styles for it', async ({
    page,
    request,
  }) => {
    skipWithoutFixturePosts()

    // Read in the served HTML: in browsers without CSS anchor positioning,
    // the polyfill replaces each stylesheet link with a <style> element
    const katexLink = /<link rel="stylesheet" href="\/_astro\/katex[^"]*\.css"/

    const withMath = await (await request.get('/posts/fixture-post')).text()
    expect(withMath).toMatch(katexLink)

    const withoutMath = await (
      await request.get('/posts/fixture-short-post')
    ).text()
    expect(withoutMath).not.toMatch(katexLink)

    await page.goto('/posts/fixture-post')
    await expect(page.locator('.katex').first()).toBeVisible()
  })
})
