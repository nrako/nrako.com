import TbHeart from '@preact-icons/tb/TbHeart'
import TbMessageCircle from '@preact-icons/tb/TbMessageCircle'
import TbRepeat from '@preact-icons/tb/TbRepeat'
import { formatCount } from '../utils/intl.ts'

export function ReactionCount(
  { count, label }: { count: number; label: string },
) {
  const Icon = () => {
    switch (label) {
      case 'like':
        return <TbHeart />
      case 'repost':
        return <TbRepeat />
      case 'reply':
        return <TbMessageCircle />
      default:
        return null
    }
  }

  return (
    <div class='flex items-center gap-1 text-gray-500'>
      <Icon />
      <span>{formatCount(count)}</span>
    </div>
  )
}
