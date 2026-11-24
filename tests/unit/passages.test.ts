import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  findPassages,
  highlighted,
  readPage,
  textDirectives,
  type Page,
  type TextDirective,
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
  assert.deepEqual(readPage(page('<p>Text.</p>'), address), {
    text: 'Text.',
    blocks: [{ text: 'Text.' }],
  })
})

/** The passages a directive finds in a text of plain blocks, one a line */
function found(text: string, directive: TextDirective): string[] {
  const plain: Page = {
    text,
    blocks: text.split('\n').map((line) => ({ text: line })),
  }
  return findPassages(plain, directive).map((blocks) =>
    blocks.map((block) => block.text).join('\n'),
  )
}

const text = [
  'A heading',
  'The first passage is here, and the first passage ends.',
  'Another block follows it.',
  'The last block, where the passage ends again.',
].join('\n')

test('a passage held whole is found as whole words, without case', () => {
  assert.deepEqual(found(text, { start: 'another BLOCK' }), ['Another block'])
  // Not inside a word, and not across two blocks
  assert.deepEqual(found(text, { start: 'pass' }), [])
  assert.deepEqual(found(text, { start: 'ends. Another' }), [])
  assert.deepEqual(found(text, { start: 'not there' }), [])
})

test('every place a passage is found is returned, the first first', () => {
  assert.deepEqual(found(text, { start: 'the first passage' }), [
    'The first passage',
    'the first passage',
  ])
})

test('a passage runs from its start to the first end after it', () => {
  assert.deepEqual(
    found(text, { start: 'Another block', end: 'passage ends' }),
    ['Another block follows it.\nThe last block, where the passage ends'],
  )
  assert.deepEqual(found(text, { start: 'is here', end: 'ends' }), [
    'is here, and the first passage ends',
  ])
  assert.deepEqual(found(text, { start: 'again', end: 'heading' }), [])
})

test('a prefix and a suffix choose among the places a passage is found', () => {
  assert.deepEqual(found(text, { prefix: 'and', start: 'the first passage' }), [
    'the first passage',
  ])
  assert.deepEqual(
    found(text, { start: 'the first passage', suffix: 'is here' }),
    ['The first passage'],
  )
  // Across the edge of a block
  assert.deepEqual(
    found(text, { prefix: 'a heading', start: 'the first passage' }),
    ['The first passage'],
  )
  assert.deepEqual(
    found(text, { prefix: 'nowhere', start: 'the first passage' }),
    [],
  )
})

const laidOut = page(
  [
    '<p>Before the list:</p>',
    '<ul><li>A first item<li>A second item</ul>',
    '<ol start="3"><li>Third step</li><li>Fourth step<ul><li>A detail</li></ul>and its end</li><li value="9">Ninth step<p>In two paragraphs.</p></li></ol>',
    '<pre>const one = 1\n  const two = 2\n</pre>',
    '<li>An item of no list</li>',
  ].join(''),
)

test('a block of a page says which item of a list it is, and what is code', () => {
  assert.deepEqual(readPage(laidOut, address).blocks, [
    { text: 'Before the list:' },
    { text: 'A first item', item: { ordered: false, depth: 1, number: 1 } },
    { text: 'A second item', item: { ordered: false, depth: 1, number: 2 } },
    { text: 'Third step', item: { ordered: true, depth: 1, number: 3 } },
    { text: 'Fourth step', item: { ordered: true, depth: 1, number: 4 } },
    { text: 'A detail', item: { ordered: false, depth: 2, number: 1 } },
    {
      text: 'and its end',
      item: { ordered: true, depth: 1, number: 4, continued: true },
    },
    { text: 'Ninth step', item: { ordered: true, depth: 1, number: 9 } },
    {
      text: 'In two paragraphs.',
      item: { ordered: true, depth: 1, number: 9, continued: true },
    },
    {
      text: 'const one = 1 const two = 2',
      code: 'const one = 1\n  const two = 2',
    },
    { text: 'An item of no list' },
  ])
})

test('a passage keeps the items it quotes whole, and what continues them', () => {
  const [passage] = findPassages(readPage(laidOut, address), {
    start: 'Before the list',
    end: 'Ninth step',
  })

  assert.deepEqual(
    passage.map((block) => [block.text, block.item?.number, block.item?.depth]),
    [
      ['Before the list:', undefined, undefined],
      ['A first item', 1, 1],
      ['A second item', 2, 1],
      ['Third step', 3, 1],
      ['Fourth step', 4, 1],
      ['A detail', 1, 2],
      ['and its end', 4, 1],
      ['Ninth step', 9, 1],
    ],
  )
})

test('an item that is cut is no longer an item, nor what continues one that is not quoted', () => {
  const read = readPage(laidOut, address)

  // Cut at its start, and at its end
  const [cut] = findPassages(read, { start: 'first item', end: 'A second' })
  assert.deepEqual(cut, [
    { text: 'first item', cut: true },
    { text: 'A second', cut: true },
  ])

  // The end of an item without its start
  const [end] = findPassages(read, { start: 'A detail', end: 'its end' })
  assert.deepEqual(end, [
    { text: 'A detail', item: { ordered: false, depth: 2, number: 1 } },
    { text: 'and its end' },
  ])
})

test('code quoted whole keeps its lines, and a part of it is on one', () => {
  const read = readPage(laidOut, address)

  assert.deepEqual(
    findPassages(read, { start: 'const one', end: 'two = 2' })[0],
    [
      {
        text: 'const one = 1 const two = 2',
        code: 'const one = 1\n  const two = 2',
      },
    ],
  )
  assert.deepEqual(findPassages(read, { start: 'const two = 2' })[0], [
    { text: 'const two = 2', cut: true, code: 'const two = 2' },
  ])
})

/** What a browser highlights of the text, each passage with one line per block */
function shown(directives: TextDirective[]): string[] | undefined {
  const plain: Page = {
    text,
    blocks: text.split('\n').map((line) => ({ text: line })),
  }
  return highlighted(plain, directives)?.map((blocks) =>
    blocks.map((block) => block.text).join('\n'),
  )
}

test('what is highlighted is in the order of the page, the first place of each passage', () => {
  assert.deepEqual(
    shown([
      { start: 'the last block' },
      { start: 'another block' },
      { start: 'a heading' },
    ]),
    ['A heading', 'Another block', 'The last block'],
  )
})

test('passages that overlap or touch are highlighted as one', () => {
  // One inside another, and two that share words
  assert.deepEqual(
    shown([
      { start: 'The first passage', end: 'ends' },
      { start: 'is here' },
      { start: 'passage ends', end: 'Another block' },
    ]),
    ['The first passage is here, and the first passage ends.\nAnother block'],
  )
  // Side by side in a line, and across the edge of a block
  assert.deepEqual(shown([{ start: 'Another' }, { start: 'block follows' }]), [
    'Another block follows',
  ])
  assert.deepEqual(
    shown([{ start: 'follows it.' }, { start: 'The last block' }]),
    ['follows it.\nThe last block'],
  )
  // Words between them, were it a comma
  assert.deepEqual(shown([{ start: 'is here' }, { start: 'and the first' }]), [
    'is here',
    'and the first',
  ])
})

test('nothing is highlighted as a whole when one passage is not found', () => {
  assert.equal(
    shown([{ start: 'a heading' }, { start: 'not there' }]),
    undefined,
  )
})
