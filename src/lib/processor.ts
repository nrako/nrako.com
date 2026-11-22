import { transformerNotationDiff } from '@shikijs/transformers'
import { VFile } from 'vfile'
import { mystParse } from 'myst-parser'
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
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { formatHtml, mystToHast } from 'myst-to-html'
import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import {
  bundledLanguages,
  createHighlighter,
  createJavaScriptRegexEngine,
  type Highlighter,
} from 'shiki'
import rehypeStringify from 'rehype-stringify'
import rehypeParse from 'rehype-parse'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { h } from 'hastscript'
import { defaultOptions, type BlogOptions } from './blogData.ts'
import { validatePageFrontmatter } from 'myst-frontmatter'
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

export type ParseOptions = Pick<
  BlogOptions,
  'highlighter' | 'defaultAuthors'
> & {
  /** Reads the files a post refers to: the bibliographies it lists */
  loadFile?: LoadFile
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
  const mdast = mystParse(text, {
    markdownit: { linkify: true },
    extensions: { citations },
    vfile: new VFile() as any,
  })
  const { frontmatter } = getFrontmatter(new VFile() as any, mdast, {
    propagateTargets: true,
  })
  return { mdast, frontmatter }
}

async function parse(text: string, options: ParseOptions) {
  // An @ is text, as in CommonMark, unless the post lists a bibliography:
  // only then do `@key` and `[@key]` cite. The frontmatter that says so is
  // only known once the post is parsed, hence the second parse.
  const firstParse = parseMyst(text, false)
  const rawPageFrontmatter = firstParse.frontmatter
  let mdast = firstParse.mdast

  const messages: Messages = {}
  const frontmatter = validatePageFrontmatter(
    {
      authors: options.defaultAuthors,
      ...rawPageFrontmatter,
    },
    { property: 'frontmatter', messages },
  )

  const bibliography = frontmatter.bibliography ?? []
  if (bibliography.length > 0) {
    mdast = parseMyst(text, true).mdast
  }
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

  const r = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeShikiFromHighlighter, highlighter, {
      ...options.highlighter,
      transformers: [transformerNotationDiff()],
    })
    .use(rehypeReferences, references)
    .use(rehypeExternalLinks, { rel: ['noopener'] })
    .use(rehypeKatex)
    .use(rehypeAutolinkHeadings, {
      content() {
        return [h('span.anchorsign', { ariaHidden: 'true' })]
      },
    })
    .use(rehypeStringify)
    .process(htmlString)

  const html = r.value as string

  return { frontmatter, html, messages }
}

export default async function processor(
  content: string,
  options: ParseOptions = defaultOptions,
) {
  return await parse(content, options)
}
