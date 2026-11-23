import { expect, test } from '@playwright/test'

// `public/_headers` forbids showing the site in a frame. A feed is asked for
// too: it takes its type from a rule of its own, and both rules apply.
for (const path of ['/', '/posts', '/feed/atom']) {
  test(`${path} is not to be shown in a frame`, async ({ request }) => {
    const response = await request.get(path)

    expect(response.status()).toBe(200)
    expect(response.headers()['content-security-policy']).toBe(
      "frame-ancestors 'none'",
    )
    expect(response.headers()['x-frame-options']).toBe('DENY')
  })
}
