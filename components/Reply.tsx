import type { AppBskyFeedDefs } from '@atproto/api'
import { AppBskyFeedPost } from '@atproto/api'
import { Avatar } from './Avatar.tsx'
import { BskyAuthor } from './BskyAuthor.tsx'
import { PostEmbed } from './PostEmbed.tsx'
import { ReactionBar } from './ReactionBar.tsx'
import { TbArrowUpRight, TbBrandBluesky } from '@preact-icons/tb'

export function Reply(
  { thread }: {
    thread: AppBskyFeedDefs.ThreadViewPost
  },
) {
  const post = thread.post
  const replies =
    thread.replies?.filter((r): r is AppBskyFeedDefs.ThreadViewPost =>
      !('notFound' in r) && !('blocked' in r)
    ).sort((a, b) =>
      new Date(a.post.indexedAt).getTime() -
      new Date(b.post.indexedAt).getTime()
    ) ?? []

  const hasMoreReplies = (post.replyCount ?? 0) > (replies?.length ?? 0)
  const showThread = replies.length > 0 || hasMoreReplies

  return (
    <div class='relative'>
      <div class='flex space-x-3'>
        <div class='flex-shrink-0 relative w-8'>
          <a
            href={`https://bsky.app/profile/${post.author.handle}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            <Avatar
              src={post.author.avatar}
              name={post.author.displayName}
            />
          </a>
          {showThread && (
            <div class='absolute left-1/2 top-8 -bottom-4 w-0.5 bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-700' />
          )}
        </div>
        <div class='flex-grow min-w-0'>
          <BskyAuthor
            author={post.author}
            indexedAt={post.indexedAt}
            postUri={`https://bsky.app/profile/${post.author.handle}/post/${
              post.uri.split('/').pop()
            }`}
          />
          <p class='mt-1 text-gray-600 dark:text-gray-300'>
            {AppBskyFeedPost.isRecord(post.record) ? post.record.text : ''}
          </p>
          {post.embed && <PostEmbed embed={post.embed} postUri={post.uri} />}
          <div class='mt-2'>
            <ReactionBar
              likes={post.likeCount ?? 0}
              reposts={(post.repostCount ?? 0) + (post.quoteCount ?? 0)}
              replies={post.replyCount ?? 0}
              postUri={`https://bsky.app/profile/${post.author.handle}/post/${
                post.uri.split('/').pop()
              }`}
            />
          </div>
        </div>
      </div>

      {showThread && (
        <div class='mt-4 space-y-4 ml-4 pl-[15px]'>
          {replies.map((reply) => (
            <Reply key={reply.post.uri} thread={reply} />
          ))}
          {hasMoreReplies && (
            <a
              href={`https://bsky.app/profile/${post.author.handle}/post/${
                post.uri.split('/').pop()
              }`}
              target='_blank'
              rel='noopener noreferrer'
              class='flex items-center gap-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
            >
              <TbBrandBluesky class='inline-block' />Continue thread on
              BlueSky<TbArrowUpRight class='inline-block' />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
