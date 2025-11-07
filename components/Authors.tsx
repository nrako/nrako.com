import type { PageFrontmatter } from 'myst-frontmatter'
import OrcidIcon from './icons/Orcid.tsx'
import {
  TbBrandTwitterFilled as TwitterIcon,
  TbMailFilled as EmailIcon,
} from '@preact-icons/tb'
import { Affiliation } from './Affiliations.tsx'

export function Author({ author, affiliations, showLinks = false }: {
  author: Required<PageFrontmatter>['authors'][0]
  affiliations: PageFrontmatter['affiliations']
  showLinks?: boolean
}) {
  return (
    <article aria-labelledby={`author-${author.id}`}>
      {!showLinks && <h3 id={`author-${author.id}`}>{author.name}</h3>}
      {showLinks && (
        <>
          <button
            type='button'
            id={`author-${author.id}`}
            /* @ts-ignore-next-line */
            popovertarget={`author-popover-${author.id}`}
          >
            {author.name}
          </button>
          <address>
            {author.email && author.corresponding && (
              <a
                href={`mailto:${author.email}`}
                title={`${author.name} <${author.email}>`}
                target='_blank'
                rel='noopener'
              >
                <EmailIcon />
              </a>
            )}
            {author.orcid && (
              <a
                href={`https://orcid.org/${author.orcid}`}
                target='_blank'
                rel='noopener'
                title='ORCID (Open Researcher and Contributor ID)'
              >
                <OrcidIcon />
              </a>
            )}
          </address>
          <div
            /* @ts-ignore-next-line */
            popover
            id={`author-popover-${author.id}`}
            /* @ts-ignore-next-line */
            anchor={`author-${author.id}`}
          >
            <h3>{author.name}</h3>
            <dl>
              {author.email && author.corresponding && (
                <div>
                  <dt>
                    <EmailIcon />
                    Email
                  </dt>
                  <dd>
                    <a
                      href={`mailto:${author.email}`}
                      title={`${author.name} <${author.email}>`}
                      target='_blank'
                      rel='noopener'
                    >
                      {author.email}
                    </a>
                  </dd>
                </div>
              )}
              {author.orcid && (
                <div>
                  <dt>
                    <OrcidIcon />
                    Orcid
                  </dt>
                  <dd>
                    <a
                      href={`https://orcid.org/${author.orcid}`}
                      target='_blank'
                      rel='noopener'
                      title='ORCID (Open Researcher and Contributor ID)'
                    >
                      {author.orcid}
                    </a>
                  </dd>
                </div>
              )}
              {author.twitter && (
                <div>
                  <dt>
                    <TwitterIcon />
                    Twitter
                  </dt>
                  <dd>
                    <a
                      href={`https://twitter.com/${author.twitter}`}
                      target='_blank'
                      rel='noopener'
                      title={`Twitter: @${author.twitter}`}
                    >
                      @{author.twitter}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {author.affiliations?.length && (
              <>
                <h4>Affiliations</h4>
                {author.affiliations?.map((affiliationId) => (
                  <Affiliation
                    key={affiliationId}
                    affiliations={affiliations}
                    affiliationId={affiliationId}
                  />
                ))}
              </>
            )}
          </div>
        </>
      )}
    </article>
  )
}

export function Authors({
  authors,
  affiliations,
  showLinks = false,
}: {
  authors: PageFrontmatter['authors']
  affiliations: PageFrontmatter['affiliations']
  showLinks?: boolean
}) {
  if (!authors || authors.length === 0) return null
  return (
    <section class='freshBlog-authors' aria-labelledby='freshBlog-authors'>
      <h2 id='freshBlog-authors'>Authors</h2>
      {authors.map((a) => (
        <Author
          key={a.name}
          author={a}
          affiliations={affiliations}
          showLinks={showLinks}
        />
      ))}
    </section>
  )
}
