import type { APIRoute } from 'astro'
import { Feed, type Item as FeedItem } from 'feed'
import { defaultOptions as options, getPosts } from '@/lib/blogData'

const feedPathPrefix = '/feed'

export function getStaticPaths() {
  return [
    { params: { type: 'atom' } },
    { params: { type: 'rss' } },
    { params: { type: 'json' } },
  ]
}

export const GET: APIRoute = async ({ params, request }) => {
  const url = new URL(request.url)
  const origin = url.origin
  const copyright = options.copyright
    .replace('{{year}}', `${new Date().getFullYear()}`)
    .replace('{{url}}', origin)

  const posts = await getPosts(options)

  let updated: Date | undefined = undefined
  if (posts[0]?.frontmatter.date) {
    updated = new Date(posts[0].frontmatter.date)
    if (!(updated instanceof Date) || !isFinite(+updated)) {
      updated = undefined
    }
  }

  const feed = new Feed({
    title: options.title,
    description: options.description,
    id: `${origin}/posts`,
    link: `${origin}/posts`,
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

  posts.forEach((post) => {
    const item: FeedItem = {
      id: `${origin}/${post.slug}`,
      title: post.frontmatter.title ?? post.slug,
      description: post.frontmatter.description,
      date: new Date(post.frontmatter.date ?? ''),
      link: `${origin}/posts/${post.slug}`,
      copyright,
      published: new Date(post.frontmatter.date ?? ''),
      content: post.content,
    }
    feed.addItem(item)
  })

  const { type } = params

  if (type === 'atom') {
    const atomFeed = feed.atom1()
    return new Response(atomFeed, {
      headers: {
        'content-type': 'application/atom+xml; charset=utf-8',
      },
    })
  } else if (type === 'rss') {
    const rssFeed = feed.rss2()
    return new Response(rssFeed, {
      headers: {
        'content-type': 'application/rss+xml; charset=utf-8',
      },
    })
  } else if (type === 'json') {
    const jsonFeed = feed.json1()
    return new Response(jsonFeed, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    })
  }

  return new Response('Not found', { status: 404 })
}
