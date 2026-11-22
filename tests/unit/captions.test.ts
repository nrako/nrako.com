import assert from 'node:assert/strict'
import { test } from 'node:test'
import processor from '../../src/lib/processor.ts'

const options = {
  highlighter: { themes: { light: 'github-light', dark: 'github-dark' } },
}

test('the number of a figure is set apart from its caption', async () => {
  const { html } = await processor(
    ':::{figure} /image.png\n:label: fig-a\n\nA caption.\n:::',
    options,
  )

  assert.ok(
    html.includes(
      '<figcaption><p><span class="caption-number">Figure\u00a01: </span>A caption.</p></figcaption>',
    ),
  )
})

test('the number of a table is set apart from its caption', async () => {
  const { html } = await processor(
    ':::{table} A caption\n:label: tbl-a\n\n| a | b |\n|---|---|\n| 1 | 2 |\n:::',
    options,
  )

  assert.ok(
    html.includes(
      '<span class="caption-number">Table\u00a01: </span>A caption',
    ),
  )
})
