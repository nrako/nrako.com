import rehypeParse from 'rehype-parse'
import { unified } from 'unified'

/**
 * What separates the anchor of a fragment from its directives
 * (`#anchor:~:text=…`), which a browser reads and takes out of the address
 * before the page sees it.
 */
const DIRECTIVES = ':~:'

/**
 * A text directive (`text=prefix-,start,end,-suffix`): the passage of a page
 * a browser scrolls to and highlights. With an `end`, the passage runs from
 * `start` to `end` and the address does not hold what is between them.
 */
export interface TextDirective {
  prefix?: string
  start: string
  end?: string
  suffix?: string
}

/**
 * The text directives of a fragment, given without its `#`. A fragment can
 * have several (`text=one&text=another`): a browser highlights them all.
 */
export function textDirectives(fragment: string): TextDirective[] {
  const at = fragment.indexOf(DIRECTIVES)
  if (at === -1) return []

  return fragment
    .slice(at + DIRECTIVES.length)
    .split('&')
    .filter((directive) => directive.startsWith('text='))
    .flatMap((directive) => {
      const terms = directive.slice('text='.length).split(',')
      const prefix = terms[0]?.endsWith('-') ? terms.shift() : undefined
      const suffix = terms.at(-1)?.startsWith('-') ? terms.pop() : undefined
      const [start, end] = terms
      if (!start || terms.length > 2) return []

      try {
        return [
          {
            prefix: prefix && decodeURIComponent(prefix.slice(0, -1)),
            start: decodeURIComponent(start),
            end: end && decodeURIComponent(end),
            suffix: suffix && decodeURIComponent(suffix.slice(1)),
          },
        ]
      } catch {
        // Not percent-encoded as an address is: no browser reads it either
        return []
      }
    })
}

interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

/** Elements whose text a browser does not search, or that hold none to read */
const UNSEARCHED = new Set([
  'audio',
  'canvas',
  'embed',
  'head',
  'iframe',
  'math',
  'noscript',
  'object',
  'script',
  'select',
  'style',
  'svg',
  'template',
  'textarea',
  'video',
])

/** Elements that are blocks: a term of a text directive does not cross one */
const BLOCKS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'body',
  'caption',
  'dd',
  'details',
  'dialog',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
])

/**
 * Whether the markup alone says an element is not shown. `hidden="until-found"`
 * is shown to a search, a text fragment's included.
 */
function hidden(node: HastNode): boolean {
  const { hidden, style } = node.properties ?? {}
  if (hidden !== undefined && hidden !== false && hidden !== 'until-found') {
    return true
  }
  return (
    typeof style === 'string' &&
    /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(style)
  )
}

/** What a page says of itself and the text a browser would search in it */
export interface Page {
  /**
   * The text of the page, one line per block, its spaces collapsed.
   *
   * It is read from the markup alone, without styles or scripts: what a
   * stylesheet hides is in it, and what a script writes is not.
   */
  text: string
  /** `rel="canonical"`: the page this one is a copy or a version of */
  canonical?: string
  /** `rel="cite-as"`: the address to cite the page by */
  citeAs?: string
}

/** Reads a page from its HTML and its address, which its links are read from */
export function readPage(html: string, address: string): Page {
  const tree = unified().use(rehypeParse).parse(html) as HastNode
  const blocks: string[] = []
  const page: Page = { text: '' }
  let line = ''

  const flush = () => {
    const text = line.replace(/\s+/g, ' ').trim()
    if (text) blocks.push(text)
    line = ''
  }

  const link = (node: HastNode) => {
    const { rel, href } = node.properties ?? {}
    if (typeof href !== 'string' || !URL.canParse(href, address)) return
    const relations = Array.isArray(rel) ? rel.map(String) : []
    const target = new URL(href, address).href
    if (relations.includes('canonical')) page.canonical ??= target
    if (relations.includes('cite-as')) page.citeAs ??= target
  }

  const walk = (node: HastNode) => {
    if (node.type === 'text') {
      line += node.value ?? ''
      return
    }
    if (node.type === 'element') {
      if (node.tagName === 'link') link(node)
      if (node.tagName !== 'head' && UNSEARCHED.has(node.tagName ?? '')) return
      if (hidden(node)) return
      if (node.tagName === 'br') line += ' '
    }

    // The head is only read for its links
    const block = node.type === 'element' && BLOCKS.has(node.tagName ?? '')
    if (block) flush()
    for (const child of node.children ?? []) {
      if (node.tagName === 'head' && child.tagName !== 'link') continue
      walk(child)
    }
    if (block) flush()
  }

  walk(tree)
  flush()
  page.text = blocks.join('\n')
  return page
}

const WORD = /[\p{L}\p{N}]/u

/** Whether a word ends or starts at an index: no word runs across it */
function wordBoundary(text: string, index: number): boolean {
  if (index <= 0 || index >= text.length) return true
  return !(WORD.test(text[index - 1]) && WORD.test(text[index]))
}

/** Where a term is found as whole words, from an index on */
function* occurrences(text: string, term: string, from: number) {
  for (
    let at = text.indexOf(term, from);
    at !== -1;
    at = text.indexOf(term, at + 1)
  ) {
    if (wordBoundary(text, at) && wordBoundary(text, at + term.length)) {
      yield at
    }
  }
}

/** A text without its case, when that keeps every character at its index */
function caseless(text: string): string {
  const lower = text.toLowerCase()
  return lower.length === text.length ? lower : text
}

/**
 * The passages of a page's text that a text directive finds, each with one
 * line per block. A browser highlights the first.
 *
 * This follows the browsers' matching in what the markup can tell: whole
 * words, without case, a term within one block, a passage from its start to
 * the first end after it, a prefix and a suffix around it. Accents are
 * compared as written.
 */
export function findPassages(text: string, directive: TextDirective): string[] {
  const searched = caseless(text)
  const start = caseless(directive.start)
  const passages: string[] = []
  if (!start) return passages

  for (const from of occurrences(searched, start, 0)) {
    let to = from + start.length

    if (directive.end) {
      const { value: end } = occurrences(
        searched,
        caseless(directive.end),
        to,
      ).next()
      // No end after this start, so none after a later one
      if (end === undefined) break
      to = end + directive.end.length
    }

    if (
      directive.prefix &&
      !searched.slice(0, from).trimEnd().endsWith(caseless(directive.prefix))
    ) {
      continue
    }
    if (
      directive.suffix &&
      !searched.slice(to).trimStart().startsWith(caseless(directive.suffix))
    ) {
      continue
    }

    passages.push(text.slice(from, to))
  }

  return passages
}
