interface Props {
  className?: string
}

export default function TbArrowUpRight({ className }: Props) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='1em'
      height='1em'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      stroke-width='2'
      stroke-linecap='round'
      stroke-linejoin='round'
      className={className}
    >
      <path d='M17 7l-10 10' />
      <path d='M8 7l9 0l0 9' />
    </svg>
  )
}
