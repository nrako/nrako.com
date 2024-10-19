import { define } from '../../utils.ts'
import {
  defaultOptions as options,
  getPosts,
  type Post,
} from '../../utils/blogData.ts'
import PostCard from '../../components/PostCard.tsx'
import { page, type PageProps } from 'fresh'

interface Data {
  posts: Post[]
}

export const handler = define.handlers<Data>({
  async GET() {
    const posts = await getPosts(options)
    return page({ posts })
  },
})

export default define.page(
  function BlogIndex(props: PageProps<Data>) {
    const { posts } = props.data
    return (
      <div class='fresh-blog prose dark:prose-invert mx-auto'>
        {!posts.length && "There's no posts yet."}
        {posts.map((post) => (
          <PostCard
            url={`posts/${post.slug}`}
            frontmatter={post.frontmatter}
            language='en'
            showAuthors={false}
          />
        ))}

        <p class='text-center py-4'>More to come soon... 🤞🏽</p>
      </div>
    )
  },
)
