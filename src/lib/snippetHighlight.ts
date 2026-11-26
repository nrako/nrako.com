import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import css from 'shiki/langs/css.mjs'
import html from 'shiki/langs/html.mjs'
import javascript from 'shiki/langs/javascript.mjs'
import xml from 'shiki/langs/xml.mjs'
import dark from 'shiki/themes/github-dark-high-contrast.mjs'
import light from 'shiki/themes/github-light-high-contrast.mjs'

import { CODE_COLOR_REPLACEMENTS, CODE_THEMES } from './codeThemes.ts'
import { highlightedAs } from './snippetDemo.ts'

/**
 * Code as HTML, each token in a `<span>` that holds its colour in both themes
 * and lines parted by `<br>`: what goes in a `<pre>`, without one.
 */
export type Highlight = (code: string, language: string) => string

/**
 * The highlighter of a snippet's page, where its sources are edited: Shiki, as
 * in a post, with the same themes and the same colours swapped in them
 * (`codeThemes.ts`), so that a source reads there as it does in its post.
 *
 * It only knows the languages a demo is made of. A source in another language
 * is shown and not run, in a post as here: here it is not coloured either.
 *
 * The grammars are read by Shiki's JavaScript engine, which turns their
 * expressions into the browser's own. It is told to write them for ES2018 and
 * not for what the browser claims to know: left to choose, it tells the tokens
 * of a script apart in WebKit otherwise than in the other browsers and in the
 * post (`tests/e2e/posts.spec.ts` compares them).
 *
 * This module is the heaviest part of that page, by far: the grammars and the
 * engine that reads them, some 100 kB compressed. The editor fetches it apart,
 * once its fields are set, and colours them when it arrives.
 */
export async function snippetHighlighter(): Promise<Highlight> {
  const highlighter = await createHighlighterCore({
    themes: [light, dark],
    langs: [html, css, javascript, xml],
    engine: createJavaScriptRegexEngine({ target: 'ES2018' }),
  })
  const known = new Set(highlighter.getLoadedLanguages())

  return (code, language) => {
    const lang = highlightedAs(language)

    return highlighter.codeToHtml(code, {
      lang: known.has(lang) ? lang : 'text',
      themes: CODE_THEMES,
      colorReplacements: CODE_COLOR_REPLACEMENTS,
      structure: 'inline',
      // Shiki gives up on a line after half a second and leaves the rest of
      // it uncoloured. The first pass, which also compiles the grammar, can
      // take that long on a slow or busy machine, and the field would then
      // differ from the post for no reason a reader can see. A snippet's
      // sources are short: each line is read to its end.
      tokenizeTimeLimit: 0,
    })
  }
}
