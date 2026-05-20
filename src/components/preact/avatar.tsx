import TbBrandBluesky from '@/components/icons/TbBrandBluesky'

interface Props {
  src?: string
  name?: string
}

export default function Avatar({ src, name }: Props) {
  return src
    ? (
      <img
        src={src}
        alt={`${name}'s avatar`}
        className='w-8 h-8 rounded-full'
      />
    )
    : (
      <div className='rounded-full w-8 h-8 bg-blue-100 flex items-center justify-center text-blue-600'>
        {name?.charAt(0).toUpperCase() || <TbBrandBluesky />}
      </div>
    )
}
