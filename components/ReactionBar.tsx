import { ReactionCount } from './ReactionCount.tsx'

export function ReactionBar(
  { likes, reposts, replies, postUri }: {
    likes: number
    reposts: number
    replies: number
    postUri: string
  },
) {
  return (
    <a
      href={postUri}
      target='_blank'
      rel='noopener noreferrer'
      class='flex gap-4 opacity-90 hover:opacity-100 transition-opacity'
      title='Interact with this post on Bluesky'
    >
      <ReactionCount count={likes} label='like' />
      <ReactionCount count={reposts} label='repost' />
      <ReactionCount count={replies} label='reply' />
    </a>
  )
}
