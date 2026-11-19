import { formatDateTime, getTimeAgo } from '@/lib/intl'

interface Props {
  author: { handle: string; displayName?: string }
  indexedAt: string
  postUri?: string
}

export default function BskyAuthor({ author, indexedAt, postUri }: Props) {
  return (
    <div className="flex items-center space-x-2">
      <a
        href={`https://bsky.app/profile/${author.handle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        <span className="font-medium">{author.displayName}</span>{' '}
        <span className="text-gray-500 dark:text-gray-400">
          @{author.handle}
        </span>
      </a>
      <span className="text-gray-500 dark:text-gray-400">·</span>
      {postUri && (
        <a
          href={postUri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 dark:text-gray-400 hover:underline text-sm"
          title={formatDateTime(new Date(indexedAt))}
        >
          {getTimeAgo(new Date(indexedAt))}
        </a>
      )}
    </div>
  )
}
