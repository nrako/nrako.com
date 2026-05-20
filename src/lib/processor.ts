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
import rehypeShiki from '@shikijs/rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeParse from 'rehype-parse'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { h } from 'hastscript'
import { defaultOptions, type InternalOptions } from './blogData.ts'
import { validatePageFrontmatter } from 'myst-frontmatter'

export type ParseOptions = Pick<
  InternalOptions,
  'highlighter' | 'defaultAuthors'
>

interface Message {
  property: string
  message: string
}

export interface Messages {
  errors?: Message[]
  warnings?: Message[]
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

  const r = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeShiki, {
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
