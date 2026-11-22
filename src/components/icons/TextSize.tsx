interface Props {
  className?: string
}

// A capital T and a small t, drawn on 20 of the 24 units like the header's
// other icons
export default function TextSize({ className }: Props) {
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
      <path d="M3 3h10" />
      <path d="M8 3v18" />
      <path d="M15 11h6" />
      <path d="M18 11v10" />
    </svg>
  )
}
