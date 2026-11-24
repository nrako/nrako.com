/**
 * A post's table of contents: its sections, read from the headings of its
 * HTML once everything that adds one (the references) has run.
 */

export interface TableOfContentsEntry {
  /** The `id` of the heading, which a link to the section targets */
  id: string
  /** The heading as plain text */
  text: string
  /** 2 for a section, 3 for a section within the one before it */
  depth: 2 | 3
}

/** A section and the sections within it */
export interface TableOfContentsSection extends TableOfContentsEntry {
  children: TableOfContentsEntry[]
}

const DEPTHS: Record<string, TableOfContentsEntry['depth']> = { h2: 2, h3: 3 }

/** The label of the footnotes, which only a screen reader is given */
const FOOTNOTES_ID = 'footnote-label'

/** A snippet's demo: its headings are the demo's, not the post's */
const DEMO_CLASS = 'snippet-demo'

/**
 * Rehype plugin: adds every section of the post to `entries`, in order. A
 * heading without an `id` cannot be linked to and is left out.
 */
export function rehypeTableOfContents(entries: TableOfContentsEntry[]) {
  return (tree: any) => {
    collect(tree, entries)
  }
}

function collect(node: any, entries: TableOfContentsEntry[]) {
  if (node.type === 'element') {
    if (node.properties?.className?.includes(DEMO_CLASS)) return

    const depth = DEPTHS[node.tagName]
    const id = node.properties?.id
    if (depth && typeof id === 'string' && id !== FOOTNOTES_ID) {
      const text = textOf(node).replace(/\s+/g, ' ').trim()
      if (text) entries.push({ id, text, depth })
      return
    }
  }
  for (const child of node.children ?? []) collect(child, entries)
}

/**
 * The text of a heading as it is read: without what is hidden from a screen
 * reader (the anchor sign, the drawing of a formula) and without the TeX
 * source KaTeX keeps beside a formula.
 */
function textOf(node: any): string {
  if (node.type === 'text') return node.value
  if (node.type !== 'element') return ''
  if (node.tagName === 'annotation') return ''
  if (String(node.properties?.ariaHidden) === 'true') return ''
  return (node.children ?? []).map(textOf).join('')
}

/**
 * The entries as sections, each with the sections within it. A deeper
 * heading that comes before any section stands as a section of its own.
 */
export function nestTableOfContents(
  entries: TableOfContentsEntry[],
): TableOfContentsSection[] {
  const sections: TableOfContentsSection[] = []
  for (const entry of entries) {
    const parent = sections.at(-1)
    if (entry.depth === 3 && parent) parent.children.push(entry)
    else sections.push({ ...entry, children: [] })
  }
  return sections
}
