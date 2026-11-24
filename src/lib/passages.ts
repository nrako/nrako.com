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

/**
 * A block of a page: a line of its text, and what of the page's layout a
 * quotation keeps, which is what Markdown can say of it.
 */
export interface Block {
  /** The text of the block, its spaces collapsed */
  text: string
  /** The block is quoted in part: a passage starts or ends inside it */
  cut?: true
  /**
   * The item of a list the block is in: its list is numbered or not, at a
   * depth (1 for a list that is in no other), and the item has a number in
   * it. A block that is not the first of its item continues it.
   */
  item?: { ordered: boolean; depth: number; number: number; continued?: true }
  /**
   * The text of a preformatted block, with its lines as the page has them.
   * Of a part of a block, it is the part, on one line.
   */
  code?: string
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
  /** The blocks of the page, each a line of its text */
  blocks: Block[]
  /** `rel="canonical"`: the page this one is a copy or a version of */
  canonical?: string
  /** `rel="cite-as"`: the address to cite the page by */
  citeAs?: string
}

/** Reads a page from its HTML and its address, which its links are read from */
export function readPage(html: string, address: string): Page {
  const tree = unified().use(rehypeParse).parse(html) as HastNode
  const page: Page = { text: '', blocks: [] }
  let line = ''

  // Where the walk is: the lists it is in, the item of the innermost, and
  // whether the text is preformatted
  const lists: { ordered: boolean; next: number }[] = []
  let item:
    | { ordered: boolean; depth: number; number: number; lines: number }
    | undefined
  let preformatted = 0

  const flush = () => {
    const text = line.replace(/\s+/g, ' ').trim()
    if (text) {
      const block: Block = { text }
      if (item) {
        const { ordered, depth, number } = item
        block.item = { ordered, depth, number }
        if (item.lines > 0) block.item.continued = true
        item.lines += 1
      }
      if (preformatted > 0) block.code = line.replace(/^\n+|\s+$/g, '')
      page.blocks.push(block)
    }
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
    const tag = node.type === 'element' ? (node.tagName ?? '') : ''
    if (tag) {
      if (tag === 'link') link(node)
      if (tag !== 'head' && UNSEARCHED.has(tag)) return
      if (hidden(node)) return
      if (tag === 'br') line += ' '
    }

    // The head is only read for its links
    const block = BLOCKS.has(tag)
    if (block) flush()

    const list = tag === 'ul' || tag === 'ol'
    const outer = item
    if (list) {
      const start = Number(node.properties?.start)
      lists.push({
        ordered: tag === 'ol',
        next: Number.isInteger(start) ? start : 1,
      })
    }
    if (tag === 'li' && lists.length > 0) {
      const within = lists[lists.length - 1]
      const value = Number(node.properties?.value)
      if (Number.isInteger(value) && value > 0) within.next = value
      item = {
        ordered: within.ordered,
        depth: lists.length,
        number: within.next,
        lines: 0,
      }
      within.next += 1
    }
    if (tag === 'pre') preformatted += 1

    for (const child of node.children ?? []) {
      if (tag === 'head' && child.tagName !== 'link') continue
      walk(child)
    }

    // What is left of the block is its own, before the walk leaves it
    if (block) flush()
    if (tag === 'pre') preformatted -= 1
    if (tag === 'li') item = outer
    if (list) lists.pop()
  }

  walk(tree)
  flush()
  page.text = page.blocks.map((block) => block.text).join('\n')
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
 * The blocks of a page from one index of its text to another: those the
 * passage runs through, the first and the last cut where it starts and ends.
 *
 * A block that is cut is no longer the item of a list: a bullet says "this is
 * an item", which a part of one is not. What continues an item is only of the
 * item with what starts it.
 */
function blocksBetween(page: Page, from: number, to: number): Block[] {
  const blocks: Block[] = []
  // The item quoted from its start at each depth, by its number
  const started = new Map<number, number>()
  let start = 0
  for (const { item, code, ...block } of page.blocks) {
    const end = start + block.text.length
    if (end > from && start < to) {
      const whole = start >= from && end <= to
      const text = page.text.slice(Math.max(start, from), Math.min(end, to))
      const itsItem =
        whole &&
        item &&
        (!item.continued || started.get(item.depth) === item.number)
      if (itsItem && !item.continued) started.set(item.depth, item.number)
      blocks.push({
        ...block,
        text,
        ...(whole ? {} : { cut: true as const }),
        ...(itsItem ? { item } : {}),
        ...(code !== undefined ? { code: whole ? code : text } : {}),
      })
    }
    // The line of the block, and the line break after it
    start = end + 1
  }
  return blocks
}

/**
 * Where a text directive finds a passage in a page's text: from an index to
 * another, the first place first.
 *
 * This follows the browsers' matching in what the markup can tell: whole
 * words, without case, a term within one block, a passage from its start to
 * the first end after it, a prefix and a suffix around it. Accents are
 * compared as written.
 */
function* rangesOf(
  page: Page,
  directive: TextDirective,
): Generator<{ from: number; to: number }> {
  const searched = caseless(page.text)
  const start = caseless(directive.start)
  if (!start) return

  for (const from of occurrences(searched, start, 0)) {
    let to = from + start.length

    if (directive.end) {
      const { value: end } = occurrences(
        searched,
        caseless(directive.end),
        to,
      ).next()
      // No end after this start, so none after a later one
      if (end === undefined) return
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

    yield { from, to }
  }
}

/**
 * The passages of a page that a text directive finds, each as the blocks it
 * runs through. A browser highlights the first.
 */
export function findPassages(page: Page, directive: TextDirective): Block[][] {
  return [...rangesOf(page, directive)].map(({ from, to }) =>
    blocksBetween(page, from, to),
  )
}

/**
 * What a browser highlights of a page for the text directives of an address:
 * the first passage each finds, as the page has them. They are in the order
 * of the page, whatever the order of the address, and those that overlap or
 * touch are one passage: between two passages, the page then always has
 * words that are not quoted.
 *
 * `undefined` when a directive finds nothing.
 */
export function highlighted(
  page: Page,
  directives: TextDirective[],
): Block[][] | undefined {
  const ranges: { from: number; to: number }[] = []
  for (const directive of directives) {
    const { value: range } = rangesOf(page, directive).next()
    if (!range) return undefined
    ranges.push(range)
  }
  ranges.sort((a, b) => a.from - b.from || a.to - b.to)

  const passages: { from: number; to: number }[] = []
  for (const range of ranges) {
    const last = passages[passages.length - 1]
    // Nothing but a space or the edge of a block between them, or less
    if (last && !/\S/.test(page.text.slice(last.to, range.from))) {
      last.to = Math.max(last.to, range.to)
    } else {
      passages.push({ ...range })
    }
  }
  return passages.map(({ from, to }) => blocksBetween(page, from, to))
}
