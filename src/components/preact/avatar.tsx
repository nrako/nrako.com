import TbBrandBluesky from '@/components/icons/TbBrandBluesky'

interface Props {
  src?: string
  name?: string
}

export default function Avatar({ src, name }: Props) {
  return src ? (
    <img
      src={src}
      alt={`${name}'s avatar`}
      className="h-8 w-8 flex-none rounded-full"
    />
  ) : (
    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-blue-100 text-blue-600">
      {name?.charAt(0).toUpperCase() || <TbBrandBluesky />}
    </div>
  )
}
