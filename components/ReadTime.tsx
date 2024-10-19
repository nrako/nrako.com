export default function ReadTime({ value }: { value: number }) {
  return (
    <span>
      {value < 1 ? 'Less than a minute read' : `${value} min read`}
    </span>
  )
}
