import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import processor from '../../src/lib/processor.ts'
import { snippetPages } from '../../src/lib/snippets.ts'

// The sample posts are built together when the site is served with them
// (`POSTS_DIR=samples/posts`): each has to render, and they share one space of
// snippet labels.
const directory = join(import.meta.dirname, '../../samples/posts')
const slugs = readdirSync(directory)
  .filter((file) => file.endsWith('.md'))
  .map((file) => file.replace('.md', ''))

async function render(slug: string) {
  return processor(readFileSync(join(directory, `${slug}.md`), 'utf-8'), {
    highlighter: { themes: { light: 'github-light', dark: 'github-dark' } },
    loadFile(path) {
      const file = join(directory, path)
      return existsSync(file) ? readFileSync(file, 'utf-8') : undefined
    },
  })
}

for (const slug of slugs) {
  test(`the sample post "${slug}" renders without an error`, async () => {
    const { html, messages } = await render(slug)

    assert.ok(html.length > 0)
    assert.equal(messages.errors, undefined)
  })
}

test('no two sample posts share a snippet label', async () => {
  const posts = await Promise.all(
    slugs.map(async (slug) => ({
      slug,
      snippets: (await render(slug)).snippets,
    })),
  )

  assert.doesNotThrow(() => snippetPages(posts))
})

test('the sample of snippets at work has a page for each of its demos', async () => {
  const { snippets, messages } = await render('snippets-at-work')

  assert.deepEqual(
    snippets.map((snippet) => snippet.slug),
    [
      'hidden-by-transform',
      'hidden-by-position',
      'hidden-by-opacity',
      'hidden-unselectable',
      'hidden-in-a-record',
      'text-in-a-field',
      'flex-center',
      'counter',
    ],
  )
  // The counter's script is part of its demo
  assert.ok(
    snippets.at(-1)?.demo.includes('<script type="module">\nlet count = 0'),
  )
  assert.deepEqual(messages, {})
})
