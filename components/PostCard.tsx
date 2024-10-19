import Time from './Time.tsx'
import type { PageFrontmatter } from 'myst-frontmatter'
import { Authors } from '../components/Authors.tsx'

export default function PostCard(
  { url, frontmatter, language, showAuthors }: {
    url: string
    frontmatter: PageFrontmatter
    language: string
    showAuthors?: boolean
  },
) {
  return (
    <a className='freshBlog-postCard' href={url}>
      <article>
        <header>
          <h2>
            {frontmatter.title}
          </h2>
          {showAuthors && frontmatter.authors && (
            <Authors
              authors={frontmatter.authors}
              affiliations={frontmatter.affiliations}
            />
          )}
          {frontmatter.date &&
            <Time date={frontmatter.date} language={language} />}
        </header>
        <section>
          {frontmatter.description}
        </section>
      </article>
    </a>
  )
}
