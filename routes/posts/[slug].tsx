import type { FreshContext, PageProps } from 'fresh'
import { define } from '../../utils.ts'
import {
  defaultOptions as options,
  getPost,
  type Post,
} from '../../utils/blogData.ts'
import Time from '../../components/Time.tsx'
import ReadTime from '../../components/ReadTime.tsx'
import DialogMessages from '../../components/DialogMessages.tsx'
import { Authors } from '../../components/Authors.tsx'

interface Data {
  post: Post
  displayMessages: boolean
}

export const handler = define.handlers<Data>({
  async GET(ctx: FreshContext) {
    const post = await getPost(ctx.params.slug, options)

    if (!post) return ctx.render(<div>Post not found</div>, { status: 404 })
    return {
      data: {
        post,
        displayMessages: options.dev || ctx.config.mode === 'development',
      },
      // TODO fix head once supported. Current alpha version of Fresh v2 hasn't
      // the new approach to support the deprecated "<Head>" element fleshed
      // out. Those eleemnts do not work, and ideally the freshblog.css and
      // freshblog.js file should be defined here too.
      head: [
        { title: `${post.frontmatter.title} - ${options.title}` },
        {
          tag: 'script',
          attrs: {
            async: true,
            src: 'https://platform.twitter.com/widgets.js',
            charset: 'utf-8',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            type: 'text/css',
            href:
              'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css',
          },
        },
      ],
    }
  },
})

export default define.page(
  function PostPage(props: PageProps<Data>) {
    const { post, displayMessages } = props.data

    post.messages.errors?.forEach((error) => console.error(post.slug, error))
    post.messages.warnings?.forEach((warning) =>
      console.warn(post.slug, warning)
    )

    return (
      <>
        {displayMessages &&
          (
            <DialogMessages
              messages={post.messages}
            />
          )}
        <article class='freshBlog-post prose prose-md md:prose-lg mx-auto dark:prose-invert'>
          <header>
            <h1>{post.frontmatter.title}</h1>
            {post.frontmatter.subtitle && (
              <p>
                {post.frontmatter.subtitle}
              </p>
            )}
            <div class='freshBlog-post-meta' aria-label='Post Metadata'>
              {options.showAuthors !== 'never' && post.frontmatter.authors && (
                <Authors
                  authors={post.frontmatter.authors}
                  affiliations={post.frontmatter.affiliations}
                  showLinks={true}
                />
              )}
              {post.frontmatter.date &&
                (
                  <Time
                    date={post.frontmatter.date}
                    language={options.language}
                  />
                )}
              <ReadTime content={post.content} />
            </div>
          </header>
          <div
            class='freshBlog-post-content'
            data-light-theme='light'
            data-dark-theme='dark'
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </>
    )
  },
)
