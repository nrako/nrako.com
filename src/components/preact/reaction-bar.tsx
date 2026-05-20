import ReactionCount from './reaction-count.tsx'

interface Props {
  likes: number
  reposts: number
  replies: number
  postUri: string
}

export default function ReactionBar({
  likes,
  reposts,
  replies,
  postUri,
}: Props) {
  return (
    <a
      href={postUri}
      target='_blank'
      rel='noopener noreferrer'
      className='flex gap-4 opacity-90 hover:opacity-100 transition-opacity'
      title='Interact with this post on Bluesky'
    >
      <ReactionCount count={likes} label='like' />
      <ReactionCount count={reposts} label='repost' />
      <ReactionCount count={replies} label='reply' />
    </a>
  )
}
