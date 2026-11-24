import { expect, test } from '@playwright/test'
import { skipWithoutFixturePosts } from './fixtures'

// A phone held upright
const NARROW = { width: 390, height: 760 }

const NAME = 'A name that runs longer than a phone has room for'
// Neither a handle nor an address has a place to break: no space, no hyphen
const HANDLE = 'ahandlethatrunslongerthanaphonehasroomfor.example.bsky.social'
const WORD = `https://example.com/${'alongpath'.repeat(12)}`
// The client checks what Bluesky answers: a `cid` has to parse as one
const CID = 'bafyreidfayvfuwqa7qlnopdjiqrxzs6blmoeu4rujcjtnci5beludirz2a'

// A reply as Bluesky gives it, with the replies to it
function reply(id: string, replies: unknown[] = []) {
  return {
    $type: 'app.bsky.feed.defs#threadViewPost',
    post: {
      uri: `at://did:plc:fixture/app.bsky.feed.post/${id}`,
      cid: CID,
      author: { did: 'did:plc:fixture', handle: HANDLE, displayName: NAME },
      record: {
        $type: 'app.bsky.feed.post',
        text: `Reply ${id} ${WORD}`,
        createdAt: '2026-01-06T00:00:00.000Z',
      },
      indexedAt: '2026-01-06T00:00:00.000Z',
      likeCount: 1,
      repostCount: 0,
      quoteCount: 0,
      replyCount: replies.length,
    },
    replies,
  }
}

test.describe('Reactions', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutFixturePosts()

    // The fixture names a Bluesky post that does not exist: this is its
    // thread, three replies deep, which is as deep as the site asks for
    await page.route('https://public.api.bsky.app/**', (route) =>
      route.fulfill({
        json: {
          thread: reply('post', [
            reply('first', [reply('second', [reply('third')])]),
          ]),
        },
        headers: { 'access-control-allow-origin': '*' },
      }),
    )
  })

  test('replies do not make the page wider than a phone', async ({ page }) => {
    await page.setViewportSize(NARROW)
    await page.goto('/posts/fixture-reactions-post')

    await expect(page.getByText(/^Reply third/)).toBeVisible()

    const { page: width, window } = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      window: document.documentElement.clientWidth,
    }))
    expect(width).toBe(window)
  })
})
