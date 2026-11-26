import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import { transformerNotationDiff } from '@shikijs/transformers'
import { h } from 'hastscript'
import { validatePageFrontmatter, type PageFrontmatter } from 'myst-frontmatter'
import { mystParse } from 'myst-parser'
import { formatHtml, mystToHast } from 'myst-to-html'
import {
  basicTransformationsPlugin,
  DOITransformer,
  enumerateTargetsPlugin,
  getFrontmatter,
  GithubTransformer,
  inlineMathSimplificationPlugin,
  linksPlugin,
  ReferenceState,
  resolveReferencesPlugin,
  RRIDTransformer,
  WikiTransformer,
} from 'myst-transforms'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import {
  bundledLanguages,
  createHighlighter,
  createJavaScriptRegexEngine,
  type Highlighter,
} from 'shiki'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'

import { defaultOptions, type BlogOptions } from './blogData.ts'
import {
  citationsTransform,
  loadBibliography,
  rehypeReferences,
  type LoadFile,
} from './citations.ts'
import {
  captionNumber,
  crossReferencesTransform,
  reportMessages,
} from './crossReferences.ts'
import {
  quoteDirective,
  quotesTransform,
  resolveQuotes,
  type FetchPage,
} from './quotes.ts'
import { snippetDirective, snippetsTransform } from './snippets.ts'
import {
  rehypeTableOfContents,
  type TableOfContentsEntry,
} from './tableOfContents.ts'

export type ParseOptions = Pick<
  BlogOptions,
  'highlighter' | 'defaultAuthors'
> & {
  /** Reads the files a post refers to: the bibliographies it lists */
  loadFile?: LoadFile
  /** The address of the post, which the pages of its snippets are under */
  address?: string
  /** Reads a page of the web: the one a quote is read from */
  fetchPage?: FetchPage
}

/**
 * A post's frontmatter: MyST's, and what the site adds to it.
 */
export type PostFrontmatter = PageFrontmatter & {
  /**
   * `false` keeps the post out of the listings and the feeds. Its pages are
   * built all the same.
   */
  listed?: boolean
}

interface Message {
  property: string
  message: string
}

export interface Messages {
  errors?: Message[]
  warnings?: Message[]
}

const highlighters = new Map<string, Promise<Highlighter>>()

/**
 * Returns a shared Shiki highlighter for the given themes, with every bundled
 * language available.
 *
 * Shiki's default Oniguruma engine decodes its WASM binary at module scope,
 * which workerd rejects ("Disallowed operation called within global scope"),
 * so the versioned-post SSR route could not render. The JavaScript regex
 * engine needs no WASM and runs in both Node and workerd.
 */
function getHighlighter(
  themes: ParseOptions['highlighter']['themes'],
): Promise<Highlighter> {
  const themeNames = Object.values(themes)
  const key = themeNames.join('|')
  let highlighter = highlighters.get(key)
  if (!highlighter) {
    highlighter = createHighlighter({
      themes: themeNames,
      langs: Object.keys(bundledLanguages),
      engine: createJavaScriptRegexEngine(),
    })
    highlighters.set(key, highlighter)
  }
  return highlighter
}

/**
 * Parses a post into its tree and its raw frontmatter. `citations` turns on
 * the `@key` and `[@key]` citation syntax; the `{cite}` roles always parse.
 */
function parseMyst(text: string, citations: boolean) {
  const file = new VFile()
  const mdast = mystParse(text, {
    markdownit: { linkify: true },
    extensions: { citations },
    directives: [snippetDirective, quoteDirective],
    vfile: file as any,
  })
  const { frontmatter } = getFrontmatter(new VFile() as any, mdast, {
    propagateTargets: true,
  })
  return { mdast, frontmatter, file }
}

async function parse(text: string, options: ParseOptions) {
  // An @ is text, as in CommonMark, unless the post lists a bibliography:
  // only then do `@key` and `[@key]` cite. The frontmatter that says so is
  // only known once the post is parsed, hence the second parse.
  let parsed = parseMyst(text, false)
  // `listed` is the site's own key: MyST's validation would drop it with a
  // warning, so it is taken out first.
  const { listed, ...rawPageFrontmatter } = parsed.frontmatter
  if (listed !== undefined && typeof listed !== 'boolean') {
    throw new Error(
      `"listed" is true or false in a post's frontmatter, not ${JSON.stringify(listed)}`,
    )
  }

  const messages: Messages = {}
  const frontmatter: PostFrontmatter = validatePageFrontmatter(
    {
      authors: options.defaultAuthors,
      ...rawPageFrontmatter,
    },
    { property: 'frontmatter', messages },
  )
  if (listed !== undefined) frontmatter.listed = listed

  const bibliography = frontmatter.bibliography ?? []
  if (bibliography.length > 0) {
    parsed = parseMyst(text, true)
  }
  const { mdast } = parsed
  reportMessages(parsed.file, messages)
  await resolveQuotes(mdast, messages, options.fetchPage)
  const citationRenderers = await loadBibliography(
    bibliography,
    options.loadFile,
  )

  const linkTransforms = [
    new WikiTransformer(),
    new GithubTransformer(),
    new DOITransformer(),
    new RRIDTransformer(),
  ]

  // For the mdast that we show, duplicate, strip positions and dump to yaml
  // Also run some of the transforms, like the links
  const mdastPre = JSON.parse(JSON.stringify(mdast))
  const file = new VFile()
  const state = new ReferenceState('', { frontmatter, vfile: file as any })
  ;(unified() as any)
    .use(basicTransformationsPlugin, {})
    .use(inlineMathSimplificationPlugin)
    .use(enumerateTargetsPlugin, { state })
    .use(linksPlugin, { transformers: linkTransforms })
    .use(resolveReferencesPlugin, { state })
    .runSync(mdastPre, file)

  reportMessages(file, messages)
  crossReferencesTransform(mdastPre)
  const snippets = snippetsTransform(mdastPre, options.address)
  quotesTransform(mdastPre)

  const references = citationsTransform(mdastPre, citationRenderers, messages)

  visit(mdastPre, (n) => delete (n as { position?: unknown }).position)
  // The renderer of `mystToHtml`, without the transforms it runs first: they
  // number, title and resolve a second time what MyST's own have just done
  // above, which showed the title of a callout twice.
  const toHtml = (unified() as any)
    .use(mystToHast, { allowDangerousHtml: true, handlers: { captionNumber } })
    .use(formatHtml)
    .use(rehypeStringify, { allowDangerousHtml: true })
  const htmlString = (
    toHtml.stringify(toHtml.runSync(mdastPre)) as string
  ).trim()

  const highlighter = await getHighlighter(options.highlighter.themes)
  const tableOfContents: TableOfContentsEntry[] = []

  const r = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeShikiFromHighlighter, highlighter, {
      ...options.highlighter,
      transformers: [transformerNotationDiff()],
    })
    .use(rehypeReferences, references)
    .use(rehypeExternalLinks, { rel: ['noopener'] })
    .use(rehypeKatex)
    // After the references, which add a section, and after KaTeX, which
    // says what of a formula is read
    .use(rehypeTableOfContents, tableOfContents)
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      content() {
        return [h('span.anchorsign', { ariaHidden: 'true' })]
      },
    })
    .use(rehypeStringify)
    .process(htmlString)

  const html = r.value as string

  return { frontmatter, html, messages, snippets, tableOfContents }
}

export default async function processor(
  content: string,
  options: ParseOptions = defaultOptions,
) {
  return await parse(content, options)
}
