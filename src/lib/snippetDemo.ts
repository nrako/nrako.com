/**
 * How a snippet's demo is made from its sources. Kept apart from the rest of
 * the snippets, with nothing imported, because two places follow this one
 * rule: the server, where a post is rendered, and the browser, where the
 * sources of a snippet are edited on its page.
 */

/** A source of a snippet: its language as typed, and its code */
export interface SnippetSource {
  language: string
  code: string
}

/** The languages of the markup a snippet's demo is made of */
export const MARKUP_LANGUAGES = ['html', 'svg']

/** The languages of a script that a snippet runs */
export const SCRIPT_LANGUAGES = ['js', 'javascript']

/** The languages of a snippet that make its demo; the others are only shown */
export const DEMO_LANGUAGES = [...MARKUP_LANGUAGES, 'css', ...SCRIPT_LANGUAGES]

/**
 * The end of a script element, in two pieces: this module is also sent to the
 * browser, possibly inline in a page, where the tag written whole would end
 * the script that holds it.
 */
const END_OF_SCRIPT = ['</', 'script>'].join('')

/**
 * The three parts of a demo, each the sources of its languages joined in the
 * order written: its markup, its CSS and its script.
 */
export function demoParts(sources: SnippetSource[]) {
  const codeOf = (languages: string[]) =>
    sources
      .filter((source) => languages.includes(source.language))
      .map((source) => source.code)
      .join('\n')

  return {
    markup: codeOf(MARKUP_LANGUAGES),
    css: codeOf(['css']),
    js: codeOf(SCRIPT_LANGUAGES),
  }
}

/**
 * The markup of a demo: its HTML and its drawings in the order written, under
 * its CSS and before its script, or `undefined` for sources without markup.
 *
 * The CSS is wrapped in an `@scope` block with no root given: its root is then
 * the element that holds the `<style>`, the demo, so it styles nothing else.
 * The script is a module, which keeps what it declares to itself.
 */
export function demoMarkup(sources: SnippetSource[]): string | undefined {
  const { markup, css, js } = demoParts(sources)
  if (!markup) return undefined

  const style = css ? `<style>@scope {\n${css}\n}</style>` : ''
  const script = js ? `<script type="module">\n${js}\n${END_OF_SCRIPT}` : ''

  return `<div class="snippet-demo not-prose">${style}${markup}${script}</div>`
}
