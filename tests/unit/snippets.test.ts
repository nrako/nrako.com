import assert from 'node:assert/strict'
import { test } from 'node:test'
import processor from '../../src/lib/processor.ts'

const options = {
  highlighter: { themes: { light: 'github-light', dark: 'github-dark' } },
}

const fence = '```'
const html = `${fence}html\n<p>Seen, <span class="secret">unseen</span>.</p>\n${fence}`
const css = `${fence}css\n.secret { opacity: 0; }\n${fence}`

function snippet(head: string, ...blocks: string[]) {
  return `:::{snippet} ${head}\n\n${blocks.join('\n\n')}\n:::`
}

test('a snippet sets its demo in the page, with its CSS scoped to it', async () => {
  const { html: page, messages } = await processor(
    snippet('A caption', html, css),
    options,
  )

  assert.ok(
    page.includes(
      '<div class="snippet-demo not-prose"><style>@scope {\n.secret { opacity: 0; }\n}</style><p>Seen, <span class="secret">unseen</span>.</p></div>',
    ),
  )
  assert.ok(!page.includes('<iframe'))
  assert.deepEqual(messages, {})
})

test('a snippet without CSS has no style', async () => {
  const { html: page } = await processor(snippet('A caption', html), options)

  assert.ok(page.includes('<div class="snippet-demo not-prose"><p>Seen,'))
  assert.ok(!page.includes('<style>'))
})

test('a snippet shows its sources after its demo, highlighted', async () => {
  const { html: page } = await processor(
    snippet('A caption', html, css),
    options,
  )

  const demo = page.indexOf('class="snippet-demo')
  const sources = [...page.matchAll(/<pre class="shiki/g)].map(
    (match) => match.index,
  )
  assert.equal(sources.length, 2)
  assert.ok(sources.every((index) => index > demo))
  // The source of the demo is text, not markup
  assert.ok(page.includes('&#x3C;'))
})

test('a snippet is a figure numbered as an example', async () => {
  const { html: page } = await processor(
    `${snippet('First', html)}\n\n${snippet('', html)}`,
    options,
  )

  assert.match(
    page,
    /<figure class="snippet"><figcaption><p><span class="caption-number">Example.1: <\/span>First<\/p><\/figcaption>/,
  )
  // Without a caption, the number stands alone
  assert.match(page, /<span class="caption-number">Example.2 <\/span><\/p>/)
})

test('a snippet is numbered apart from the figures', async () => {
  const { html: page } = await processor(
    `:::{figure} /image.png\n:label: fig-a\n\nA figure.\n:::\n\n${snippet('After a figure', html)}`,
    options,
  )

  assert.match(page, /caption-number">Figure.1: </)
  assert.match(page, /caption-number">Example.1: </)
})

test('a snippet is referred to by its label', async () => {
  const { html: page, messages } = await processor(
    `${snippet('A caption\n:label: ex-a', html)}\n\nSee [](#ex-a), {numref}\`ex-a\` and [the demo](#ex-a).`,
    options,
  )

  assert.ok(page.includes('<figure class="snippet" id="ex-a">'))
  assert.match(
    page,
    /See <a href="#ex-a">Example.1<\/a>, <a href="#ex-a">Example.1<\/a> and <a href="#ex-a">the demo<\/a>\./,
  )
  assert.deepEqual(messages, {})
})

test('a snippet takes a label written above it', async () => {
  const { html: page } = await processor(
    `(ex-b)=\n${snippet('A caption', html)}\n\nSee [](#ex-b).`,
    options,
  )

  assert.ok(page.includes('<figure class="snippet" id="ex-b">'))
  assert.match(page, /See <a href="#ex-b">Example.1<\/a>\./)
})

test('a snippet without HTML is an error, and still shows its sources', async () => {
  const { html: page, messages } = await processor(
    snippet('Only CSS', css),
    options,
  )

  assert.ok(!page.includes('snippet-demo'))
  assert.equal([...page.matchAll(/<pre class="shiki/g)].length, 1)
  assert.equal(messages.errors?.length, 1)
  assert.match(messages.errors![0].message, /no `html` block/)
})

test('a snippet shows a script without running it, with a warning', async () => {
  const { html: page, messages } = await processor(
    snippet('With a script', html, `${fence}js\nalert(1)\n${fence}`),
    options,
  )

  assert.ok(!page.includes('<script'))
  assert.equal([...page.matchAll(/<pre class="shiki/g)].length, 2)
  assert.equal(messages.warnings?.length, 1)
  assert.match(messages.warnings![0].message, /`js` block but does not run it/)
})

test('a snippet keeps what else is written in it', async () => {
  const { html: page } = await processor(
    snippet('A caption', html, 'A note about it.'),
    options,
  )

  assert.match(page, /<\/pre><p>A note about it\.<\/p><\/figure>/)
})
