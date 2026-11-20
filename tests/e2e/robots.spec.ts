import { expect, test } from '@playwright/test'

test.describe('robots.txt', () => {
  test('is served as plain text', async ({ request }) => {
    const response = await request.get('/robots.txt')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')
  })

  test('lets search engines in and opts out of AI use', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text()

    expect(body).toMatch(/^User-agent: \*$/m)
    expect(body).toMatch(/^Allow: \/$/m)
    expect(body).toMatch(/^Content-Signal: .*ai-train=no/m)
  })

  test('turns AI training crawlers away', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text()

    // The group that lists GPTBot must end with a blanket Disallow
    const group = body
      .split(/\n\s*\n/)
      .find((block) => /^User-agent: GPTBot$/m.test(block))

    expect(group).toBeDefined()
    expect(group).toMatch(/^Disallow: \/$/m)
  })
})
