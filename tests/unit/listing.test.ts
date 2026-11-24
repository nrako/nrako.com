import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  defaultOptions,
  getListedPosts,
  getPosts,
} from '../../src/lib/blogData.ts'
import processor from '../../src/lib/processor.ts'

const processorOptions = {
  highlighter: { themes: { light: 'github-light', dark: 'github-dark' } },
}

// Without versioning, no post is looked up on GitHub
const fixtures = {
  ...defaultOptions,
  contentDir: fileURLToPath(new URL('../fixtures/posts', import.meta.url)),
  versioning: undefined,
}

function post(frontmatter: string) {
  return `---\ntitle: A post\n${frontmatter}---\n\nSome text.`
}

const slugs = (posts: { slug: string }[]) => posts.map((post) => post.slug)

test('`listed: false` reaches the frontmatter, without a message', async () => {
  const { frontmatter, messages } = await processor(
    post('listed: false\n'),
    processorOptions,
  )

  assert.equal(frontmatter.listed, false)
  assert.deepEqual(messages, {})
})

test('`listed: true` reaches the frontmatter, without a message', async () => {
  const { frontmatter, messages } = await processor(
    post('listed: true\n'),
    processorOptions,
  )

  assert.equal(frontmatter.listed, true)
  assert.deepEqual(messages, {})
})

test('a post that does not say has no `listed`', async () => {
  const { frontmatter } = await processor(post(''), processorOptions)

  assert.ok(!('listed' in frontmatter))
})

test('a `listed` that is neither true nor false fails', async () => {
  await assert.rejects(
    processor(post('listed: maybe\n'), processorOptions),
    /"listed" is true or false in a post's frontmatter, not "maybe"/,
  )
})

test('an unlisted post is a post, and is not a listed one', async () => {
  assert.deepEqual(slugs(await getPosts(fixtures)), [
    'fixture-unlisted-post',
    'fixture-post',
    'fixture-short-post',
    'fixture-reactions-post',
  ])
  assert.deepEqual(slugs(await getListedPosts(fixtures)), [
    'fixture-post',
    'fixture-short-post',
  ])
})

test('nothing is listed when every post is unlisted', async () => {
  const contentDir = mkdtempSync(join(tmpdir(), 'unlisted-posts-'))
  try {
    writeFileSync(join(contentDir, 'an-annex.md'), post('listed: false\n'))
    const options = { ...fixtures, contentDir }

    assert.deepEqual(slugs(await getPosts(options)), ['an-annex'])
    assert.deepEqual(await getListedPosts(options), [])
  } finally {
    rmSync(contentDir, { recursive: true })
  }
})
