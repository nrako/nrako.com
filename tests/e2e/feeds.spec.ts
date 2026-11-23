import { expect, test } from '@playwright/test'
import { skipWithoutFixturePosts } from './fixtures'

test.describe('RSS/Atom/JSON Feeds', () => {
  test('atom feed returns valid XML', async ({ request }) => {
    const response = await request.get('/feed/atom')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/atom+xml')

    const body = await response.text()
    expect(body).toContain('<?xml')
    expect(body).toContain('<feed')
  })

  test('rss feed returns valid XML', async ({ request }) => {
    const response = await request.get('/feed/rss')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/rss+xml')

    const body = await response.text()
    expect(body).toContain('<?xml')
    expect(body).toContain('<rss')
  })

  test('json feed returns valid JSON', async ({ request }) => {
    const response = await request.get('/feed/json')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/json')

    const body = await response.json()
    expect(body).toHaveProperty('version')
    expect(body).toHaveProperty('title')
    expect(body).toHaveProperty('items')
  })

  test('the feed points at the post listing', async ({ request }) => {
    const body = await (await request.get('/feed/json')).json()

    expect(body.home_page_url).toBe('https://nrako.com/posts')
  })

  test('the feed lists the posts, newest first', async ({ request }) => {
    skipWithoutFixturePosts()

    const body = await (await request.get('/feed/json')).json()
    const urls = body.items.map((item: { url: string }) => item.url)

    expect(urls).toEqual([
      'https://nrako.com/posts/fixture-post',
      'https://nrako.com/posts/fixture-short-post',
    ])
  })

  for (const type of ['atom', 'rss', 'json']) {
    test(`the ${type} feed has no unlisted post`, async ({ request }) => {
      skipWithoutFixturePosts()

      const body = await (await request.get(`/feed/${type}`)).text()

      expect(body).toContain('/posts/fixture-short-post')
      expect(body).not.toContain('fixture-unlisted-post')
    })
  }
})
