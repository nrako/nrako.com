import type { PageFrontmatter } from 'myst-frontmatter'
import OrcidIcon from '../icons/orcid.tsx'
import RorIcon from '../icons/ror.tsx'
import TbMail from '@/components/icons/TbMail'
import TbBrandX from '@/components/icons/TbBrandX'

type Author = Required<PageFrontmatter>['authors'][0]
type Affiliations = PageFrontmatter['affiliations']

function Affiliation({
  affiliations,
  affiliationId,
}: {
  affiliationId: string
  affiliations?: Affiliations
}) {
  if (!affiliations || affiliations.length === 0) return null
  const affiliationsLookup = Object.fromEntries(
    affiliations?.map(({ id, ...rest }) => [id, rest]) ?? [],
  )
  const affiliation = affiliationsLookup[affiliationId] ?? {
    name: affiliationId,
  }
  return (
    <>
      {affiliation.name || affiliation.institution} {affiliation.ror && (
        <a
          href={`https://ror.org/${
            affiliation.ror.replace(/(https?:\/\/)?ror\.org\//, '')
          }`}
          target='_blank'
          rel='noopener'
          title='Research Organization Registry'
        >
          <RorIcon width='1rem' height='1rem' className='inline-block' />
        </a>
      )}
    </>
  )
}

export default function Author({
  author,
  affiliations,
  showLinks = false,
}: {
  author: Author
  affiliations?: Affiliations
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
            popoverTarget={`author-popover-${author.id}`}
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
                <TbMail className='text-base' />
              </a>
            )}
            {author.orcid && (
              <a
                href={`https://orcid.org/${author.orcid}`}
                target='_blank'
                rel='noopener'
                title='ORCID (Open Researcher and Contributor ID)'
              >
                <OrcidIcon size={16} />
              </a>
            )}
          </address>
          <div popover='auto' id={`author-popover-${author.id}`}>
            <h3>{author.name}</h3>
            <dl>
              {author.email && author.corresponding && (
                <div>
                  <dt>
                    <TbMail className='text-base' />
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
                    <OrcidIcon size={16} />
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
                    <TbBrandX className='text-base' />
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
            {author.affiliations && author.affiliations.length > 0 && (
              <>
                <h4>Affiliations</h4>
                {author.affiliations.map((affiliationId) => (
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
