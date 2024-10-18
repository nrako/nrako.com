import { page, type PageProps } from 'fresh'
import { define } from '../utils.ts'
import HeroText from '../islands/HeroText.tsx'
import {
  defaultOptions as options,
  getPosts,
  type Post,
} from '../utils/blogData.ts'
import Time from '../components/Time.tsx'

interface Data {
  posts: Post[]
}

export const handler = define.handlers<Data>({
  async GET() {
    const posts = await getPosts(options)
    return page({ posts })
  },
})

export default define.page(function Home(props: PageProps<Data>) {
  const { posts } = props.data
  return (
    <div>
      <div class='flex flex-col items-center justify-center pt-8 pb-32 gap-4'>
        <h1 class='text-4xl md:text-6xl font-bold'>
          Hello, I'm Nicholas.
        </h1>
        <HeroText />
      </div>

      <section class='mt-8 container max-w-xl mx-auto'>
        <h1 class='text-2xl mt-4 mb-2'>Recent Posts</h1>
        <div class='grid divide-y'>
          {posts.map((post) => (
            <a className='group' href={`/posts/${post.slug}`}>
              <article>
                <header class='flex gap-x-4 justify-between flex-wrap py-4'>
                  <h2 class='font-semibold group-hover:text-red-600'>
                    {post.frontmatter.title}
                  </h2>
                  {post.frontmatter.date &&
                    (
                      <Time
                        class='flex-auto text-right'
                        date={post.frontmatter.date}
                        language={(post.frontmatter.parts?.language as
                          | string
                          | undefined) ||
                          'en'}
                      />
                    )}
                </header>
              </article>
            </a>
          ))}
        </div>
        <p class='text-center py-4'>More to come soon... 🤞🏽</p>
      </section>
    </div>
  )
})
