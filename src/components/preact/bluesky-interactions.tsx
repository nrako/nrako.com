import { useEffect, useState } from 'preact/hooks'
import type { AppBskyFeedDefs } from '@atproto/api'
import { getPostInteractions } from '@/lib/bluesky'
import Reply from './reply'
import { formatCount } from '@/lib/intl'

interface Props {
  postUri: string
}

function isThreadViewPost(
  data: unknown,
): data is AppBskyFeedDefs.ThreadViewPost {
  return typeof data === 'object' && data !== null && 'post' in data
}

export default function BlueSkyInteractions({ postUri }: Props) {
  const [data, setData] = useState<AppBskyFeedDefs.ThreadViewPost | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const response = await getPostInteractions(postUri)
      if (response?.success) {
        if (isThreadViewPost(response.data.thread)) {
          setData(response.data.thread)
        } else {
          setData(null)
        }
      } else {
        setData(null)
      }
      setLoading(false)
    }

    fetchData()
  }, [postUri])

  if (loading && !data) {
    return (
      <div className="mt-8 text-gray-500 dark:text-gray-400">
        Loading reactions...
      </div>
    )
  }

  if (!data) {
    return null
  }

  const post = data.post
  const replies =
    data.replies?.filter(
      (r): r is AppBskyFeedDefs.ThreadViewPost =>
        !('notFound' in r) && !('blocked' in r),
    ) ?? []

  return (
    <div className="mt-8 space-y-6 not-prose">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Reactions</h2>
        <div className="flex gap-4 text-gray-500 dark:text-gray-400">
          <a
            href={`https://bsky.app/profile/${post.author.handle}/post/${postUri.split('/').pop()}/reposted-by`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            <span className="text-xl font-medium text-gray-600 dark:text-gray-300">
              {formatCount(post.repostCount ?? 0)}
            </span>{' '}
            reposts
          </a>
          <a
            href={`https://bsky.app/profile/${post.author.handle}/post/${postUri.split('/').pop()}/quotes`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            <span className="text-xl font-medium text-gray-600 dark:text-gray-300">
              {formatCount(post.quoteCount ?? 0)}
            </span>{' '}
            quotes
          </a>
          <a
            href={`https://bsky.app/profile/${post.author.handle}/post/${postUri.split('/').pop()}/liked-by`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            <span className="text-xl font-medium text-gray-600 dark:text-gray-300">
              {formatCount(post.likeCount ?? 0)}
            </span>{' '}
            likes
          </a>
          <a
            href={`https://bsky.app/profile/${post.author.handle}/post/${postUri.split('/').pop()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            <span className="text-xl font-medium text-gray-600 dark:text-gray-300">
              {formatCount(post.replyCount ?? 0)}
            </span>{' '}
            replies
          </a>
        </div>
        <p>
          Reply on Bluesky{' '}
          <a
            href={`https://bsky.app/profile/${post.author.handle}/post/${postUri.split('/').pop()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            here
          </a>{' '}
          to join the conversation.
        </p>
      </div>
      {replies.length > 0 && (
        <div className="space-y-4">
          {replies
            .sort(
              (a, b) =>
                new Date(a.post.indexedAt).getTime() -
                new Date(b.post.indexedAt).getTime(),
            )
            .map((reply) => (
              <Reply key={reply.post.uri} thread={reply} />
            ))}
        </div>
      )}
    </div>
  )
}
