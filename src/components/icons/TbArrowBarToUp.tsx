interface Props {
  className?: string
}

export default function TbArrowBarToUp({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className={className}
    >
      <path d="M12 10l0 10" />
      <path d="M12 10l4 4" />
      <path d="M12 10l-4 4" />
      <path d="M4 4l16 0" />
    </svg>
  )
}
