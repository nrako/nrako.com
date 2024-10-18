import { transformerNotationDiff } from 'npm:shikiji-transformers@0.9'
import { VFile } from 'npm:vfile@5'
import { mystParse } from 'npm:myst-parser@1.0.22'
import {
  basicTransformationsPlugin,
  DOITransformer,
  getFrontmatter,
  GithubTransformer,
  inlineMathSimplificationPlugin,
  linksPlugin,
  RRIDTransformer,
  WikiTransformer,
} from 'npm:myst-transforms@1.2.1'
import { unified } from 'npm:unified@10'
import { visit } from 'npm:unist-util-visit@5'
import { mystToHtml } from 'npm:myst-to-html@1.0.22'
import rehypeShiki from 'npm:@shikijs/rehype@1.0.0-beta.3'
import rehypeStringify from 'npm:rehype-stringify@8'
import rehypeParse from 'npm:rehype-parse@8'
import rehypeExternalLinks from 'npm:rehype-external-links@3'
import rehypeKatex from 'npm:rehype-katex@7.0.0'
import rehypeAutolinkHeadings from 'npm:rehype-autolink-headings@7'
import { h } from 'npm:hastscript@9'
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
    vfile: file,
  })

  const messages: Messages = {}
  const vfile = new VFile()
  const { frontmatter: rawPageFrontmatter } = getFrontmatter(vfile, mdast, {
    propagateTargets: true,
  })
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
  unified()
    .use(basicTransformationsPlugin, {})
    .use(inlineMathSimplificationPlugin)
    .use(linksPlugin, { transformers: linkTransforms })
    .runSync(mdastPre)

  visit(mdastPre, (n) => delete n.position)
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
    // @ts-ignore required until unified can be upgrade to v11 when mystmd plays fair
    .use(rehypeShiki, {
      ...options.highlighter,
      transformers: [
        transformerNotationDiff(),
      ],
    })
    // @ts-ignore required until unified can be upgrade to v11 when mystmd plays fair
    .use(rehypeExternalLinks, { rel: ['noopener'] })
    // @ts-ignore required until unified can be upgrade to v11 when mystmd plays fair
    .use(rehypeKatex)
    .use(rehypeAutolinkHeadings, {
      content() {
        return [
          h('span.anchorsign', { ariaHidden: 'true' }),
        ]
      },
    })
    // @ts-ignore required until unified can be upgrade to v11 when mystmd plays fair
    .use(rehypeStringify)
    .process(htmlString)

  const html = r.value

  return { frontmatter, html, messages }
}

export default async function processor(
  content: string,
  options: ParseOptions = defaultOptions,
) {
  return await parse(content, options)
}
