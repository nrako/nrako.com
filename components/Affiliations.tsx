import RorIcon from './icons/Ror.tsx'
import type { PageFrontmatter } from 'myst-frontmatter'

type Affiliations = Required<PageFrontmatter>['affiliations']
type Affiliation = Affiliations[0]

export function Affiliation({
  affiliations,
  affiliationId,
}: {
  affiliationId: string
  affiliations?: Affiliations
}) {
  if (!affiliations || affiliations.length === 0) return null
  const affiliationsLookup = Object.fromEntries(
    affiliations?.map(({ id, ...rest }: Affiliation) => [id, rest]) ?? [],
  )
  const affiliation = affiliationsLookup[affiliationId] ??
    { name: affiliationId }
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
          <RorIcon width='1rem' height='1rem' class='inline-block' />
        </a>
      )}
    </>
  )
}
