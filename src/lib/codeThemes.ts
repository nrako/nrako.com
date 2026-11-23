/**
 * The themes code is highlighted in, see https://shiki.style/themes. Kept
 * apart, with nothing imported, because two places highlight: the server,
 * where a post is rendered, and the browser, where the sources of a snippet
 * are edited on its page.
 */
export const CODE_THEMES = {
  light: 'github-light-high-contrast',
  dark: 'github-dark-high-contrast',
}

/**
 * Colours swapped in a theme, by theme name.
 *
 * Every token is at 7:1 or more on the code's background in both themes and
 * both reading backgrounds, as the text is; the light theme's comments alone
 * fall short (4.5:1) and are darkened to reach it.
 */
export const CODE_COLOR_REPLACEMENTS: Record<string, Record<string, string>> = {
  'github-light-high-contrast': { '#66707b': '#474f58' },
}
