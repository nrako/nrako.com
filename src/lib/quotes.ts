import {
  fileError,
  toText,
  type DirectiveSpec,
  type GenericNode,
} from 'myst-common'
import { mystParse } from 'myst-parser'
import { visit } from 'unist-util-visit'
import {
  findPassages,
  highlighted,
  readPage,
  textDirectives,
  type Block,
  type Page,
  type TextDirective,
} from './passages.ts'
import type { Messages } from './processor.ts'

/** The line that attributes a quotation, as MyST reads it: `-- Someone` */
const ATTRIBUTION = /^(?:---?|—) +/

/** Whether a paragraph is the attribution of a quotation */
function attributes(node: GenericNode | undefined): boolean {
  const lead = node?.children?.[0]
  return (
    node?.type === 'paragraph' &&
    lead?.type === 'text' &&
    ATTRIBUTION.test(String(lead.value))
  )
}

/**
 * The text of a quotation as it was typed, without its attribution.
 *
 * The parser sets typographic quotes and reads a role or a subscript, so the
 * text of what it parsed is not the text that was typed. The quotation is
 * parsed again here as plain Markdown, with no typography.
 */
function writtenText(markup: string): string {
  const tree = mystParse(markup, {
    markdownit: { typographer: false, linkify: false },
  }) as GenericNode
  const children: GenericNode[] = tree.children ?? []
  if (attributes(children[children.length - 1])) children.pop()

  const blocks: string[] = []
  visit(tree as any, (node: GenericNode) => {
    if (['paragraph', 'heading', 'code', 'tableCell'].includes(node.type)) {
      blocks.push(toText(node))
    }
  })
  return blocks.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * A text as it is compared with another: what a post says a page has, with
 * what the page has. What differs in the typing and not in the words is left
 * out: case, spaces, the edges of blocks, typographic quotes and dashes, and
 * the ellipsis that stands between two passages, in brackets or not.
 */
function comparable(text: string): string {
  return (
    text
      // An ellipsis becomes three dots, a no-break space a space
      .normalize('NFKC')
      .replace(/\[\s*\.{3}\s*\]/g, ' ')
      .replace(/(?<!\S)\.{3}(?!\S)/g, ' ')
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[“”„‟]/g, '"')
      .replace(/[‐‑‒–—―]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  )
}

function paragraph(value: string, className?: string): GenericNode {
  return {
    type: 'paragraph',
    data: className ? { hProperties: { class: className } } : undefined,
    children: [{ type: 'text', value }],
  }
}

/** The words of a passage, without its layout */
function passageText(blocks: Block[]): string {
  return blocks.map((block) => block.text).join(' ')
}

/** The ellipsis that stands between two passages, in brackets or not */
const BETWEEN_PASSAGES = /\[\s*(?:…|\.{3})\s*\]|(?<!\S)(?:…|\.{3})(?!\S)/

/**
 * Which passages the post wrote otherwise than the page has them, and how it
 * wrote each: `undefined` for one it wrote the same.
 *
 * A quotation of several passages written with an ellipsis between them is
 * compared passage by passage. Written otherwise, nothing says which
 * of its words are of which passage: every passage is then written
 * otherwise, as the whole quotation.
 */
function writtenOtherwise(
  written: string,
  passages: Block[][],
): (string | undefined)[] {
  const read = passages.map(passageText)
  if (comparable(written) === comparable(read.join(' '))) {
    return read.map(() => undefined)
  }

  const parts = written
    .split(BETWEEN_PASSAGES)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length !== read.length) return read.map(() => written)
  return parts.map((part, index) =>
    comparable(part) === comparable(read[index]) ? undefined : part,
  )
}

/**
 * A part of a paragraph: words of a line, which another part can follow in
 * the line. A block quoted whole, the item of a list and code are not.
 */
function inLine(block: Block): boolean {
  return Boolean(block.cut) && !block.item && block.code === undefined
}

/**
 * The items of a list, one after the other, as the lists they are in: a list
 * in an item for those that are deeper, another list where the kind changes.
 * A numbered list starts at the number of its first item quoted.
 */
function listNodes(
  entries: { block: Block; node: GenericNode }[],
): GenericNode[] {
  const lists: GenericNode[] = []
  const open: { depth: number; list: GenericNode; item: GenericNode }[] = []

  for (const { block, node } of entries) {
    const { ordered, depth, number, continued } = block.item!
    while (open.length > 0 && open[open.length - 1].depth > depth) open.pop()

    let within = open[open.length - 1]
    if (continued && within?.depth === depth) {
      within.item.children!.push(node)
      continue
    }
    // Another kind of list at the same depth takes the place of this one
    if (within?.depth === depth && within.list.ordered !== ordered) {
      open.pop()
      within = open[open.length - 1]
    }

    const item: GenericNode = {
      type: 'listItem',
      spread: false,
      children: [node],
    }
    if (within?.depth === depth) {
      within.list.children!.push(item)
      within.item = item
      continue
    }
    const list: GenericNode = {
      type: 'list',
      ordered,
      start: ordered ? number : undefined,
      spread: false,
      children: [item],
    }
    ;(within ? within.item.children! : lists).push(list)
    open.push({ depth, list, item })
  }
  return lists
}

/**
 * Passages as a quotation: a paragraph for each of their blocks, a list for
 * those that are the items of one, and a block of code for what the page has
 * preformatted. This is what of a page's layout Markdown can say, and what a
 * quotation written in a post could have.
 *
 * An ellipsis stands between two passages. Two parts of paragraphs are set
 * in one line with it between them, as a quotation that leaves words out is
 * written. A block quoted whole, an item or code is on a line of its own,
 * as the page has it: the ellipsis then ends the part before it or starts
 * the part after it, and stands alone between two such blocks.
 *
 * A passage the post wrote otherwise (`otherwise`) is marked as text that
 * was put in the place of another (`ins`), and says under the pointer what
 * the post quoted there.
 */
function passageNodes(
  passages: Block[][],
  otherwise: (string | undefined)[] = [],
): GenericNode[] {
  const entries: { block: Block; children: GenericNode[] }[] = []
  for (const [index, passage] of passages.entries()) {
    const was = otherwise[index]
    const text = (value: string): GenericNode =>
      was === undefined
        ? { type: 'text', value }
        : {
            type: 'quoteChanged',
            data: {
              hName: 'ins',
              hProperties: {
                class: 'quote-changed',
                title: `Quoted in this post as: “${was}”`,
              },
            },
            children: [{ type: 'text', value }],
          }

    for (const [at, block] of passage.entries()) {
      const children = [text(block.text)]
      const last = entries[entries.length - 1]
      if (index > 0 && at === 0 && last) {
        // The ellipsis goes with what is cut: a block quoted whole is left
        // as the page has it, on a line of its own
        if (inLine(last.block) && inLine(block)) {
          last.children.push({ type: 'text', value: ' … ' }, ...children)
          continue
        }
        if (inLine(last.block)) {
          last.children.push({ type: 'text', value: ' …' })
        } else if (inLine(block)) {
          children.unshift({ type: 'text', value: '… ' })
        } else {
          entries.push({
            block: { text: '…' },
            children: [{ type: 'text', value: '…' }],
          })
        }
      }
      entries.push({ block, children })
    }
  }

  const nodes: GenericNode[] = []
  let items: { block: Block; node: GenericNode }[] = []
  const endList = () => {
    nodes.push(...listNodes(items))
    items = []
  }
  for (const { block, children } of entries) {
    const node: GenericNode =
      block.code === undefined
        ? { type: 'paragraph', children }
        : { type: 'code', value: block.code }
    if (block.item) {
      items.push({ block, node })
    } else {
      endList()
      nodes.push(node)
    }
  }
  endList()
  return nodes
}

/**
 * The `{linked-quote}` directive: what a text fragment names on a page of the
 * web, quoted with the link that leads to it.
 *
 * ```
 * :::{linked-quote} https://example.com/a-page#:~:text=the%20start,the%20end
 * The passage, as the page has it.
 *
 * -- Its author
 * :::
 * ```
 *
 * The address is the reference: it always has the text fragment, as a
 * browser's "copy link to highlight" gives it, and the site never makes one.
 * It can name several passages (`text=one&text=another`), which a browser
 * highlights together.
 *
 * What is quoted is read from the page (`resolveQuotes`). The quotation
 * written in the post is optional: it is there to be read in the source, to
 * be compared with what the page has, and to be shown when the page does not
 * have the passage any more or could not be read.
 */
export const quoteDirective: DirectiveSpec = {
  name: 'linked-quote',
  doc: 'What a text fragment names on a page of the web, with the link to it',
  arg: {
    type: String,
    required: true,
    doc: 'The address of the page, with the text fragment that names what is quoted',
  },
  body: {
    type: 'myst',
    doc: 'The passage as the page has it, optional, and a last line `-- Someone` to attribute it',
  },
  run(data, vfile) {
    const address = String(data.arg ?? '').trim()
    const body = (data.body ?? []) as GenericNode[]
    const quotation = (source?: string, extra?: Record<string, unknown>) => [
      {
        type: 'container',
        kind: 'quote',
        class: 'quote',
        source,
        ...extra,
        children: [
          {
            type: 'blockquote',
            data: source ? { hProperties: { cite: source } } : undefined,
            children: body,
          },
        ],
      },
    ]
    const fail = (reason: string) => {
      fileError(vfile, reason, { node: data.node, ruleId: 'quote' })
      // What was written is still shown, as a quotation from nowhere
      return body.length > 0 ? quotation() : []
    }

    if (
      !URL.canParse(address) ||
      !/^https?:$/.test(new URL(address).protocol)
    ) {
      return fail(
        `A quote is from a page, named by its address: "${address}" is not one`,
      )
    }

    const directives = textDirectives(address.split('#')[1] ?? '')
    if (directives.length === 0) {
      return fail(
        `The quote from "${address}" does not say what it quotes: its address has to name it, with a text fragment (#:~:text=the%20passage)`,
      )
    }

    // What the address names is read from the page once the post is parsed
    return quotation(address, {
      awaited: directives,
      written: writtenText(String(data.node.value ?? '')) || undefined,
    })
  },
}

/** Reads a page of the web as HTML, and rejects with the reason it cannot */
export type FetchPage = (address: string) => Promise<string>

const pages = new Map<string, Promise<string>>()

/**
 * Reads a page of the web, once: a build asks for a page as many times as it
 * is quoted. A page that could not be read is asked for again.
 */
export const fetchPage: FetchPage = (address) => {
  let page = pages.get(address)
  if (!page) {
    page = requestPage(address)
    page.catch(() => pages.delete(address))
    pages.set(address, page)
  }
  return page
}

async function requestPage(address: string): Promise<string> {
  const response = await fetch(address, {
    headers: { accept: 'text/html' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`it answered ${response.status}`)
  const type = response.headers.get('content-type') ?? ''
  if (!type.includes('html')) {
    throw new Error(`it is not HTML (${type || 'no content type'})`)
  }
  return response.text()
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * What a quote says of itself beside its link, when what it quotes is not
 * simply what its page has.
 */
type Notice =
  /** The page has other words than those the post wrote */
  | 'changed'
  /** The page no longer has what the address names */
  | 'gone'
  /** The page could not be read */
  | 'unchecked'

/**
 * What is said under a quotation that has no text of its own to show, and is
 * set from its address: a note of the site's, not words of the page
 */
const FROM_ADDRESS: Record<'gone' | 'unchecked', string> = {
  gone: 'No longer on the page: these are the words its address holds.',
  unchecked: 'Not read from the page: these are the words its address holds.',
}

/**
 * What an address holds of the passages it names: a passage whole, or its
 * first words and its last, with an ellipsis for what the page had between
 * them.
 */
function heldByAddress(directives: TextDirective[]): Block[][] {
  return directives.map((directive) => [
    {
      text: directive.end
        ? `${directive.start} … ${directive.end}`
        : directive.start,
      // Words of a line: nothing says they are a block of the page
      cut: true,
    },
  ])
}

/**
 * Gives each quote its text, read from the page its address names, at every
 * build: the page is what is quoted, and the post follows it.
 *
 * - The page has what the address names: that is the quotation, as the page
 *   has it. If the post wrote the quotation otherwise, it gets a warning,
 *   and the passages it wrote otherwise are marked, each with what the post
 *   quoted there.
 * - The page does not have it any more: the quotation is what the post wrote,
 *   or what the address holds of it with a note that says so, and the post
 *   gets a warning.
 * - The page could not be read, or none is read here (`fetchPage` is not
 *   given): the same, said otherwise, since nothing says the passage left.
 *
 * None of these fails: a build does not depend on another site. A post with
 * a quote that has no written text is not the same from one build to the
 * next, when the page changes or cannot be read; writing the quotation is
 * what keeps it.
 *
 * Words that the page has at several places are quoted from the first, as a
 * browser highlights them, and the post gets a warning: the place meant may
 * be another, which a prefix or a suffix in the address tells apart.
 *
 * A page can say it is a version of another (`rel="canonical"`). What is
 * found on the version and not on the page it is a version of is still
 * quoted from the version, and the quote says that the page has moved on.
 */
export async function resolveQuotes(
  tree: GenericNode,
  messages: Messages,
  fetchPage?: FetchPage,
) {
  const awaited: GenericNode[] = []
  visit(tree as any, 'container', (node: GenericNode) => {
    if (node.kind === 'quote' && node.awaited) awaited.push(node)
  })

  const warn = (message: string) => {
    messages.warnings ??= []
    messages.warnings.push({ property: 'quote', message })
  }

  for (const node of awaited) {
    const address: string = node.source
    const directives: TextDirective[] = node.awaited
    const written: string | undefined = node.written
    delete node.awaited
    delete node.written

    const quotation: GenericNode | undefined = node.children?.find(
      (child: GenericNode) => child.type === 'blockquote',
    )
    if (!quotation) continue
    // The attribution stays under whatever text the quotation gets
    const last = quotation.children?.[quotation.children.length - 1]
    const attribution: GenericNode[] = last && attributes(last) ? [last] : []
    const without = (notice: 'gone' | 'unchecked') => {
      node.notice = notice satisfies Notice
      if (!written) {
        quotation.children = [
          ...passageNodes(heldByAddress(directives)),
          paragraph(FROM_ADDRESS[notice], 'quote-missing'),
          ...attribution,
        ]
      }
    }

    const page = address.split('#')[0]
    let read: Page
    try {
      if (!fetchPage) throw new Error('no page is read here')
      read = readPage(await fetchPage(page), page)
    } catch (error) {
      warn(
        `The quote from "${address}" could not be read from its page: ${reason(error)}`,
      )
      without('unchecked')
      continue
    }

    // What a browser highlights: the passages in the order of the page
    const passages = highlighted(read, directives)
    if (!passages) {
      warn(`The page of "${address}" no longer has what the address names`)
      without('gone')
      continue
    }

    // Words the page has more than once are quoted from their first place,
    // which is the one a browser highlights, and may not be the one meant
    for (const directive of directives) {
      const places = findPassages(read, directive).length
      if (places > 1) {
        const named = directive.end
          ? `from "${directive.start}" to "${directive.end}"`
          : `"${directive.start}"`
        warn(
          `The page of "${address}" has what the address names ${named} at ${places} places: the first is quoted. Words before or after it tell them apart (#:~:text=before-,the%20passage,-after)`,
        )
      }
    }

    const otherwise = written ? writtenOtherwise(written, passages) : []
    quotation.children = [...passageNodes(passages, otherwise), ...attribution]
    if (otherwise.some((was) => was !== undefined)) {
      warn(
        `The page of "${address}" has other words than the post: "${passages.map(passageText).join(' ')}", where the post quotes "${written}"`,
      )
      node.notice = 'changed' satisfies Notice
    }

    // Does the page this one is a version of still have it?
    const { canonical } = read
    if (!fetchPage || !canonical) continue
    if (new URL(canonical).href === new URL(page).href) continue
    try {
      const current = readPage(await fetchPage(canonical), canonical)
      if (
        directives.some(
          (directive) => findPassages(current, directive).length === 0,
        )
      ) {
        warn(
          `What is quoted from "${address}" is no longer on the page it is a version of, ${canonical}`,
        )
        node.superseded = true
      }
    } catch (error) {
      warn(
        `What is quoted from "${address}" could not be looked for on the page it is a version of, ${canonical}: ${reason(error)}`,
      )
    }
  }
}

/** How a page is named under what is quoted from it: by its host */
function pageName(address: string): string {
  return new URL(address).hostname.replace(/^www\./, '')
}

/** What a quote says beside its link */
const NOTICES: Record<Notice | 'superseded', string> = {
  changed: 'changed since it was quoted',
  gone: 'no longer found on the page',
  unchecked: 'not checked: the page could not be read',
  superseded: 'no longer in the current version of the page',
}

/**
 * Finishes the quotes once MyST has made a caption of their attribution: the
 * caption ends with the link to what is quoted, named by the host it leads
 * to, and a quote without attribution gets a caption for the link alone.
 *
 * What `resolveQuotes` found is said there, in a notice after the link: that
 * the page has other words than the post wrote, no longer has the passage,
 * could not be read, or has moved on from the version quoted.
 */
export function quotesTransform(tree: GenericNode) {
  visit(tree as any, 'container', (node: GenericNode) => {
    if (node.kind !== 'quote' || typeof node.source !== 'string') return

    const link: GenericNode = {
      type: 'link',
      url: node.source,
      children: [{ type: 'text', value: pageName(node.source) }],
    }
    const notices = [
      node.notice ? NOTICES[node.notice as Notice] : undefined,
      node.superseded ? NOTICES.superseded : undefined,
    ].filter((notice) => notice !== undefined)
    delete node.source
    delete node.notice
    delete node.superseded

    const ending: GenericNode[] = [
      link,
      ...notices.map((notice) => ({
        type: 'quoteNotice',
        data: { hName: 'span', hProperties: { class: 'quote-notice' } },
        children: [{ type: 'text', value: ` (${notice})` }],
      })),
    ]

    const caption: GenericNode | undefined = node.children?.find(
      (child: GenericNode) => child.type === 'caption',
    )?.children?.[0]
    if (caption) {
      caption.children = [
        ...(caption.children ?? []),
        { type: 'text', value: ', ' },
        ...ending,
      ]
    } else {
      node.children = [
        ...(node.children ?? []),
        {
          type: 'caption',
          children: [{ type: 'paragraph', children: ending }],
        },
      ]
    }
  })
}
