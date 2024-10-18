import { define } from '../../utils.ts'
import { Feed, type Item as FeedItem } from 'npm:feed@4.2.2'
import { defaultOptions as options, getPosts } from '../../utils/blogData.ts'
import { type FreshContext, HttpError } from 'fresh'

const feedPathPrefix = '/feed'

export const handler = define.handlers({
  async GET(ctx: FreshContext) {
    const url = new URL(ctx.url)
    const origin = url.origin
    const copyright = options.copyright.replace(
      '{{year}}',
      `${new Date().getFullYear()}`,
    ).replace('{{url}}', origin)

    const posts = await getPosts(options)

    let updated: Date | undefined = undefined
    if (posts[0].frontmatter.date) {
      updated = new Date(posts[0].frontmatter.date)
      if (!(updated instanceof Date) || !isFinite(+updated)) {
        updated = undefined
      }
    }

    const feed = new Feed({
      title: options.title,
      description: options.description,
      id: `${origin}${options.path}`,
      link: `${origin}${options.path}`,
      language: 'en',
      favicon: `${origin}${options.favicon}`,
      copyright,
      generator: options.generator,
      feedLinks: {
        atom: `${origin}${feedPathPrefix}/atom`,
        rss: `${origin}${feedPathPrefix}/rss`,
        json: `${origin}${feedPathPrefix}/json`,
      },
      updated,
    })

    posts.map((post) => {
      const item: FeedItem = {
        id: `${origin}/${post.slug}`,
        title: post.frontmatter.title ?? post.slug,
        description: post.frontmatter.description,
        date: new Date(post.frontmatter.date ?? ''),
        link: `${origin}${options.path}/${post.slug}`,
        copyright,
        published: new Date(post.frontmatter.date ?? ''),
        content: post.content,
      }
      feed.addItem(item)
    })

    let response: Response
    if (ctx.url.pathname.endsWith('/atom')) {
      const atomFeed = feed.atom1()
      response = new Response(atomFeed, {
        headers: {
          'content-type': 'application/atom+xml; charset=utf-8',
        },
      })
    } else if (ctx.url.pathname.endsWith('/rss')) {
      const rssFeed = feed.rss2()
      response = new Response(rssFeed, {
        headers: {
          'content-type': 'application/rss+xml; charset=utf-8',
        },
      })
    } else if (ctx.url.pathname.endsWith('/json')) {
      const jsonFeed = feed.json1()
      response = new Response(jsonFeed, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      })
    } else {
      throw new HttpError(404)
    }

    return response
  },
})
