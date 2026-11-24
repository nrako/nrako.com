import assert from 'node:assert/strict'
import { test } from 'node:test'
import processor from '../../src/lib/processor.ts'

const options = {
  highlighter: { themes: { light: 'github-light', dark: 'github-dark' } },
}

function quote(address: string, ...paragraphs: string[]) {
  return `:::{linked-quote} ${address}\n${paragraphs.join('\n\n')}\n:::`
}

function webPage(body: string, head = '') {
  return `<!doctype html><html><head>${head}</head><body>${body}</body></html>`
}

/** The pages of a web, and what is asked of it */
function web(pages: Record<string, string>) {
  const asked: string[] = []
  return {
    asked,
    async fetchPage(address: string) {
      asked.push(address)
      if (!(address in pages)) throw new Error('it answered 404')
      return pages[address]
    },
  }
}

const page = 'https://example.com/a-page'
const body =
  '<h1>A page</h1><p>The passage starts here, it’s “quoted”.</p><p>And ends here.</p>'
const whole = `${page}#:~:text=The%20passage%20starts%20here`
const ranged = `${page}#:~:text=The%20passage,ends%20here.`

/** A quote rendered against a web that has the page */
function render(
  markup: string,
  pages: Record<string, string> = { [page]: webPage(body) },
) {
  const { asked, fetchPage } = web(pages)
  return processor(markup, { ...options, fetchPage }).then((rendered) => ({
    ...rendered,
    asked,
  }))
}

test('a quote is what its address names on the page, with the link to it', async () => {
  const { html, messages, asked } = await render(quote(ranged))

  assert.ok(
    html.includes(
      `<figure class="numbered quote"><blockquote cite="${ranged}">\n<p>The passage starts here, it’s “quoted”.</p>\n<p>And ends here.</p>\n</blockquote><figcaption><p><a href="${ranged}" rel="noopener">example.com</a></p></figcaption></figure>`,
    ),
  )
  assert.deepEqual(messages, {})
  // The page is asked for without its fragment
  assert.deepEqual(asked, [page])
})

test('a passage the address holds whole is quoted as the page has it', async () => {
  const { html, messages } = await render(
    quote(`${page}#:~:text=the%20PASSAGE%20starts`),
  )

  assert.ok(html.includes('<p>The passage starts</p>'))
  assert.deepEqual(messages, {})
})

test('the link comes after the attribution, which stays under the text read', async () => {
  const { html, messages } = await render(
    quote(
      whole.replace('example.com', 'www.example.com'),
      '-- Someone, *A Work*',
    ),
    { 'https://www.example.com/a-page': webPage(body) },
  )

  assert.match(
    html,
    /<p>The passage starts here<\/p>\s*<\/blockquote><figcaption><p>Someone, <em>A Work<\/em>, <a href="[^"]*"[^>]*>example\.com<\/a><\/p>/,
  )
  assert.deepEqual(messages, {})
})

test('a quotation written as the page has it says nothing', async () => {
  // Typed with straight quotes, another case, markup and on two lines
  const { html, messages } = await render(
    quote(
      ranged,
      `the passage *starts* here, it's "quoted".`,
      'And ends here.',
      '-- Someone',
    ),
  )

  // What is shown is the page's text, not the post's
  assert.ok(
    html.includes(
      '<p>The passage starts here, it’s “quoted”.</p>\n<p>And ends here.</p>',
    ),
  )
  assert.ok(!html.includes('<em>'))
  assert.ok(!html.includes('quote-'))
  assert.deepEqual(messages, {})
})

test('a quotation the page has otherwise is shown as the page has it, and says so', async () => {
  const { html, messages } = await render(
    quote(whole, 'The passage started there'),
  )

  // The passage is marked, and says under the pointer what the post quoted
  assert.ok(
    html.includes(
      '<p><ins class="quote-changed" title="Quoted in this post as: “The passage started there”">The passage starts here</ins></p>',
    ),
  )
  assert.match(
    html,
    /<a href="[^"]*" rel="noopener">example\.com<\/a><span class="quote-notice"> \(changed since it was quoted\)<\/span><\/p>/,
  )
  assert.deepEqual(messages, {
    warnings: [
      {
        property: 'quote',
        message: `The page of "${whole}" has other words than the post: "The passage starts here", where the post quotes "The passage started there"`,
      },
    ],
  })
})

const gone = `${page}#:~:text=A%20passage%20taken%20out`

test('a quote the page no longer has shows what the post wrote, and says so', async () => {
  const { html, messages } = await render(
    quote(gone, 'A passage *taken* out', '-- Someone'),
  )

  assert.match(
    html,
    /<p>A passage <em>taken<\/em> out<\/p>\s*<\/blockquote><figcaption><p>Someone, <a href="[^"]*" rel="noopener">example\.com<\/a><span class="quote-notice"> \(no longer found on the page\)<\/span><\/p>/,
  )
  assert.deepEqual(messages, {
    warnings: [
      {
        property: 'quote',
        message: `The page of "${gone}" no longer has what the address names`,
      },
    ],
  })
})

test('a quote the page no longer has, without a written text, says it has none', async () => {
  const { html, messages } = await render(quote(gone, '-- Someone'))

  // What its address holds of it, and a note of the site's under it
  assert.match(
    html,
    /<p>A passage taken out<\/p>\s*<p class="quote-missing">No longer on the page: these are the words its address holds\.<\/p>\s*<\/blockquote><figcaption><p>Someone, <a [^>]*>example\.com<\/a><span class="quote-notice"> \(no longer found on the page\)<\/span>/,
  )
  assert.equal(messages.warnings?.length, 1)
})

test('a passage named by its start and end is set from them when the page has none', async () => {
  const { html } = await render(
    quote(
      `${page}#:~:text=a%20page&text=before-,A%20passage,taken%20out,-after`,
    ),
  )

  assert.ok(
    html.includes(
      '<p>a page … A passage … taken out</p>\n<p class="quote-missing">',
    ),
  )
})

test('a page that cannot be read is not a passage that left', async () => {
  const written = await render(quote(whole, 'The passage starts here'), {})

  assert.match(
    written.html,
    /<p>The passage starts here<\/p>\s*<\/blockquote><figcaption><p><a [^>]*>example\.com<\/a><span class="quote-notice"> \(not checked: the page could not be read\)<\/span>/,
  )
  assert.deepEqual(written.messages, {
    warnings: [
      {
        property: 'quote',
        message: `The quote from "${whole}" could not be read from its page: it answered 404`,
      },
    ],
  })

  const bare = await render(quote(whole), {})
  assert.ok(
    bare.html.includes(
      '<p>The passage starts here</p>\n<p class="quote-missing">Not read from the page: these are the words its address holds.</p>',
    ),
  )
  assert.ok(bare.html.includes('(not checked: the page could not be read)'))
})

test('where no page is read, a quote is not checked', async () => {
  const { html, messages } = await processor(
    quote(whole, 'The passage starts here'),
    options,
  )

  assert.ok(html.includes('<p>The passage starts here</p>'))
  assert.ok(html.includes('(not checked: the page could not be read)'))
  assert.match(messages.warnings?.[0].message ?? '', /no page is read here$/)
})

// Two passages with words of the page between them
const several = `${page}#:~:text=a%20page&text=starts%20here,ends%20here.`

test('a quote of several passages sets an ellipsis where the page has other words', async () => {
  const { html, messages } = await render(quote(several))

  assert.ok(
    html.includes(
      '<p>A page</p>\n<p>… starts here, it’s “quoted”.</p>\n<p>And ends here.</p>',
    ),
  )
  assert.equal(
    html.match(/<a href="([^"]*)"/)?.[1].replace('&#x26;', '&'),
    several,
  )
  assert.deepEqual(messages, {})
})

test('several passages written with or without what stands between them say nothing', async () => {
  for (const written of [
    'A page … starts here, it’s “quoted”. And ends here.',
    'A page [...] starts here, it’s “quoted”. And ends here.',
    'A page starts here, it’s “quoted”. And ends here.',
  ]) {
    const { messages } = await render(quote(several, written))
    assert.deepEqual(messages, {}, written)
  }
})

test('of several passages, those the post wrote otherwise are marked', async () => {
  const { html, messages } = await render(
    quote(several, 'A page … begins here, it’s “quoted”. And ends here.'),
  )

  assert.ok(
    html.includes(
      '<p>A page</p>\n<p>… <ins class="quote-changed" title="Quoted in this post as: “begins here, it’s “quoted”. And ends here.”">starts here, it’s “quoted”.</ins></p>\n<p><ins class="quote-changed" title="Quoted in this post as: “begins here, it’s “quoted”. And ends here.”">And ends here.</ins></p>',
    ),
  )
  assert.equal(messages.warnings?.length, 1)
})

test('several passages written otherwise and as one are all marked', async () => {
  const { html } = await render(
    quote(several, 'A leaf, it starts there and ends here.'),
  )

  assert.equal(html.match(/<ins class="quote-changed"/g)?.length, 3)
})

test('passages are set in the order of the page, whatever the order of the address', async () => {
  const { html, messages } = await render(
    quote(`${page}#:~:text=And%20ends%20here.&text=a%20page`),
  )

  // Two blocks quoted whole, with words of the page between them
  assert.ok(html.includes('<p>A page</p>\n<p>…</p>\n<p>And ends here.</p>'))
  assert.deepEqual(messages, {})
})

test('two parts of paragraphs are set in one line, with an ellipsis between them', async () => {
  const { html } = await render(
    quote(`${page}#:~:text=The%20passage&text=quoted`),
  )

  assert.ok(html.includes('<p>The passage … quoted</p>'))
})

test('a block quoted whole is on a line of its own, the ellipsis with the part that is cut', async () => {
  // A part, then a block
  const before = await render(
    quote(`${page}#:~:text=starts%20here&text=And%20ends%20here.`),
  )
  assert.ok(before.html.includes('<p>starts here …</p>\n<p>And ends here.</p>'))

  // A block, then a part
  const after = await render(
    quote(`${page}#:~:text=A%20page&text=starts%20here`),
  )
  assert.ok(after.html.includes('<p>A page</p>\n<p>… starts here</p>'))
})

test('passages that touch on the page are one, with no ellipsis between them', async () => {
  const { html } = await render(
    quote(`${page}#:~:text=a%20page&text=The%20passage,ends%20here.`),
  )

  assert.ok(
    html.includes(
      '<p>A page</p>\n<p>The passage starts here, it’s “quoted”.</p>\n<p>And ends here.</p>',
    ),
  )
  assert.ok(!html.includes('…'))
})

test('a passage that is inside another is not quoted twice', async () => {
  const { html } = await render(
    quote(`${page}#:~:text=The%20passage,ends%20here.&text=starts%20here`),
  )

  assert.equal(html.match(/starts here/g)?.length, 1)
  assert.ok(!html.includes('…'))
})

test('one of several passages that left the page is enough for the quote to say so', async () => {
  const { html, messages } = await render(
    quote(`${page}#:~:text=a%20page&text=A%20passage%20taken%20out`),
  )

  // Set from its address, not half from the page
  assert.ok(html.includes('<p>a page … A passage taken out</p>'))
  assert.ok(html.includes('class="quote-missing"'))
  assert.match(
    messages.warnings?.[0].message ?? '',
    /no longer has what the address names$/,
  )
})

// A page with lists and code

const laidOut = webPage(
  [
    '<p>Use context only if one of the following is true:</p>',
    '<ul><li>The quoted text is ambiguous<li>The quoted text is short</ul>',
    '<ol start="3"><li>Third step</li><li>Fourth step<ul><li>A detail</li></ul>and its end</li></ol>',
    '<pre>const one = 1\n  const two = 2\n</pre>',
  ].join(''),
)

/** What a quote of that page sets in its quotation */
async function quoted(fragment: string, ...paragraphs: string[]) {
  const { html, messages } = await render(
    quote(`${page}#:~:${fragment}`, ...paragraphs),
    { [page]: laidOut },
  )
  return {
    messages,
    quotation: html
      .match(/<blockquote[^>]*>\n([^]*)\n<\/blockquote>/)?.[1]
      .replace(/ style="[^"]*"/g, ''),
  }
}

test('a quote keeps the list of the page it quotes', async () => {
  const { quotation, messages } = await quoted('text=Use%20context,is%20short')

  assert.equal(
    quotation,
    [
      '<p>Use context only if one of the following is true:</p>',
      '<ul>',
      '<li>The quoted text is ambiguous</li>',
      '<li>The quoted text is short</li>',
      '</ul>',
    ].join('\n'),
  )
  assert.deepEqual(messages, {})
})

test('an item quoted in part is a paragraph, not an item', async () => {
  const { quotation } = await quoted(
    'text=text%20is%20ambiguous,The%20quoted%20text%20is',
  )

  assert.equal(quotation, '<p>text is ambiguous</p>\n<p>The quoted text is</p>')
})

test('a numbered list starts at the number of its first item quoted, with the lists in it', async () => {
  const { quotation } = await quoted('text=Fourth%20step,its%20end')

  assert.equal(
    quotation,
    [
      '<ol start="4">',
      '<li>Fourth step',
      '<ul>',
      '<li>A detail</li>',
      '</ul>',
      'and its end</li>',
      '</ol>',
    ].join('\n'),
  )
})

test('code is quoted with its lines', async () => {
  const { quotation } = await quoted('text=const%20one,two%20%3D%202')

  assert.match(quotation ?? '', /^<pre[^>]*><code>/)
  assert.equal(
    quotation?.replace(/<[^>]*>/g, ''),
    'const one = 1\n  const two = 2\n',
  )
})

test('an item and code are on lines of their own, the ellipsis with the part that is cut or alone', async () => {
  const { quotation } = await quoted(
    'text=Use%20context%20only&text=Third%20step&text=const%20one,two%20%3D%202',
  )

  assert.ok(
    quotation?.startsWith(
      '<p>Use context only …</p>\n<ol start="3">\n<li>Third step</li>\n</ol>\n<p>…</p>\n<pre',
    ),
  )
})

test('a list written in the post as the page has it says nothing, and one written otherwise is marked', async () => {
  const same = await quoted(
    'text=Use%20context,is%20short',
    'Use context only if one of the following is true:',
    '- The quoted text is ambiguous\n- The quoted text is short',
  )
  assert.deepEqual(same.messages, {})

  const other = await quoted(
    'text=Use%20context,is%20short',
    'Use context only if one of the following is true:',
    '- The quoted text is ambiguous\n- The quoted text is long',
  )
  assert.equal(other.messages.warnings?.length, 1)
  assert.equal(
    other.quotation?.match(/<li><ins class="quote-changed"/g)?.length,
    2,
  )
})

const version = 'https://example.com/a-page/1a2b3c4'
const versioned = `${version}#:~:text=The%20passage,ends%20here.`
const canonical = '<link rel="canonical" href="/a-page">'

test('a passage that left the page its version is a version of says so', async () => {
  const { html, messages, asked } = await render(quote(versioned), {
    [version]: webPage(body, canonical),
    [page]: webPage('<p>The passage starts otherwise.</p><p>And stops.</p>'),
  })

  // Read from the version, then looked for on the page it is a version of
  assert.deepEqual(asked, [version, page])
  assert.match(
    html,
    /<p>And ends here\.<\/p>\s*<\/blockquote><figcaption><p><a [^>]*>example\.com<\/a><span class="quote-notice"> \(no longer in the current version of the page\)<\/span>/,
  )
  assert.deepEqual(messages, {
    warnings: [
      {
        property: 'quote',
        message: `What is quoted from "${versioned}" is no longer on the page it is a version of, ${page}`,
      },
    ],
  })
})

test('a passage its version and the page it is a version of both have says nothing', async () => {
  const { html, messages, asked } = await render(quote(versioned), {
    [version]: webPage(body, canonical),
    [page]: webPage(body, canonical),
  })

  assert.deepEqual(asked, [version, page])
  assert.ok(!html.includes('quote-notice'))
  assert.deepEqual(messages, {})
})

test('a page a version is a version of that cannot be read is a warning only', async () => {
  const { html, messages } = await render(quote(versioned), {
    [version]: webPage(body, canonical),
  })

  assert.ok(html.includes('<p>And ends here.</p>'))
  assert.ok(!html.includes('quote-notice'))
  assert.match(
    messages.warnings?.[0].message ?? '',
    /could not be looked for on the page it is a version of, .*: it answered 404$/,
  )
})

test('a quote whose address names no passage is an error, and still shown', async () => {
  const { html, messages, asked } = await render(
    quote(`${page}#a-section`, 'A passage.'),
  )

  assert.ok(html.includes('<blockquote>\n<p>A passage.</p>'))
  assert.ok(!html.includes('<figcaption'))
  assert.deepEqual(asked, [])
  assert.equal(messages.errors?.[0].property, 'quote')
  assert.match(
    messages.errors?.[0].message ?? '',
    /does not say what it quotes: its address has to name it, with a text fragment/,
  )

  const bare = await render(quote(page))
  assert.ok(!bare.html.includes('<blockquote'))
  assert.equal(bare.messages.errors?.length, 1)
})

test('a quote from what is not an address is an error, and still shown', async () => {
  for (const address of ['a-page', 'mailto:someone@example.com']) {
    const { html, messages } = await render(quote(address, 'A passage.'))

    assert.ok(html.includes('<blockquote>\n<p>A passage.</p>'))
    assert.ok(!html.includes('<figcaption'))
    assert.match(messages.errors?.[0].message ?? '', /is not one/)
  }
})
