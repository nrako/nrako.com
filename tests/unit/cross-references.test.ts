import assert from 'node:assert/strict'
import { test } from 'node:test'

import processor from '../../src/lib/processor.ts'

const options = {
  highlighter: { themes: { light: 'github-light', dark: 'github-dark' } },
}

const figure = ':::{figure} /image.png\n:label: fig-a\n\nA caption.\n:::'
const code =
  '```{code} js\n:label: code-a\n:caption: A caption\nconst a = 1\n```'

test('a reference without a text takes the name of its target', async () => {
  const { html, messages } = await processor(
    `(sec-a)=\n## A section\n\n${figure}\n\nSee [](#sec-a) and [](#fig-a).`,
    options,
  )

  assert.ok(html.includes('See <a href="#sec-a">A section</a>'))
  assert.ok(html.includes('and <a href="#fig-a">Figure\u00a01</a>.'))
  assert.deepEqual(messages, {})
})

test('a reference with a text keeps it', async () => {
  const { html } = await processor(
    `${figure}\n\nSee [the figure](#fig-a) and {numref}\`Fig. %s <fig-a>\`.`,
    options,
  )

  assert.ok(html.includes('<a href="#fig-a">the figure</a>'))
  assert.ok(html.includes('<a href="#fig-a">Fig. 1</a>'))
})

test('a block of code is numbered and referred to by its number', async () => {
  const { html, messages } = await processor(
    `${code}\n\nSee {numref}\`code-a\`.`,
    options,
  )

  assert.ok(
    html.includes('<span class="caption-number">Program\u00a01: </span>'),
  )
  assert.ok(html.includes('See <a href="#code-a">Program\u00a01</a>.'))
  assert.deepEqual(messages, {})
})

test('a heading is referred to by the id made from its text', async () => {
  const { html, messages } = await processor(
    '## A plain heading\n\nSee [](#a-plain-heading).',
    options,
  )

  assert.ok(html.includes('<a href="#a-plain-heading">A plain heading</a>'))
  assert.deepEqual(messages, {})
})

test('a labelled paragraph is where a link to its label lands', async () => {
  const { html } = await processor(
    '(my-target)=\nA paragraph.\n\nSee [the paragraph](#my-target).',
    options,
  )

  assert.ok(html.includes('<p id="my-target">A paragraph.</p>'))
  assert.ok(html.includes('<a href="#my-target">the paragraph</a>'))
})

test('a labelled equation is where a reference to it lands', async () => {
  const { html } = await processor(
    '```{math}\n:label: eq-a\na^2\n```\n\nSee {eq}`eq-a`.',
    options,
  )

  assert.ok(
    html.includes(
      '<div id="eq-a" class="equation"><span class="katex-display">',
    ),
  )
  assert.equal(html.match(/id="eq-a"/g)?.length, 1)
  assert.ok(html.includes('See <a href="#eq-a">(1)</a>.'))
})

test('a reference to a target that does not exist stays as text, with a warning', async () => {
  const { html, messages } = await processor(
    'See {ref}`nope`, {numref}`nope` and {ref}`a text <nope>`.',
    options,
  )

  assert.ok(html.includes('<p>See nope, nope and a text.</p>'))
  assert.equal(messages.warnings?.length, 3)
  assert.match(messages.warnings![0].message, /target was not found: nope/)
})

test('a link to a label that does not exist is a warning', async () => {
  const { html, messages } = await processor(
    'See [](#nope) and [a text](#nope).',
    options,
  )

  assert.ok(html.includes('<a href="#nope">#nope</a>'))
  assert.ok(html.includes('<a href="#nope">a text</a>'))
  assert.equal(messages.warnings?.length, 2)
})

test('a link without a text shows its address', async () => {
  const { html } = await processor(
    'See [](https://github.com/jupyter-book/mystmd) and {doc}`./other`.',
    options,
  )

  assert.ok(html.includes('>https://github.com/jupyter-book/mystmd</a>'))
  assert.ok(html.includes('<a href="./other">./other</a>'))
})
