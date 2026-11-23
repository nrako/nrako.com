import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { before, test } from 'node:test'
import processor from '../../src/lib/processor.ts'

// samples/posts/what-a-post-can-set.md shows every piece of markup the site
// renders. These tests hold it to that: each piece it uses comes out as the
// element it should, and nothing in it is left unrendered.
const directory = join(import.meta.dirname, '../../samples/posts')

let html = ''
let messages = {}

before(async () => {
  const rendered = await processor(
    readFileSync(join(directory, 'what-a-post-can-set.md'), 'utf-8'),
    {
      highlighter: { themes: { light: 'github-light', dark: 'github-dark' } },
      address: '/posts/what-a-post-can-set',
      loadFile(path) {
        const file = join(directory, path)
        return existsSync(file) ? readFileSync(file, 'utf-8') : undefined
      },
    },
  )
  html = rendered.html
  messages = rendered.messages
})

test('nothing in the sample is left unrendered', () => {
  assert.deepEqual(messages, {})
  // A role or a directive the site has no rendering for
  assert.ok(!html.includes('unhandled'))
  // A link without a text, an element without content
  assert.deepEqual(html.match(/<a [^>]*><\/a>/g), null)
  assert.deepEqual(html.match(/<div[^>]*><\/div>/g), null)
  assert.ok(!html.includes('<p></p>'))
})

const pieces: Record<string, RegExp> = {
  'typographic quotes': /“Straight quotes”/,
  'a bare address as a link':
    /<a href="http:\/\/mystmd\.org"[^>]*>mystmd\.org<\/a>/,
  'an abbreviation': /<abbr title="Markedly Structured Text">MyST<\/abbr>/,
  subscript: /H<sub>2<\/sub>O/,
  superscript: /4<sup>th<\/sup>/,
  'a key': /<kbd>Ctrl<\/kbd>/,
  'a deletion': /<del>left in the text on purpose<\/del>/,
  'inline HTML': /<mark>highlight<\/mark>/,
  'a Wikipedia link':
    /<a href="https:\/\/en\.wikipedia\.org\/wiki\/Hypertext"[^>]*>Hypertext<\/a>/,
  'a DOI link': /<a href="https:\/\/doi\.org\/10\.1093\/comjnl\/27\.2\.97"/,
  'a GitHub link': /mystmd\/pull\/3083"[^>]*>jupyter/,
  'a note called twice': /id="user-content-fnref-short-2"/,
  'a note of two paragraphs':
    /<li id="user-content-fn-long">\s*<p>[^<]*<\/p>\s*<p>/,
  'a citation in the text':
    /<a href="#cite-knuth1984" class="citation">Knuth \(1984\)<\/a>/,
  'a citation with a page':
    /<a href="#cite-lamport1994" class="citation">Lamport \(1994, ch\. 2\)<\/a>/,
  'citations in parentheses':
    /\(<a href="#cite-lamport1994" class="citation">Lamport, 1994<\/a>; <a href="#cite-bringhurst2004" class="citation">see also Bringhurst, 2004<\/a>\)/,
  'a citation of the year alone':
    /\(<a href="#cite-kernighan1988" class="citation">1988, p\. 6<\/a>\)/,
  'a citation of two authors': />Kernighan &#x26; Ritchie \(1988\)<\/a>/,
  'a citation of three authors': />Berners-Lee <em>et al\.<\/em> \(2005\)<\/a>/,
  'a {cite:t} role':
    /<a href="#cite-gruber2004" class="citation">Gruber \(2004\)<\/a> in the text/,
  'a {cite:p} role':
    /\(<a href="#cite-knuth1984" class="citation">Knuth, 1984<\/a>; <a href="#cite-gruber2004" class="citation">Gruber, 2004<\/a>\)/,
  'an escaped @': /as in @someone\./,
  'the references': /<section class="references"><h2 id="references">/,
  'a link to a heading': /<a href="#notes">the section on notes<\/a>/,
  'a labelled heading': /<h2 id="labels">/,
  'a numbered reference to a figure':
    /<a href="#fig-pipeline">Figure\u00a01<\/a>/,
  'a numbered reference to a table': /<a href="#tbl-syntax">Table\u00a01<\/a>/,
  'a numbered reference to an equation': /<a href="#eq-pythagoras">\(1\)<\/a>/,
  'a numbered reference to code': /<a href="#code-greet">Program\u00a01<\/a>/,
  'a numbered reference with its own text':
    /<a href="#fig-pipeline">Fig\. 1<\/a>/,
  'a reference without a text to a section':
    /<a href="#labels">References between parts<\/a> for a/,
  'a reference without a text to a figure':
    /<a href="#fig-pipeline">Figure\u00a01<\/a> for a figure/,
  'a labelled paragraph':
    /<p id="a-labelled-paragraph">[\s\S]*<a href="#a-labelled-paragraph">a link to it<\/a>/,
  'a labelled equation':
    /<div id="eq-pythagoras" class="equation"><span class="katex-display">/,
  'a figure with a caption':
    /<figure id="fig-pipeline" class="numbered"><img src="\/samples\/from-source-to-page\.svg"[^>]*class="align-center" width="90%"><figcaption><p><span class="caption-number">Figure\u00a01: <\/span>A figure/,
  'a pipe table': /<td><code>\*text\*<\/code><\/td>\s*<td><em>text<\/em><\/td>/,
  'a table with a caption':
    /<figure id="tbl-syntax" class="numbered"><figcaption><p><span class="caption-number">Table\u00a01: <\/span>What each/,
  'a table written as a list':
    /<figcaption><p>A table written as a list<\/p><\/figcaption><table>/,
  'a nested list': /<ol>\s*<li>\s*<p>A numbered item<\/p>\s*<ul>/,
  'a checklist': /<input type="checkbox" checked disabled> Write the post/,
  'a definition list': /<dl><dt>Role<\/dt><dd>/,
  'an attributed quotation':
    /<\/blockquote><figcaption><p>Harold Abelson and Gerald Jay Sussman<\/p>/,
  'an epigraph': /<figure class="numbered epigraph"><blockquote>/,
  "a callout with its kind's title, once":
    /<aside class="admonition note"><p class="admonition-title">Note<\/p><p>The body/,
  'a callout of a kind with another title':
    /<aside class="admonition warning"><p class="admonition-title">Mind the order<\/p><p>A label/,
  'a callout without a kind':
    /<aside class="admonition"><p class="admonition-title">A callout with its own title<\/p><p>It is/,
  'inline math': /<span class="katex">/,
  'a block of math': /<span class="katex-display">/,
  'highlighted code':
    /<pre class="shiki [^"]*" [^>]*><code><span class="line">/,
  'code with a caption':
    /<\/pre><figcaption><p><span class="caption-number">Program\u00a01: <\/span>A function with a caption<\/p><\/figcaption>/,
  'removed and added lines':
    /<span class="line diff remove">[\s\S]*<span class="line diff add">/,
  'a snippet with its number and caption':
    /<figure class="snippet" id="ex-unseen"><figcaption><p><span class="caption-number">Example.1: <\/span>Words that are there/,
  "a snippet's demo, with its CSS scoped to it":
    /<div class="snippet-demo not-prose"><style>@scope \{\n\.unseen \{\n {2}opacity: 0;\n\}\n\}<\/style><p>A sentence with <span class="unseen">words nobody sees<\/span> in it\.<\/p><\/div>/,
  "a snippet's sources":
    /<div class="snippet-source"><p class="snippet-language">HTML<\/p><pre class="shiki [^>]*>[\s\S]*?<\/pre><\/div><div class="snippet-source"><p class="snippet-language">CSS<\/p><pre class="shiki [^>]*>[\s\S]*?<\/pre><\/div><\/figure>/,
  "a snippet's link to its own page":
    /<\/div><p class="snippet-alone"><a href="\/posts\/what-a-post-can-set\/snippets\/ex-unseen">On a page of its own<\/a><\/p>/,
  'a reference to a snippet': /<a href="#ex-unseen">Example.1<\/a> hides/,
  "a snippet's script, as a module after its HTML":
    /<button id="ex-shown-button">Show or hide the words<\/button><script type="module">\nconst words = document\.getElementById\('ex-shown-words'\)\n[\s\S]*?\n<\/script><\/div>/,
  'a block of HTML with Markdown inside':
    /<summary>A disclosure, closed by default<\/summary><p>Its content is <em>Markdown<\/em>\.<\/p><\/details>/,
  'a comment': /<!--This line is only in the source\.-->/,
}

for (const [piece, rendering] of Object.entries(pieces)) {
  test(`the sample sets ${piece}`, () => {
    assert.match(html, rendering)
  })
}

test('the sample lists the works it cites, and no other', () => {
  const entries = [...html.matchAll(/<li id="(cite-[^"]+)">/g)].map(
    (match) => match[1],
  )
  assert.deepEqual(entries, [
    'cite-berners-lee2005',
    'cite-bringhurst2004',
    'cite-gruber2004',
    'cite-kernighan1988',
    'cite-knuth1984',
    'cite-lamport1994',
  ])
})
