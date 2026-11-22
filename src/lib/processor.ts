import { transformerNotationDiff } from '@shikijs/transformers'
import { VFile } from 'vfile'
import { mystParse } from 'myst-parser'
import {
  basicTransformationsPlugin,
  DOITransformer,
  getFrontmatter,
  GithubTransformer,
  inlineMathSimplificationPlugin,
  linksPlugin,
  RRIDTransformer,
  WikiTransformer,
} from 'myst-transforms'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { mystToHtml } from 'myst-to-html'
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

export type ParseOptions = Pick<BlogOptions, 'highlighter' | 'defaultAuthors'>

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

async function parse(text: string, options: ParseOptions) {
  const file = new VFile()
  const mdast = mystParse(text, {
    markdownit: { linkify: true },
    vfile: file as any,
  })

  const messages: Messages = {}
  const vfile = new VFile()
  const { frontmatter: rawPageFrontmatter } = getFrontmatter(
    vfile as any,
    mdast,
    {
      propagateTargets: true,
    },
  )
  const frontmatter = validatePageFrontmatter(
    {
      authors: options.defaultAuthors,
      ...rawPageFrontmatter,
    },
    { property: 'frontmatter', messages },
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
  ;(unified() as any)
    .use(basicTransformationsPlugin, {})
    .use(inlineMathSimplificationPlugin)
    .use(linksPlugin, { transformers: linkTransforms })
    .runSync(mdastPre)

  visit(mdastPre, (n) => delete (n as { position?: unknown }).position)
  const htmlString = mystToHtml(mdastPre, {
    hast: {
      allowDangerousHtml: true,
    },
    stringifyHtml: {
      allowDangerousHtml: true,
    },
  })

  const highlighter = await getHighlighter(options.highlighter.themes)

  const r = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeShikiFromHighlighter, highlighter, {
      ...options.highlighter,
      transformers: [transformerNotationDiff()],
    })
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
