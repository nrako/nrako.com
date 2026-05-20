import TbHeart from '@/components/icons/TbHeart'
import TbMessageCircle from '@/components/icons/TbMessageCircle'
import TbRepeat from '@/components/icons/TbRepeat'
import { formatCount } from '@/lib/intl'

interface Props {
  count: number
  label: string
}

export default function ReactionCount({ count, label }: Props) {
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
    <div className='flex items-center gap-1 text-gray-500'>
      <Icon />
      <span>{formatCount(count)}</span>
    </div>
  )
}
