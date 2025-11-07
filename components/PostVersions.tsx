import { type CommitInfo } from '../utils/githubVersionning.ts'
import { defaultOptions as options } from '../utils/blogData.ts'
import Time from './Time.tsx'
export function PostVersions({
  slug,
  versions,
}: {
  slug: string
  versions: CommitInfo[]
}) {
  if (!versions || versions.length === 0) return null

  // Get the latest version date for display.
  const latestVersion = versions[0]
  const lastEditedDate = latestVersion?.date
    ? new Date(latestVersion.date).toLocaleString()
    : 'Unknown'

  return (
    <section class='not-prose'>
      <button
        type='button'
        id='versions-button'
        /* @ts-ignore-next-line */
        popovertarget='versions-popover'
        title={`Edited on ${lastEditedDate}`}
      >
        {versions.length} edits
      </button>

      <div
        /* @ts-ignore-next-line */
        popover
        id='versions-popover'
        /* @ts-ignore-next-line */
        anchor='versions-button'
      >
        <h3>Version History</h3>
        <ul>
          {versions.map((version) => (
            <li key={version.sha} class='version-item'>
              <div class='flex gap-2'>
                {version.sha === 'draft' ? <strong>Draft</strong> : (
                  <a
                    href={`/posts/${slug}/${version.shortSha}`}
                    title={`View version ${version.shortSha}`}
                  >
                    <strong>
                      {version.shortSha}
                    </strong>
                  </a>
                )}
                <Time
                  date={version.date}
                  language={options.language}
                />
                {version.author && (
                  <>
                    <span>by {version.author}</span>
                    {version.verified && <span>(Verified)</span>}
                  </>
                )}
              </div>
              <p>{version.message.split('\n')[0]}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
