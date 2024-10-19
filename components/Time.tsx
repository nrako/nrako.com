export default function Time(
  props: { class?: string; date: Date | string; language?: string },
) {
  const { date, language } = props
  return (
    <time class={props.class}>
      {new Date(date).toLocaleDateString(language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </time>
  )
}
