import assert from 'node:assert/strict'
import { test } from 'node:test'

import { defaultOptions } from '../../src/lib/blogData.ts'
import processor from '../../src/lib/processor.ts'
import { snippetHighlighter } from '../../src/lib/snippetHighlight.ts'

const highlight = await snippetHighlighter()

/** The colours of the tokens, as written in the HTML of highlighted code */
function colours(html: string): string[] {
  return [...html.matchAll(/style="(color:[^"]+)"/g)].map((match) => match[1])
}

test('a source is coloured in both themes, token by token', () => {
  const html = highlight('let count = 0', 'js')

  assert.ok(colours(html).length > 1)
  for (const colour of colours(html)) {
    assert.match(colour, /^color:#[0-9A-F]{6};--shiki-dark:#[0-9A-F]{6}$/i)
  }
  // What goes in a <pre>, without one
  assert.ok(!html.includes('<pre'))
})

test('a source is coloured in its page as it is in its post', async () => {
  const sources = {
    html: '<p class="seen">Seen, <!-- or not --> &amp; said.</p>',
    css: '.seen { opacity: 0; } /* gone */',
    js: "const said = 'a word' // and no more",
    svg: '<svg viewBox="0 0 10 10"><circle r="4" /></svg>',
  }

  for (const [language, code] of Object.entries(sources)) {
    const fence = '```'
    const { html: post } = await processor(
      `:::{snippet} A caption\n\n${fence}html\n<p>Seen.</p>\n${fence}\n\n${fence}${language}\n${code}\n${fence}\n:::`,
      defaultOptions,
    )
    // The last block of the post is the source: its tokens, in order
    const block = post.slice(post.lastIndexOf('<pre class="shiki'))

    assert.deepEqual(colours(highlight(code, language)), colours(block))
  }
})

test("a source's lines are parted, and its text is text", () => {
  const html = highlight('<b>\n  &amp;\n</b>', 'html')

  assert.equal([...html.matchAll(/<br>/g)].length, 2)
  assert.ok(!html.includes('<b>'))
  assert.ok(html.includes('&#x3C;') || html.includes('&lt;'))
})

test('a source in a language that makes no demo is not coloured', () => {
  const html = highlight('const shown: string = "and not run"', 'ts')

  assert.deepEqual(colours(html), [])
  assert.ok(html.includes('const shown: string = "and not run"'))
})
