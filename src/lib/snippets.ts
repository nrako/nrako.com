import {
  fileError,
  fileWarn,
  normalizeLabel,
  toText,
  type DirectiveSpec,
  type GenericNode,
} from 'myst-common'
import { parseHTML } from 'linkedom'
import { visit } from 'unist-util-visit'

/** The languages of the markup a snippet's demo is made of */
const MARKUP_LANGUAGES = ['html', 'svg']

/** The languages of a script that a snippet runs */
const SCRIPT_LANGUAGES = ['js', 'javascript']

/** The languages of a snippet that make its demo; the others are only shown */
const DEMO_LANGUAGES = [...MARKUP_LANGUAGES, 'css', ...SCRIPT_LANGUAGES]

/** How a source is named above it; another language is named as typed */
const LANGUAGE_NAMES: Record<string, string> = {
  html: 'HTML',
  svg: 'SVG',
  css: 'CSS',
  js: 'JavaScript',
  javascript: 'JavaScript',
}

/**
 * The `{snippet}` directive: a small piece of HTML, CSS and JavaScript that a
 * post shows twice from one source, as it renders (the demo) and as it is
 * typed.
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
 * The demo's markup is its `html` blocks, and its `svg` blocks, which are
 * drawings set inline. The demo is set in the page itself, not in a frame: its
 * text is the post's text, which a reader can select, search and link to. Its
 * CSS is wrapped in an `@scope` block, whose root is the demo, so that it
 * styles nothing else.
 *
 * A `js` block runs as a module script, after the demo's HTML: what it
 * declares is its own, so two snippets can name a variable alike. Nothing
 * else keeps it apart: it sees the whole page, and finds its elements by an
 * `id` or a class that the page does not use elsewhere.
 *
 * A snippet is numbered ("Example 1") and its label can be referred to, as a
 * figure's.
 */
export const snippetDirective: DirectiveSpec = {
  name: 'snippet',
  doc: 'HTML, CSS and JavaScript, shown as they render and as they are typed',
  arg: { type: 'myst', doc: 'The caption of the snippet' },
  options: {
    label: { type: String, doc: 'The label to refer to the snippet by' },
  },
  body: {
    type: 'myst',
    required: true,
    doc: 'The `html` or `svg` of the demo, the `css` that styles it and the `js` that runs in it',
  },
  run(data, vfile) {
    const body = (data.body ?? []) as GenericNode[]
    const sources = body.filter((node) => node.type === 'code')
    const sourcesOf = (...langs: string[]) =>
      sources.filter((source) => langs.includes(source.lang))
    const join = (blocks: GenericNode[]) =>
      blocks.map((block) => block.value).join('\n')

    const html = join(sourcesOf(...MARKUP_LANGUAGES))
    const css = join(sourcesOf('css'))
    const js = join(sourcesOf(...SCRIPT_LANGUAGES))

    const children: GenericNode[] = []
    if (data.arg) {
      children.push({
        type: 'caption',
        children: [{ type: 'paragraph', children: data.arg as GenericNode[] }],
      })
    }

    const style = css ? `<style>@scope {\n${css}\n}</style>` : ''
    const script = js ? `<script type="module">\n${js}\n</script>` : ''
    const demo = html
      ? `<div class="snippet-demo not-prose">${style}${html}${script}</div>`
      : undefined

    if (demo) {
      children.push({ type: 'html', value: demo })
    } else {
      fileError(
        vfile,
        'A snippet has no `html` or `svg` block, so nothing to show',
        { node: data.node },
      )
    }

    for (const source of sources) {
      if (DEMO_LANGUAGES.includes(source.lang)) continue
      fileWarn(
        vfile,
        `A snippet shows its \`${source.lang}\` block but does not run it: only \`html\`, \`svg\`, \`css\` and \`js\` make the demo`,
        { node: source },
      )
    }

    // The sources as typed, each under the name of its language
    if (sources.length > 0) {
      children.push({
        type: 'snippetSources',
        data: { hName: 'div', hProperties: { class: 'snippet-sources' } },
        languages: sources.map(languageName),
        lines: sources.reduce(
          (lines, source) => lines + String(source.value).split('\n').length,
          0,
        ),
        children: sources.map((source) => ({
          type: 'snippetSource',
          data: { hName: 'div', hProperties: { class: 'snippet-source' } },
          children: [
            {
              type: 'paragraph',
              data: { hProperties: { class: 'snippet-language' } },
              children: [{ type: 'text', value: languageName(source) }],
            },
            // The highlighter has no SVG of its own: it is XML
            source.lang === 'svg' ? { ...source, lang: 'xml' } : source,
          ],
        })),
      })
    }

    // And anything else written in the snippet, after them
    children.push(...body.filter((node) => node.type !== 'code'))

    return [
      {
        type: 'snippet',
        // Named "Example" where it is numbered and referred to
        kind: 'example',
        enumerated: true,
        ...normalizeLabel(data.options?.label as string | undefined),
        demo,
        children,
      },
    ]
  },
}

function languageName(source: GenericNode): string {
  return LANGUAGE_NAMES[source.lang] ?? source.lang ?? 'Text'
}

/**
 * From how many lines the sources of a snippet are set as tabs, one shown at a
 * time, instead of one under the other.
 */
const TABS_FROM_LINES = 24

/**
 * The tabs of a snippet's sources: a group of radio buttons, one per source,
 * which CSS alone reads to show the source chosen (`global.css`). Without the
 * stylesheet, in a feed, the sources are one under the other, each named.
 */
function sourceTabs(languages: string[], name: string): GenericNode {
  const escape = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  const tabs = languages.map(
    (language, index) =>
      `<label><input type="radio" name="${escape(name)}"${index === 0 ? ' checked' : ''}>${escape(language)}</label>`,
  )

  return {
    type: 'html',
    value: `<div class="snippet-tablist" role="radiogroup" aria-label="Source shown">${tabs.join('')}</div>`,
  }
}

/** A snippet that has a page of its own: one with a label */
export interface PostSnippet {
  /** Its label, the last part of its page's address */
  label: string
  /** Its caption as text, or its number when it has none */
  title: string
  /** The markup of its demo, as set in the post */
  demo: string
  /** The markup of its sources, highlighted, as set in the post */
  sources: string
}

/**
 * Gives each snippet the markup of its sources, taken from the rendered post:
 * they are highlighted with the rest of it.
 */
export function withSources(
  snippets: Omit<PostSnippet, 'sources'>[],
  html: string,
): PostSnippet[] {
  if (snippets.length === 0) return []

  const { document } = parseHTML(`<html><body>${html}</body></html>`)
  return snippets.map((snippet) => ({
    ...snippet,
    sources:
      document.getElementById(snippet.label)?.querySelector('.snippet-sources')
        ?.outerHTML ?? '',
  }))
}

/**
 * The address of a snippet's own page, under its post's
 * (`src/pages/posts/[slug]/snippets/[label].astro`).
 */
export function snippetAddress(postAddress: string, label: string): string {
  return `${postAddress}/snippets/${encodeURIComponent(label)}`
}

/**
 * Finishes the snippets once MyST has numbered them: each becomes a figure
 * whose caption starts with its number ("Example 1:"), and takes its label as
 * `id`. One with a label has a page of its own; they are returned, and each
 * links to its page when the address of the post is given.
 */
export function snippetsTransform(
  tree: GenericNode,
  postAddress?: string,
): Omit<PostSnippet, 'sources'>[] {
  const snippets: Omit<PostSnippet, 'sources'>[] = []

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

    // Long sources are set as tabs: one is read at a time, and the demo stays
    // in view. The group of tabs is named after the snippet's number, which
    // is unique in the post.
    const sources: GenericNode | undefined = node.children?.find(
      (child: GenericNode) => child.type === 'snippetSources',
    )
    if (
      sources &&
      sources.languages.length > 1 &&
      sources.lines >= TABS_FROM_LINES
    ) {
      sources.data.hProperties.class = 'snippet-sources snippet-tabs'
      sources.children = [
        sourceTabs(sources.languages, `snippet-sources-${node.enumerator}`),
        ...(sources.children ?? []),
      ]
    }

    if (node.identifier && node.demo) {
      snippets.push({
        label: node.identifier,
        title: captioned
          ? toText(paragraph.children)
          : `Example ${node.enumerator}`,
        demo: node.demo,
      })
    }

    if (node.identifier && node.demo && postAddress) {
      // Under the demo, the way to it alone
      const children: GenericNode[] = node.children ?? []
      const demoIndex = children.findIndex((child) => child.type === 'html')
      children.splice(demoIndex + 1, 0, {
        type: 'paragraph',
        data: { hProperties: { class: 'snippet-alone' } },
        children: [
          {
            type: 'link',
            url: snippetAddress(postAddress, node.identifier),
            children: [{ type: 'text', value: 'On a page of its own' }],
          },
        ],
      })
    }

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

  return snippets
}
