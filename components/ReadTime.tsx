import { DOMParser } from '@b-fuze/deno-dom'

// 200 word-per-minute is on the lower range of the average reading speed 200-300 wpm
const WPM = 200

export default function ReadTime({ content }: { content: string }) {
  const textContent =
    new DOMParser().parseFromString(content, 'text/html')?.textContent ?? ''

  // Strip characters that would skew the word count
  const wordCount =
    textContent.replace(/[-*\s\n]+/gm, ' ').split(/\s/).length ?? 0

  // Calculate the reading time in minutes
  const minutes = Math.floor(wordCount / WPM)

  return (
    <span>
      {minutes < 1 ? 'Less than a minute read' : `${minutes} min read`}
    </span>
  )
}
