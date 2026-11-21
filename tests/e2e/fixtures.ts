import { test } from '@playwright/test'

// `pnpm run test:e2e:fixtures` builds the site from tests/fixtures/posts
// instead of posts/. The tests that name a fixture post only apply to that run.
export const usesFixturePosts = Boolean(process.env.POSTS_DIR)

export function skipWithoutFixturePosts() {
  test.skip(!usesFixturePosts, 'the site is not built from the fixture posts')
}
