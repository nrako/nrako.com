import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { CommitInfo } from '../../src/lib/gitVersioning.ts'
import {
  latestVersion,
  postLinks,
  snippetLinks,
  versionPath,
} from '../../src/lib/permalinks.ts'

const site = 'https://nrako.com'
const slug = 'a-post'

function commit(shortSha: string): CommitInfo {
  return {
    sha: `${shortSha}${'0'.repeat(33)}`,
    shortSha,
    message: 'A change',
    date: '2026-01-01T00:00:00Z',
    author: 'Someone',
    verified: true,
  }
}

const draft: CommitInfo = {
  sha: 'draft',
  shortSha: 'draft',
  message: 'Uncommitted version',
  date: '2026-01-02T00:00:00Z',
  author: '',
  verified: false,
}

// Newest first, as git lists them
const versions = [commit('ccccccc'), commit('bbbbbbb'), commit('aaaaaaa')]

test("the post's page is canonical and cites its latest version", () => {
  assert.deepEqual(postLinks({ site, slug, versions }), {
    canonical: 'https://nrako.com/posts/a-post',
    citeAs: 'https://nrako.com/posts/a-post/ccccccc',
  })
})

test('an older version has the post as canonical and cites itself', () => {
  assert.deepEqual(postLinks({ site, slug, versions, shortSha: 'aaaaaaa' }), {
    canonical: 'https://nrako.com/posts/a-post',
    citeAs: 'https://nrako.com/posts/a-post/aaaaaaa',
  })
})

test('the latest version has the post as canonical and cites itself', () => {
  assert.deepEqual(postLinks({ site, slug, versions, shortSha: 'ccccccc' }), {
    canonical: 'https://nrako.com/posts/a-post',
    citeAs: 'https://nrako.com/posts/a-post/ccccccc',
  })
})

test('without a history, the post is canonical and cites nothing', () => {
  assert.deepEqual(postLinks({ site, slug, versions: undefined }), {
    canonical: 'https://nrako.com/posts/a-post',
  })
  assert.deepEqual(postLinks({ site, slug, versions: [] }), {
    canonical: 'https://nrako.com/posts/a-post',
  })
})

test('a draft post cites no version: none shows what its page shows', () => {
  assert.deepEqual(postLinks({ site, slug, versions: [draft, ...versions] }), {
    canonical: 'https://nrako.com/posts/a-post',
  })
})

test('the links are absolute on the origin of the site', () => {
  const links = postLinks({
    site: new URL('https://example.test/'),
    slug,
    versions,
  })

  assert.equal(links.canonical, 'https://example.test/posts/a-post')
  assert.equal(links.citeAs, 'https://example.test/posts/a-post/ccccccc')
})

test('the latest version is the newest commit, past a draft', () => {
  assert.equal(latestVersion(versions)?.shortSha, 'ccccccc')
  assert.equal(latestVersion([draft, ...versions])?.shortSha, 'ccccccc')
  assert.equal(latestVersion([draft]), undefined)
  assert.equal(latestVersion(undefined), undefined)
})

test('a version is at its short sha under the post', () => {
  assert.equal(versionPath(slug, 'aaaaaaa'), '/posts/a-post/aaaaaaa')
})

const label = 'ex-a'

test("a snippet's page is canonical and cites it at the latest version", () => {
  assert.deepEqual(
    snippetLinks({ site, slug, versions, label, inPost: true }),
    {
      canonical: 'https://nrako.com/posts/a-post/snippets/ex-a',
      citeAs: 'https://nrako.com/posts/a-post/ccccccc/snippets/ex-a',
    },
  )
})

test("a version's snippet has the post's as canonical and cites itself", () => {
  assert.deepEqual(
    snippetLinks({
      site,
      slug,
      versions,
      shortSha: 'aaaaaaa',
      label,
      inPost: true,
    }),
    {
      canonical: 'https://nrako.com/posts/a-post/snippets/ex-a',
      citeAs: 'https://nrako.com/posts/a-post/aaaaaaa/snippets/ex-a',
    },
  )
})

test('a snippet the post no longer has declares no canonical page', () => {
  assert.deepEqual(
    snippetLinks({
      site,
      slug,
      versions,
      shortSha: 'aaaaaaa',
      label,
      inPost: false,
    }),
    { citeAs: 'https://nrako.com/posts/a-post/aaaaaaa/snippets/ex-a' },
  )
})

test('the snippet of a draft or of a post without history cites nothing', () => {
  for (const shown of [undefined, [draft, ...versions]]) {
    assert.deepEqual(
      snippetLinks({ site, slug, versions: shown, label, inPost: true }),
      { canonical: 'https://nrako.com/posts/a-post/snippets/ex-a' },
    )
  }
})
