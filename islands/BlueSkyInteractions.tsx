import { useEffect, useState } from 'preact/hooks'
import type { AppBskyFeedDefs } from '@atproto/api'
import { getPostInteractions } from '../utils/bluesky.ts'
import { Reply } from '../components/Reply.tsx'
import { formatCount } from '../utils/intl.ts'

interface Props {
  postUri: string
}

// deno-lint-ignore no-explicit-any
function isThreadViewPost(data: any): data is AppBskyFeedDefs.ThreadViewPost {
  return 'post' in data
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
      <div class='mt-8 text-gray-500 dark:text-gray-400'>
        Loading reactions...
      </div>
    )
  }

  if (!data) {
    return null
  }

  const post = data.post
  const replies =
    data.replies?.filter((r): r is AppBskyFeedDefs.ThreadViewPost =>
      !('notFound' in r) && !('blocked' in r)
    ) ?? []

  return (
    <div class='mt-8 space-y-6 not-prose'>
      <div class='space-y-4'>
        <h2 class='text-2xl font-semibold'>Reactions</h2>
        <div class='flex gap-4 text-gray-500 dark:text-gray-400'>
          <a
            href={`https://bsky.app/profile/${post.author.handle}/post/${
              postUri.split('/').pop()
            }/reposted-by`}
            target='_blank'
            rel='noopener noreferrer'
            class='hover:underline'
          >
            <span class='text-xl font-medium text-gray-600 dark:text-gray-300'>
              {formatCount(post.repostCount ?? 0)}
            </span>{' '}
            reposts
          </a>
          <a
            href={`https://bsky.app/profile/${post.author.handle}/post/${
              postUri.split('/').pop()
            }/quotes`}
            target='_blank'
            rel='noopener noreferrer'
            class='hover:underline'
          >
            <span class='text-xl font-medium text-gray-600 dark:text-gray-300'>
              {formatCount(post.quoteCount ?? 0)}
            </span>{' '}
            quotes
          </a>
          <a
            href={`https://bsky.app/profile/${post.author.handle}/post/${
              postUri.split('/').pop()
            }/liked-by`}
            target='_blank'
            rel='noopener noreferrer'
            class='hover:underline'
          >
            <span class='text-xl font-medium text-gray-600 dark:text-gray-300'>
              {formatCount(post.likeCount ?? 0)}
            </span>{' '}
            likes
          </a>
          <a
            href={`https://bsky.app/profile/${post.author.handle}/post/${
              postUri.split('/').pop()
            }`}
            target='_blank'
            rel='noopener noreferrer'
            class='hover:underline'
          >
            <span class='text-xl font-medium text-gray-600 dark:text-gray-300'>
              {formatCount(post.replyCount ?? 0)}
            </span>{' '}
            replies
          </a>
        </div>
        <p>
          Reply on Bluesky{' '}
          <a
            href={`https://bsky.app/profile/${post.author.handle}/post/${
              postUri.split('/').pop()
            }`}
            target='_blank'
            rel='noopener noreferrer'
            class='text-blue-600 hover:underline'
          >
            here
          </a>{' '}
          to join the conversation.
        </p>
      </div>
      {replies.length > 0 && (
        <div class='space-y-4'>
          {replies
            .sort((a, b) =>
              new Date(a.post.indexedAt).getTime() -
              new Date(b.post.indexedAt).getTime()
            )
            .map((reply) => <Reply key={reply.post.uri} thread={reply} />)}
        </div>
      )}
    </div>
  )
}
