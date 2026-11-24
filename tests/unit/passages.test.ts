import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  findPassages,
  readPage,
  textDirectives,
} from '../../src/lib/passages.ts'

const address = 'https://example.com/posts/a-page/1a2b3c4'

test('the text directives of a fragment are read with their context', () => {
  assert.deepEqual(textDirectives('a-section'), [])
  assert.deepEqual(textDirectives(':~:text=one%20passage'), [
    {
      prefix: undefined,
      start: 'one passage',
      end: undefined,
      suffix: undefined,
    },
  ])
  assert.deepEqual(
    textDirectives('a-section:~:text=before-,start,end%2C,-after&text=other'),
    [
      { prefix: 'before', start: 'start', end: 'end,', suffix: 'after' },
      { prefix: undefined, start: 'other', end: undefined, suffix: undefined },
    ],
  )
  // Another directive, and one no browser would read
  assert.deepEqual(textDirectives(':~:selector=x&text=%E0%A4%A'), [])
})

function page(body: string, head = '') {
  return `<!doctype html><html><head><title>A title</title>${head}</head><body>${body}</body></html>`
}

test('the text of a page is one line per block, its spaces collapsed', () => {
  const { text } = readPage(
    page(
      '<main><h1>A  heading</h1><p>One <em>paragraph</em>,\n  on two lines<br>and a break.</p><ul><li>An item</li><li>Another</li></ul></main>',
    ),
    address,
  )

  assert.equal(
    text,
    'A heading\nOne paragraph, on two lines and a break.\nAn item\nAnother',
  )
})

test('what a browser does not search is not in the text', () => {
  const { text } = readPage(
    page(
      [
        '<p>Shown.</p>',
        '<script>const script = 1</script>',
        '<style>p { color: red }</style>',
        '<template><p>A template.</p></template>',
        '<p hidden>Hidden.</p>',
        '<p style="color: red; display: none">Not displayed.</p>',
        '<p style="visibility:hidden">Not visible.</p>',
        '<p hidden="until-found">Found by a search.</p>',
        '<svg><text>Drawn.</text></svg>',
      ].join(''),
    ),
    address,
  )

  assert.equal(text, 'Shown.\nFound by a search.')
})

test('a page says what it is a version of and how to cite it', () => {
  const links = readPage(
    page(
      '<p>Text.</p>',
      '<link rel="canonical" href="/posts/a-page"><link rel="cite-as" href="https://example.com/posts/a-page/1a2b3c4"><link rel="stylesheet" href="/a.css">',
    ),
    address,
  )

  assert.equal(links.canonical, 'https://example.com/posts/a-page')
  assert.equal(links.citeAs, 'https://example.com/posts/a-page/1a2b3c4')
  assert.deepEqual(readPage(page('<p>Text.</p>'), address), { text: 'Text.' })
})

const text = [
  'A heading',
  'The first passage is here, and the first passage ends.',
  'Another block follows it.',
  'The last block, where the passage ends again.',
].join('\n')

test('a passage held whole is found as whole words, without case', () => {
  assert.deepEqual(findPassages(text, { start: 'another BLOCK' }), [
    'Another block',
  ])
  // Not inside a word, and not across two blocks
  assert.deepEqual(findPassages(text, { start: 'pass' }), [])
  assert.deepEqual(findPassages(text, { start: 'ends. Another' }), [])
  assert.deepEqual(findPassages(text, { start: 'not there' }), [])
})

test('every place a passage is found is returned, the first first', () => {
  assert.deepEqual(findPassages(text, { start: 'the first passage' }), [
    'The first passage',
    'the first passage',
  ])
})

test('a passage runs from its start to the first end after it', () => {
  assert.deepEqual(
    findPassages(text, { start: 'Another block', end: 'passage ends' }),
    ['Another block follows it.\nThe last block, where the passage ends'],
  )
  assert.deepEqual(findPassages(text, { start: 'is here', end: 'ends' }), [
    'is here, and the first passage ends',
  ])
  assert.deepEqual(findPassages(text, { start: 'again', end: 'heading' }), [])
})

test('a prefix and a suffix choose among the places a passage is found', () => {
  assert.deepEqual(
    findPassages(text, { prefix: 'and', start: 'the first passage' }),
    ['the first passage'],
  )
  assert.deepEqual(
    findPassages(text, { start: 'the first passage', suffix: 'is here' }),
    ['The first passage'],
  )
  // Across the edge of a block
  assert.deepEqual(
    findPassages(text, { prefix: 'a heading', start: 'the first passage' }),
    ['The first passage'],
  )
  assert.deepEqual(
    findPassages(text, { prefix: 'nowhere', start: 'the first passage' }),
    [],
  )
})
