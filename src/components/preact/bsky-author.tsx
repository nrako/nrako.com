import { formatDateTime, getTimeAgo } from '@/lib/intl'

interface Props {
  author: { handle: string; displayName?: string }
  indexedAt: string
  postUri?: string
}

export default function BskyAuthor({ author, indexedAt, postUri }: Props) {
  // One line whatever the room: the name and the handle give way, cut with
  // an ellipsis, and the date stays. A reply to a reply has less room each
  // time, and a line that kept its width made the page wider than a phone.
  return (
    <div className="flex min-w-0 items-center space-x-2">
      <a
        href={`https://bsky.app/profile/${author.handle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 truncate hover:underline"
      >
        <span className="font-medium">{author.displayName}</span>{' '}
        <span className="text-gray-500 dark:text-gray-400">
          @{author.handle}
        </span>
      </a>
      <span className="flex-none text-gray-500 dark:text-gray-400">·</span>
      {postUri && (
        <a
          href={postUri}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-none text-sm text-gray-500 hover:underline dark:text-gray-400"
          title={formatDateTime(new Date(indexedAt))}
        >
          {getTimeAgo(new Date(indexedAt))}
        </a>
      )}
    </div>
  )
}
