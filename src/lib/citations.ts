import {
  getCitations,
  InlineCite,
  type CitationRenderer,
} from 'citation-js-utils'
import { h } from 'hastscript'
import rehypeParse from 'rehype-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import type { Messages } from './processor.ts'

/**
 * Reads a file a post refers to, by its path from the posts directory.
 * Resolves to `undefined` when the file does not exist.
 */
export type LoadFile = (
  path: string,
) => Promise<string | undefined> | string | undefined

/** A cited work: its key in the bibliography and its formatted entry */
export interface Reference {
  key: string
  /** Sanitized HTML of the entry, in the APA style */
  html: string
}

interface MdastNode {
  type: string
  children?: MdastNode[]
  [key: string]: any
}

/**
 * Loads the BibTeX files a post lists under `bibliography` in its
 * frontmatter. A file that is missing, outside the posts directory or not
 * BibTeX is an error: every citation of the post depends on it.
 */
export async function loadBibliography(
  paths: string[],
  loadFile: LoadFile | undefined,
): Promise<CitationRenderer> {
  const renderers: CitationRenderer = {}
  for (const path of paths) {
    if (!loadFile) {
      throw new Error(
        `Bibliography "${path}" cannot be read: no file loader was given`,
      )
    }
    if (path.startsWith('/') || path.split(/[\\/]/).includes('..')) {
      throw new Error(
        `Bibliography "${path}" must be a path inside the posts directory`,
      )
    }

    const bibtex = await loadFile(path)
    if (bibtex === undefined) {
      throw new Error(`Bibliography "${path}" was not found`)
    }

    try {
      Object.assign(renderers, await getCitations(bibtex))
    } catch (error) {
      throw new Error(`Bibliography "${path}" could not be read as BibTeX`, {
        cause: error,
      })
    }
  }
  return renderers
}

/** The `id` of a work's entry in the list of references */
function referenceId(key: string): string {
  return `cite-${key}`
}

/**
 * Replaces every citation of the tree by a link to its entry in the list of
 * references, and returns the works cited, in the order of that list.
 *
 * A key the bibliography does not hold stays in the text as `@key`, with a
 * warning.
 */
export function citationsTransform(
  tree: MdastNode,
  renderers: CitationRenderer,
  messages: Messages,
): Reference[] {
  const cited = new Set<string>()

  function citation(cite: MdastNode): MdastNode {
    const key = String(cite.label)
    const renderer = renderers[key]
    if (!renderer) {
      messages.warnings ??= []
      messages.warnings.push({
        property: 'citation',
        message: `"${key}" is cited but is not in the bibliography (an @ meant as text is written \\@)`,
      })
      return { type: 'text', value: `@${key}` }
    }

    cited.add(key)
    return {
      type: 'link',
      url: `#${encodeURIComponent(referenceId(key))}`,
      children: renderer.inline(
        cite.kind === 'narrative' ? InlineCite.t : InlineCite.p,
        {
          prefix: typeof cite.prefix === 'string' ? cite.prefix : undefined,
          suffix: typeof cite.suffix === 'string' ? cite.suffix : undefined,
          partial: cite.partial,
        },
      ),
      data: { hProperties: { class: 'citation' } },
    }
  }

  /** Several citations as one: "(a; b)" in parentheses, "a, b" in the text */
  function citationGroup(group: MdastNode): MdastNode[] {
    const parenthetical = group.kind === 'parenthetical'
    const separator = parenthetical ? '; ' : ', '
    const nodes: MdastNode[] = []

    if (parenthetical) nodes.push({ type: 'text', value: '(' })
    for (const [index, child] of (group.children ?? []).entries()) {
      if (index > 0) nodes.push({ type: 'text', value: separator })
      nodes.push(child.type === 'cite' ? citation(child) : child)
    }
    if (parenthetical) nodes.push({ type: 'text', value: ')' })
    return nodes
  }

  function replaceCitations(parent: MdastNode) {
    parent.children = parent.children?.flatMap((node) => {
      if (node.type === 'citeGroup') return citationGroup(node)
      if (node.type === 'cite') return [citation(node)]
      replaceCitations(node)
      return [node]
    })
  }

  replaceCitations(tree)

  // An author-year list is read by name: the entries are sorted as formatted
  return [...cited]
    .map((key) => ({ key, html: renderers[key].render() }))
    .sort((a, b) => plainText(a.html).localeCompare(plainText(b.html), 'en'))
}

function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Rehype plugin: sets the list of references in place of the post's
 * `{bibliography}` directive, or in a "References" section at the end of the
 * post when it has none. A post that cites nothing gets no list.
 */
export function rehypeReferences(references: Reference[]) {
  return (tree: any) => {
    if (references.length === 0) return

    const list = h(
      'ol.reference-list',
      references.map(({ key, html }) =>
        h('li', { id: referenceId(key) }, entryNodes(html)),
      ),
    )

    let placed = false
    visit(tree, 'element', (node: any, index, parent: any) => {
      if (placed || index === undefined || !parent) return
      if (node.tagName !== 'div') return
      if (!node.properties?.className?.includes('bibliography')) return
      parent.children[index] = list
      placed = true
    })

    if (!placed) {
      tree.children.push(
        h('section.references', [
          h('h2', { id: 'references' }, 'References'),
          list,
        ]),
      )
    }
  }
}

/**
 * An entry's HTML as nodes. Its links lose the `target` and `rel` the
 * formatter sets, so they behave like every other link of a post.
 */
function entryNodes(html: string) {
  const fragment = unified().use(rehypeParse, { fragment: true }).parse(html)
  visit(fragment, 'element', (node: any) => {
    if (node.tagName !== 'a') return
    delete node.properties.target
    delete node.properties.rel
  })
  return fragment.children as any[]
}
