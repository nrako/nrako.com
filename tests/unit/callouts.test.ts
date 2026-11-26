import assert from 'node:assert/strict'
import { test } from 'node:test'

import processor from '../../src/lib/processor.ts'

const options = {
  highlighter: { themes: { light: 'github-light', dark: 'github-dark' } },
}

test('a built-in callout shows its title once', async () => {
  const { html } = await processor(':::{note}\nA note.\n:::', options)

  assert.ok(
    html.includes(
      '<aside class="admonition note"><p class="admonition-title">Note</p><p>A note.</p></aside>',
    ),
  )
})

test('a built-in callout takes a title of its own', async () => {
  const { html } = await processor(
    ':::{tip} Mind the gap\nA tip.\n:::',
    options,
  )

  assert.ok(
    html.includes(
      '<aside class="admonition tip"><p class="admonition-title">Mind the gap</p><p>A tip.</p></aside>',
    ),
  )
})

test('a callout without a kind keeps the title it is given', async () => {
  const { html } = await processor(
    ':::{admonition} Its own title\nBody.\n:::',
    options,
  )

  assert.ok(
    html.includes(
      '<aside class="admonition"><p class="admonition-title">Its own title</p><p>Body.</p></aside>',
    ),
  )
})
