import assert from 'node:assert/strict'
import { test } from 'node:test'

import processor from '../../src/lib/processor.ts'
import { nestTableOfContents } from '../../src/lib/tableOfContents.ts'

const options = {
  highlighter: { themes: { light: 'github-light', dark: 'github-dark' } },
}

test('the table of contents lists the sections of a post, in order', async () => {
  const { tableOfContents } = await processor(
    '## One\n\nText.\n\n### Within one\n\nText.\n\n## Two\n\nText.',
    options,
  )

  assert.deepEqual(tableOfContents, [
    { id: 'one', text: 'One', depth: 2 },
    { id: 'within-one', text: 'Within one', depth: 3 },
    { id: 'two', text: 'Two', depth: 2 },
  ])
})

test('an entry leads to the `id` its heading has in the page', async () => {
  const { html, tableOfContents } = await processor(
    '(labelled)=\n## A labelled section\n\nText.',
    options,
  )

  assert.deepEqual(tableOfContents, [
    { id: 'labelled', text: 'A labelled section', depth: 2 },
  ])
  assert.ok(html.includes('<h2 id="labelled">'))
})

test('an entry is the text of its heading, without its markup', async () => {
  const { tableOfContents } = await processor(
    '## The `code` of *a* heading, and {math}`x^2`\n\nText.',
    options,
  )

  assert.equal(tableOfContents.length, 1)
  assert.equal(tableOfContents[0].text, 'The code of a heading, and x2')
})

test('a heading deeper than a subsection is not an entry', async () => {
  const { tableOfContents } = await processor(
    '## One\n\n### Two\n\n#### Three\n\nText.',
    options,
  )

  assert.deepEqual(
    tableOfContents.map((entry) => entry.text),
    ['One', 'Two'],
  )
})

test('the label of the footnotes is not an entry', async () => {
  const { html, tableOfContents } = await processor(
    '## One\n\nText[^note].\n\n[^note]: A note.',
    options,
  )

  assert.ok(html.includes('id="footnote-label"'))
  assert.deepEqual(
    tableOfContents.map((entry) => entry.text),
    ['One'],
  )
})

test("a heading of a snippet's demo is not an entry", async () => {
  const { html, tableOfContents } = await processor(
    '## One\n\n:::{snippet} A demo\n\n```html\n<h2 id="in-the-demo">In the demo</h2>\n```\n:::',
    options,
  )

  assert.ok(html.includes('id="in-the-demo"'))
  assert.deepEqual(
    tableOfContents.map((entry) => entry.text),
    ['One'],
  )
})

test('the references of a post are its last entry', async () => {
  const { tableOfContents } = await processor(
    '---\nbibliography: works.bib\n---\n\n## One\n\nAs @work2020 says.',
    {
      ...options,
      loadFile: () =>
        '@book{work2020, title = {A work}, author = {Doe, Jane}, year = {2020}}',
    },
  )

  assert.deepEqual(tableOfContents, [
    { id: 'one', text: 'One', depth: 2 },
    { id: 'references', text: 'References', depth: 2 },
  ])
})

test('a post without sections has no entry', async () => {
  const { tableOfContents } = await processor('Some text.', options)

  assert.deepEqual(tableOfContents, [])
})

test('subsections are nested in the section before them', () => {
  const sections = nestTableOfContents([
    { id: 'early', text: 'Early', depth: 3 },
    { id: 'one', text: 'One', depth: 2 },
    { id: 'within', text: 'Within', depth: 3 },
    { id: 'two', text: 'Two', depth: 2 },
  ])

  assert.deepEqual(
    sections.map((section) => [
      section.id,
      section.children.map((child) => child.id),
    ]),
    [
      ['early', []],
      ['one', ['within']],
      ['two', []],
    ],
  )
})
