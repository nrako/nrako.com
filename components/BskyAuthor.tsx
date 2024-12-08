import { formatDateTime, getTimeAgo } from '../utils/intl.ts'

export function BskyAuthor({ author, indexedAt, postUri }: {
  author: { handle: string; displayName?: string }
  indexedAt: string
  postUri?: string
}) {
  return (
    <div class='flex items-center space-x-2'>
      <a
        href={`https://bsky.app/profile/${author.handle}`}
        target='_blank'
        rel='noopener noreferrer'
        class='hover:underline'
      >
        <span class='font-medium'>{author.displayName}</span>{' '}
        <span class='text-gray-500 dark:text-gray-400'>
          @{author.handle}
        </span>
      </a>
      <span class='text-gray-500 dark:text-gray-400'>·</span>
      {postUri && (
        <a
          href={postUri}
          target='_blank'
          rel='noopener noreferrer'
          class='text-gray-500 dark:text-gray-400 hover:underline text-sm'
          title={formatDateTime(new Date(indexedAt))}
        >
          {getTimeAgo(new Date(indexedAt))}
        </a>
      )}
    </div>
  )
}
