import { SKIP, visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

import type { Messages } from './processor.ts'

interface MdastNode {
  type: string
  children?: MdastNode[]
  [key: string]: any
}

/**
 * The blocks a label can name besides those the renderer already gives an
 * `id` (headings, figures, tables, equations, code).
 */
const LABELLED_BLOCKS = [
  'paragraph',
  'list',
  'blockquote',
  'admonition',
  'definitionList',
]

/**
 * Finishes what MyST's resolution of references leaves for its renderer, which
 * the HTML one does not do:
 *
 * - a reference whose target does not exist becomes its own text, in place of
 *   a role shown as unhandled;
 * - a link without a text shows its address, in place of an empty link;
 * - a labelled block or equation gets its label as `id`, so that a link to it
 *   lands.
 */
export function crossReferencesTransform(tree: MdastNode) {
  visit(
    tree as any,
    (node: MdastNode, index, parent: MdastNode | undefined) => {
      if (node.type === 'crossReference' && !node.resolved) {
        if (index === undefined || !parent?.children) return
        const text = node.children?.length
          ? node.children
          : [{ type: 'text', value: String(node.label ?? node.identifier) }]
        parent.children.splice(index, 1, ...text)
        return [SKIP, index + text.length]
      }

      // The math renderer replaces the element that carries an equation's `id`
      if (node.type === 'math' && node.identifier) {
        if (index === undefined || !parent?.children) return
        const { identifier } = node
        delete node.identifier
        parent.children[index] = {
          type: 'equation',
          data: {
            hName: 'div',
            hProperties: { id: identifier, class: 'equation' },
          },
          children: [node],
        }
        return [SKIP, index + 1]
      }

      if (node.type === 'link' && !node.children?.length) {
        node.children = [{ type: 'text', value: String(node.url) }]
      }

      if (LABELLED_BLOCKS.includes(node.type) && node.identifier) {
        node.data = {
          ...node.data,
          hProperties: { ...node.data?.hProperties, id: node.identifier },
        }
      }
    },
  )
}

/**
 * Handler of the renderer for the number MyST sets before a caption
 * ("Figure 1:"), which it would otherwise rebuild from fields MyST does not
 * fill. The space after it is in the markup, not in CSS, so that a feed
 * reader has it too.
 */
export function captionNumber(h: any, node: MdastNode) {
  return h(node, 'span', { class: 'caption-number' }, [
    { type: 'text', value: `${textOf(node)} ` },
  ])
}

function textOf(node: MdastNode): string {
  return node.value ?? node.children?.map(textOf).join('') ?? ''
}

/**
 * Adds what MyST reported while it transformed a post to the post's messages.
 * Linking to a heading by the `id` made from its text is how a post refers to
 * a section here, so MyST's advice to label the heading instead is left out.
 */
export function reportMessages(file: VFile, messages: Messages) {
  for (const message of file.messages) {
    if (message.ruleId === 'reference-target-explicit') continue
    const list = message.fatal ? 'errors' : 'warnings'
    messages[list] ??= []
    messages[list].push({
      property: message.ruleId ?? 'markup',
      message: message.reason,
    })
  }
}
