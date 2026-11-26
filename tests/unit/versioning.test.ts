import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { test } from 'node:test'

import { defaultOptions } from '../../src/lib/blogData.ts'
import { getPostAtVersion } from '../../src/lib/githubVersioning.ts'

const fence = '```'
const post = `---
title: A post
---

:::{snippet} A caption
:label: ex-a

${fence}html
<p>At this version.</p>
${fence}
:::
`

// GitHub's contents API, answering with the post for any file asked for
function serveFromGitHub(t: import('node:test').TestContext) {
  const token = process.env.GITHUB_TOKEN
  process.env.GITHUB_TOKEN = 'a-token'
  t.after(() => {
    if (token === undefined) delete process.env.GITHUB_TOKEN
    else process.env.GITHUB_TOKEN = token
  })

  return t.mock.method(globalThis, 'fetch', async (url: string | URL) => {
    assert.match(String(url), /\/contents\/posts\/a-post\.md\?ref=/)
    return Response.json({
      content: Buffer.from(post).toString('base64'),
    })
  })
}

test("a version's snippets have their pages under the version's", async (t) => {
  serveFromGitHub(t)

  const version = await getPostAtVersion('a-post', 'aaaaaaa', defaultOptions)

  assert.ok(version)
  assert.deepEqual(
    version.snippets.map((snippet) => snippet.label),
    ['ex-a'],
  )
  assert.ok(
    version.content.includes('href="/posts/a-post/aaaaaaa/snippets/ex-a"'),
  )
  assert.ok(
    version.content.includes(
      'href="/posts/a-post/aaaaaaa/snippets/ex-a?source"',
    ),
  )
  assert.ok(!version.content.includes('href="/posts/a-post/snippets/'))
})

test('a version is fetched once for its page and its snippets', async (t) => {
  const fetch = serveFromGitHub(t)

  const [page, snippets] = await Promise.all([
    getPostAtVersion('a-post', 'bbbbbbb', defaultOptions),
    getPostAtVersion('a-post', 'bbbbbbb', defaultOptions),
  ])
  const again = await getPostAtVersion('a-post', 'bbbbbbb', defaultOptions)

  assert.equal(fetch.mock.callCount(), 1)
  assert.equal(page, snippets)
  assert.equal(page, again)
})
