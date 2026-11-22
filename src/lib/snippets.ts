import {
  fileError,
  fileWarn,
  normalizeLabel,
  type DirectiveSpec,
  type GenericNode,
} from 'myst-common'
import { visit } from 'unist-util-visit'

/** The languages of a snippet that make its demo; the others are only shown */
const DEMO_LANGUAGES = ['html', 'css']

/**
 * The `{snippet}` directive: a small piece of HTML and CSS that a post shows
 * twice from one source, as it renders (the demo) and as it is typed.
 *
 *     :::{snippet} A caption
 *     :label: ex-opacity
 *
 *     ```html
 *     <p>Seen, <span class="secret">unseen</span>.</p>
 *     ```
 *
 *     ```css
 *     .secret { opacity: 0; }
 *     ```
 *     :::
 *
 * The demo is set in the page itself, not in a frame: its text is the post's
 * text, which a reader can select, search and link to. Its CSS is wrapped in
 * an `@scope` block, whose root is the demo, so that it styles nothing else.
 *
 * A snippet is numbered ("Example 1") and its label can be referred to, as a
 * figure's.
 */
export const snippetDirective: DirectiveSpec = {
  name: 'snippet',
  doc: 'A piece of HTML and CSS, shown as it renders and as it is typed',
  arg: { type: 'myst', doc: 'The caption of the snippet' },
  options: {
    label: { type: String, doc: 'The label to refer to the snippet by' },
  },
  body: {
    type: 'myst',
    required: true,
    doc: 'One `html` block, and the `css` blocks that style it',
  },
  run(data, vfile) {
    const body = (data.body ?? []) as GenericNode[]
    const sources = body.filter((node) => node.type === 'code')
    const sourcesOf = (lang: string) =>
      sources.filter((source) => source.lang === lang)
    const join = (blocks: GenericNode[]) =>
      blocks.map((block) => block.value).join('\n')

    const html = join(sourcesOf('html'))
    const css = join(sourcesOf('css'))

    const children: GenericNode[] = []
    if (data.arg) {
      children.push({
        type: 'caption',
        children: [{ type: 'paragraph', children: data.arg as GenericNode[] }],
      })
    }

    if (html) {
      const style = css ? `<style>@scope {\n${css}\n}</style>` : ''
      children.push({
        type: 'html',
        value: `<div class="snippet-demo not-prose">${style}${html}</div>`,
      })
    } else {
      fileError(vfile, 'A snippet has no `html` block, so nothing to show', {
        node: data.node,
      })
    }

    for (const source of sources) {
      if (DEMO_LANGUAGES.includes(source.lang)) continue
      fileWarn(
        vfile,
        `A snippet shows its \`${source.lang}\` block but does not run it: only \`html\` and \`css\` make the demo`,
        { node: source },
      )
    }

    // The sources, and anything else written in the snippet, as typed
    children.push(...body)

    return [
      {
        type: 'snippet',
        // Named "Example" where it is numbered and referred to
        kind: 'example',
        enumerated: true,
        ...normalizeLabel(data.options?.label as string | undefined),
        children,
      },
    ]
  },
}

/**
 * Finishes the snippets once MyST has numbered them: each becomes a figure
 * whose caption starts with its number ("Example 1:"), and takes its label as
 * `id`.
 */
export function snippetsTransform(tree: GenericNode) {
  visit(tree as any, 'snippet', (node: GenericNode) => {
    node.data = {
      hName: 'figure',
      hProperties: { class: 'snippet', id: node.identifier },
    }

    // The caption the directive made, or one for the number alone
    let paragraph: GenericNode | undefined = node.children?.find(
      (child: GenericNode) => child.type === 'caption',
    )?.children?.[0]
    if (!paragraph) {
      paragraph = { type: 'paragraph' }
      node.children = [
        { type: 'caption', children: [paragraph] },
        ...(node.children ?? []),
      ]
    }

    const captioned = Boolean(paragraph.children?.length)
    paragraph.children = [
      {
        type: 'captionNumber',
        children: [
          {
            type: 'text',
            value: `Example\u00a0${node.enumerator}${captioned ? ':' : ''}`,
          },
        ],
      },
      ...(paragraph.children ?? []),
    ]
  })
}
