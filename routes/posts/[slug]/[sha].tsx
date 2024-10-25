import { define } from '../../../utils.ts'
import type { FreshContext, PageProps } from 'fresh'
import { getPostAtVersion } from '../../../utils/githubVersionning.ts'
import {
  defaultOptions as options,
  getPost,
  type Post,
} from '../../../utils/blogData.ts'
import Time from '../../../components/Time.tsx'
import ReadTime from '../../../components/ReadTime.tsx'
import DialogMessages from '../../../components/DialogMessages.tsx'
import { Authors } from '../../../components/Authors.tsx'
import { PostVersions } from '../../../components/PostVersions.tsx'

interface Data {
  post: Post
  version: string
  displayMessages: boolean
}

export const handler = define.handlers<Data>({
  async GET(ctx: FreshContext) {
    const { slug, sha } = ctx.params

    const mainPost = await getPost(slug, options)

    const latestCommit = mainPost?.versions?.[0]

    // Redirect to the URL without the SHA if the provided SHA matches the latest.
    if (sha === latestCommit?.shortSha) {
      const url = new URL(ctx.req.url)
      url.pathname = `/posts/${slug}`
      return ctx.redirect(url.toString(), 307)
    }

    // Fetch the versioned content from GitHub or cache
    const post = await getPostAtVersion(slug, sha, options)

    if (!post) return ctx.render(<div>Post not found</div>, { status: 404 })

    return {
      data: {
        post,
        version: sha,
        displayMessages: options.dev || ctx.config.mode === 'development',
      },
    }
  },
})

export default define.page(
  function PostShaPage(props: PageProps<Data>) {
    const { post, displayMessages, version } = props.data

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
              <p class='freshBlog-post-subtitle'>
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
              {post.versions && post.versions.length > 1 && (
                <PostVersions slug={post.slug} versions={post.versions} />
              )}
              <ReadTime value={post.readingTimeMinutes} />
            </div>
            <dialog
              role='alertdialog'
              open
              class='freshBlog-dialogMessages not-prose'
            >
              You are looking at version{' '}
              <a
                href={`https://github.com/${options.versionning.repoOwner}/${options.versionning.repoName}/commit/${version}`}
              >
                {version}
              </a>. Click <a href={`/posts/${post.slug}`}>here</a>{' '}
              to go back to the latest version.
            </dialog>
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
