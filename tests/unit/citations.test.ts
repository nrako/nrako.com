import assert from 'node:assert/strict'
import { test } from 'node:test'
import processor from '../../src/lib/processor.ts'

const bibtex = `
@book{knuth1984,
  author = {Knuth, Donald E.},
  title = {The TeXbook},
  publisher = {Addison-Wesley},
  year = {1984}
}
@article{harris2020,
  author = {Harris, Charles R. and Millman, K. Jarrod and van der Walt, Stéfan J.},
  title = {Array programming with NumPy},
  journal = {Nature},
  year = {2020},
  doi = {10.1038/s41586-020-2649-2}
}
`

const options = {
  highlighter: { themes: { light: 'github-light', dark: 'github-dark' } },
  loadFile: (path: string) => (path === 'refs.bib' ? bibtex : undefined),
}

function post(body: string, bibliography = 'refs.bib') {
  return `---\ntitle: A post\nbibliography: ${bibliography}\n---\n\n${body}`
}

const knuth = '<a href="#cite-knuth1984" class="citation">'
const harris = '<a href="#cite-harris2020" class="citation">'

test('a citation in the text links to its reference', async () => {
  const { html, messages } = await processor(
    post('As @knuth1984 says, and {cite:t}`harris2020` too.'),
    options,
  )

  assert.ok(html.includes(`As ${knuth}Knuth (1984)</a> says`))
  assert.ok(html.includes(`${harris}Harris <em>et al.</em> (2020)</a> too`))
  assert.deepEqual(messages, {})
})

test('citations in parentheses take a prefix and a suffix', async () => {
  const { html } = await processor(
    post(
      'Typesetting [see @knuth1984, p. 3; @harris2020] and {cite:p}`knuth1984`.',
    ),
    options,
  )

  assert.ok(
    html.includes(
      `(${knuth}see Knuth, 1984, p. 3</a>; ${harris}Harris <em>et al.</em>, 2020</a>)`,
    ),
  )
  assert.ok(html.includes(`and (${knuth}Knuth, 1984</a>).`))
})

test('the references list the cited works once, sorted by name', async () => {
  const { html } = await processor(
    post('First @knuth1984, then @harris2020, then @knuth1984 again.'),
    options,
  )

  const entries = [...html.matchAll(/<li id="(cite-[^"]+)">/g)].map(
    (match) => match[1],
  )
  assert.deepEqual(entries, ['cite-harris2020', 'cite-knuth1984'])
  assert.ok(
    html.includes(
      '<li id="cite-knuth1984">Knuth, D. E. (1984). <i>The TeXbook</i>. Addison-Wesley.</li>',
    ),
  )
})

test("an entry's link behaves like a post's other links", async () => {
  const { html } = await processor(post('See @harris2020.'), options)

  assert.ok(
    html.includes(
      '<a href="https://doi.org/10.1038/s41586-020-2649-2" rel="noopener">',
    ),
  )
  assert.ok(!html.includes('target='))
})

test('the references come last, after the footnotes', async () => {
  const { html } = await processor(
    post('A note[^a] and @knuth1984.\n\n[^a]: The note.'),
    options,
  )

  const footnotes = html.indexOf('class="footnotes"')
  const references = html.indexOf('<section class="references">')
  assert.ok(footnotes > -1)
  assert.ok(references > footnotes)
  assert.ok(html.includes('<h2 id="references">'))
})

test('a {bibliography} directive places the references', async () => {
  const { html } = await processor(
    post('Cite @knuth1984.\n\n## Sources\n\n:::{bibliography}\n:::\n\nAfter.'),
    options,
  )

  const heading = html.indexOf('Sources</h2>')
  const list = html.indexOf('<ol class="reference-list">')
  const after = html.indexOf('<p>After.</p>')
  assert.ok(heading > -1 && heading < list && list < after)
  assert.ok(!html.includes('class="references"'))
})

test('a post that cites nothing has no references', async () => {
  const { html, messages } = await processor(post('Nothing here.'), options)

  assert.ok(!html.includes('reference'))
  assert.deepEqual(messages, {})
})

test('a key missing from the bibliography stays as text, with a warning', async () => {
  const { html, messages } = await processor(
    post('Ping @someone and [@knuth1984; @gone].'),
    options,
  )

  assert.ok(html.includes('Ping @someone and ('))
  assert.ok(html.includes('; @gone).'))
  assert.deepEqual(
    messages.warnings?.map((warning) => warning.property),
    ['citation', 'citation'],
  )
  assert.match(messages.warnings![0].message, /"someone" is cited/)
})

test('an escaped @ is text in a post with a bibliography', async () => {
  const { html, messages } = await processor(
    post('Ping \\@knuth1984.'),
    options,
  )

  assert.ok(html.includes('<p>Ping @knuth1984.</p>'))
  assert.deepEqual(messages, {})
})

test('an @ is text in a post without a bibliography', async () => {
  const { html, messages } = await processor(
    '---\ntitle: A post\n---\n\nPing @someone and [@a-note].',
    options,
  )

  assert.ok(html.includes('<p>Ping @someone and [@a-note].</p>'))
  assert.deepEqual(messages, {})
})

test('a {cite} role without a bibliography is a warning', async () => {
  const { html, messages } = await processor(
    '---\ntitle: A post\n---\n\nSee {cite}`knuth1984`.',
    options,
  )

  assert.ok(html.includes('<p>See @knuth1984.</p>'))
  assert.equal(messages.warnings?.length, 1)
})

test('a bibliography that cannot be read fails the post', async () => {
  await assert.rejects(
    processor(post('x', 'nope.bib'), options),
    /Bibliography "nope\.bib" was not found/,
  )
  await assert.rejects(
    processor(post('x', '../refs.bib'), options),
    /must be a path inside the posts directory/,
  )
  await assert.rejects(
    processor(post('x', '/refs.bib'), options),
    /must be a path inside the posts directory/,
  )
  await assert.rejects(
    processor(post('x'), { ...options, loadFile: () => '@book{broken, a = {' }),
    /Bibliography "refs\.bib" could not be read as BibTeX/,
  )
  await assert.rejects(
    processor(post('x'), { ...options, loadFile: undefined }),
    /no file loader was given/,
  )
})
