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

test('a snippet names the language of each source above it', async () => {
  const { html: page } = await processor(
    snippet(
      'A caption',
      html,
      css,
      `${fence}js\nlet a = 1\n${fence}`,
      `${fence}javascript\nlet b = 1\n${fence}`,
      `${fence}ts\nconst c: number = 1\n${fence}`,
    ),
    options,
  )

  assert.deepEqual(
    [
      ...page.matchAll(
        /<div class="snippet-source"><p class="snippet-language">([^<]+)<\/p><pre class="shiki/g,
      ),
    ].map((match) => match[1]),
    ['HTML', 'CSS', 'JavaScript', 'JavaScript', 'ts'],
  )
})

test('a snippet sets an `svg` block in its demo, as it does HTML', async () => {
  const drawing =
    '<svg viewBox="0 0 10 10" width="40"><circle class="dot" cx="5" cy="5" r="4" /></svg>'
  const { html: page, messages } = await processor(
    snippet(
      'A drawing',
      `${fence}svg\n${drawing}\n${fence}`,
      `${fence}css\n.dot { fill: red; }\n${fence}`,
    ),
    options,
  )

  // Inline, with its attributes as typed: `viewBox` keeps its capital
  assert.ok(
    page.includes(
      '<div class="snippet-demo not-prose"><style>@scope {\n.dot { fill: red; }\n}</style><svg viewBox="0 0 10 10" width="40"><circle class="dot" cx="5" cy="5" r="4"></circle></svg></div>',
    ),
  )
  // Named as SVG and highlighted, which the highlighter does as XML
  assert.ok(
    page.includes('<p class="snippet-language">SVG</p><pre class="shiki '),
  )
  assert.deepEqual(messages, {})
})

test('a snippet sets its HTML and its drawings in the order written', async () => {
  const { html: page } = await processor(
    snippet(
      'Both',
      `${fence}svg\n<svg width="1"></svg>\n${fence}`,
      `${fence}html\n<p>After the drawing.</p>\n${fence}`,
    ),
    options,
  )

  assert.ok(
    page.includes(
      '<div class="snippet-demo not-prose"><svg width="1"></svg>\n<p>After the drawing.</p></div>',
    ),
  )
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
  assert.match(messages.errors![0].message, /no `html` or `svg` block/)
})

const logs = `${fence}js\nconsole.log(1 + 1)\n${fence}`
const says = (text: string) => `${fence}console\n${text}\n${fence}`

const consoleOf = (text: string) =>
  `<div class="snippet-console not-prose"><pre role="log" aria-label="Console">${text}</pre></div>`

test('a `console` block gives the snippet a console that holds its text', async () => {
  const { html: page, messages } = await processor(
    snippet('With a console', html, logs, says('2')),
    options,
  )

  // After the sources, the script's the last of them, and not in the demo
  assert.ok(page.includes(`</pre></div></div>${consoleOf('2')}</figure>`))
  assert.ok(
    page.includes(
      '<span class="secret">unseen</span>.</p><script type="module">',
    ),
  )
  assert.deepEqual(messages, {})
})

test('a console comes after the sources wherever its block is written', async () => {
  const { html: page } = await processor(
    snippet('With a console', says('2'), html, logs),
    options,
  )

  assert.ok(page.includes(`</pre></div></div>${consoleOf('2')}</figure>`))
})

test('a console is under the tabs of long sources, not one of them', async () => {
  const long = `${fence}js\n${'console.log(1)\n'.repeat(30)}${fence}`
  const { html: page } = await processor(
    snippet('With a console', html, long, says('1')),
    options,
  )

  assert.ok(page.includes('class="snippet-sources snippet-tabs"'))
  assert.ok(page.includes(`</pre></div></div>${consoleOf('1')}</figure>`))
  assert.equal([...page.matchAll(/<input type="radio"/g)].length, 2)
})

test('the text of a console is text, whatever it holds', async () => {
  const { html: page } = await processor(
    snippet('With a console', html, logs, says('<b>bold</b> & more')),
    options,
  )

  assert.ok(!page.includes('<b>bold</b>'))
  assert.match(
    page,
    /aria-label="Console">(&lt;|&#x3C;)b>bold(&lt;|&#x3C;)\/b> (&amp;|&#x26;) more<\/pre>/,
  )
})

test('a snippet with markup is not hidden', async () => {
  const { html: page } = await processor(
    snippet('With a console', html, logs, says('2')),
    options,
  )

  assert.ok(page.includes('<div class="snippet-demo not-prose"><p>Seen,'))
})

test('a `console` block is not one of the sources', async () => {
  const { html: page, snippets } = await processor(
    snippet('With a console\n:label: ex-a', html, logs, says('2')),
    options,
  )

  // Not shown as code, not named, not given to the page to edit
  assert.equal([...page.matchAll(/<pre class="shiki/g)].length, 2)
  assert.deepEqual(
    [...page.matchAll(/<p class="snippet-language">([^<]+)<\/p>/g)].map(
      (match) => match[1],
    ),
    ['HTML', 'JavaScript'],
  )
  assert.deepEqual(
    snippets[0].files.map((file) => file.language),
    ['html', 'js'],
  )
  // The page is told of the console, and not of its text
  assert.equal(snippets[0].console, true)
  assert.ok(!snippets[0].demo.includes('snippet-console'))
})

test('a script alone is a snippet when it has a console', async () => {
  const {
    html: page,
    messages,
    snippets,
  } = await processor(
    snippet('A function alone\n:label: ex-a', logs, says('2')),
    options,
  )

  // Its demo has nothing to show: it is there to run the script, hidden
  assert.ok(
    page.includes(
      '<div class="snippet-demo not-prose" hidden><script type="module">\nconsole.log(1 + 1)\n</script></div>',
    ),
  )
  assert.ok(page.includes(consoleOf('2')))
  assert.deepEqual(messages, {})
  assert.equal(snippets.length, 1)
})

test('a console without a script to write to it shows nothing', async () => {
  const { html: page, messages } = await processor(
    snippet('Only a console', css, says('2')),
    options,
  )

  assert.ok(!page.includes('snippet-demo'))
  assert.equal(messages.errors?.length, 1)
})

test('a script alone without a console has nothing to show', async () => {
  const { html: page, messages } = await processor(
    snippet('A function alone', logs),
    options,
  )

  assert.ok(!page.includes('snippet-demo'))
  assert.equal(messages.errors?.length, 1)
  assert.match(messages.errors![0].message, /with a `console` block/)
})

test('a snippet without a `console` block has no console', async () => {
  const { html: page } = await processor(
    snippet('A caption', html, logs),
    options,
  )

  assert.ok(!page.includes('snippet-console'))
})

test('a snippet runs its script as a module, after its HTML', async () => {
  const script = 'const a = 1\nif (a < 2 && a > 0) document.title = "<b>"'
  const { html: page, messages } = await processor(
    snippet('With a script', html, css, `${fence}js\n${script}\n${fence}`),
    options,
  )

  // As typed: nothing in it is escaped or rewritten
  assert.ok(
    page.includes(
      `<span class="secret">unseen</span>.</p><script type="module">\n${script}\n</script></div>`,
    ),
  )
  // And shown, as the other sources are
  assert.equal([...page.matchAll(/<pre class="shiki/g)].length, 3)
  assert.deepEqual(messages, {})
})

test('a snippet runs the scripts written as `javascript` too', async () => {
  const { html: page, messages } = await processor(
    snippet('With a script', html, `${fence}javascript\nlet a = 1\n${fence}`),
    options,
  )

  assert.ok(page.includes('<script type="module">\nlet a = 1\n</script>'))
  assert.deepEqual(messages, {})
})

test('a snippet without a script has none', async () => {
  const { html: page } = await processor(
    snippet('A caption', html, css),
    options,
  )

  assert.ok(!page.includes('<script'))
})

test('a snippet shows another language without running it, with a warning', async () => {
  const { html: page, messages } = await processor(
    snippet(
      'With TypeScript',
      html,
      `${fence}ts\nconst a: number = 1\n${fence}`,
    ),
    options,
  )

  assert.ok(!page.includes('<script'))
  assert.equal([...page.matchAll(/<pre class="shiki/g)].length, 2)
  assert.equal(messages.warnings?.length, 1)
  assert.match(messages.warnings![0].message, /`ts` block but does not run it/)
})

test('a snippet keeps what else is written in it, after its sources', async () => {
  const { html: page } = await processor(
    snippet('A caption', html, 'A note about it.', css),
    options,
  )

  assert.match(page, /<\/pre><\/div><\/div><p>A note about it\.<\/p><\/figure>/)
})

const long = (lines: number) =>
  `${fence}css\n${Array.from({ length: lines }, (_, line) => `.rule-${line} {}`).join('\n')}\n${fence}`

test('a snippet sets short sources one under the other', async () => {
  const { html: page } = await processor(
    snippet('A caption', html, long(22)),
    options,
  )

  assert.ok(
    page.includes('<div class="snippet-sources"><div class="snippet-source">'),
  )
  assert.ok(!page.includes('snippet-tab'))
})

test('a snippet sets long sources as tabs, one per source', async () => {
  const { html: page } = await processor(
    `${snippet('Short', html)}\n\n${snippet('Long', html, long(23), `${fence}js\nlet a = 1\n${fence}`)}`,
    options,
  )

  // Named after the snippet's number, the first source shown
  assert.ok(
    page.includes(
      '<div class="snippet-sources snippet-tabs"><div class="snippet-tablist" role="radiogroup" aria-label="Source shown"><label><input type="radio" name="snippet-sources-2" checked>HTML</label><label><input type="radio" name="snippet-sources-2">CSS</label><label><input type="radio" name="snippet-sources-2">JavaScript</label></div><div class="snippet-source"><p class="snippet-language">HTML</p>',
    ),
  )
  // Every source is in the page: the stylesheet shows the one chosen
  assert.equal([...page.matchAll(/<pre class="shiki/g)].length, 4)
})

test('a snippet with one long source has no tabs', async () => {
  const { html: page } = await processor(
    snippet('A caption', `${fence}html\n${'<p>x</p>\n'.repeat(40)}${fence}`),
    options,
  )

  assert.ok(!page.includes('snippet-tab'))
})

test('a snippet with a label has a page of its own under its post, which it links to', async () => {
  const { html: page, snippets } = await processor(
    snippet('A *caption*\n:label: ex-a', html, css),
    { ...options, address: '/posts/a-post' },
  )

  assert.deepEqual(snippets, [
    {
      label: 'ex-a',
      title: 'A caption',
      demo: '<div class="snippet-demo not-prose"><style>@scope {\n.secret { opacity: 0; }\n}</style><p>Seen, <span class="secret">unseen</span>.</p></div>',
      // Its sources as typed, for its page to let a reader edit them
      files: [
        {
          language: 'html',
          name: 'HTML',
          code: '<p>Seen, <span class="secret">unseen</span>.</p>',
        },
        { language: 'css', name: 'CSS', code: '.secret { opacity: 0; }' },
      ],
      console: false,
    },
  ])
  // The link ends the caption's line: an arrow, named for who does not see it
  assert.match(
    page,
    /<p class="snippet-alone"><a href="\/posts\/a-post\/snippets\/ex-a\?source" aria-label="Edit its sources" title="Edit its sources"><svg [^>]*aria-hidden="true"><path [^>]*><\/path><\/svg><\/a><a href="\/posts\/a-post\/snippets\/ex-a" aria-label="On a page of its own" title="On a page of its own"><svg [^>]*aria-hidden="true"><path [^>]*><\/path><\/svg><\/a><\/p><\/figcaption><div class="snippet-demo/,
  )
})

test('a snippet does not link to its page when the address of its post is not known', async () => {
  const { html: page, snippets } = await processor(
    snippet('A caption\n:label: ex-a', html),
    options,
  )

  assert.equal(snippets.length, 1)
  assert.ok(!page.includes('snippet-alone'))
})

test('a snippet without a caption is titled by its number', async () => {
  const { snippets } = await processor(snippet('\n:label: ex-a', html), options)

  assert.equal(snippets[0].title, 'Example 1')
})

test('a snippet without a label has no page', async () => {
  const { html: page, snippets } = await processor(snippet('A caption', html), {
    ...options,
    address: '/posts/a-post',
  })

  assert.deepEqual(snippets, [])
  assert.ok(!page.includes('snippet-alone'))
})

test('a snippet without HTML has no page', async () => {
  const { html: page, snippets } = await processor(
    snippet('Only CSS\n:label: ex-a', css),
    { ...options, address: '/posts/a-post' },
  )

  assert.deepEqual(snippets, [])
  assert.ok(!page.includes('snippet-alone'))
})
