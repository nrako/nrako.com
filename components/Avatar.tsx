import { TbBrandBluesky } from '@preact-icons/tb'

export function Avatar(
  { src, name }: { src?: string; name?: string },
) {
  return src
    ? (
      <img
        src={src}
        alt={`${name}'s avatar`}
        class='w-8 h-8 rounded-full'
      />
    )
    : (
      <div class='rounded-full w-8 h-8 bg-blue-100 flex items-center justify-center text-blue-600'>
        {name?.charAt(0).toUpperCase() || <TbBrandBluesky />}
      </div>
    )
}
