export default function Links(
  { title, feedPathPrefix }: { title: string; feedPathPrefix: string },
) {
  return (
    <>
      <link
        rel='alternate'
        type='application/atom+xml'
        title={`${title} – Atom Feed`}
        href={`${feedPathPrefix}/atom`}
      />
      <link
        rel='alternate'
        type='application/rss+xml'
        title={`${title} – RSS Feed`}
        href={`${feedPathPrefix}/rss`}
      />
      <link
        rel='alternate'
        type='application/json'
        title={`${title} – JSON Feed`}
        href={`${feedPathPrefix}/json`}
      />
    </>
  )
}
