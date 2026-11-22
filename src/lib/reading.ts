// The reader's settings for the text: its typeface, its size, its weight
// and its background. Each is an attribute on <html> (`data-reading-font`,
// `data-reading-size`, `data-reading-weight`, `data-reading-background`),
// absent for the default, and
// is kept in localStorage under the same name. `Layout.astro` sets them
// before the page is drawn; `global.css` draws them.

export const readingSettings = {
  font: {
    attribute: 'data-reading-font',
    storageKey: 'reading-font',
    values: ['sans', 'serif', 'hyperlegible'],
    default: 'sans',
  },
  size: {
    attribute: 'data-reading-size',
    storageKey: 'reading-size',
    values: ['small', 'medium', 'large'],
    default: 'medium',
  },
  weight: {
    attribute: 'data-reading-weight',
    storageKey: 'reading-weight',
    values: ['light', 'regular', 'heavy'],
    default: 'regular',
  },
  background: {
    attribute: 'data-reading-background',
    storageKey: 'reading-background',
    values: ['contrast', 'soft'],
    default: 'contrast',
  },
} as const

export type ReadingSetting = keyof typeof readingSettings
export type ReadingFont = (typeof readingSettings.font.values)[number]
export type ReadingSize = (typeof readingSettings.size.values)[number]
export type ReadingWeight = (typeof readingSettings.weight.values)[number]
export type ReadingBackground =
  (typeof readingSettings.background.values)[number]

export function readReadingSetting(setting: ReadingSetting): string {
  const { attribute, default: fallback } = readingSettings[setting]
  return document.documentElement.getAttribute(attribute) ?? fallback
}

export function applyReadingSetting(setting: ReadingSetting, value: string) {
  const { attribute, storageKey, default: fallback } = readingSettings[setting]
  const root = document.documentElement
  if (value === fallback) root.removeAttribute(attribute)
  else root.setAttribute(attribute, value)

  // Storage can be unavailable (private windows, blocked site data): the
  // setting still applies to this page
  try {
    if (value === fallback) localStorage.removeItem(storageKey)
    else localStorage.setItem(storageKey, value)
  } catch {
    // Not kept for the next page
  }
}
