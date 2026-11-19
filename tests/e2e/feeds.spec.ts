import { expect, test } from '@playwright/test'

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
})
