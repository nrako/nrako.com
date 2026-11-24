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

const several = `${page}#:~:text=a%20page&text=The%20passage,ends%20here.`

test('a quote of several passages sets an ellipsis between them', async () => {
  const { html, messages } = await render(quote(several))

  assert.ok(
    html.includes(
      '<p>A page … The passage starts here, it’s “quoted”.</p>\n<p>And ends here.</p>',
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
    'A page … The passage starts here, it’s “quoted”. And ends here.',
    'A page [...] The passage starts here, it’s “quoted”. And ends here.',
    'A page The passage starts here, it’s “quoted”. And ends here.',
  ]) {
    const { messages } = await render(quote(several, written))
    assert.deepEqual(messages, {}, written)
  }
})

test('of several passages, those the post wrote otherwise are marked', async () => {
  const { html, messages } = await render(
    quote(
      several,
      'A page … The passage begins here, it’s “quoted”. And ends here.',
    ),
  )

  assert.ok(
    html.includes(
      '<p>A page … <ins class="quote-changed" title="Quoted in this post as: “The passage begins here, it’s “quoted”. And ends here.”">The passage starts here, it’s “quoted”.</ins></p>\n<p><ins class="quote-changed" title="Quoted in this post as: “The passage begins here, it’s “quoted”. And ends here.”">And ends here.</ins></p>',
    ),
  )
  assert.equal(messages.warnings?.length, 1)
})

test('several passages written otherwise and as one are all marked', async () => {
  const { html } = await render(
    quote(several, 'A leaf, the passage starts here and ends here.'),
  )

  assert.equal(html.match(/<ins class="quote-changed"/g)?.length, 3)
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
